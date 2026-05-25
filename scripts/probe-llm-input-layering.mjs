#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const testRepoRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(testRepoRoot, '..');
const agentRoot = resolve(workspaceRoot, 'AlembicAgent');
const expectedAgentHead = 'bf0a2c2cb0c3d760817ac699e5f47d83e0e5b4d9';

function usage() {
  return [
    'Usage: ALEMBIC_TEST_MODE=1 node scripts/probe-llm-input-layering.mjs [--out <path>] [--vitest-output <path>] [--capture-output <path>] [--capture-vitest-output <path>] [--wave1-output <path>]',
    '',
    'Runs the LLMI-P4 Agent input layering test-mode probe.',
    'The probe executes AlembicAgent targeted Vitest coverage and reuses the Test-05',
    'correctness probe for Wave 1 regression evidence. It does not start a daemon',
    'or modify product source.',
  ].join('\n');
}

function parseArgs(argv) {
  const defaults = {
    out: join(testRepoRoot, 'tmp', 'llm-input-layering-test-mode.json'),
    vitestOutput: join(testRepoRoot, 'tmp', 'llm-input-layering-vitest.json'),
    captureOutput: join(testRepoRoot, 'tmp', 'llm-input-layering-runtime-capture.json'),
    captureVitestOutput: join(testRepoRoot, 'tmp', 'llm-input-layering-runtime-capture-vitest.json'),
    wave1Output: join(testRepoRoot, 'tmp', 'llm-input-layering-wave1-regression.json'),
  };
  const args = { ...defaults };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (
      arg === '--out' ||
      arg === '--vitest-output' ||
      arg === '--capture-output' ||
      arg === '--capture-vitest-output' ||
      arg === '--wave1-output'
    ) {
      const value = argv[i + 1];
      if (!value) throw new Error(`${arg} requires a path`);
      const key =
        arg === '--out'
          ? 'out'
          : arg === '--vitest-output'
            ? 'vitestOutput'
            : arg === '--capture-output'
              ? 'captureOutput'
              : arg === '--capture-vitest-output'
                ? 'captureVitestOutput'
                : 'wave1Output';
      args[key] = resolve(process.cwd(), value);
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

async function runCommand(file, args, options = {}) {
  const startedAt = Date.now();
  const result = await execFileAsync(file, args, {
    cwd: options.cwd,
    env: options.env,
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    command: [file, ...args].join(' '),
    cwd: options.cwd || process.cwd(),
    durationMs: Date.now() - startedAt,
    stderr: sanitizeCommandText(result.stderr || ''),
    stdout: sanitizeCommandText(result.stdout || ''),
  };
}

function sanitizeCommandText(text) {
  return text
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(/\/Users\/[^/\s]+\/Documents\/AlembicWorkspace/g, '<workspace>');
}

function includesAll(text, values) {
  return Object.fromEntries(values.map((value) => [value, text.includes(value)]));
}

function passedAssertionNames(report) {
  return (report.testResults || [])
    .flatMap((suite) => suite.assertionResults || [])
    .map((result) => ({
      fullName: result.fullName,
      status: result.status,
    }));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

function runtimeCaptureTestSource() {
  return String.raw`
import { afterAll, describe, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { ExplorationTracker } from '../../AlembicAgent/src/agent/context/ExplorationTracker.js';
import { STRATEGY_PRODUCER } from '../../AlembicAgent/src/agent/context/exploration/ExplorationStrategies.js';
import { PRODUCER_SYSTEM_PROMPT } from '../../AlembicAgent/src/agent/prompts/insight-producer.js';
import { AgentRuntime, SystemPromptBuilder } from '../../AlembicAgent/src/agent/runtime/index.js';

const evidence = {
  analyze: null,
  record: null,
  produce: null,
  producerBudget: null,
  producerTracker: null,
};

function createRuntime({ chatWithTools, onProgress, toolSchemas = [] }) {
  return new AgentRuntime({
    aiProvider: { name: 'unit-test', model: 'unit', chatWithTools },
    toolRegistry: { getManifest: () => null },
    toolRouter: { execute: vi.fn() },
    container: {
      get: (name) => {
        if (name !== 'capabilityCatalog') return undefined;
        return {
          toToolSchemas: (ids) => toolSchemas.filter((schema) => ids?.includes(String(schema.name))),
        };
      },
    },
    capabilities: [],
    strategy: { name: 'unused', execute: vi.fn() },
    onProgress,
  });
}

function createTracker({ phase, pipelineType = 'analyst', toolChoice = 'none', phaseContext = null }) {
  return {
    phase,
    pipelineType,
    isGracefulExit: false,
    isHardExit: false,
    iteration: 0,
    totalSubmits: 0,
    tick: vi.fn(),
    shouldExit: vi.fn(() => false),
    getNudge: vi.fn(() => null),
    getPhaseContext: vi.fn(() => phaseContext),
    getToolChoice: vi.fn(() => toolChoice),
    getMetrics: vi.fn(() => ({
      evidenceToolCallCount: 0,
      iteration: 0,
      memoryFindingCount: 0,
      phase,
      phaseRounds: 0,
      submitCount: 0,
      totalToolCalls: 0,
    })),
    getPlanProgress: vi.fn(() => ({ coveredSteps: 0, totalSteps: 0 })),
    recordToolCall: vi.fn(() => ({ isNew: true })),
    endRound: vi.fn(() => null),
    onTextResponse: vi.fn(() => ({
      isFinalAnswer: true,
      needsDigestNudge: false,
      shouldContinue: false,
      nudge: null,
    })),
  };
}

function getLlmInput(progress) {
  return progress.map((event) => event.processEvent).find((event) => event?.kind === 'llm.input');
}

function sectionPresence(text) {
  return {
    identity: text.includes('## Identity (static)'),
    stagePolicy: text.includes('## Stage policy'),
    toolContract: text.includes('## Tool contract'),
    taskContext: text.includes('## Task context'),
    evidenceContext: text.includes('## Evidence context'),
    dynamicContext: text.includes('## Dynamic context'),
    providerRuntimeLayer: text.includes('## Provider runtime layer'),
  };
}

describe('LLMI-P4 runtime capture', () => {
  it('captures Analyze provider runtime layer and retained llm.input metadata', async () => {
    const progress = [];
    const capture = {};
    const chatWithTools = vi.fn(async (_prompt, opts) => {
      capture.messages = opts?.messages;
      return { text: 'done', functionCalls: [], usage: { inputTokens: 1, outputTokens: 1 } };
    });
    const runtime = createRuntime({
      chatWithTools,
      onProgress: (event) => progress.push(event),
    });
    const tracker = createTracker({
      phase: 'SCAN',
      phaseContext: 'SCAN briefing: produce a small plan before tools.',
    });

    await runtime.reactLoop('analyze with apiKey=visibleInputSecret12345', {
      source: 'system',
      context: { pipelinePhase: 'analyze', dimensionId: 'architecture' },
      systemPromptOverride: 'Analyst identity prompt',
      tracker,
      budgetOverride: { maxIterations: 1, timeoutMs: 1000 },
    });

    const llmInput = getLlmInput(progress);
    const inputText = llmInput?.content?.text || '';
    const providerLayer = capture.messages?.at(-1)?.content || '';
    evidence.analyze = {
      metadata: llmInput?.metadata || null,
      sectionPresence: sectionPresence(inputText),
      providerHasRuntimeLayer: providerLayer.includes('# LLM input runtime layer'),
      providerHasStagePolicy: providerLayer.includes('## Stage policy'),
      providerHasToolContract: providerLayer.includes('## Tool contract'),
      providerHasTaskContext: providerLayer.includes('## Task context'),
      providerHasEvidenceContext: providerLayer.includes('## Evidence context'),
      providerHasDynamicContext: providerLayer.includes('## Dynamic context'),
      secretRedactedFromDeveloperInput: !inputText.includes('visibleInputSecret12345'),
      providerLayerPreview: providerLayer.slice(0, 700),
    };

    expect(providerLayer).toContain('# LLM input runtime layer');
    expect(inputText).toContain('## Identity (static)');
    expect(inputText).toContain('## Provider runtime layer');
    expect(inputText).not.toContain('visibleInputSecret12345');
    expect(llmInput?.metadata).toMatchObject({
      inputLayerAppended: true,
      inputStageProfile: 'analyze',
    });
    expect(llmInput?.metadata?.inputSectionIds).toEqual(
      expect.arrayContaining(['identity', 'stagePolicy', 'toolContract', 'taskContext', 'evidenceContext', 'dynamicContext'])
    );
    expect(llmInput?.metadata?.providerVisibleSectionIds).toEqual(
      expect.arrayContaining(['identity', 'stagePolicy', 'toolContract', 'taskContext', 'evidenceContext', 'dynamicContext'])
    );
  });

  it('captures RECORD as note_finding-only without exploration instructions', async () => {
    const progress = [];
    const capture = {};
    const chatWithTools = vi.fn(async (_prompt, opts) => {
      capture.toolSchemas = opts?.toolSchemas;
      capture.messages = opts?.messages;
      return { text: 'done', functionCalls: [], usage: { inputTokens: 1, outputTokens: 1 } };
    });
    const runtime = createRuntime({
      chatWithTools,
      onProgress: (event) => progress.push(event),
      toolSchemas: [
        { name: 'memory', description: 'Memory', parameters: { type: 'object' } },
        { name: 'code', description: 'Code', parameters: { type: 'object' } },
        { name: 'graph', description: 'Graph', parameters: { type: 'object' } },
      ],
    });
    const tracker = createTracker({ phase: 'RECORD', toolChoice: 'required' });

    await runtime.reactLoop('record confirmed findings', {
      source: 'system',
      additionalToolsOverride: ['memory', 'code', 'graph'],
      context: { pipelinePhase: 'analyze' },
      systemPromptOverride: 'Record identity prompt',
      tracker,
      budgetOverride: { maxIterations: 1, timeoutMs: 1000 },
    });

    const llmInput = getLlmInput(progress);
    const providerLayer = capture.messages?.at(-1)?.content || '';
    evidence.record = {
      metadata: llmInput?.metadata || null,
      toolSchemas: (capture.toolSchemas || []).map((schema) => schema.name),
      providerHasRecordOnly: providerLayer.includes('Record-only phase'),
      providerHasCodeExploreInstruction: providerLayer.includes('code({ action'),
      providerHasGraphExploreInstruction: providerLayer.includes('graph({ action'),
      providerLayerPreview: providerLayer.slice(0, 700),
    };

    expect(capture.toolSchemas?.map((schema) => schema.name)).toEqual(['note_finding']);
    expect(providerLayer).toContain('stageProfile: record');
    expect(providerLayer).toContain('Record-only phase');
    expect(providerLayer).not.toContain('code({ action');
    expect(providerLayer).not.toContain('graph({ action');
    expect(llmInput?.metadata).toMatchObject({ inputStageProfile: 'record' });
  });

  it('captures Producer profile and Producer budget without Analyst exploration policy', async () => {
    const progress = [];
    const capture = { messageBatches: [] };
    const chatWithTools = vi.fn(async (_prompt, opts) => {
      capture.systemPrompt = opts?.systemPrompt;
      capture.messageBatches.push(opts?.messages || []);
      return { text: 'done', functionCalls: [], usage: { inputTokens: 1, outputTokens: 1 } };
    });
    const runtime = createRuntime({
      chatWithTools,
      onProgress: (event) => progress.push(event),
      toolSchemas: [
        { name: 'code', description: 'Code', parameters: { type: 'object' } },
        { name: 'knowledge', description: 'Knowledge', parameters: { type: 'object' } },
      ],
    });
    const tracker = ExplorationTracker.resolve(
      { source: 'system', strategy: 'producer' },
      { maxIterations: 3, pipelineType: 'producer' }
    );

    await runtime.reactLoop('produce knowledge candidates', {
      source: 'system',
      additionalToolsOverride: ['code', 'knowledge'],
      context: { pipelinePhase: 'produce' },
      systemPromptOverride: PRODUCER_SYSTEM_PROMPT,
      tracker,
      budgetOverride: { maxIterations: 3, timeoutMs: 1000 },
    });

    const llmInput = getLlmInput(progress);
    const providerLayer = capture.messageBatches[0]?.at(-1)?.content || '';
    const producerBudget = SystemPromptBuilder.injectBudget('Producer identity', {
      source: 'system',
      tracker: { phase: 'PRODUCE', pipelineType: 'producer' },
      budget: { maxIterations: 5 },
    });
    const producerTracker = new ExplorationTracker(STRATEGY_PRODUCER, { maxIterations: 2 });
    evidence.produce = {
      metadata: llmInput?.metadata || null,
      providerHasProduceProfile: providerLayer.includes('stageProfile: produce'),
      providerHasProducerPhase: providerLayer.includes('Producer phase'),
      providerHasGraphExploreInstruction: providerLayer.includes('graph({ action'),
      systemPromptHasProducerBudget: capture.systemPrompt?.includes('## Producer 轮次预算') || false,
      systemPromptHasAnalystExploration: capture.systemPrompt?.includes('探索阶段') || false,
      systemPromptHasStructuredQuery: capture.systemPrompt?.includes('结构化查询') || false,
      providerLayerPreview: providerLayer.slice(0, 700),
    };
    evidence.producerBudget = {
      hasProducerBudget: producerBudget.includes('## Producer 轮次预算'),
      hasAnalystExploration: producerBudget.includes('探索阶段'),
      hasStructuredQuery: producerBudget.includes('结构化查询'),
    };
    evidence.producerTracker = {
      phase: producerTracker.phase,
      pipelineType: producerTracker.pipelineType,
    };

    expect(capture.systemPrompt).toContain('## Producer 轮次预算');
    expect(capture.systemPrompt).not.toContain('探索阶段');
    expect(capture.systemPrompt).not.toContain('结构化查询');
    expect(providerLayer).toContain('stageProfile: produce');
    expect(providerLayer).toContain('Producer phase');
    expect(providerLayer).not.toContain('graph({ action');
    expect(llmInput?.metadata).toMatchObject({ inputStageProfile: 'produce' });
    expect(producerBudget).toContain('## Producer 轮次预算');
    expect(producerBudget).not.toContain('探索阶段');
    expect(producerTracker.pipelineType).toBe('producer');
  });
});

afterAll(() => {
  writeFileSync(process.env.LLMI_CAPTURE_OUTPUT, JSON.stringify(evidence, null, 2) + '\n');
});
`;
}

function runtimeCaptureVitestConfigSource(captureTestPath) {
  const escapedAgentRoot = JSON.stringify(`${agentRoot}/`);
  const escapedCaptureTestPath = JSON.stringify(captureTestPath);
  return `const agentRoot = ${escapedAgentRoot};

export default {
  resolve: {
    conditions: ['alembic-dev'],
    alias: [
      { find: /^#agent\\/(.*)$/u, replacement: \`\${agentRoot}src/agent/$1\` },
      { find: /^#external\\/(.*)$/u, replacement: \`\${agentRoot}src/external/$1\` },
      { find: /^#shared\\/(.*)$/u, replacement: \`\${agentRoot}src/shared/$1\` },
      { find: /^#tools\\/(.*)$/u, replacement: \`\${agentRoot}src/tools/$1\` },
    ],
  },
  test: {
    include: [${escapedCaptureTestPath}],
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
  },
};
`;
}

async function runProbe() {
  const args = parseArgs(process.argv.slice(2));
  assert(
    process.env.ALEMBIC_TEST_MODE === '1',
    'ALEMBIC_TEST_MODE=1 is required for this probe.'
  );

  const [
    agentHead,
    agentStatus,
    biliDiliStatus,
    workspaceStatus,
    packageJsonText,
    assemblySource,
    runtimeSource,
    layeringTestSource,
    correctnessTestSource,
    distRuntime,
  ] = await Promise.all([
    git(['rev-parse', 'HEAD'], agentRoot),
    git(['status', '--short'], agentRoot),
    git(['-C', join(workspaceRoot, 'BiliDili'), 'status', '--short'], workspaceRoot).catch(
      (error) => `unavailable: ${error.message}`
    ),
    git(['status', '--short'], workspaceRoot),
    readFile(join(agentRoot, 'package.json'), 'utf8'),
    readFile(join(agentRoot, 'src/agent/runtime/LLMInputAssembly.ts'), 'utf8'),
    readFile(join(agentRoot, 'src/agent/runtime/AgentRuntime.ts'), 'utf8'),
    readFile(join(agentRoot, 'test/llm-input-layering.test.ts'), 'utf8'),
    readFile(join(agentRoot, 'test/llm-input-correctness.test.ts'), 'utf8'),
    readFile(join(agentRoot, 'dist/agent/runtime/AgentRuntime.js'), 'utf8').catch(() => ''),
  ]);
  const packageJson = JSON.parse(packageJsonText);

  assert(agentHead === expectedAgentHead, 'AlembicAgent HEAD does not match Test-06 target.', {
    actual: agentHead,
    expected: expectedAgentHead,
  });
  assert(agentStatus === '', 'AlembicAgent working tree must stay clean for Test-06.', agentStatus);

  const sourceEvidence = {
    assemblyMetadataFields: includesAll(assemblySource, [
      'inputSectionIds',
      'inputStageProfile',
      'inputLayerAppended',
      'providerVisibleSectionIds',
    ]),
    assemblySections: includesAll(assemblySource, [
      "id: 'identity'",
      "title: 'Stage policy'",
      "title: 'Tool contract'",
      "title: 'Task context'",
      "title: 'Evidence context'",
      "title: 'Dynamic context'",
      '# LLM input runtime layer',
    ]),
    runtimeConsumption: includesAll(runtimeSource, [
      'buildLlmInputAssembly',
      'const unifiedMessages = llmInputAssembly.providerMessages',
      'formatDeveloperVisibleLlmInput(llmInputAssembly)',
      '...llmInputAssembly.metadata',
    ]),
    targetedTestAssertions: includesAll(layeringTestSource, [
      "providerLayer).toContain('# LLM input runtime layer')",
      "inputText).toContain('## Identity (static)')",
      "inputLayerAppended: true",
      "inputStageProfile: 'analyze'",
      "inputStageProfile: 'record'",
      "inputStageProfile: 'produce'",
      "expect(capture.toolSchemas?.map((schema) => schema.name)).toEqual(['note_finding'])",
      "expect(capture.systemPrompt).toContain('## Producer",
      "expect(capture.systemPrompt).not.toContain('探索阶段')",
      "expect(capture.systemPrompt).not.toContain('结构化查询')",
    ]),
    wave1RegressionAssertions: includesAll(correctnessTestSource, [
      "expect(prompt).not.toContain('[object Promise]')",
      "expect(params.required ?? []).not.toContain('path')",
      "expect(batch.ok).toBe(true)",
      "expect(JSON.stringify(batch)).not.toContain('Missing required param \"path\"')",
    ]),
  };

  for (const [group, checks] of Object.entries(sourceEvidence)) {
    const missing = Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);
    assert(missing.length === 0, `Source evidence check failed for ${group}.`, missing);
  }

  await Promise.all([
    mkdir(dirname(args.vitestOutput), { recursive: true }),
    mkdir(dirname(args.captureOutput), { recursive: true }),
    mkdir(dirname(args.wave1Output), { recursive: true }),
  ]);

  const vitestRun = await runCommand(
    'npm',
    [
      'test',
      '--',
      'llm-input-layering',
      '--reporter=json',
      '--outputFile',
      args.vitestOutput,
    ],
    { cwd: agentRoot, env: { ...process.env, ALEMBIC_TEST_MODE: '1' } }
  );
  const vitestReport = await readJson(args.vitestOutput);
  assert(vitestReport.success === true, 'llm-input-layering Vitest run failed.', vitestReport);
  assert(vitestReport.numPassedTests === 5, 'Unexpected llm-input-layering passed test count.', {
    numPassedTests: vitestReport.numPassedTests,
  });

  const captureTestPath = join(testRepoRoot, 'tmp', 'llm-input-layering-runtime-capture.test.ts');
  const captureConfigPath = join(testRepoRoot, 'tmp', 'llm-input-layering-runtime-capture.vitest.config.ts');
  await writeFile(captureTestPath, runtimeCaptureTestSource());
  await writeFile(captureConfigPath, runtimeCaptureVitestConfigSource(captureTestPath));
  const captureRun = await runCommand(
    join(agentRoot, 'node_modules/.bin/vitest'),
    [
      'run',
      '--config',
      captureConfigPath,
      '--reporter=json',
      '--outputFile',
      args.captureVitestOutput,
    ],
    {
      cwd: agentRoot,
      env: { ...process.env, ALEMBIC_TEST_MODE: '1', LLMI_CAPTURE_OUTPUT: args.captureOutput },
    }
  );
  const captureVitestReport = await readJson(args.captureVitestOutput);
  const runtimeCapture = await readJson(args.captureOutput);
  assert(captureVitestReport.success === true, 'runtime capture Vitest run failed.', captureVitestReport);
  assert(
    runtimeCapture.analyze?.metadata?.inputLayerAppended === true,
    'runtime capture missing inputLayerAppended=true.',
    runtimeCapture.analyze?.metadata
  );
  assert(
    runtimeCapture.analyze?.metadata?.inputStageProfile === 'analyze',
    'runtime capture missing analyze stage profile.',
    runtimeCapture.analyze?.metadata
  );
  assert(
    runtimeCapture.record?.metadata?.inputStageProfile === 'record',
    'runtime capture missing record stage profile.',
    runtimeCapture.record?.metadata
  );
  assert(
    runtimeCapture.produce?.metadata?.inputStageProfile === 'produce',
    'runtime capture missing produce stage profile.',
    runtimeCapture.produce?.metadata
  );

  const wave1Run = await runCommand(
    process.execPath,
    [
      join(testRepoRoot, 'scripts/probe-llm-input-agent-correctness.mjs'),
      '--out',
      args.wave1Output,
    ],
    { cwd: workspaceRoot, env: { ...process.env, ALEMBIC_TEST_MODE: '1' } }
  );
  const wave1Report = await readJson(args.wave1Output);
  assert(wave1Report.checks?.noObjectPromiseInAnalystPrompt === true, 'Wave 1 prompt regression failed.');
  assert(wave1Report.checks?.noObjectPromiseInRetainedInput === true, 'Wave 1 retained input regression failed.');
  assert(
    wave1Report.checks?.codeReadBatchPartialFailure?.batchSummary?.partialFailure === true,
    'Wave 1 code.read filePaths partial failure regression failed.',
    wave1Report.checks?.codeReadBatchPartialFailure
  );

  const distEvidence = {
    distHasLLMInputAssemblyFile: existsSync(join(agentRoot, 'dist/agent/runtime/LLMInputAssembly.js')),
    distRuntimeHasInputAssemblyImport: distRuntime.includes('buildLlmInputAssembly'),
    distRuntimeHasProviderRuntimeLayer: distRuntime.includes('# LLM input runtime layer'),
    distRuntimeStillUsesDynamicContextOnly: distRuntime.includes(
      '// 构建 LLM 输入消息 — projected messages + ephemeral dynamic context'
    ),
  };

  const evidence = {
    createdAt: new Date().toISOString(),
    config: {
      ALEMBIC_TEST_MODE: process.env.ALEMBIC_TEST_MODE,
      command: `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-input-layering.mjs --out ${relative(
        workspaceRoot,
        args.out
      )} --vitest-output ${relative(workspaceRoot, args.vitestOutput)} --capture-output ${relative(
        workspaceRoot,
        args.captureOutput
      )} --capture-vitest-output ${relative(
        workspaceRoot,
        args.captureVitestOutput
      )} --wave1-output ${relative(
        workspaceRoot,
        args.wave1Output
      )}`,
      scope:
        'AlembicAgent source test-mode fixture; no full cold-start; no daemon start; no product source edits; no BiliDili operation',
    },
    alembicAgent: {
      expectedHead: expectedAgentHead,
      head: agentHead,
      packageVersion: packageJson.version,
      statusShort: agentStatus || '(clean)',
    },
    realProjectStatus: {
      BiliDili: biliDiliStatus || '(clean)',
      AlembicWorkspace: workspaceStatus || '(clean)',
    },
    sourceEvidence,
    executionEvidence: {
      vitest: {
        outputFile: relative(workspaceRoot, args.vitestOutput),
        success: vitestReport.success,
        numTotalTests: vitestReport.numTotalTests,
        numPassedTests: vitestReport.numPassedTests,
        tests: passedAssertionNames(vitestReport),
        command: vitestRun.command,
        durationMs: vitestRun.durationMs,
        stdoutPreview: vitestRun.stdout.slice(0, 1200),
        stderrPreview: vitestRun.stderr.slice(0, 1200),
      },
      runtimeCapture: {
        outputFile: relative(workspaceRoot, args.captureOutput),
        vitestOutputFile: relative(workspaceRoot, args.captureVitestOutput),
        success: captureVitestReport.success,
        numTotalTests: captureVitestReport.numTotalTests,
        numPassedTests: captureVitestReport.numPassedTests,
        tests: passedAssertionNames(captureVitestReport),
        captured: runtimeCapture,
        command: captureRun.command,
        durationMs: captureRun.durationMs,
        stdoutPreview: captureRun.stdout.slice(0, 1200),
        stderrPreview: captureRun.stderr.slice(0, 1200),
      },
      wave1Regression: {
        outputFile: relative(workspaceRoot, args.wave1Output),
        checks: {
          noObjectPromiseInAnalystPrompt: wave1Report.checks?.noObjectPromiseInAnalystPrompt,
          noObjectPromiseInRetainedInput: wave1Report.checks?.noObjectPromiseInRetainedInput,
          noMissingPathRegression:
            !JSON.stringify(wave1Report.checks?.codeReadBatchPartialFailure || {}).includes(
              'Missing required param "path"'
            ),
          batchPartialFailure:
            wave1Report.checks?.codeReadBatchPartialFailure?.batchSummary?.partialFailure === true,
        },
        retainedInputMetadata: wave1Report.retainedProcessEvents?.llmInput?.metadata || null,
        command: wave1Run.command,
        durationMs: wave1Run.durationMs,
        stdoutPreview: wave1Run.stdout.slice(0, 1200),
      },
    },
    distArtifactObservation: distEvidence,
    conclusion: {
      sourceTestModeRuntime: 'passed',
      wave1Regression: 'passed',
      distArtifactRisk:
        distEvidence.distHasLLMInputAssemblyFile && distEvidence.distRuntimeHasInputAssemblyImport
          ? 'not_observed'
          : 'dist_not_refreshed_after_source_change',
    },
  };

  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        ok: true,
        out: args.out,
        vitestOutput: args.vitestOutput,
        captureOutput: args.captureOutput,
        captureVitestOutput: args.captureVitestOutput,
        wave1Output: args.wave1Output,
        conclusion: evidence.conclusion,
      },
      null,
      2
    )
  );
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
