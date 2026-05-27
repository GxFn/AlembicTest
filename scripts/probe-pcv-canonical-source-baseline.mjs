#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const testRepoRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(testRepoRoot, '..');

const expectedCommits = {
  pcv: 'badbf0aa23bbaaff2cf185491a6785a61b74c1d8',
  alembic: 'd99d66d0af14fe6e8a51e683d963028ec9d0679a',
  plugin: 'aa171f31734350ef49efaac56c34588b67f0d924',
};

const scorecardFields = [
  'usefulUnit',
  'qualityGate',
  'stageLoss',
  'baseline',
  'evidenceLinks',
  'verdict',
];

function usage() {
  return [
    'Usage: node scripts/probe-pcv-canonical-source-baseline.mjs [options]',
    '',
    'Validates the PCV canonical source baseline without changing product repositories.',
    '',
    'Options:',
    '  --pcv-root <path>       Default: ../progressive-chain-validation',
    '  --alembic-root <path>   Default: ../Alembic',
    '  --plugin-root <path>    Default: ../AlembicPlugin',
    '  --bilidili-root <path>  Default: ../BiliDili',
    '  --out <path>            JSON evidence output path',
    '  --plan <path>           Generated minimal N9 baseline plan fixture path',
    '  --expected-pcv-commit <sha>       Override the expected PCV source commit',
    '  --expected-alembic-commit <sha>   Override the expected Alembic cleanup commit',
    '  --expected-plugin-commit <sha>    Override the expected AlembicPlugin cleanup commit',
  ].join('\n');
}

function parseArgs(argv) {
  const args = {
    pcvRoot: join(workspaceRoot, 'progressive-chain-validation'),
    alembicRoot: join(workspaceRoot, 'Alembic'),
    pluginRoot: join(workspaceRoot, 'AlembicPlugin'),
    bilidiliRoot: join(workspaceRoot, 'BiliDili'),
    out: join(testRepoRoot, 'tmp', 'pcv-canonical-source-baseline.json'),
    plan: join(testRepoRoot, 'tmp', 'pcv-canonical-source-baseline-plan.md'),
    expectedPcvCommit: expectedCommits.pcv,
    expectedAlembicCommit: expectedCommits.alembic,
    expectedPluginCommit: expectedCommits.plugin,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    if (
      arg === '--pcv-root' ||
      arg === '--alembic-root' ||
      arg === '--plugin-root' ||
      arg === '--bilidili-root' ||
      arg === '--out' ||
      arg === '--plan'
    ) {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a path`);
      }
      const key = {
        '--pcv-root': 'pcvRoot',
        '--alembic-root': 'alembicRoot',
        '--plugin-root': 'pluginRoot',
        '--bilidili-root': 'bilidiliRoot',
        '--out': 'out',
        '--plan': 'plan',
      }[arg];
      args[key] = resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    if (
      arg === '--expected-pcv-commit' ||
      arg === '--expected-alembic-commit' ||
      arg === '--expected-plugin-commit'
    ) {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a commit sha`);
      }
      const key = {
        '--expected-pcv-commit': 'expectedPcvCommit',
        '--expected-alembic-commit': 'expectedAlembicCommit',
        '--expected-plugin-commit': 'expectedPluginCommit',
      }[arg];
      args[key] = value;
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

function workspaceRelative(path) {
  const rel = relative(workspaceRoot, path);
  return rel && !rel.startsWith('..') ? rel : path;
}

function sanitizeText(text) {
  return String(text).replaceAll(workspaceRoot, '<workspace>').trim();
}

async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, {
    cwd,
    maxBuffer: 1024 * 1024 * 10,
    timeout: 20000,
    killSignal: 'SIGTERM',
  });
  return stdout.trim();
}

async function gitGrep(pattern, cwd) {
  try {
    const { stdout } = await execFileAsync('git', ['grep', '-n', '--', pattern], {
      cwd,
      maxBuffer: 1024 * 1024 * 10,
      timeout: 10000,
      killSignal: 'SIGTERM',
    });
    return stdout.trim();
  } catch (error) {
    if (error.code === 1) {
      return '';
    }
    throw error;
  }
}

async function pathExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function markerPresence(text, markers) {
  return Object.fromEntries(markers.map((marker) => [marker, text.includes(marker)]));
}

function assertAllMarkers(name, markers) {
  const missing = Object.entries(markers)
    .filter(([, present]) => !present)
    .map(([marker]) => marker);
  assert(missing.length === 0, `${name} is missing required markers.`, { missing });
}

