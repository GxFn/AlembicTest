#!/usr/bin/env node
import { execFile } from 'node:child_process';
import {
  lstat,
  mkdir,
  readFile,
  realpath,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const testRepoRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(testRepoRoot, '..');
const agentRoot = resolve(workspaceRoot, 'AlembicAgent');
const coreRoot = resolve(workspaceRoot, 'AlembicCore');
const stagedAgentRoot = resolve(agentRoot, 'tmp/release/@alembic-agent');
const expectedAgentHead = '8970327d73bf6c01476a1aeb5384f014483b68dd';
const expectedPackShasum = 'dbd390be0d13cca816c1bdb6de354b1838aca55f';

function usage() {
  return [
    'Usage: ALEMBIC_TEST_MODE=1 node scripts/probe-package-runtime-integration.mjs [--out <path>] [--staged-agent <path>] [--core-root <path>]',
    '',
    'Runs the LLMI-P11 package/runtime integration probe against the staged',
    '@alembic/agent package. The probe imports the package through a temporary',
    'node_modules harness, validates public runtime/tool exports, executes',
    'code.read({ filePaths }) through ToolRouterV2, builds an Observation Ledger,',
    'and assembles provider LLM input from the staged runtime artifact.',
    '',
    'It does not start a daemon, run cold-start, publish npm packages, or modify',
    'product source.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = {
    out: join(testRepoRoot, 'tmp', 'llm-input-package-runtime-integration.json'),
    stagedAgent: stagedAgentRoot,
    coreRoot,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--out' || arg === '--staged-agent' || arg === '--core-root') {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a path`);
      }
      const key =
        arg === '--out' ? 'out' : arg === '--staged-agent' ? 'stagedAgent' : 'coreRoot';
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

async function pathExists(path) {
  try {
    await lstat(path);
    return true;
  } catch {
    return false;
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 1024 * 1024 * 10 });
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
    command: sanitizeText([file, ...args].join(' ')),
    cwd: sanitizeText(options.cwd || process.cwd()),
    durationMs: Date.now() - startedAt,
    stderr: sanitizeText(result.stderr || ''),
    stdout: sanitizeText(result.stdout || ''),
  };
}

function sanitizeText(text) {
  return String(text)
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replaceAll(workspaceRoot, '<workspace>');
}

function workspaceRelative(path) {
  const rel = relative(workspaceRoot, path);
  return rel && !rel.startsWith('..') ? rel : path;
}

function packageLocalDependencies(manifest) {
  const dependencyBlocks = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
    'bundleDependencies',
    'bundledDependencies',
  ];
  const entries = [];
  for (const block of dependencyBlocks) {
    const value = manifest[block];
    if (!value) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (String(item).startsWith('file:') || String(item).startsWith('link:')) {
          entries.push({ block, name: item, specifier: item });
        }
      }
      continue;
    }
    for (const [name, specifier] of Object.entries(value)) {
      if (/^(file|link):/u.test(String(specifier))) {
        entries.push({ block, name, specifier: String(specifier) });
      }
    }
  }
  return entries;
}

function textMarkers(text, markers) {
  return Object.fromEntries(markers.map((marker) => [marker, text.includes(marker)]));
}

