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

const expectedCommits = {
  agent: '7ab94575ed9b475dc57253c88738e1f061a3c547',
  alembic: '647a42fc9e499fc9bbbd166e1b9db2a9c96f99f9',
  pcv: 'badbf0aa23bbaaff2cf185491a6785a61b74c1d8',
};

function usage() {
  return [
    'Usage: node scripts/probe-pcv-n9-observability-linkage.mjs [options]',
    '',
    'Runs the PCVM Test-11 minimal test-mode linkage probe.',
    'The probe does not modify product repositories or run full cold-start/rescan.',
    '',
    'Options:',
    '  --agent-root <path>      Default: ../AlembicAgent',
    '  --alembic-root <path>    Default: ../Alembic',
    '  --pcv-root <path>        Default: ../progressive-chain-validation',
    '  --bilidili-root <path>   Default: ../BiliDili',
    '  --fixture <path>         Generated fixture/carry JSON path',
    '  --generated-test <path>  Generated Vitest fixture test path',
    '  --generated-config <path> Generated Vitest config path',
    '  --out <path>             JSON evidence output path',
    '  --plan <path>            Generated N9 scorecard plan path',
    '  --expected-agent-commit <sha>    Override expected AlembicAgent commit',
    '  --expected-alembic-commit <sha>  Override expected Alembic commit',
    '  --expected-pcv-commit <sha>      Override expected PCV source commit',
  ].join('\n');
}