function statusSummary(statusShortBranch) {
  const lines = statusShortBranch.split('\n').filter(Boolean);
  const branch = lines.find((line) => line.startsWith('##')) || '';
  const dirty = lines.filter((line) => !line.startsWith('##'));
  return {
    branch,
    clean: dirty.length === 0,
    dirty,
  };
}

async function inspectRepo({ name, root, expectedCommit }) {
  const head = await git(['rev-parse', 'HEAD'], root);
  const status = statusSummary(await git(['status', '--short', '--branch'], root));
  return {
    name,
    root: workspaceRelative(root),
    expectedCommit,
    head,
    expectedCommitMatched: head === expectedCommit,
    status,
  };
}

async function inspectPcvSource(pcvRoot) {
  const paths = {
    skill: join(pcvRoot, 'progressive-chain-validation', 'SKILL.md'),
    metricsContract: join(pcvRoot, 'progressive-chain-validation', 'references', 'metrics-contract.md'),
    planTemplate: join(pcvRoot, 'progressive-chain-validation', 'templates', 'plan.md'),
    n9Example: join(pcvRoot, 'examples', 'alembic-n9-analyze-quality-baseline.md'),
  };
  const texts = Object.fromEntries(
    await Promise.all(
      Object.entries(paths).map(async ([key, path]) => [key, await readFile(path, 'utf8')])
    )
  );

  const metricsMarkers = markerPresence(texts.metricsContract, [
    '`usefulUnit`',
    '`qualityGate`',
    '`stageLoss`',
    '`baseline`',
    '`candidate`',
    '`comparison`',
    '`verdict`',
    '`evidenceLinks`',
    '`residualRisk`',
    '`blocked-by-observability-gap`',
    'Do not infer a quality verdict from unrelated artifacts.',
  ]);
  const templateMarkers = markerPresence(texts.planTemplate, [
    'Source-First Chain Analysis',
    'Metrics contract:',
    'Useful unit:',
    'Quality gate:',
    'Stage loss:',
    'Baseline:',
    'Evidence links:',
    'Verdict:',
    'Observability gap, if blocked:',
    'Run Metrics Summary',
  ]);
  const n9Markers = markerPresence(texts.n9Example, [
    'N9-agent-analyze-quality',
    'usefulUnit: quality-gated analysis finding with file-level evidence',
    'llmInputAssembly:',
    'observationLedger:',
    'noteFindingQuality:',
    'artifactTraceMetrics:',
    'stageLoss:',
    'evidenceLinks:',
    'verdict: pass',
    'verdict: blocked-by-observability-gap',
  ]);
  const skillMarkers = markerPresence(texts.skill, [
    'Progressive Chain Validation',
    'Source-Derived Planning',
    'Node Contract',
    'blocked-by-observability-gap',
  ]);

  assertAllMarkers('metrics contract', metricsMarkers);
  assertAllMarkers('plan template', templateMarkers);
  assertAllMarkers('N9 baseline example', n9Markers);
  assertAllMarkers('PCV skill', skillMarkers);

  return {
    paths: Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, workspaceRelative(path)])),
    markers: {
      metricsContract: metricsMarkers,
      planTemplate: templateMarkers,
      n9Example: n9Markers,
      skill: skillMarkers,
    },
  };
}

async function inspectConsumerCleanup(root) {
  const gitmodulesPath = join(root, '.gitmodules');
  const gitmodulesText = (await pathExists(gitmodulesPath))
    ? await readFile(gitmodulesPath, 'utf8')
    : '';
  const submoduleStatus = await git(['submodule', 'status'], root);
  const skillGitlink = await git(['ls-files', '-s', 'skills/progressive-chain-validation'], root);
  const internalPathRefs = await gitGrep('skills/progressive-chain-validation', root);
  const pcvNameRefs = await gitGrep('progressive-chain-validation', root);

  const checks = {
    noGitmodulesPcvEntry: !gitmodulesText.includes('progressive-chain-validation'),
    noSubmodulePcvEntry: !submoduleStatus.includes('progressive-chain-validation'),
    noSkillGitlink: skillGitlink.trim().length === 0,
    noInternalPathRefs: internalPathRefs.trim().length === 0,
  };

  return {
    passed: Object.values(checks).every(Boolean),
    checks,
    gitmodulesPath: (await pathExists(gitmodulesPath)) ? workspaceRelative(gitmodulesPath) : null,
    submoduleStatus: sanitizeText(submoduleStatus),
    skillGitlink: sanitizeText(skillGitlink),
    internalPathRefs: sanitizeText(internalPathRefs),
    nameRefs: sanitizeText(pcvNameRefs),
  };
}