async function inspectKeyFiles(stagedRoot) {
  const keyFiles = {
    llmInputAssembly: 'dist/agent/runtime/LLMInputAssembly.js',
    agentRuntime: 'dist/agent/runtime/AgentRuntime.js',
    activeContext: 'dist/agent/memory/ActiveContext.js',
    codeHandler: 'dist/tools/v2/handlers/code.js',
    toolRegistry: 'dist/tools/v2/registry.js',
  };
  const evidence = {};
  for (const [name, relPath] of Object.entries(keyFiles)) {
    const absPath = join(stagedRoot, relPath);
    const text = await readFile(absPath, 'utf8');
    evidence[name] = {
      path: workspaceRelative(absPath),
      byteLength: Buffer.byteLength(text),
      markers:
        name === 'llmInputAssembly'
          ? textMarkers(text, [
              'export function buildLlmInputAssembly',
              '# LLM input runtime layer',
              'inputStageProfile',
            ])
          : name === 'agentRuntime'
            ? textMarkers(text, [
                "import { buildLlmInputAssembly } from './LLMInputAssembly.js'",
                'const llmInputAssembly = buildLlmInputAssembly',
                "kind: 'llm.input'",
              ])
            : name === 'activeContext'
              ? textMarkers(text, ['## Observation Ledger', '#buildObservationLedgerSection'])
              : name === 'codeHandler'
                ? textMarkers(text, [
                    'const MAX_BATCH_READ_FILES = 5',
                    'params.filePaths',
                    'code.read accepts either path or filePaths',
                    'code.read requires path or filePaths[]',
                  ])
                : textMarkers(text, [
                    'Read file content (single path or batch filePaths)',
                    'filePaths',
                    'generateLightweightSchemas',
                  ]),
    };
  }
  return evidence;
}

async function setupHarness({ stagedAgent, coreRoot: corePackageRoot }) {
  const harnessRoot = join(
    testRepoRoot,
    'tmp',
    `package-runtime-integration-harness-${new Date().toISOString().replace(/[:.]/g, '-')}`
  );
  const scopedNodeModules = join(harnessRoot, 'node_modules', '@alembic');
  await mkdir(scopedNodeModules, { recursive: true });
  await symlink(stagedAgent, join(scopedNodeModules, 'agent'), 'dir');
  await symlink(corePackageRoot, join(scopedNodeModules, 'core'), 'dir');
  await writeFile(
    join(harnessRoot, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }, null, 2)
  );
  await writeFile(join(harnessRoot, 'runtime-probe.mjs'), harnessSource(), 'utf8');
  return harnessRoot;
}

