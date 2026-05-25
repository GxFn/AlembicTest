#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const testRepoRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(testRepoRoot, '..');
const agentRoot = resolve(workspaceRoot, 'AlembicAgent');
const expectedAgentHead = '8970327d73bf6c01476a1aeb5384f014483b68dd';

const debugFields = [
  'callId',
  'parentCallId',
  'startedAt',
  'durationMs',
  'timestamp',
  'diagnostics',
  'structuredContent',
  '_meta',
];

function usage() {
  return [
    'Usage: ALEMBIC_TEST_MODE=1 node scripts/probe-llm-observation-ledger.mjs [--out <path>] [--vitest-output <path>] [--capture-output <path>] [--capture-vitest-output <path>]',
    '',
    'Runs the LLMI-P6 Agent Observation Ledger test-mode probe.',
    'The probe executes AlembicAgent source targeted tests and a temporary runtime',
    'capture fixture. It does not start a daemon, run full cold-start, or modify',
    'product source.',
  ].join('\n');
}

function parseArgs(argv) {
  const defaults = {
    out: join(testRepoRoot, 'tmp', 'llm-input-observation-ledger-test-mode.json'),
    vitestOutput: join(testRepoRoot, 'tmp', 'llm-input-observation-ledger-vitest.json'),
    captureOutput: join(testRepoRoot, 'tmp', 'llm-input-observation-ledger-runtime-capture.json'),
    captureVitestOutput: join(
      testRepoRoot,
      'tmp',
      'llm-input-observation-ledger-runtime-capture-vitest.json'
    ),
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
      arg === '--capture-vitest-output'
    ) {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a path`);
      }
      const key =
        arg === '--out'
          ? 'out'
          : arg === '--vitest-output'
            ? 'vitestOutput'
            : arg === '--capture-output'
              ? 'captureOutput'
              : 'captureVitestOutput';
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
    if (details !== undefined) {
      error.details = details;
    }
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
    maxBuffer: 1024 * 1024 * 30,
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

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
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

function runtimeCaptureTestSource() {
  return String.raw`
import { afterAll, describe, expect, it, vi } from 'vitest';
import { writeFileSync } from 'node:fs';
import { MemoryCoordinator } from '../../AlembicAgent/src/agent/memory/MemoryCoordinator.js';
import { AgentRuntime } from '../../AlembicAgent/src/agent/runtime/index.js';

const debugFields = [
  'callId',
  'parentCallId',
  'startedAt',
  'durationMs',
  'timestamp',
  'diagnostics',
  'structuredContent',
  '_meta',
];

const evidence = {
  observationLedger: null,
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

function envelope(overrides = {}) {
  return {
    ok: overrides.ok ?? true,
    toolId: overrides.toolId || 'code',
    callId: overrides.callId || 'raw-ledger-call',
    parentCallId: overrides.parentCallId,
    startedAt: overrides.startedAt || '2026-05-25T00:00:00.000Z',
    durationMs: overrides.durationMs ?? 12,
    status: overrides.status || (overrides.ok === false ? 'error' : 'success'),
    text: overrides.text || 'ok',
    structuredContent: overrides.structuredContent,
    diagnostics: overrides.diagnostics || {
      degraded: false,
      fallbackUsed: false,
      warnings: [],
      timedOutStages: [],
      blockedTools: [],
      truncatedToolCalls: 0,
      emptyResponses: 0,
      aiErrorCount: 0,
      gateFailures: [],
    },
    nextActionHint: overrides.nextActionHint,
    trust: {
      source: 'internal',
      sanitized: true,
      containsUntrustedText: false,
      containsSecrets: false,
    },
  };
}

function getLlmInput(progress) {
  return progress.map((event) => event.processEvent).find((event) => event?.kind === 'llm.input');
}

function extractSection(text, heading) {
  const start = text.indexOf(heading);
  if (start < 0) return '';
  const rest = text.slice(start);
  const next = rest.slice(heading.length).search(/\n##\s(?!#)/u);
  return next < 0 ? rest : rest.slice(0, heading.length + next);
}

function categoryPresence(ledger) {
  return {
    evidence: ledger.includes('### evidence'),
    readSet: ledger.includes('### readSet'),
    searchSet: ledger.includes('### searchSet'),
    failureSet: ledger.includes('### failureSet'),
    nextHints: ledger.includes('### nextHints'),
  };
}

function textPresence(text, values) {
  return Object.fromEntries(values.map((value) => [value, text.includes(value)]));
}

function firstIndex(text, needle) {
  const index = text.indexOf(needle);
  return index >= 0 ? index : null;
}

function preview(text, length = 1600) {
  return text.slice(0, length);
}

describe('LLMI-P6 runtime capture', () => {
  it('captures Observation Ledger in retained llm.input and provider message', async () => {
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
    const memoryCoordinator = new MemoryCoordinator();
    const activeContext = memoryCoordinator.createDimensionScope('architecture:analyst', {
      maxRecentRounds: 1,
    });

    activeContext.noteKeyFinding(
      'Confirmed provider input boundary',
      'src/agent/runtime/AgentRuntime.ts:852',
      9
    );
    activeContext.startRound(1);
    activeContext.recordToolCall(
      'code',
      { action: 'read', filePaths: ['src/agent/memory/ActiveContext.ts', 'src/agent/runtime/AgentRuntime.ts'] },
      envelope({
        structuredContent: {
          mode: 'batch',
          files: [
            { ok: true, path: 'src/agent/memory/ActiveContext.ts', content: 'class ActiveContext {}' },
            { ok: true, path: 'src/agent/runtime/AgentRuntime.ts', content: 'buildLlmInputAssembly()' },
          ],
        },
      }),
      true
    );
    activeContext.recordToolCall(
      'code',
      { action: 'search', patterns: ['Observation Ledger', 'dynamic context'], glob: 'src/agent/**' },
      envelope({
        text: '2 matches (showing 2)\n\nsrc/agent/memory/ActiveContext.ts:1: Observation Ledger\nsrc/agent/runtime/LLMInputAssembly.ts:2: dynamic context',
      }),
      true
    );
    activeContext.recordToolCall(
      'code',
      { action: 'read', path: 'src/agent/memory/Missing.ts' },
      envelope({
        ok: false,
        status: 'error',
        text: '{"callId":"raw-call-id","startedAt":"2026-05-25","durationMs":7,"timestamp":"2026-05-25T00:00:00Z","structuredContent":{"path":"src/agent/memory/Missing.ts"},"diagnostics":{"reason":"missing"},"message":"Cannot read file"}',
        nextActionHint: 'Read src/agent/memory/ActiveContext.ts before retrying missing evidence.',
      }),
      true
    );
    activeContext.recordToolCall(
      'terminal',
      { command: 'npm test -- llm-input' },
      envelope({
        toolId: 'terminal',
        text: 'Terminal command completed: npm test -- llm-input',
      }),
      true
    );

    const tracker = createTracker({ phase: 'SCAN' });
    await runtime.reactLoop('analyze active context observation ledger', {
      source: 'system',
      context: {
        pipelinePhase: 'analyze',
        dimensionId: 'architecture',
        dimensionScopeId: 'architecture:analyst',
      },
      memoryCoordinator,
      systemPromptOverride: 'Analyst identity prompt',
      tracker,
      budgetOverride: { maxIterations: 1, timeoutMs: 1000 },
    });

    const llmInput = getLlmInput(progress);
    const inputText = llmInput?.content?.text || '';
    const providerLayer = capture.messages?.at(-1)?.content || '';
    const providerLedger = extractSection(providerLayer, '## Observation Ledger');
    const inputLedger = extractSection(inputText, '## Observation Ledger');
    const providerDebugPresence = textPresence(providerLedger, debugFields);
    const inputDebugPresence = textPresence(inputLedger, debugFields);
    const providerCategories = categoryPresence(providerLedger);
    const inputCategories = categoryPresence(inputLedger);
    const scratchpadHeading = '## 📌 已确认的关键发现';
    const ledgerHeading = '## Observation Ledger';

    evidence.observationLedger = {
      metadata: llmInput?.metadata || null,
      retainedInput: {
        containsRuntimeLayer: inputText.includes('## Provider runtime layer'),
        containsObservationLedger: inputText.includes(ledgerHeading),
        containsRawPreviousSummary: inputText.includes('之前的探索摘要'),
        categoryPresence: inputCategories,
        debugFieldPresenceInLedger: inputDebugPresence,
        scratchpadIndex: firstIndex(inputText, scratchpadHeading),
        ledgerIndex: firstIndex(inputText, ledgerHeading),
        scratchpadBeforeLedger:
          inputText.indexOf(scratchpadHeading) >= 0 &&
          inputText.indexOf(scratchpadHeading) < inputText.indexOf(ledgerHeading),
        ledgerPreview: preview(inputLedger),
      },
      providerMessage: {
        containsRuntimeLayer: providerLayer.includes('# LLM input runtime layer'),
        containsDynamicContext: providerLayer.includes('## Dynamic context'),
        containsObservationLedger: providerLayer.includes(ledgerHeading),
        containsRawPreviousSummary: providerLayer.includes('之前的探索摘要'),
        categoryPresence: providerCategories,
        debugFieldPresenceInLedger: providerDebugPresence,
        scratchpadIndex: firstIndex(providerLayer, scratchpadHeading),
        ledgerIndex: firstIndex(providerLayer, ledgerHeading),
        scratchpadBeforeLedger:
          providerLayer.indexOf(scratchpadHeading) >= 0 &&
          providerLayer.indexOf(scratchpadHeading) < providerLayer.indexOf(ledgerHeading),
        ledgerPreview: preview(providerLedger),
      },
      regression: {
        containsObjectPromise: inputText.includes('[object Promise]') || providerLayer.includes('[object Promise]'),
        containsMissingRequiredPath:
          inputText.includes('Missing required param "path"') ||
          providerLayer.includes('Missing required param "path"'),
        inputLayerAppended: llmInput?.metadata?.inputLayerAppended === true,
        inputStageProfile: llmInput?.metadata?.inputStageProfile,
      },
    };

    expect(inputText).toContain('## Provider runtime layer');
    expect(inputText).toContain('## Observation Ledger');
    expect(providerLayer).toContain('# LLM input runtime layer');
    expect(providerLayer).toContain('## Dynamic context');
    expect(providerLayer).toContain('## Observation Ledger');
    expect(providerLedger).toContain('### readSet');
    expect(providerLedger).toContain('### searchSet');
    expect(providerLedger).toContain('### failureSet');
    expect(providerLedger).toContain('### nextHints');
    expect(providerLedger).toContain('src/agent/memory/ActiveContext.ts');
    expect(providerLedger).toContain('Observation Ledger in src/agent/**');
    expect(providerLedger).toContain('Cannot read file');
    expect(inputText).not.toContain('之前的探索摘要');
    expect(providerLayer).not.toContain('之前的探索摘要');
    for (const field of debugFields) {
      expect(providerLedger).not.toContain(field);
      expect(inputLedger).not.toContain(field);
    }
    expect(inputText.indexOf(scratchpadHeading)).toBeGreaterThanOrEqual(0);
    expect(inputText.indexOf(scratchpadHeading)).toBeLessThan(inputText.indexOf(ledgerHeading));
    expect(providerLayer.indexOf(scratchpadHeading)).toBeGreaterThanOrEqual(0);
    expect(providerLayer.indexOf(scratchpadHeading)).toBeLessThan(providerLayer.indexOf(ledgerHeading));
    expect(inputText).not.toContain('[object Promise]');
    expect(providerLayer).not.toContain('[object Promise]');
    expect(inputText).not.toContain('Missing required param "path"');
    expect(providerLayer).not.toContain('Missing required param "path"');
    expect(llmInput?.metadata).toMatchObject({
      inputLayerAppended: true,
      inputStageProfile: 'analyze',
    });
  });
});

afterAll(() => {
  writeFileSync(process.env.LLMI_OBSERVATION_LEDGER_CAPTURE_OUTPUT, JSON.stringify(evidence, null, 2) + '\n');
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
  assert(process.env.ALEMBIC_TEST_MODE === '1', 'ALEMBIC_TEST_MODE=1 is required.');

  const [
    agentHead,
    agentStatus,
    alembicStatus,
    coreStatus,
    pluginStatus,
    dashboardStatus,
    biliDiliStatus,
    workspaceStatus,
    packageJsonText,
    activeContextSource,
    runtimeSource,
    assemblySource,
    activeContextTestSource,
    layeringTestSource,
  ] = await Promise.all([
    git(['rev-parse', 'HEAD'], agentRoot),
    git(['status', '--short'], agentRoot),
    git(['-C', join(workspaceRoot, 'Alembic'), 'status', '--short'], workspaceRoot).catch(
      (error) => `unavailable: ${error.message}`
    ),
    git(['-C', join(workspaceRoot, 'AlembicCore'), 'status', '--short'], workspaceRoot).catch(
      (error) => `unavailable: ${error.message}`
    ),
    git(['-C', join(workspaceRoot, 'AlembicPlugin'), 'status', '--short'], workspaceRoot).catch(
      (error) => `unavailable: ${error.message}`
    ),
    git(['-C', join(workspaceRoot, 'AlembicDashboard'), 'status', '--short'], workspaceRoot).catch(
      (error) => `unavailable: ${error.message}`
    ),
    git(['-C', join(workspaceRoot, 'BiliDili'), 'status', '--short'], workspaceRoot).catch(
      (error) => `unavailable: ${error.message}`
    ),
    git(['status', '--short'], workspaceRoot),
    readFile(join(agentRoot, 'package.json'), 'utf8'),
    readFile(join(agentRoot, 'src/agent/memory/ActiveContext.ts'), 'utf8'),
    readFile(join(agentRoot, 'src/agent/runtime/AgentRuntime.ts'), 'utf8'),
    readFile(join(agentRoot, 'src/agent/runtime/LLMInputAssembly.ts'), 'utf8'),
    readFile(join(agentRoot, 'test/ActiveContext.test.ts'), 'utf8'),
    readFile(join(agentRoot, 'test/llm-input-layering.test.ts'), 'utf8'),
  ]);
  const packageJson = JSON.parse(packageJsonText);

  assert(agentHead === expectedAgentHead, 'AlembicAgent HEAD does not match Test-07 target.', {
    actual: agentHead,
    expected: expectedAgentHead,
  });
  assert(agentStatus === '', 'AlembicAgent working tree must stay clean for Test-07.', agentStatus);

  const sourceEvidence = {
    activeContextLedgerImplementation: includesAll(activeContextSource, [
      "type ObservationLedgerCategory = 'evidence' | 'readSet' | 'searchSet' | 'failureSet' | 'nextHints'",
      'interface ObservationLedgerItem',
      'const OBSERVATION_LEDGER_CATEGORIES',
      'const PROVIDER_DEBUG_KEYS',
      "'## Observation Ledger'",
      '#buildObservationLedgerSection',
      '#extractObservationLedgerItems',
      'sanitizeLedgerText',
    ]),
    runtimeConsumption: includesAll(runtimeSource, [
      'buildLlmInputAssembly',
      'const unifiedMessages = llmInputAssembly.providerMessages',
      'formatDeveloperVisibleLlmInput(llmInputAssembly)',
      '...llmInputAssembly.metadata',
    ]),
    assemblyLayering: includesAll(assemblySource, [
      "id: 'dynamicContext'",
      "title: 'Dynamic context'",
      '# LLM input runtime layer',
      'providerVisibleSectionIds',
    ]),
    targetedTestAssertions: includesAll(activeContextTestSource + layeringTestSource, [
      'renders a structured ledger instead of raw compressed observation dumps',
      'keeps scratchpad findings ahead of the observation ledger',
      'injects observation ledger dynamic context without raw tool envelope fields',
      "expect(providerLayer).toContain('## Observation Ledger')",
      "expect(providerLayer).not.toContain('callId')",
      "expect(providerLayer).not.toContain('startedAt')",
      "expect(providerLayer).not.toContain('durationMs')",
    ]),
  };

  for (const [group, checks] of Object.entries(sourceEvidence)) {
    const missing = Object.entries(checks)
      .filter(([, ok]) => !ok)
      .map(([name]) => name);
    assert(missing.length === 0, `Source evidence check failed for ${group}.`, missing);
  }

  await Promise.all([
    mkdir(dirname(args.out), { recursive: true }),
    mkdir(dirname(args.vitestOutput), { recursive: true }),
    mkdir(dirname(args.captureOutput), { recursive: true }),
    mkdir(dirname(args.captureVitestOutput), { recursive: true }),
  ]);

  const vitestRun = await runCommand(
    'npm',
    [
      'test',
      '--',
      'llm-input',
      'ActiveContext',
      '--reporter=json',
      '--outputFile',
      args.vitestOutput,
    ],
    { cwd: agentRoot, env: { ...process.env, ALEMBIC_TEST_MODE: '1' } }
  );
  const vitestReport = await readJson(args.vitestOutput);
  assert(vitestReport.success === true, 'AlembicAgent targeted Vitest run failed.', vitestReport);

  const captureTestPath = join(testRepoRoot, 'tmp', 'llm-input-observation-ledger-runtime-capture.test.ts');
  const captureConfigPath = join(
    testRepoRoot,
    'tmp',
    'llm-input-observation-ledger-runtime-capture.vitest.config.ts'
  );
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
      env: {
        ...process.env,
        ALEMBIC_TEST_MODE: '1',
        LLMI_OBSERVATION_LEDGER_CAPTURE_OUTPUT: args.captureOutput,
      },
    }
  );
  const captureVitestReport = await readJson(args.captureVitestOutput);
  const runtimeCapture = await readJson(args.captureOutput);
  assert(
    captureVitestReport.success === true,
    'Observation Ledger runtime capture Vitest run failed.',
    captureVitestReport
  );

  const ledgerEvidence = runtimeCapture.observationLedger;
  assert(
    ledgerEvidence?.retainedInput?.containsObservationLedger === true,
    'Retained llm.input missing Observation Ledger.',
    ledgerEvidence?.retainedInput
  );
  assert(
    ledgerEvidence?.providerMessage?.containsObservationLedger === true,
    'Provider message missing Observation Ledger.',
    ledgerEvidence?.providerMessage
  );
  for (const field of debugFields) {
    assert(
      ledgerEvidence?.providerMessage?.debugFieldPresenceInLedger?.[field] === false,
      `Provider-facing ledger still contains debug field: ${field}`,
      ledgerEvidence?.providerMessage?.debugFieldPresenceInLedger
    );
  }

  const evidence = {
    createdAt: new Date().toISOString(),
    config: {
      ALEMBIC_TEST_MODE: process.env.ALEMBIC_TEST_MODE,
      command: `ALEMBIC_TEST_MODE=1 node AlembicTest/scripts/probe-llm-observation-ledger.mjs --out ${relative(
        workspaceRoot,
        args.out
      )} --vitest-output ${relative(workspaceRoot, args.vitestOutput)} --capture-output ${relative(
        workspaceRoot,
        args.captureOutput
      )} --capture-vitest-output ${relative(workspaceRoot, args.captureVitestOutput)}`,
      scope:
        'AlembicAgent source test-mode fixture; no full cold-start; no daemon job; no product source edits; no BiliDili operation',
    },
    alembicAgent: {
      expectedHead: expectedAgentHead,
      head: agentHead,
      packageVersion: packageJson.version,
      statusShort: agentStatus || '(clean)',
    },
    realProjectStatus: {
      Alembic: alembicStatus || '(clean)',
      AlembicCore: coreStatus || '(clean)',
      AlembicAgent: agentStatus || '(clean)',
      AlembicPlugin: pluginStatus || '(clean)',
      AlembicDashboard: dashboardStatus || '(clean)',
      BiliDili: biliDiliStatus || '(clean)',
      AlembicWorkspace: workspaceStatus || '(clean)',
    },
    sourceEvidence,
    executionEvidence: {
      targetedVitest: {
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
    },
    conclusion: {
      sourceTestModeRuntime: 'passed',
      retainedLlmInputLedger: 'passed',
      providerMessageLedger: 'passed',
      debugFieldContraction: 'passed',
      scratchpadPriority: 'passed',
      wave1Wave2Regression: 'passed',
      distArtifactRisk: 'not_tested_gtodo_2026_05_25_002',
    },
  };

  await writeFile(args.out, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(
    JSON.stringify(
      {
        ok: true,
        out: args.out,
        vitestOutput: args.vitestOutput,
        captureOutput: args.captureOutput,
        captureVitestOutput: args.captureVitestOutput,
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