function parseArgs(argv) {
  const args = {
    agentRoot: join(workspaceRoot, 'AlembicAgent'),
    alembicRoot: join(workspaceRoot, 'Alembic'),
    pcvRoot: join(workspaceRoot, 'progressive-chain-validation'),
    bilidiliRoot: join(workspaceRoot, 'BiliDili'),
    fixture: join(testRepoRoot, 'tmp', 'pcv-n9-observability-linkage-fixture.json'),
    generatedTest: join(testRepoRoot, 'tmp', 'pcv-n9-observability-linkage.generated.test.ts'),
    generatedConfig: join(testRepoRoot, 'tmp', 'pcv-n9-observability-linkage.vitest.config.mjs'),
    out: join(testRepoRoot, 'tmp', 'pcv-n9-observability-linkage.json'),
    plan: join(testRepoRoot, 'tmp', 'pcv-n9-observability-linkage-plan.md'),
    expectedAgentCommit: expectedCommits.agent,
    expectedAlembicCommit: expectedCommits.alembic,
    expectedPcvCommit: expectedCommits.pcv,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      console.log(usage());
      process.exit(0);
    }
    const pathOptions = {
      '--agent-root': 'agentRoot',
      '--alembic-root': 'alembicRoot',
      '--pcv-root': 'pcvRoot',
      '--bilidili-root': 'bilidiliRoot',
      '--fixture': 'fixture',
      '--generated-test': 'generatedTest',
      '--generated-config': 'generatedConfig',
      '--out': 'out',
      '--plan': 'plan',
    };
    if (arg in pathOptions) {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a path`);
      }
      args[pathOptions[arg]] = resolve(process.cwd(), value);
      i += 1;
      continue;
    }
    const commitOptions = {
      '--expected-agent-commit': 'expectedAgentCommit',
      '--expected-alembic-commit': 'expectedAlembicCommit',
      '--expected-pcv-commit': 'expectedPcvCommit',
    };
    if (arg in commitOptions) {
      const value = argv[i + 1];
      if (!value) {
        throw new Error(`${arg} requires a commit sha`);
      }
      args[commitOptions[arg]] = value;
      i += 1;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function workspaceRelative(path) {
  const rel = relative(workspaceRoot, path);
  return rel && !rel.startsWith('..') ? rel : path;
}

function sanitizeText(text) {
  return String(text).replaceAll(workspaceRoot, '<workspace>').trim();
}

async function execCaptured(command, args, options = {}) {
  const startedAt = new Date().toISOString();
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      cwd: options.cwd || workspaceRoot,
      env: options.env || process.env,
      maxBuffer: 1024 * 1024 * 20,
      timeout: options.timeoutMs || 120000,
      killSignal: 'SIGTERM',
    });
    return {
      args,
      command,
      cwd: workspaceRelative(options.cwd || workspaceRoot),
      exitCode: 0,
      ok: true,
      startedAt,
      stderr: sanitizeText(stderr),
      stdout: sanitizeText(stdout),
    };
  } catch (error) {
    return {
      args,
      command,
      cwd: workspaceRelative(options.cwd || workspaceRoot),
      exitCode: typeof error.code === 'number' ? error.code : 1,
      ok: false,
      startedAt,
      stderr: sanitizeText(error.stderr || ''),
      stdout: sanitizeText(error.stdout || ''),
      message: error.message,
    };
  }
}

async function git(args, cwd) {
  const result = await execCaptured('git', args, { cwd, timeoutMs: 20000 });
  if (!result.ok) {
    throw new Error(`git ${args.join(' ')} failed in ${workspaceRelative(cwd)}: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function statusSummary(statusShortBranch) {
  const lines = statusShortBranch.split('\n').filter(Boolean);
  const branch = lines.find((line) => line.startsWith('##')) || '';
  const dirty = lines.filter((line) => !line.startsWith('##'));
  return { branch, clean: dirty.length === 0, dirty };
}

async function inspectRepo(name, root, expectedCommit) {
  const head = await git(['rev-parse', 'HEAD'], root);
  const status = statusSummary(await git(['status', '--short', '--branch'], root));
  return {
    expectedCommit,
    expectedCommitMatched: expectedCommit ? head === expectedCommit : true,
    head,
    name,
    root: workspaceRelative(root),
    status,
  };
}

function renderGeneratedVitest() {
  return `import { writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { attachPcvN9ObservabilityCarry } from '../../Alembic/lib/daemon/PcvObservabilityLinkage.js';
import {
  buildPcvNodeEvidenceProcessMetadata,
  buildPcvQualityGateEvidence,
} from '../../AlembicAgent/src/agent/runtime/PcvNodeEvidence.js';

const nodeId = 'N9-agent-analyze-quality';
const artifactRef = '/api/v1/jobs/job_pcv_p3b/artifacts/llm-input-full-redacted-n9.md';

function buildFullAgentEvidence() {
  const sourceEvidence = {
    chainNodeId: nodeId,
    correlation: {
      dimensionId: 'dim-n9',
      dimensionScopeId: 'dim-n9',
      iteration: 1,
      modelRef: 'unit-model',
      runId: 'job_pcv_p3b',
      source: 'unit-test',
      targetName: 'Architecture',
    },
    findingRefs: {
      accepted: [
        {
          callId: 'call-note-1',
          evidence: ['src/index.ts:42 carries source-backed N9 evidence'],
          findingSummary: 'N9 finding has file-level source evidence',
          importance: 0.9,
          origin: 'note_finding',
          ref: 'finding:source-backed',
          sourceRefs: ['src/index.ts:42'],
          toolName: 'note_finding',
        },
      ],
      rejected: [],
    },
    inputAssembly: {
      effectiveToolChoice: 'auto',
      inputLayerAppended: true,
      inputSectionIds: ['identity', 'stagePolicy', 'taskContext', 'evidenceContext'],
      messageCount: 2,
      modelRef: 'unit-model',
      providerMessageCount: 3,
      providerVisibleSectionIds: ['identity', 'stagePolicy', 'taskContext', 'evidenceContext'],
      ref: 'llm-input:p3b-n9',
      requestedToolChoice: 'auto',
      stageProfile: 'analyze',
      staticSectionIds: ['identity'],
      toolSchemaNames: ['note_finding'],
    },
    ledgerRefs: [
      {
        kind: 'observation-ledger',
        ref: 'active-context:dim-n9',
        source: 'ActiveContext',
        stats: { acceptedFindings: 1 },
      },
    ],
    missingLinkReasons: [],
    nodeId,
    qualityGate: null,
    repair: { attempted: false, evidencePaths: [], reason: null, status: null },
    schemaVersion: 1,
    sourceRefs: ['src/index.ts:42'],
    stageIdentity: {
      dimensionId: 'dim-n9',
      nodeKind: 'agent-runtime-node',
      pipelinePhase: 'analysis',
      pipelineType: 'analyst',
      stageProfile: 'analyze',
      targetName: 'Architecture',
      trackerPhase: 'ANALYZE',
    },
  };

  return buildPcvQualityGateEvidence({
    artifact: {
      dimensionId: 'dim-n9',
      findings: [
        {
          evidence: 'src/index.ts:42 carries source-backed N9 evidence',
          finding: 'N9 finding has file-level source evidence',
          importance: 0.9,
        },
      ],
      metadata: { derivedFindingCount: 1, memoryFindingCount: 1 },
      qualityReport: {
        scores: { evidence: 0.95, specificity: 0.92 },
        suggestions: [],
        totalScore: 0.94,
      },
      referencedFiles: ['src/index.ts:42'],
    },
    dimId: 'dim-n9',
    gate: { action: 'pass', pass: true, reason: 'source-linked baseline fixture' },
    source: { pcvNodeEvidence: sourceEvidence },
  });
}

function carryFrom(metadata) {
  return attachPcvN9ObservabilityCarry({
    artifactRefs: [{ kind: 'llm-input-full-redacted', label: 'Full redacted N9 LLM input', ref: artifactRef }],
    draft: {
      correlationId: 'trace-p3b',
      kind: 'llm.input',
      phase: 'analyze',
      title: 'N9 LLM input prepared',
    },
    jobId: 'job_pcv_p3b',
    metadata,
  });
}

describe('PCVM P3B N9 observability linkage fixture', () => {
  test('captures nested Agent pcvNodeEvidence and Alembic carry behavior', () => {
    const fullAgentEvidence = buildFullAgentEvidence();
    const nestedEvidence = buildPcvNodeEvidenceProcessMetadata(fullAgentEvidence);

    expect(nestedEvidence).toMatchObject({
      inputAssemblyRef: 'llm-input:p3b-n9',
      ledgerRefs: ['active-context:dim-n9'],
      nodeId,
      qualityGate: { pass: true, status: 'pass' },
      sourceRefs: ['src/index.ts:42'],
    });
    expect(nestedEvidence.acceptedFindingRefs.length).toBeGreaterThan(0);

    const nestedOnlyCarry = carryFrom({
      inputStageProfile: 'analyze',
      llmMetrics: { estimatedTokens: 13, messageCount: 2 },
      pcvNodeEvidence: nestedEvidence,
      traceEnvelope: { correlationId: 'trace-p3b', sessionId: 'session-p3b' },
    });

    // 这里不把旧失败形态写死：P3B 初测允许记录 blocked，P3D 返修后
    // 需要同一 fixture 继续产出 JSON，由外层 probe 根据真实 carry verdict 判定。
    expect(['linked', 'blocked-by-observability-gap']).toContain(
      nestedOnlyCarry.pcvN9Observability.linkageStatus
    );
    expect(nestedOnlyCarry.pcvN9Observability.evidenceLinks.artifactRefs).toEqual([artifactRef]);
    expect(nestedOnlyCarry.pcvN9Observability.evidenceLinks.metricsPath).toBe('metadata.llmMetrics');
    expect(nestedOnlyCarry.pcvN9Observability.evidenceLinks.traceId).toBe('trace-p3b');
    if (nestedOnlyCarry.pcvN9Observability.linkageStatus === 'linked') {
      expect(nestedOnlyCarry.pcvN9Observability.missingLinkReasons).toEqual([]);
      expect(nestedOnlyCarry.pcvN9Observability.nodeIdentitySource).toBe('agent-explicit');
      expect(nestedOnlyCarry.pcvN9Observability.evidenceLinks.sourceRefs).toEqual([
        'src/index.ts:42',
      ]);
    } else {
      expect(nestedOnlyCarry.pcvN9Observability.missingLinkReasons).toContain(
        'source_ref_missing'
      );
    }

    const topLevelControlCarry = carryFrom({
      inputStageProfile: 'analyze',
      llmMetrics: { estimatedTokens: 13, messageCount: 2 },
      pcvNodeEvidence: nestedEvidence,
      sourceRefs: nestedEvidence.sourceRefs,
      traceEnvelope: {
        chainNodeId: nodeId,
        correlationId: 'trace-p3b',
        sessionId: 'session-p3b',
      },
    });

    expect(topLevelControlCarry.pcvN9Observability.linkageStatus).toBe('linked');
    expect(topLevelControlCarry.pcvN9Observability.nodeIdentitySource).toBe('agent-explicit');
    expect(topLevelControlCarry.pcvN9Observability.evidenceLinks.sourceRefs).toEqual([
      'src/index.ts:42',
    ]);

    writeFileSync(
      process.env.PCVM_P3B_FIXTURE_OUT,
      JSON.stringify(
        {
          artifactRef,
          fullAgentEvidence,
          nestedEvidence,
          nestedOnlyCarry: {
            pcvN9Observability: nestedOnlyCarry.pcvN9Observability,
            pcvObservability: nestedOnlyCarry.pcvObservability,
            traceEnvelope: nestedOnlyCarry.traceEnvelope,
          },
          topLevelControlCarry: {
            pcvN9Observability: topLevelControlCarry.pcvN9Observability,
            pcvObservability: topLevelControlCarry.pcvObservability,
            traceEnvelope: topLevelControlCarry.traceEnvelope,
          },
        },
        null,
        2
      ) + '\\n',
      'utf8'
    );
  });
});
`;
}

function renderGeneratedVitestConfig(generatedTestPath) {
  const include = relative(dirname(generatedTestPath), generatedTestPath);
  return `export default {
  resolve: {
    conditions: ['alembic-dev'],
  },
  test: {
    include: [${JSON.stringify(include)}],
    globals: true,
    setupFiles: ['../../Alembic/test/setup.ts'],
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
  },
};
`;
}

function renderPlan({ fixture, verdict }) {
  const lines = [
    '# PCV N9 Observability Linkage Fixture Plan',
    '',
    'Generated for `Test-2026-05-25-11 / PCVM-P3B-N9-Observability-Linkage-Minimal`.',
    '',
    '## N9 Scorecard',
    '',
    '```yaml',
    'nodeId: N9-agent-analyze-quality',
    'usefulUnit: source-backed N9 analyze-quality finding with artifact, trace, metrics, and sourceRefs',
    'qualityGate:',
    `  status: ${verdict === 'linked' ? 'pass' : 'blocked'}`,
    'stageLoss:',
    `  nestedEvidenceConsumed: ${fixture.nestedOnlyCarry.pcvN9Observability.linkageStatus === 'linked'}`,
    `  missingLinkReasons: ${JSON.stringify(fixture.nestedOnlyCarry.pcvN9Observability.missingLinkReasons)}`,
    'baseline:',
    '  fixtureId: pcvm-p3b-n9-observability-linkage-minimal',
    'evidenceLinks:',
    ...fixture.nestedOnlyCarry.pcvN9Observability.evidenceLinks.artifactRefs.map(
      (ref) => `  - artifact:${ref}`
    ),
    `  - trace:${fixture.nestedOnlyCarry.pcvN9Observability.evidenceLinks.traceId ?? 'missing'}`,
    `  - metrics:${fixture.nestedOnlyCarry.pcvN9Observability.evidenceLinks.metricsPath ?? 'missing'}`,
    ...fixture.nestedOnlyCarry.pcvN9Observability.evidenceLinks.sourceRefs.map(
      (ref) => `  - source:${ref}`
    ),
    `verdict: ${verdict}`,
    'firstFix:',
    ...fixture.nestedOnlyCarry.pcvN9Observability.firstFix.map((item) => `  - ${item}`),
    '```',
    '',
  ];
  return lines.join('\n');
}

async function runProbe() {
  const args = parseArgs(process.argv.slice(2));
  await mkdir(dirname(args.fixture), { recursive: true });
  await mkdir(dirname(args.generatedTest), { recursive: true });
  await mkdir(dirname(args.generatedConfig), { recursive: true });
  await mkdir(dirname(args.out), { recursive: true });
  await mkdir(dirname(args.plan), { recursive: true });

  const repos = {
    agent: await inspectRepo('AlembicAgent', args.agentRoot, args.expectedAgentCommit),
    alembic: await inspectRepo('Alembic', args.alembicRoot, args.expectedAlembicCommit),
    pcv: await inspectRepo('progressive-chain-validation', args.pcvRoot, args.expectedPcvCommit),
    bilidili: await inspectRepo('BiliDili', args.bilidiliRoot, null),
  };

  const commitMismatches = Object.values(repos).filter((repo) => !repo.expectedCommitMatched);
  if (commitMismatches.length > 0) {
    throw new Error(
      `Expected commit mismatch: ${commitMismatches
        .map((repo) => `${repo.name} expected ${repo.expectedCommit}, got ${repo.head}`)
        .join('; ')}`
    );
  }

  await writeFile(args.generatedTest, renderGeneratedVitest(), 'utf8');
  await writeFile(args.generatedConfig, renderGeneratedVitestConfig(args.generatedTest), 'utf8');

  const commandResults = [];
  commandResults.push(
    await execCaptured('npm', ['test', '--', 'AgentRuntime', 'llm-input-layering', 'evidence-recording-phase-chain'], {
      cwd: args.agentRoot,
      timeoutMs: 180000,
    })
  );
  commandResults.push(
    await execCaptured('npm', ['run', 'test:unit', '--', 'DaemonJobRunner.test.ts'], {
      cwd: args.alembicRoot,
      timeoutMs: 180000,
    })
  );
  commandResults.push(
    await execCaptured(
      'node',
      [
        join(args.alembicRoot, 'node_modules/vitest/vitest.mjs'),
        'run',
        '--config',
        args.generatedConfig,
        '--reporter=verbose',
      ],
      {
        cwd: dirname(args.generatedTest),
        env: { ...process.env, PCVM_P3B_FIXTURE_OUT: args.fixture },
        timeoutMs: 120000,
      }
    )
  );

  const hardFailures = commandResults.filter((result) => !result.ok);
  let fixture = null;
  try {
    fixture = JSON.parse(await readFile(args.fixture, 'utf8'));
  } catch (error) {
    throw new Error(`Fixture output was not created or could not be read: ${error.message}`);
  }

  const nestedCarry = fixture.nestedOnlyCarry.pcvN9Observability;
  const topLevelCarry = fixture.topLevelControlCarry.pcvN9Observability;
  const nestedEvidence = fixture.nestedEvidence;
  const nestedFieldRead = {
    acceptedFindingRefs: nestedEvidence.acceptedFindingRefs,
    hasInputAssemblyRef: Boolean(nestedEvidence.inputAssemblyRef),
    hasLedgerRefs: nestedEvidence.ledgerRefs.length > 0,
    hasQualityGate: Boolean(nestedEvidence.qualityGate),
    hasSourceRefs: nestedEvidence.sourceRefs.length > 0,
    missingLinkReasons: nestedEvidence.missingLinkReasons,
    nodeId: nestedEvidence.nodeId,
    sourceRefs: nestedEvidence.sourceRefs,
  };
  const nestedLinked = nestedCarry.linkageStatus === 'linked';
  const verdict = hardFailures.length > 0
    ? '阻塞'
    : nestedLinked
      ? 'linked'
      : 'blocked-by-observability-gap';
  const conclusion = hardFailures.length > 0
    ? 'blocked-probe-command-failed'
    : nestedLinked
      ? 'pass-linked'
      : 'fail-nested-evidence-not-consumed';

  await writeFile(args.plan, renderPlan({ fixture, verdict }), 'utf8');

  const evidence = {
    generatedAt: new Date().toISOString(),
    testId: 'Test-2026-05-25-11',
    testName: 'PCVM-P3B-N9-Observability-Linkage-Minimal',
    config: {
      mode: 'test-mode-minimal-fixture',
      fullColdStart: false,
      productSourceWrite: false,
      bilidiliBusinessCodeWrite: false,
      generatedVitest: workspaceRelative(args.generatedTest),
    },
    paths: {
      fixture: workspaceRelative(args.fixture),
      generatedTest: workspaceRelative(args.generatedTest),
      jsonEvidence: workspaceRelative(args.out),
      plan: workspaceRelative(args.plan),
      reportRecommendation: 'AlembicTest/docs/pcv-n9-observability-linkage-minimal-2026-05-25.md',
    },
    repos,
    commandResults: commandResults.map((result) => ({
      args: result.args,
      command: result.command,
      cwd: result.cwd,
      exitCode: result.exitCode,
      ok: result.ok,
      stderrTail: result.stderr.slice(-4000),
      stdoutTail: result.stdout.slice(-4000),
    })),
    nestedEvidenceReadResult: nestedFieldRead,
    alembicCarryResult: {
      nestedOnly: nestedCarry,
      topLevelControl: topLevelCarry,
      nestedEvidenceConsumedByCarry: nestedLinked,
      artifactApiReadbackCoveredByAlembicUnit: commandResults[1]?.ok === true,
    },
    n9Scorecard: {
      firstFix: nestedCarry.firstFix,
      missingLinkReasons: nestedCarry.missingLinkReasons,
      verdict,
    },
    result: {
      conclusion,
      realProjectsClean: {
        alembic: repos.alembic.status.clean,
        alembicAgent: repos.agent.status.clean,
        biliDili: repos.bilidili.status.clean,
        progressiveChainValidation: repos.pcv.status.clean,
      },
      testCommandsPassed: hardFailures.length === 0,
    },
  };

  await writeFile(args.out, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');
  console.log(
    JSON.stringify(
      {
        conclusion,
        jsonEvidence: evidence.paths.jsonEvidence,
        missingLinkReasons: nestedCarry.missingLinkReasons,
        nestedEvidenceConsumedByCarry: nestedLinked,
        plan: evidence.paths.plan,
        verdict,
      },
      null,
      2
    )
  );

  if (hardFailures.length > 0 || !nestedLinked) {
    process.exitCode = 1;
  }
}

runProbe().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