function harnessSource() {
  return String.raw`
import { ActiveContext } from '@alembic/agent/memory';
import { AgentRuntime, buildLlmInputAssembly, resolveLlmInputStageProfile } from '@alembic/agent/runtime';
import { TOOL_REGISTRY, ToolRouterV2, generateLightweightSchemas } from '@alembic/agent/tools/v2';

const testRepoRoot = ${JSON.stringify(testRepoRoot)};

function assert(condition, message, details = undefined) {
  if (!condition) {
    const error = new Error(message);
    if (details !== undefined) {
      error.details = details;
    }
    throw error;
  }
}

const resolutions = {
  runtime: import.meta.resolve('@alembic/agent/runtime'),
  memory: import.meta.resolve('@alembic/agent/memory'),
  toolsV2: import.meta.resolve('@alembic/agent/tools/v2'),
  coreLogging: import.meta.resolve('@alembic/core/logging'),
};

assert(typeof AgentRuntime === 'function', 'AgentRuntime public export is not a class/function');
assert(typeof buildLlmInputAssembly === 'function', 'buildLlmInputAssembly public export missing');
assert(typeof resolveLlmInputStageProfile === 'function', 'resolveLlmInputStageProfile public export missing');
assert(typeof ActiveContext === 'function', 'ActiveContext public export missing');
assert(typeof ToolRouterV2 === 'function', 'ToolRouterV2 public export missing');
assert(typeof TOOL_REGISTRY?.code?.actions?.read?.handler === 'function', 'code.read handler missing from TOOL_REGISTRY');

const router = new ToolRouterV2();
const batchRead = await router.execute(
  {
    tool: 'code',
    action: 'read',
    params: {
      filePaths: ['package.json', 'scripts/README.md'],
      maxLines: 8,
    },
  },
  {
    projectRoot: testRepoRoot,
    tokenBudget: 5000,
    searchCache: new Map(),
    deltaCache: null,
  }
);

assert(batchRead.ok === true, 'code.read({ filePaths }) failed', batchRead);
assert(batchRead.data?.mode === 'batch', 'code.read did not use batch mode', batchRead.data);
assert(batchRead.data?.summary?.requested === 2, 'batch read requested count mismatch', batchRead.data?.summary);
assert(batchRead.data?.summary?.failed === 0, 'batch read unexpectedly failed a file', batchRead.data?.summary);

const activeContext = new ActiveContext({ maxRecentRounds: 1 });
activeContext.startRound(1);
activeContext.recordToolCall(
  'code',
  { action: 'read', filePaths: ['package.json', 'scripts/README.md'] },
  {
    ok: true,
    toolId: 'code',
    callId: 'package-runtime-batch-read',
    status: 'success',
    text: 'batch read completed',
    structuredContent: batchRead.data,
  },
  true
);
activeContext.endRound();
activeContext.startRound(2);
activeContext.recordToolCall(
  'terminal',
  { action: 'exec', command: 'node --version' },
  {
    ok: true,
    toolId: 'terminal',
    callId: 'package-runtime-terminal',
    status: 'success',
    text: 'v22.x',
  },
  true
);
activeContext.endRound();

const observationLedger = activeContext.buildContext(5000);
assert(observationLedger.includes('## Observation Ledger'), 'Observation Ledger was not generated');
assert(observationLedger.includes('### readSet'), 'Observation Ledger did not include readSet');
assert(observationLedger.includes('package.json'), 'Observation Ledger did not retain package.json read evidence');

const toolSchemas = generateLightweightSchemas({ code: ['read'] });
const tracker = {
  phase: 'SCAN',
  pipelineType: 'bootstrap',
  getMetrics: () => ({
    phase: 'SCAN',
    totalToolCalls: 1,
    evidenceToolCallCount: 1,
    submitCount: 0,
  }),
  getPlanProgress: () => ({ coveredSteps: 1, totalSteps: 2 }),
};
const runtimeCtx = {
  context: {
    dimensionId: 'LLMI-P11',
    pipelinePhase: 'analyze',
    targetName: 'package-runtime-integration',
  },
  iteration: 1,
  maxIterations: 1,
  prompt: 'Validate staged package runtime input assembly.',
  sharedState: {},
  source: 'package-runtime-harness',
  toolCalls: [batchRead],
  tracker,
  trace: {
    getStats: () => ({ events: 1, retained: 1 }),
  },
};
const assembly = buildLlmInputAssembly({
  ctx: runtimeCtx,
  dynamicContext: observationLedger,
  effectiveToolChoice: 'auto',
  messages: [{ role: 'user', content: 'Use package runtime input assembly.' }],
  modelRef: 'unit-test-model',
  requestedToolChoice: 'auto',
  systemPrompt: 'You are a package runtime integration probe.',
  tools: toolSchemas,
});

assert(assembly.stageProfile === 'analyze', 'LLM input stage profile mismatch', assembly.stageProfile);
assert(assembly.metadata.inputLayerAppended === true, 'LLM input layer was not appended');
assert(assembly.providerMessages.length === 2, 'Provider messages did not include runtime input layer');
assert(
  assembly.providerMessages.at(-1)?.content?.includes('# LLM input runtime layer'),
  'Provider message missing runtime layer heading'
);
assert(
  assembly.providerMessages.at(-1)?.content?.includes('## Observation Ledger'),
  'Provider message missing Observation Ledger dynamic context'
);

const serialized = JSON.stringify({ batchRead, observationLedger, assembly });
assert(!serialized.includes('[object Promise]'), 'Runtime output contains [object Promise]');
assert(!serialized.includes('Missing required param "path"'), 'Runtime output contains stale code.read path error');
assert(!Object.values(resolutions).some((value) => value.includes('/src/')), 'Public package import resolved to src', resolutions);

console.log(
  JSON.stringify(
    {
      passed: true,
      resolutions,
      publicExports: {
        AgentRuntime: typeof AgentRuntime,
        ActiveContext: typeof ActiveContext,
        ToolRouterV2: typeof ToolRouterV2,
        codeReadSummary: TOOL_REGISTRY.code.actions.read.summary,
      },
      batchRead: {
        ok: batchRead.ok,
        mode: batchRead.data?.mode,
        summary: batchRead.data?.summary,
        files: (batchRead.data?.files || []).map((file) => ({
          ok: file.ok,
          path: file.path,
          lineCount: file.lineCount,
          mode: file.mode,
        })),
      },
      observationLedger: {
        includesHeading: observationLedger.includes('## Observation Ledger'),
        includesReadSet: observationLedger.includes('### readSet'),
        excerpt: observationLedger.slice(0, 1200),
      },
      llmInputAssembly: {
        stageProfile: assembly.stageProfile,
        inputLayerAppended: assembly.metadata.inputLayerAppended,
        inputSectionIds: assembly.metadata.inputSectionIds,
        providerVisibleSectionIds: assembly.metadata.providerVisibleSectionIds,
        providerMessages: assembly.providerMessages.length,
        lastMessageExcerpt: assembly.providerMessages.at(-1)?.content?.slice(0, 1800),
      },
      regressionGuards: {
        noObjectPromise: !serialized.includes('[object Promise]'),
        noMissingRequiredPath: !serialized.includes('Missing required param "path"'),
        noSrcResolution: !Object.values(resolutions).some((value) => value.includes('/src/')),
      },
    },
    null,
    2
  )
);
`;
}

