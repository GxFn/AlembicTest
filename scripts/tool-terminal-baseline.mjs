#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const testRepoRoot = path.resolve(scriptDir, '..');
const workspaceRoot = path.resolve(testRepoRoot, '..');

const requiredActionFields = [
  'timestamp',
  'surface',
  'actionId',
  'purpose',
  'workdir',
  'targetRepo',
  'readWriteClass',
  'writesFiles',
  'externalCall',
  'success',
  'evidenceRef',
];

function usage() {
  return [
    'Usage: node scripts/tool-terminal-baseline.mjs --actions <path> [options]',
    '',
    'Builds a controlled Tool/Terminal baseline from an explicit action ledger.',
    'It normalizes transcript order into a timestamp field, recomputes metrics,',
    'and writes all generated evidence under AlembicTest paths only.',
    '',
    'Options:',
    '  --actions <path>          Required input JSON. Accepts {actions:[]} or an array.',
    '  --source-map <path>       Optional telemetry source map JSON to copy into output.',
    '  --run-id <id>             Run id for generated evidence.',
    '  --sampling-window <name>  Sampling window label.',
    '  --out-dir <path>          Output evidence dir. Default: AlembicTest/tmp/tool-terminal-baseline',
    '  --report <path>           Output markdown report. Default: <out-dir>/tool-terminal-baseline.md',
    '  --expected-workdir <path>  Expected terminal/file-facing workdir. Default: AlembicTest root.',
    '  --check                   Validate and print summary without writing files.',
    '  --json                    Print JSON summary.',
    '  -h, --help                Show this help.',
  ].join('\n');
}

function parseArgs(argv) {
  const args = {
    actions: null,
    sourceMap: null,
    runId: 'tool-terminal-baseline',
    samplingWindow: 'controlled-action-ledger',
    outDir: path.join(testRepoRoot, 'tmp', 'tool-terminal-baseline'),
    report: null,
    expectedWorkdir: testRepoRoot,
    check: false,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '-h' || arg === '--help') {
      console.log(usage());
      process.exit(0);
    }
    if (arg === '--check') {
      args.check = true;
      continue;
    }
    if (arg === '--json') {
      args.json = true;
      continue;
    }
    if (
      arg === '--actions' ||
      arg === '--source-map' ||
      arg === '--run-id' ||
      arg === '--sampling-window' ||
      arg === '--out-dir' ||
      arg === '--report' ||
      arg === '--expected-workdir'
    ) {
      const value = argv[index + 1];
      if (!value) {
        throw new Error(`${arg} requires a value`);
      }
      index += 1;
      if (arg === '--actions') args.actions = path.resolve(process.cwd(), value);
      if (arg === '--source-map') args.sourceMap = path.resolve(process.cwd(), value);
      if (arg === '--run-id') args.runId = value;
      if (arg === '--sampling-window') args.samplingWindow = value;
      if (arg === '--out-dir') args.outDir = path.resolve(process.cwd(), value);
      if (arg === '--report') args.report = path.resolve(process.cwd(), value);
      if (arg === '--expected-workdir') {
        args.expectedWorkdir = path.resolve(process.cwd(), value);
      }
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  if (!args.actions) {
    throw new Error('--actions is required');
  }
  if (!args.report) {
    args.report = path.join(args.outDir, 'tool-terminal-baseline.md');
  }
  assertInsideTestRepo(args.outDir, '--out-dir');
  assertInsideTestRepo(args.report, '--report');
  return args;
}

function assertInsideTestRepo(targetPath, label) {
  const resolved = path.resolve(targetPath);
  const rel = path.relative(testRepoRoot, resolved);
  if (rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))) {
    return;
  }
  throw new Error(`${label} must stay under AlembicTest root: ${resolved}`);
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

function asArrayActions(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.actions)) return raw.actions;
  throw new Error('actions JSON must be an array or an object with actions[]');
}