function renderPlanFixture({ repos, pcvSource, outputPath }) {
  const scorecard = {
    nodeId: 'N9-agent-analyze-quality',
    usefulUnit: 'quality-gated analysis finding with file-level source evidence',
    qualityGate: {
      status: 'blocked',
      invariants: [
        'retained llm.input links selected files to N9',
        'Observation Ledger entries link tool and memory calls to accepted or rejected findings',
        'note_finding output has file-level source evidence',
        'artifact, trace, metrics, and report fields carry the same node id or explicit trace-unavailable reason',
      ],
    },
    stageLoss: {
      missingSourceRefs: 'unknown',
      fallbackOnlyFindings: 'unknown',
      vagueReasonCount: 'unknown',
      unlinkedArtifactCount: 'blocked',
      qualityGateRejectCount: 'unknown',
    },
    baseline: {
      fixtureId: 'pcv-p2-canonical-source-baseline-doc-fixture',
      sourceCommit: repos.pcv.head,
      evidenceLinks: [
        `source:${pcvSource.paths.metricsContract}`,
        `source:${pcvSource.paths.planTemplate}`,
        `source:${pcvSource.paths.n9Example}`,
      ],
    },
    evidenceLinks: [
      `report:${workspaceRelative(outputPath)}`,
      `source:${repos.alembic.root}@${repos.alembic.head}`,
      `source:${repos.plugin.root}@${repos.plugin.head}`,
    ],
    verdict: 'blocked-by-observability-gap',
    blockedReason:
      'This baseline fixture validates canonical source shape and consumer cleanup, but it has no real N9 artifact, trace, metric, source-ref, or report field linked to the node boundary.',
    firstFix: [
      'Add stable node id, run id, and artifact path to the N9 analyze-quality report producer.',
      'Link Observation Ledger records to accepted and rejected finding ids.',
      'Record trace id, metrics path, or explicit trace-unavailable reason before scoring quality.',
      'Rerun the same N9 fixture before assigning pass/improved/regression.',
    ],
  };

  const lines = [
    '# PCV Canonical Source Baseline Fixture',
    '',
    'This fixture was generated by `probe-pcv-canonical-source-baseline.mjs` for PCVM Test-01.',
    'It is a minimal plan/report section proving the required N9 scorecard shape from canonical PCV source docs.',
    '',
    '## Source Baseline',
    '',
    `- PCV source commit: \`${repos.pcv.head}\``,
    `- Metrics contract: \`${pcvSource.paths.metricsContract}\``,
    `- Plan template: \`${pcvSource.paths.planTemplate}\``,
    `- N9 example: \`${pcvSource.paths.n9Example}\``,
    '',
    '## N9 Baseline Scorecard',
    '',
    '```yaml',
    `nodeId: ${scorecard.nodeId}`,
    `usefulUnit: ${scorecard.usefulUnit}`,
    'qualityGate:',
    `  status: ${scorecard.qualityGate.status}`,
    '  invariants:',
    ...scorecard.qualityGate.invariants.map((item) => `    - ${item}`),
    'stageLoss:',
    ...Object.entries(scorecard.stageLoss).map(([key, value]) => `  ${key}: ${value}`),
    'baseline:',
    `  fixtureId: ${scorecard.baseline.fixtureId}`,
    `  sourceCommit: ${scorecard.baseline.sourceCommit}`,
    '  evidenceLinks:',
    ...scorecard.baseline.evidenceLinks.map((item) => `    - ${item}`),
    'evidenceLinks:',
    ...scorecard.evidenceLinks.map((item) => `  - ${item}`),
    `verdict: ${scorecard.verdict}`,
    `blockedReason: ${scorecard.blockedReason}`,
    'firstFix:',
    ...scorecard.firstFix.map((item) => `  - ${item}`),
    '```',
    '',
    '## Default Use / Opt-Out Rule',
    '',
    '- Default use: use PCV for long-chain Alembic validation, node-level quality baseline, before/after optimization comparison, or any workflow where artifact/trace/metric linkage determines the verdict.',
    '- Opt out: allowed for one-off repo hygiene checks, source-only inventory, or emergency diagnostics that do not compare node quality; the report must record the opt-out reason.',
    '- Guardrail: when node-local artifact/trace/metric/source-ref linkage is absent, record `blocked-by-observability-gap` and do not infer a quality score from unrelated artifacts.',
    '',
  ];

  return { scorecard, content: lines.join('\n') };
}