async function runHarness({ stagedAgent, corePackageRoot }) {
  const harnessRoot = await setupHarness({ stagedAgent, coreRoot: corePackageRoot });
  const stdoutPath = join(harnessRoot, 'runtime-probe-output.json');
  const commandResult = await runCommand(process.execPath, ['--preserve-symlinks', 'runtime-probe.mjs'], {
    cwd: harnessRoot,
    env: { ...process.env, ALEMBIC_TEST_MODE: '1' },
  });
  await writeFile(stdoutPath, commandResult.stdout, 'utf8');
  const payload = JSON.parse(commandResult.stdout);
  return {
    command: commandResult,
    harnessRoot: workspaceRelative(harnessRoot),
    outputPath: workspaceRelative(stdoutPath),
    payload: sanitizeObject(payload),
    symlinks: {
      agent: {
        link: workspaceRelative(join(harnessRoot, 'node_modules/@alembic/agent')),
        realpath: workspaceRelative(await realpath(join(harnessRoot, 'node_modules/@alembic/agent'))),
      },
      core: {
        link: workspaceRelative(join(harnessRoot, 'node_modules/@alembic/core')),
        realpath: workspaceRelative(await realpath(join(harnessRoot, 'node_modules/@alembic/core'))),
      },
    },
  };
}

function sanitizeObject(value) {
  return JSON.parse(sanitizeText(JSON.stringify(value)));
}