function normalizeAction(action, index) {
  const order = action.order ?? index + 1;
  const timestamp =
    action.timestamp ??
    action.timestampOrder ??
    (Number.isFinite(Number(order)) ? `order:${order}` : String(order));

  return {
    ...action,
    timestamp,
    timestampMode: action.timestamp ? 'timestamp' : 'order',
    order,
  };
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== '';
}

function countBy(items, keyFn) {
  const counts = {};
  for (const item of items) {
    const key = keyFn(item);
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

function familyCounts(actions) {
  const counts = {};
  for (const action of actions.filter((item) => item.surface === 'terminal')) {
    const families = String(action.commandFamily ?? 'unknown')
      .split('+')
      .map((item) => item.trim())
      .filter(Boolean);
    for (const family of families.length > 0 ? families : ['unknown']) {
      counts[family] = (counts[family] ?? 0) + 1;
    }
  }
  return counts;
}

function isReadOrVerify(action) {
  return action.readWriteClass === 'read' || action.readWriteClass === 'verify';
}

function isWriteOrMutation(action) {
  return action.readWriteClass === 'write' || action.writesFiles === true;
}

function isParallelRead(action) {
  return isReadOrVerify(action) && String(action.commandShape ?? '').includes('parallel');
}

function placementMismatch(action) {
  return /file placement mismatch|placement mismatch:/i.test(String(action.notes ?? ''));
}

function outputNoise(action) {
  if (action.commandFamily === 'session-control') {
    return false;
  }
  return action.outputNoise === true || /truncated|noisy|too broad|output noise/i.test(
    `${action.notes ?? ''} ${action.evidenceRef ?? ''}`
  );
}

function sourceBlindSpots(sourceMap) {
  if (!sourceMap || !Array.isArray(sourceMap.sources)) return [];
  const blindSpots = [];
  for (const source of sourceMap.sources) {
    const unavailable = source.availability === 'unavailable';
    const transcriptExportGap =
      source.source === 'Codex current tool transcript' &&
      /No stable local raw transcript file path/i.test(String(source.blindSpot ?? ''));
    if (unavailable || transcriptExportGap) {
      blindSpots.push({
        source: source.source,
        reason: source.blindSpot ?? source.evidence ?? source.availability,
      });
    }
  }
  return blindSpots;
}

function buildMetrics({ actions, sourceMap, expectedWorkdir }) {
  const missingRequiredRows = actions
    .map((action) => ({
      actionId: action.actionId,
      missing: requiredActionFields.filter((field) => !hasValue(action[field])),
    }))
    .filter((item) => item.missing.length > 0);

  const readOrVerify = actions.filter(isReadOrVerify);
  const writeOrMutation = actions.filter(isWriteOrMutation);
  const failed = actions.filter((action) => action.success === false);
  const blindSpots = sourceBlindSpots(sourceMap);
  const workdirMismatches = actions.filter(
    (action) =>
      hasValue(action.workdir) &&
      path.resolve(action.workdir) !== path.resolve(expectedWorkdir) &&
      action.surface === 'terminal'
  );

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    metrics: {
      'pcvm.toolTerminal.baselineCoverage': {
        value:
          actions.length === 0
            ? 0
            : Number(((actions.length - missingRequiredRows.length) / actions.length).toFixed(4)),
        missingRequiredRows,
        timestampModes: countBy(actions, (action) => action.timestampMode ?? 'unknown'),
      },
      'pcvm.tool.countBySurface': {
        terminal: 0,
        tool: 0,
        browser: 0,
        mcp: 0,
        other: 0,
        ...countBy(actions, (action) => action.surface ?? 'unknown'),
      },
      'pcvm.terminal.commandCountByFamily': familyCounts(actions),
      'pcvm.tool.readToWriteRatio': {
        readOrVerifyActions: readOrVerify.length,
        writeOrMutationActions: writeOrMutation.length,
        ratio:
          writeOrMutation.length === 0
            ? null
            : Number((readOrVerify.length / writeOrMutation.length).toFixed(4)),
      },
      'pcvm.tool.parallelReadRatio': {
        parallelReadActions: actions.filter(isParallelRead).length,
        eligibleReadActions: readOrVerify.length,
        ratio:
          readOrVerify.length === 0
            ? null
            : Number((actions.filter(isParallelRead).length / readOrVerify.length).toFixed(4)),
      },
      'pcvm.terminal.workdirMismatchCount': workdirMismatches.length,
      'pcvm.tool.failureRate': {
        failedActions: failed.length,
        totalActions: actions.length,
        rate: actions.length === 0 ? 0 : Number((failed.length / actions.length).toFixed(4)),
      },
      'pcvm.tool.escalationCount': actions.filter((action) => action.sandboxEscalated === true)
        .length,
      'pcvm.tool.externalCallCount': actions.filter((action) => action.externalCall === true)
        .length,
      'pcvm.terminal.sessionLeakCount': actions.filter((action) => action.sessionClosed === false)
        .length,
      diagnostics: {
        'pcvm.terminal.chainedCommandCount': actions.filter(
          (action) => action.commandShape === 'chained'
        ).length,
        'pcvm.tool.duplicateReadCount': duplicateReadCount(actions),
        'pcvm.tool.outputNoiseIncidents': actions.filter(outputNoise).length,
        'pcvm.tool.evidenceMissingCount': blindSpots.length,
        'pcvm.tool.actionEvidenceMissingCount': actions.filter(
          (action) => !hasValue(action.evidenceRef)
        ).length,
        'pcvm.tool.filePlacementMismatchCount': actions.filter(placementMismatch).length,
      },
    },
    details: {
      expectedWorkdir: workspaceRelative(expectedWorkdir),
      workdirMismatches: workdirMismatches.map((action) => ({
        actionId: action.actionId,
        workdir: workspaceRelative(action.workdir),
      })),
      sourceBlindSpots: blindSpots,
      placementMismatchActions: actions.filter(placementMismatch).map((action) => action.actionId),
      outputNoiseActions: actions.filter(outputNoise).map((action) => action.actionId),
      failedActions: failed.map((action) => action.actionId),
    },
  };
}

function duplicateReadCount(actions) {
  const seen = new Set();
  let duplicates = 0;
  for (const action of actions) {
    if (!isReadOrVerify(action)) continue;
    const key = `${action.readWriteClass}:${action.commandFamily ?? ''}:${action.evidenceRef ?? ''}`;
    if (!action.evidenceRef) continue;
    if (seen.has(key)) {
      duplicates += 1;
    } else {
      seen.add(key);
    }
  }
  return duplicates;
}

function workspaceRelative(targetPath) {
  if (!targetPath) return targetPath;
  const resolved = path.resolve(targetPath);
  const rel = path.relative(workspaceRoot, resolved);
  return rel && !rel.startsWith('..') && !path.isAbsolute(rel) ? rel : resolved;
}

function buildReport({ args, actions, metrics, sourceMap }) {
  const metric = metrics.metrics;
  const coverage = metric['pcvm.toolTerminal.baselineCoverage'];
  const surface = metric['pcvm.tool.countBySurface'];
  const failure = metric['pcvm.tool.failureRate'];
  const diagnostics = metric.diagnostics;

  return [
    '# Tool / Terminal Baseline Evidence',
    '',
    `Run ID: \`${args.runId}\``,
    `Sampling window: \`${args.samplingWindow}\``,
    `Generated: \`${metrics.generatedAt}\``,
    '',
    '## Boundary',
    '',
    '- This report is generated from an explicit controlled action ledger.',
    '- It does not start live AI, Dashboard, delivery, browser, or Alembic runtime routes.',
    '- Generated output paths are constrained under AlembicTest.',
    '',
    '## Source',
    '',
    `- Actions: \`${workspaceRelative(args.actions)}\``,
    sourceMap ? `- Source map: \`${workspaceRelative(args.sourceMap)}\`` : '- Source map: not provided',
    '',
    '## Metrics',
    '',
    `- baselineCoverage: \`${coverage.value}\``,
    `- timestampModes: \`${JSON.stringify(coverage.timestampModes)}\``,
    `- countBySurface: terminal \`${surface.terminal}\`, tool \`${surface.tool}\`, browser \`${surface.browser}\`, mcp \`${surface.mcp}\`, other \`${surface.other}\``,
    `- readToWriteRatio: \`${metric['pcvm.tool.readToWriteRatio'].ratio}\``,
    `- parallelReadRatio: \`${metric['pcvm.tool.parallelReadRatio'].ratio}\``,
    `- failureRate: \`${failure.rate}\``,
    `- workdirMismatchCount: \`${metric['pcvm.terminal.workdirMismatchCount']}\``,
    `- escalationCount: \`${metric['pcvm.tool.escalationCount']}\``,
    `- externalCallCount: \`${metric['pcvm.tool.externalCallCount']}\``,
    `- sessionLeakCount: \`${metric['pcvm.terminal.sessionLeakCount']}\``,
    `- outputNoiseIncidents: \`${diagnostics['pcvm.tool.outputNoiseIncidents']}\``,
    `- evidenceMissingCount: \`${diagnostics['pcvm.tool.evidenceMissingCount']}\``,
    `- actionEvidenceMissingCount: \`${diagnostics['pcvm.tool.actionEvidenceMissingCount']}\``,
    `- filePlacementMismatchCount: \`${diagnostics['pcvm.tool.filePlacementMismatchCount']}\``,
    '',
    '## Actions',
    '',
    '| Action | Surface | Class | Success | Shape | Evidence |',
    '| --- | --- | --- | --- | --- | --- |',
    ...actions.map((action) =>
      [
        `\`${action.actionId}\``,
        action.surface,
        action.readWriteClass,
        String(action.success),
        action.commandShape ?? '',
        compact(action.evidenceRef),
      ].join(' | ')
    ).map((row) => `| ${row} |`),
    '',
  ].join('\n');
}

function compact(value) {
  return String(value ?? '')
    .replaceAll(workspaceRoot, '<workspace>')
    .replace(/\s+/g, ' ')
    .slice(0, 180);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const rawActions = asArrayActions(await readJson(args.actions));
  const actions = rawActions.map(normalizeAction);
  const sourceMap = args.sourceMap ? await readJson(args.sourceMap) : null;
  const metrics = buildMetrics({ actions, sourceMap, expectedWorkdir: args.expectedWorkdir });

  const summary = {
    runId: args.runId,
    samplingWindow: args.samplingWindow,
    checkOnly: args.check,
    actionCount: actions.length,
    outputDir: workspaceRelative(args.outDir),
    report: workspaceRelative(args.report),
    metrics,
  };

  if (!args.check) {
    await mkdir(args.outDir, { recursive: true });
    await mkdir(path.dirname(args.report), { recursive: true });
    await writeFile(
      path.join(args.outDir, 'baseline-actions.json'),
      `${JSON.stringify({ runId: args.runId, samplingWindow: args.samplingWindow, actions }, null, 2)}\n`
    );
    await writeFile(
      path.join(args.outDir, 'baseline-metrics.json'),
      `${JSON.stringify({ runId: args.runId, samplingWindow: args.samplingWindow, ...metrics }, null, 2)}\n`
    );
    if (sourceMap) {
      await writeFile(
        path.join(args.outDir, 'telemetry-source-map.json'),
        `${JSON.stringify(sourceMap, null, 2)}\n`
      );
    }
    await writeFile(args.report, buildReport({ args, actions, metrics, sourceMap }));
  }

  if (args.json) {
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } else {
    process.stdout.write(
      `Tool/terminal baseline ${args.check ? 'checked' : 'written'}: ${actions.length} actions\n`
    );
    process.stdout.write(`coverage: ${metrics.metrics['pcvm.toolTerminal.baselineCoverage'].value}\n`);
    process.stdout.write(`report: ${workspaceRelative(args.report)}\n`);
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
