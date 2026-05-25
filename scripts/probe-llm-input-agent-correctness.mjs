#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const testRepoRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(testRepoRoot, '..');
const agentRoot = resolve(workspaceRoot, 'AlembicAgent');

function usage() {
  return [
    'Usage: ALEMBIC_TEST_MODE=1 node scripts/probe-llm-input-agent-correctness.mjs [--out <path>]',
    '',
    'Runs the LLMI-P2 Agent correctness test-mode probe against AlembicAgent dist.',
    'Writes developer-safe retained-input/events evidence JSON.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = { out: join(testRepoRoot, 'tmp', 'llm-input-agent-correctness-test-mode.json') };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--out') {
      const value = argv[i + 1];
      if (!value) throw new Error('--out requires a path');
      args.out = resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function assert(condition, message, details = undefined) {
  if (!condition) {
    const error = new Error(message);
    if (details !== undefined) error.details = details;
    throw error;
  }
}

async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, { cwd });
  return stdout.trim();
}

async function importAgentModule(...parts) {
  return import(pathToFileURL(join(agentRoot, ...parts)).href);
}

async function withCodeFixture(run) {
  const root = await mkdtemp(join(tmpdir(), 'alembic-agent-llmi-probe-'));
  try {
    await mkdir(join(root, 'src'), { recursive: true });
    await writeFile(join(root, 'src/a.ts'), 'export const a = 1;\nexport const aa = 2;\n');
    await writeFile(join(root, 'src/b.ts'), 'export function b() {\n  return "b";\n}\n');
    return await run(root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

function toolContext(root, deltaCache, tokenBudget = 4000) {
  return {
    projectRoot: root,
    tokenBudget,
    ...(deltaCache ? { deltaCache } : {}),
  };
}

function eventPreview(event) {
  const text = event?.content?.text || '';
  return {
    assertions: {
      containsAsyncGraphContext: text.includes('Async graph context'),
      containsMessagesSection: text.includes('## Messages'),
      containsObjectPromise: text.includes('[object Promise]'),
      containsVisibleInputSecret: text.includes('visibleInputSecret12345'),
    },
    contentPreview: text.slice(0, 1200),
    contentTextChars: text.length,
    displayPolicy: event?.displayPolicy || null,
    dimensionId: event?.dimensionId || null,
    kind: event?.kind || null,
    metadata: event?.metadata || null,
    phase: event?.phase || null,
    retention: event?.retention || null,
    sourceClass: event?.sourceClass || null,
    summary: event?.summary || null,
    targetName: event?.targetName || null,
    title: event?.title || null,
  };
}

async function runProbe() {
  const args = parseArgs(process.argv.slice(2));
  assert(
    process.env.ALEMBIC_TEST_MODE === '1',
    'ALEMBIC_TEST_MODE=1 is required for this probe.'
  );

  const [
    { buildAnalystPrompt },
    { ExplorationTracker },
    { AgentRuntime },
    { DeltaCache, TOOL_REGISTRY, ToolRouterV2 },
  ] = await Promise.all([
    importAgentModule('dist/agent/prompts/index.js'),
    importAgentModule('dist/agent/context/index.js'),
    importAgentModule('dist/agent/runtime/index.js'),
    importAgentModule('dist/tools/v2/index.js'),
  ]);

  const agentHead = await git(['rev-parse', 'HEAD'], agentRoot);
  const agentStatus = await git(['status', '--short'], agentRoot);
  const packageJson = JSON.parse(await readFile(join(agentRoot, 'package.json'), 'utf8'));

  const asyncPrompt = await buildAnalystPrompt(
    { id: 'architecture', label: 'Architecture' },
    { name: 'LLMIProbeProject', lang: 'typescript', fileCount: 2 },
    null,
    null,
    null,
    {
      generateContextForAgent: async () => '## Code Entity Graph\nAsync graph context',
    },
    null,
    null,
    null,
    null,
    null
  );
  assert(asyncPrompt.includes('Async graph context'), 'Async graph context was not retained.');
  assert(!asyncPrompt.includes('[object Promise]'), 'Async graph context leaked [object Promise].');

  const readSpec = TOOL_REGISTRY.code?.actions.read;
  const readParams = readSpec?.params || {};
  assert(readSpec, 'code.read spec is missing.');
  assert(
    !(readParams.required || []).includes('path'),
    'code.read still requires path.',
    readParams
  );
  assert(readParams.properties?.filePaths, 'code.read filePaths schema is missing.', readParams);
  assert(
    String(readSpec.description || '').includes('partial failure'),
    'code.read description does not advertise partial failure.',
    readSpec
  );

  const routerEvidence = await withCodeFixture(async (fixtureRoot) => {
    const router = new ToolRouterV2();

    const single = await router.execute(
      { tool: 'code', action: 'read', params: { path: 'src/a.ts', maxLines: 1 } },
      toolContext(fixtureRoot)
    );
    assert(single.ok === true, 'single path code.read failed.', single);
    assert(String(single.data).includes('1|export const a = 1;'), 'single path content mismatch.');

    const batch = await router.execute(
      {
        tool: 'code',
        action: 'read',
        params: { filePaths: ['src/a.ts', 'src/missing.ts', '../outside.ts'], maxLines: 1 },
      },
      toolContext(fixtureRoot)
    );
    assert(batch.ok === true, 'batch code.read should tolerate partial failure.', batch);
    assert(
      !JSON.stringify(batch).includes('Missing required param "path"'),
      'batch code.read still triggered Missing required param "path".',
      batch
    );
    assert(batch.data?.mode === 'batch', 'batch code.read did not return batch mode.', batch);
    assert(
      batch.data?.summary?.requested === 3 &&
        batch.data?.summary?.succeeded === 1 &&
        batch.data?.summary?.failed === 2 &&
        batch.data?.summary?.partialFailure === true,
      'batch code.read summary mismatch.',
      batch.data?.summary
    );
    assert(
      batch.data.files.find((file) => file.path === '../outside.ts')?.error?.includes(
        'outside project root'
      ),
      'batch code.read did not preserve per-file outside-root error.',
      batch.data
    );

    const deltaCache = new DeltaCache(10);
    await router.execute(
      { tool: 'code', action: 'read', params: { filePaths: ['src/a.ts', 'src/b.ts'] } },
      toolContext(fixtureRoot, deltaCache)
    );
    const unchanged = await router.execute(
      { tool: 'code', action: 'read', params: { filePaths: ['src/a.ts', 'src/b.ts'] } },
      toolContext(fixtureRoot, deltaCache)
    );
    assert(
      unchanged.data?.files?.every((file) => file.content === '[unchanged since last read]'),
      'delta cache did not apply per file.',
      unchanged.data
    );

    return {
      batchFiles: batch.data.files.map((file) => ({
        ok: file.ok,
        path: file.path,
        hasContent: typeof file.content === 'string' && file.content.length > 0,
        error: file.error || null,
      })),
      batchSummary: batch.data.summary,
      singleOk: single.ok,
      unchangedSummary: unchanged.data.summary,
    };
  });

  const tracker = ExplorationTracker.resolve(
    { source: 'system', strategy: 'analyst' },
    { maxIterations: 12, searchBudget: 8 }
  );
  assert(tracker?.phase === 'SCAN', 'tracker did not start in SCAN.', tracker);
  assert(tracker?.getToolChoice() === 'none', 'SCAN toolChoice is not none.');
  tracker?.tick();
  const nudge = tracker?.getNudge({ expectPlan: () => undefined });
  assert(nudge?.type === 'planning', 'SCAN nudge is not planning.', nudge);
  assert(String(nudge?.text || '').includes('下一轮'), 'SCAN nudge no longer says next round.');
  assert(!String(nudge?.text || '').includes('同一轮'), 'SCAN nudge still says same round.');
  assert(
    !String(nudge?.text || '').includes('立即开始执行'),
    'SCAN nudge still claims immediate execution.'
  );

  const progress = [];
  const inputSecret = 'visibleInputSecret12345';
  const chatWithTools = async () => ({
    text: 'test-mode response',
    functionCalls: [],
    usage: { inputTokens: 11, outputTokens: 3 },
  });
  const runtime = new AgentRuntime({
    aiProvider: { name: 'test-mode-provider', model: 'unit', chatWithTools },
    toolRegistry: { getManifest: () => null },
    toolRouter: { execute: async () => ({ ok: true, data: null }) },
    capabilities: [],
    strategy: { name: 'test-mode-strategy', execute: async () => null },
    onProgress: (event) => progress.push(event),
  });

  await runtime.reactLoop(`${asyncPrompt}\nUser hint apiKey=${inputSecret}`, {
    source: 'system',
    context: {
      pipelinePhase: 'analyze',
      dimensionId: 'llmi-p2',
      targetName: 'LLMI-P2 Agent correctness',
    },
    budgetOverride: { maxIterations: 1, timeoutMs: 1000 },
  });

  const processEvents = progress
    .map((event) => event.processEvent)
    .filter((event) => event && typeof event === 'object');
  const llmInput = processEvents.find((event) => event.kind === 'llm.input');
  const llmOutput = processEvents.find((event) => event.kind === 'llm.output');
  assert(llmInput, 'AgentRuntime did not emit llm.input process event.', processEvents);
  assert(llmInput.retention === 'job-retained', 'llm.input is not job-retained.', llmInput);
  assert(llmInput.sourceClass === 'developer-facing', 'llm.input is not developer-facing.', llmInput);
  assert(
    llmInput.content?.text?.includes('Async graph context'),
    'retained llm.input did not include awaited async graph context.',
    llmInput
  );
  assert(
    !llmInput.content?.text?.includes('[object Promise]'),
    'retained llm.input contains [object Promise].',
    llmInput
  );
  assert(
    !llmInput.content?.text?.includes(inputSecret),
    'retained llm.input leaked the fixture secret.',
    llmInput
  );
  assert(llmOutput, 'AgentRuntime did not emit llm.output process event.', processEvents);

  const evidence = {
    createdAt: new Date().toISOString(),
    config: {
      ALEMBIC_TEST_MODE: process.env.ALEMBIC_TEST_MODE,
      command: `ALEMBIC_TEST_MODE=1 node scripts/probe-llm-input-agent-correctness.mjs --out ${args.out}`,
      scope: 'AlembicAgent dist test-mode fixture; no full cold-start; no real project source edits',
    },
    alembicAgent: {
      head: agentHead,
      packageVersion: packageJson.version,
      statusShort: agentStatus || '(clean)',
    },
    checks: {
      asyncContextAwaited: true,
      noObjectPromiseInAnalystPrompt: true,
      noObjectPromiseInRetainedInput: true,
      codeReadFilePathsSchema: {
        hasPathProperty: Boolean(readParams.properties?.path),
        hasFilePathsProperty: Boolean(readParams.properties?.filePaths),
        required: readParams.required || [],
        descriptionMentionsPartialFailure: true,
      },
      codeReadBatchPartialFailure: routerEvidence,
      scanPlanningToolChoice: {
        phase: tracker?.phase,
        toolChoice: tracker?.getToolChoice(),
        nudgeText: nudge?.text || null,
        saysNextRound: true,
        saysSameRound: false,
        claimsImmediateExecution: false,
      },
    },
    retainedProcessEvents: {
      kinds: processEvents.map((event) => event.kind),
      llmInput: eventPreview(llmInput),
      llmOutput: eventPreview(llmOutput),
    },
  };

  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ ok: true, out: args.out, checks: evidence.checks }, null, 2));
}

runProbe().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        details: error?.details,
      },
      null,
      2
    )
  );
  process.exit(1);
});