async function runPackPreview(stagedAgent) {
  const result = await runCommand(
    'npm',
    ['--cache', join(testRepoRoot, 'tmp/npm-cache'), 'pack', '--dry-run', '--json', stagedAgent],
    {
      cwd: testRepoRoot,
      env: { ...process.env, ALEMBIC_TEST_MODE: '1' },
    }
  );
  const parsed = JSON.parse(result.stdout);
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return {
    command: {
      ...result,
      stdout: `[npm pack dry-run JSON parsed; entryCount=${Array.isArray(first?.files) ? first.files.length : 'unknown'}]`,
    },
    package: first?.name,
    version: first?.version,
    filename: first?.filename,
    shasum: first?.shasum,
    size: first?.size,
    unpackedSize: first?.unpackedSize,
    entryCount: Array.isArray(first?.files) ? first.files.length : null,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assert(process.env.ALEMBIC_TEST_MODE === '1', 'ALEMBIC_TEST_MODE=1 is required');
  assert(await pathExists(args.stagedAgent), `Staged package not found: ${args.stagedAgent}`);
  assert(await pathExists(args.coreRoot), `Core package root not found: ${args.coreRoot}`);

  const agentHead = await git(['rev-parse', 'HEAD'], agentRoot);
  const coreHead = await git(['rev-parse', 'HEAD'], coreRoot);
  const agentStatusBefore = await git(['status', '--short'], agentRoot);
  const coreStatusBefore = await git(['status', '--short'], coreRoot);
  const testStatusBefore = await git(['status', '--short'], testRepoRoot);
  assert(agentHead === expectedAgentHead, 'AlembicAgent HEAD does not match Wave 6A source commit', {
    expectedAgentHead,
    agentHead,
  });

  const manifestPath = join(args.stagedAgent, 'package.json');
  const manifest = await readJson(manifestPath);
  const localDependencies = packageLocalDependencies(manifest);
  assert(manifest.name === '@alembic/agent', 'Unexpected staged package name', manifest.name);
  assert(manifest.dependencies?.['@alembic/core'] === '0.2.0', 'Staged @alembic/core dependency is not registry version', {
    dependency: manifest.dependencies?.['@alembic/core'],
  });
  assert(localDependencies.length === 0, 'Staged manifest still has local file/link dependencies', {
    localDependencies,
  });

  const keyFileEvidence = await inspectKeyFiles(args.stagedAgent);
  for (const [name, evidence] of Object.entries(keyFileEvidence)) {
    assert(
      Object.values(evidence.markers).every(Boolean),
      `Missing expected marker in ${name}`,
      evidence.markers
    );
  }

  const packPreview = await runPackPreview(args.stagedAgent);
  assert(packPreview.shasum === expectedPackShasum, 'Pack preview shasum changed from Wave 6A evidence', {
    expectedPackShasum,
    actual: packPreview.shasum,
  });

  const harness = await runHarness({ stagedAgent: args.stagedAgent, corePackageRoot: args.coreRoot });
  assert(harness.payload.passed === true, 'Runtime harness did not pass', harness.payload);

  const agentStatusAfter = await git(['status', '--short'], agentRoot);
  const coreStatusAfter = await git(['status', '--short'], coreRoot);
  const testStatusAfter = await git(['status', '--short'], testRepoRoot);

  const result = {
    ok: true,
    probe: 'LLMI-P11-Package-Runtime-Integration',
    timestamp: new Date().toISOString(),
    testMode: process.env.ALEMBIC_TEST_MODE,
    scope: {
      fullColdStart: false,
      daemonStarted: false,
      dashboardUsed: false,
      productSourceModified: false,
      biliDiliTouched: false,
    },
    source: {
      agentHead,
      expectedAgentHead,
      coreHead,
      stagedAgent: workspaceRelative(args.stagedAgent),
      stagedAgentRealpath: workspaceRelative(await realpath(args.stagedAgent)),
      coreRoot: workspaceRelative(args.coreRoot),
    },
    gitStatus: {
      AlembicAgent: {
        before: agentStatusBefore,
        after: agentStatusAfter,
      },
      AlembicCore: {
        before: coreStatusBefore,
        after: coreStatusAfter,
      },
      AlembicTest: {
        before: testStatusBefore,
        after: testStatusAfter,
      },
    },
    manifest: {
      path: workspaceRelative(manifestPath),
      name: manifest.name,
      version: manifest.version,
      dependencies: manifest.dependencies,
      localDependencies,
      alembicRelease: manifest.alembicRelease,
    },
    keyFileEvidence,
    packPreview,
    harness,
    writeBoundary: {
      agentAsdExists: await pathExists(join(agentRoot, '.asd')),
      coreAsdExists: await pathExists(join(coreRoot, '.asd')),
      agentNestedAlembicExists: await pathExists(join(agentRoot, 'Alembic')),
      coreNestedAlembicExists: await pathExists(join(coreRoot, 'Alembic')),
    },
  };

  await mkdir(dirname(args.out), { recursive: true });
  await writeFile(args.out, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(`Package runtime integration probe passed: ${workspaceRelative(args.out)}`);
  console.log(
    JSON.stringify(
      {
        out: workspaceRelative(args.out),
        agentHead,
        packShasum: packPreview.shasum,
        runtimeImport: harness.payload.resolutions.runtime,
        batchRead: harness.payload.batchRead.summary,
        llmInputStageProfile: harness.payload.llmInputAssembly.stageProfile,
        observationLedger: harness.payload.observationLedger.includesReadSet,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  process.exit(1);
});