async function runProbe() {
  const args = parseArgs(process.argv.slice(2));
  const repos = {
    pcv: await inspectRepo({
      name: 'progressive-chain-validation',
      root: args.pcvRoot,
      expectedCommit: args.expectedPcvCommit,
    }),
    alembic: await inspectRepo({
      name: 'Alembic',
      root: args.alembicRoot,
      expectedCommit: args.expectedAlembicCommit,
    }),
    plugin: await inspectRepo({
      name: 'AlembicPlugin',
      root: args.pluginRoot,
      expectedCommit: args.expectedPluginCommit,
    }),
    bilidili: await inspectRepo({
      name: 'BiliDili',
      root: args.bilidiliRoot,
      expectedCommit: null,
    }),
  };

  assert(repos.pcv.expectedCommitMatched, 'PCV source commit does not match the test precondition.', repos.pcv);
  assert(repos.alembic.expectedCommitMatched, 'Alembic cleanup commit does not match the test precondition.', repos.alembic);
  assert(repos.plugin.expectedCommitMatched, 'AlembicPlugin cleanup commit does not match the test precondition.', repos.plugin);

  const pcvSource = await inspectPcvSource(args.pcvRoot);
  const consumerCleanup = {
    alembic: await inspectConsumerCleanup(args.alembicRoot),
    plugin: await inspectConsumerCleanup(args.pluginRoot),
  };
  const planFixture = renderPlanFixture({ repos, pcvSource, outputPath: args.plan });

  await mkdir(dirname(args.out), { recursive: true });
  await mkdir(dirname(args.plan), { recursive: true });
  await writeFile(args.plan, planFixture.content, 'utf8');

  const observabilityGapVerdict = {
    triggered: true,
    verdict: 'blocked-by-observability-gap',
    reason:
      'The generated baseline validates PCV source shape and consumer cleanup only; no real N9 artifact, trace, metric, source-ref, or report node link exists in this fixture.',
    noQualityScoreAssigned: true,
    firstFix: planFixture.scorecard.firstFix,
  };
  const consumerCleanupPassed =
    consumerCleanup.alembic.passed === true && consumerCleanup.plugin.passed === true;
  const conclusion = consumerCleanupPassed
    ? 'pass-source-baseline-with-scoring-blocked-by-observability-gap'
    : 'fail-consumer-cleanup-incomplete-with-scoring-blocked-by-observability-gap';

  const evidence = {
    generatedAt: new Date().toISOString(),
    testId: 'Test-2026-05-25-10',
    testName: 'PCVM-P2-Canonical-Source-Baseline',
    config: {
      mode: 'source-readonly-plus-alembic-test-fixture',
      productSourceWrite: false,
      fullColdStart: false,
      bilidiliBusinessCodeWrite: false,
    },
    paths: {
      fixture: workspaceRelative(args.plan),
      reportRecommendation: 'AlembicTest/docs/pcv-canonical-source-baseline-2026-05-25.md',
      planFixture: workspaceRelative(args.plan),
      jsonEvidence: workspaceRelative(args.out),
    },
    repos,
    pcvSource,
    consumerCleanup,
    scorecardFields,
    n9BaselineScorecard: planFixture.scorecard,
    observabilityGapVerdict,
    result: {
      conclusion,
      pcvCanonicalSourceUsable: true,
      consumerCleanupPassed,
      realProjectsClean: {
        progressiveChainValidation: repos.pcv.status.clean,
        alembic: repos.alembic.status.clean,
        alembicPlugin: repos.plugin.status.clean,
        biliDili: repos.bilidili.status.clean,
      },
    },
  };

  await writeFile(args.out, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(
    JSON.stringify(
      {
        conclusion: evidence.result.conclusion,
        output: evidence.paths.jsonEvidence,
        fixture: evidence.paths.fixture,
        observabilityGapVerdict,
        consumerCleanupPassed: evidence.result.consumerCleanupPassed,
      },
      null,
      2
    )
  );
  if (!consumerCleanupPassed) {
    process.exitCode = 1;
  }
}

runProbe().catch((error) => {
  console.error(error.stack || error.message);
  if (error.details) {
    console.error(JSON.stringify(error.details, null, 2));
  }
  process.exit(1);
});
