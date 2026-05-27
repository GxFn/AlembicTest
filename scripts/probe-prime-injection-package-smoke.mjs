#!/usr/bin/env node

import { createServer } from 'node:http';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = resolve(import.meta.dirname, '..', '..');
const defaults = {
  fixtureProject: 'AlembicTest/tmp/g037-stage6a-prime-package-fixture-project',
  plugin: 'AlembicPlugin',
  runtime: 'AlembicPlugin/plugins/alembic-codex/runtime',
  timeoutMs: 60000,
};

const options = parseArgs(process.argv.slice(2));
const fixtureProjectRoot = resolveWorkspacePath(options.fixtureProject);
const pluginRoot = resolveWorkspacePath(options.plugin);
const runtimeRoot = resolveWorkspacePath(options.runtime);
const outputPath = options.output
  ? resolve(options.output)
  : join(
      workspaceRoot,
      'AlembicTest',
      'tmp',
      `g037-stage6a-prime-package-smoke-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

mkdirSync(fixtureProjectRoot, { recursive: true });
mkdirSync(join(fixtureProjectRoot, '.asd'), { recursive: true });

const runtimeRequire = createRequire(join(runtimeRoot, 'package.json'));
const { Client } = await import(
  pathToFileURL(runtimeRequire.resolve('@modelcontextprotocol/sdk/client/index.js')).href
);
const { StdioClientTransport } = await import(
  pathToFileURL(runtimeRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
);
const { createAlembicResidentServiceStatus } = await import(
  pathToFileURL(join(runtimeRoot, 'node_modules', '@alembic', 'core', 'dist', 'daemon', 'index.js'))
    .href
);

const report = {
  ok: false,
  classification: 'unknown',
  startedAt: new Date().toISOString(),
  durationMs: 0,
  scope: {
    kind: 'test-mode-fixture',
    fixtureProjectRootRelative: displayWorkspacePath(fixtureProjectRoot),
    pluginRootRelative: displayWorkspacePath(pluginRoot),
    runtimeRootRelative: displayWorkspacePath(runtimeRoot),
    fullColdStart: false,
    rescan: false,
    dashboardUi: false,
    productSourceChangedByProbe: false,
  },
  versions: {
    alembicCommit: await gitHead('Alembic'),
    alembicPluginCommit: await gitHead('AlembicPlugin'),
    pluginRuntimeCommit: await gitHead('AlembicPlugin/plugins/alembic-codex/runtime'),
  },
  daemonStartAttempt: {
    attempted: options.daemonStartBlocked === true,
    blockedReason: options.daemonStartBlockedReason || null,
  },
  mockResident: {
    calls: [],
    port: null,
    searchCalls: [],
    episodeStarts: [],
    episodeOutcomes: [],
  },
  mcp: {
    tools: [],
    status: null,
    search: null,
    prime: null,
    taskCreate: null,
    taskClose: null,
    stderrTail: [],
  },
  checks: {},
};

const startedAt = Date.now();
const token = 'g037-stage6a-test-token';
const serverState = {
  episodeStarts: [],
  episodeOutcomes: [],
  searchCalls: [],
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const method = req.method || 'GET';
  const body = await readJsonBody(req);
  serverState.calls = serverState.calls || [];
  serverState.calls.push({ method, path: url.pathname });

  if (method === 'GET' && url.pathname === '/api/v1/daemon/health') {
    return sendJson(res, 200, {
      success: true,
      data: {
        dashboardUrl: `http://127.0.0.1:${report.mockResident.port}`,
        dataRoot: fixtureProjectRoot,
        databasePath: join(fixtureProjectRoot, '.asd', 'alembic.db'),
        mode: 'daemon',
        projectId: 'g037-stage6a-fixture',
        projectRoot: fixtureProjectRoot,
        residentService: buildResidentServiceStatus(),
        schemaMigrationVersion: null,
        version: '0.2.0-fixture',
      },
    });
  }

  if (req.headers['x-alembic-daemon-token'] !== token) {
    return sendJson(res, 401, { success: false, message: 'invalid token' });
  }

  if (method === 'GET' && url.pathname === '/api/v1/project-scope/resolve-folder') {
    return sendJson(res, 200, {
      success: true,
      data: {
        capability: { available: true, source: 'g037-fixture-resident' },
        summary: buildProjectScopeSummary(),
      },
    });
  }

  if ((method === 'GET' || method === 'POST') && url.pathname === '/api/v1/search') {
    const query = stringFrom(body?.query) || stringFrom(body?.q) || url.searchParams.get('q') || '';
    const mode = stringFrom(body?.mode) || url.searchParams.get('mode') || 'semantic';
    const searchMeta = buildSearchMeta({ mode, query, requestBody: body });
    serverState.searchCalls.push({
      method,
      mode,
      query,
      requestBodyKeys: body && typeof body === 'object' ? Object.keys(body).sort() : [],
      searchMeta,
    });
    return sendJson(res, 200, {
      success: true,
      data: {
        items: buildSearchItems(),
        mode,
        query,
        searchMeta,
        total: 2,
        totalResults: 2,
      },
    });
  }

  if (method === 'GET' && url.pathname === '/api/v1/intent-episodes/latest') {
    return sendJson(res, 200, {
      success: true,
      data: { capability: { available: true }, episode: null },
    });
  }

  if (method === 'GET' && url.pathname === '/api/v1/intent-episodes/recent') {
    return sendJson(res, 200, {
      success: true,
      data: { capability: { available: true }, count: 0, episode: null, episodes: [] },
    });
  }

  if (method === 'POST' && url.pathname === '/api/v1/intent-episodes') {
    const episode = buildEpisode(body, 'active');
    serverState.episodeStarts.push({ request: body, response: episode });
    return sendJson(res, 200, {
      success: true,
      data: { capability: { available: true }, episode },
    });
  }

  if (method === 'PATCH' && url.pathname.startsWith('/api/v1/intent-episodes/')) {
    const episodeId = decodeURIComponent(url.pathname.split('/').pop() || 'episode-unknown');
    const episode = buildEpisode({ ...body, episodeId }, stringFrom(body?.status) || 'completed');
    serverState.episodeOutcomes.push({ episodeId, request: body, response: episode });
    return sendJson(res, 200, {
      success: true,
      data: { capability: { available: true }, episode },
    });
  }

  return sendJson(res, 404, { success: false, message: `unhandled fixture route ${method} ${url.pathname}` });
});

await listen(server);

const address = server.address();
const port = typeof address === 'object' && address ? address.port : 0;
report.mockResident.port = port;
const residentUrl = `http://127.0.0.1:${port}`;
writeDaemonState({ residentUrl, token });

const stderr = [];
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(runtimeRoot, 'dist', 'bin', 'codex-mcp.js')],
  cwd: runtimeRoot,
  env: {
    ...process.env,
    ALEMBIC_CHANNEL_ID: 'codex',
    ALEMBIC_CODEX_MCP_MODE: '1',
    ALEMBIC_MCP_MODE: '1',
    ALEMBIC_MCP_TIER: 'agent',
    ALEMBIC_PLUGIN_HOST: 'codex',
    ALEMBIC_PROJECT_DIR: fixtureProjectRoot,
    ALEMBIC_QUIET: '1',
    ALEMBIC_RUNTIME_MODE: 'plugin',
    ALEMBIC_TEST_MODE: '1',
    CODEX_WORKSPACE_DIR: fixtureProjectRoot,
    INIT_CWD: fixtureProjectRoot,
    PWD: fixtureProjectRoot,
  },
  stderr: 'pipe',
});
transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));

const client = new Client({
  name: 'alembic-test-prime-injection-package-smoke',
  version: '0.1.0',
});

try {
  await withTimeout(
    client.connect(transport, { timeout: options.timeoutMs }),
    options.timeoutMs + 2000,
    () => `MCP connect timed out\n${stderr.join('')}`
  );

  const toolsResult = await withTimeout(
    client.listTools(undefined, { timeout: options.timeoutMs }),
    options.timeoutMs + 2000,
    () => `MCP tools/list timed out\n${stderr.join('')}`
  );
  report.mcp.tools = toolsResult.tools.map((tool) => tool.name).sort();
  report.mcp.status = await callJsonTool(client, 'alembic_codex_status', {}, options.timeoutMs);

  report.mcp.search = await callJsonTool(
    client,
    'alembic_search',
    {
      hostDeclaredIntent: {
        action: 'verify',
        constraints: ['PrimeInjectionPackage must cross Plugin runtime projection'],
        sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
        target: 'PrimeInjectionPackage',
      },
      hostTurnMeta: {
        messageId: 'msg-g037-smoke',
        threadIdHash: 'thread-hash-g037-smoke',
        turnId: 'turn-g037-smoke-search',
      },
      kind: 'all',
      language: 'typescript',
      limit: 4,
      mode: 'auto',
      query: 'PrimeInjectionPackage resident projection smoke',
      sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
    },
    options.timeoutMs
  );

  report.mcp.prime = await callJsonTool(
    client,
    'alembic_task',
    {
      activeFile: 'fixtures/g037-prime-package-smoke.ts',
      hostDeclaredIntent: {
        action: 'verify',
        constraints: ['Prime material and episode metadata retain package'],
        sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
        target: 'PrimeInjectionPackage',
      },
      hostTurnMeta: {
        messageId: 'msg-g037-smoke-prime',
        threadIdHash: 'thread-hash-g037-smoke',
        turnId: 'turn-g037-smoke-prime',
      },
      language: 'typescript',
      operation: 'prime',
      userQuery:
        'Verify Plugin runtime receives Alembic resident PrimeInjectionPackage and exposes it to prime material and episode metadata.',
    },
    options.timeoutMs
  );

  report.mcp.taskCreate = await callJsonTool(
    client,
    'alembic_task',
    {
      operation: 'create',
      title: 'G037 prime package smoke task',
    },
    options.timeoutMs
  );
  const taskId = report.mcp.taskCreate?.data?.id;
  report.mcp.taskClose = await callJsonTool(
    client,
    'alembic_task',
    {
      id: typeof taskId === 'string' ? taskId : undefined,
      operation: 'close',
      reason: 'G037 prime package smoke completed',
    },
    options.timeoutMs
  );

  report.checks = buildChecks(report, serverState);
  report.classification = classify(report.checks);
  report.ok = report.classification === 'passed';
} catch (error) {
  report.classification = 'probe-error';
  report.error = error instanceof Error ? error.stack || error.message : String(error);
} finally {
  await client.close().catch(() => {});
  await closeServer(server);
  report.durationMs = Date.now() - startedAt;
  report.mockResident.calls = serverState.calls || [];
  report.mockResident.searchCalls = serverState.searchCalls.map(summarizeSearchCall);
  report.mockResident.episodeStarts = serverState.episodeStarts.map(summarizeEpisodeExchange);
  report.mockResident.episodeOutcomes = serverState.episodeOutcomes.map(summarizeEpisodeExchange);
  report.mcp.stderrTail = stderr.join('').split(/\n/).filter(Boolean).slice(-80);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ outputPath, ...summarizeReport(report) }, null, 2)}\n`);
}

function buildChecks(value, state) {
  const searchPackage = value.mcp.search?.data?.searchMeta?.primeInjectionPackage;
  const primeSearchPackage = value.mcp.prime?.data?.searchMeta?.primeInjectionPackage;
  const materialPackage = value.mcp.prime?.data?.primeKnowledgeMaterial?.primeInjectionPackage;
  const startRequestPackage = state.episodeStarts[0]?.request?.searchMeta?.primeInjectionPackage;
  const outcomeRequestPackage = state.episodeOutcomes[0]?.request?.searchMeta?.primeInjectionPackage;
  const searchResident = value.mcp.search?.data?.searchMeta?.residentSearch;
  const material = value.mcp.prime?.data?.primeKnowledgeMaterial;
  return {
    toolsListContainsAlembicSearch: value.mcp.tools.includes('alembic_search'),
    toolsListContainsAlembicTask: value.mcp.tools.includes('alembic_task'),
    residentHealthCalled: (state.calls || []).some((call) => call.path === '/api/v1/daemon/health'),
    residentSearchCalled: state.searchCalls.length >= 1,
    intentEpisodeStartCalled: state.episodeStarts.length >= 1,
    intentEpisodeOutcomeCalled: state.episodeOutcomes.length >= 1,
    searchSuccess: value.mcp.search?.success === true,
    primeSuccess: value.mcp.prime?.success === true,
    taskCloseSuccess: value.mcp.taskClose?.success === true,
    searchResponsePackagePath: Boolean(searchPackage),
    primeResponseSearchMetaPackagePath: Boolean(primeSearchPackage),
    primeMaterialPackagePath: Boolean(materialPackage),
    episodeStartMetadataPackagePath: Boolean(startRequestPackage),
    episodeOutcomeMetadataPackagePath: Boolean(outcomeRequestPackage),
    pluginResidentRoute: searchResident?.route ?? null,
    pluginResidentOwner: searchResident?.residentService?.owner ?? null,
    pluginResidentUsed: searchResident?.used === true,
    primeMaterialStatus: material?.status ?? null,
    acceptedKnowledgeCount: Array.isArray(material?.acceptedKnowledge)
      ? material.acceptedKnowledge.length
      : 0,
    acceptedGuardCount: Array.isArray(material?.acceptedGuards) ? material.acceptedGuards.length : 0,
    packageSummary: summarizePackage(materialPackage || primeSearchPackage || searchPackage),
    noRawAbsolutePathInPackage: !JSON.stringify({
      materialPackage,
      outcomeRequestPackage,
      primeSearchPackage,
      searchPackage,
      startRequestPackage,
    }).includes('/Users/'),
  };
}

function classify(checks) {
  if (!checks.toolsListContainsAlembicSearch || !checks.toolsListContainsAlembicTask) {
    return 'plugin-runtime-tools-missing';
  }
  if (!checks.residentHealthCalled || !checks.residentSearchCalled) {
    return 'resident-not-called';
  }
  if (!checks.searchSuccess || !checks.primeSuccess || !checks.taskCloseSuccess) {
    return 'mcp-call-failed';
  }
  if (
    checks.searchResponsePackagePath &&
    checks.primeResponseSearchMetaPackagePath &&
    checks.primeMaterialPackagePath &&
    checks.episodeStartMetadataPackagePath &&
    checks.episodeOutcomeMetadataPackagePath &&
    checks.pluginResidentUsed &&
    checks.noRawAbsolutePathInPackage
  ) {
    return 'passed';
  }
  return 'missing-package-path';
}

function summarizeReport(value) {
  return {
    ok: value.ok,
    classification: value.classification,
    durationMs: value.durationMs,
    scope: value.scope,
    versions: value.versions,
    toolCount: value.mcp.tools.length,
    checks: value.checks,
    mockResident: {
      callCount: value.mockResident.calls.length,
      searchCallCount: value.mockResident.searchCalls.length,
      episodeStartCount: value.mockResident.episodeStarts.length,
      episodeOutcomeCount: value.mockResident.episodeOutcomes.length,
    },
  };
}

function buildSearchItems() {
  return [
    {
      actionHint: 'Assert the package paths before claiming the integration smoke passed.',
      description: 'Fixture resident result carrying package evidence through Plugin projection.',
      doClause: 'Check searchMeta, primeKnowledgeMaterial, and IntentEpisode handoff metadata.',
      id: 'fixture-prime-package-recipe',
      kind: 'pattern',
      language: 'typescript',
      score: 0.97,
      sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
      title: 'PrimeInjectionPackage projection fixture',
      trigger: 'prime injection package projection',
      whenClause: 'When testing Plugin runtime to Alembic resident package handoff.',
    },
    {
      actionHint: 'Keep raw paths out of visible reports and only retain compact evidence refs.',
      description: 'Guard fixture for package redaction and field path verification.',
      id: 'fixture-prime-package-guard',
      kind: 'rule',
      language: 'typescript',
      score: 0.91,
      sourceRefs: ['fixtures/g037-prime-package-smoke.ts:18'],
      title: 'PrimeInjectionPackage redaction guard',
      trigger: 'do not leak local absolute paths',
      whenClause: 'When reporting package evidence.',
    },
  ];
}

function buildSearchMeta({ mode, query, requestBody }) {
  return {
    actualMode: mode,
    coreRoute: 'fixture-alembic-resident-search',
    durationMs: 7,
    filteredCount: 2,
    hostIntentApplied: true,
    hostIntentConfidence: 0.91,
    hostIntentDegraded: false,
    hostIntentSourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
    intentEvidence: buildIntentEvidence(),
    intentSearchPlan: {
      executableQuery: query,
      queryPlan: ['PrimeInjectionPackage', 'Plugin projection', 'episode metadata'],
      rankingProfile: 'g037-fixture',
      sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
    },
    primeInjectionPackage: buildPrimeInjectionPackage({ mode, query }),
    queries: [query, 'PrimeInjectionPackage Plugin projection'],
    requestedMode: mode,
    residentVector: {
      available: true,
      reason: null,
      stats: {
        count: 2,
        dimension: 3,
        embedProviderAvailable: true,
        hasIndex: true,
        indexSize: 2,
      },
    },
    resultCount: 2,
    route: 'fixture-alembic-resident-search',
    semanticUsed: true,
    service: 'g037-fixture-resident',
    vectorUsed: true,
    workspace: {
      currentFolderPath: basename(fixtureProjectRoot),
      mode: 'test-fixture',
      projectId: 'g037-stage6a-fixture',
    },
    ...(requestBody && typeof requestBody === 'object'
      ? {
          hostDeclaredIntent: requestBody.hostDeclaredIntent,
          hostTurnMeta: requestBody.hostTurnMeta,
        }
      : {}),
  };
}

function buildIntentEvidence() {
  return {
    degraded: false,
    degradedReasons: [],
    relationEvidence: [
      {
        direction: 'outgoing',
        itemId: 'fixture-prime-package-recipe',
        relatedId: 'fixture-prime-package-guard',
        relatedType: 'rule',
        relation: 'guarded-by',
        source: 'g037-fixture',
      },
    ],
    scoreBreakdown: [
      {
        finalScore: 0.97,
        itemId: 'fixture-prime-package-recipe',
        rank: 1,
        semanticScore: 0.94,
        signals: ['semantic', 'relation', 'intent'],
        vectorScore: 0.93,
      },
    ],
    semanticAnchors: [
      {
        kind: 'source-ref',
        source: 'intentSearchPlan.sourceRefs',
        value: 'fixtures/g037-prime-package-smoke.ts:12',
        weight: 0.7,
      },
    ],
    topAnchorMatches: [
      {
        anchor: 'PrimeInjectionPackage projection',
        itemId: 'fixture-prime-package-recipe',
        matchType: 'semantic',
        rank: 1,
        score: 0.97,
        sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
        title: 'PrimeInjectionPackage projection fixture',
      },
    ],
    version: 1,
  };
}

function buildPrimeInjectionPackage({ mode, query }) {
  return {
    injection: {
      degradedReasons: [],
      omittedCount: 0,
      selectedCount: 2,
      status: 'ready',
    },
    intent: {
      applied: true,
      confidence: 0.91,
      degraded: false,
      degradedReasons: [],
      executableQuery: query,
      rankingProfile: 'g037-fixture',
      requestedMode: mode,
      sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
      whySelected: ['host intent matched PrimeInjectionPackage projection smoke'],
    },
    omitted: [],
    relations: {
      evidence: [
        {
          direction: 'outgoing',
          itemId: 'fixture-prime-package-recipe',
          relatedId: 'fixture-prime-package-guard',
          relatedType: 'rule',
          relation: 'guarded-by',
          source: 'g037-fixture',
        },
      ],
      omitted: [],
    },
    search: {
      actualMode: mode,
      filteredCount: 2,
      query,
      queries: [query, 'PrimeInjectionPackage Plugin projection'],
      requestedMode: mode,
      resultCount: 2,
    },
    selectedKnowledge: [
      {
        evidenceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
        injectionStatus: 'selected',
        itemId: 'fixture-prime-package-recipe',
        kind: 'pattern',
        knowledgeType: 'fixture',
        rank: 1,
        score: 0.97,
        sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
        title: 'PrimeInjectionPackage projection fixture',
        trigger: 'prime injection package projection',
        whySelected: ['semantic intent match'],
      },
      {
        evidenceRefs: ['fixtures/g037-prime-package-smoke.ts:18'],
        injectionStatus: 'selected',
        itemId: 'fixture-prime-package-guard',
        kind: 'rule',
        knowledgeType: 'guard',
        rank: 2,
        score: 0.91,
        sourceRefs: ['fixtures/g037-prime-package-smoke.ts:18'],
        title: 'PrimeInjectionPackage redaction guard',
        trigger: 'do not leak local absolute paths',
        whySelected: ['guard relation match'],
      },
    ],
    trace: {
      evidenceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
      sourcePath: ['searchMeta.primeInjectionPackage'],
      sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
      sources: ['intentSearchPlan', 'intentEvidence', 'relationEvidence'],
    },
    vector: {
      omitted: [],
      scoreBreakdown: [
        {
          finalScore: 0.97,
          itemId: 'fixture-prime-package-recipe',
          rank: 1,
          semanticScore: 0.94,
          signals: ['semantic', 'relation', 'intent'],
          vectorScore: 0.93,
        },
      ],
      semanticAnchors: [
        {
          kind: 'source-ref',
          source: 'intentSearchPlan.sourceRefs',
          value: 'fixtures/g037-prime-package-smoke.ts:12',
          weight: 0.7,
        },
      ],
      semanticUsed: true,
      topAnchorMatches: [
        {
          anchor: 'PrimeInjectionPackage projection',
          itemId: 'fixture-prime-package-recipe',
          matchType: 'semantic',
          rank: 1,
          score: 0.97,
          sourceRefs: ['fixtures/g037-prime-package-smoke.ts:12'],
          title: 'PrimeInjectionPackage projection fixture',
        },
      ],
      vectorAvailable: true,
      vectorUsed: true,
    },
    version: 1,
  };
}

function buildResidentServiceStatus() {
  const runtimeDir = join(fixtureProjectRoot, '.asd');
  return createAlembicResidentServiceStatus({
    apiBaseUrl: `http://127.0.0.1:${report.mockResident.port}`,
    capabilityOverrides: {
      'dashboard.handoff': {
        available: true,
        message: 'Fixture dashboard handoff is available but unused in this smoke.',
      },
      'jobs.internal-ai.bootstrap': {
        available: true,
        message: 'Fixture bootstrap capability is available but unused in this smoke.',
      },
      'jobs.internal-ai.rescan': {
        available: true,
        message: 'Fixture rescan capability is available but unused in this smoke.',
      },
      'search.keyword': {
        available: true,
        message: 'Fixture keyword search is available.',
      },
      'search.semantic': {
        available: true,
        message: 'Fixture semantic search is available.',
      },
      'status.health': {
        available: true,
        message: 'Fixture health is available.',
      },
    },
    owner: 'alembic',
    route: 'local-alembic-daemon',
    serviceScope: {
      diagnosticPaths: {
        controlRoot: fixtureProjectRoot,
        databasePath: join(runtimeDir, 'alembic.db'),
        dataRoot: fixtureProjectRoot,
        projectRoot: fixtureProjectRoot,
        runtimeDir,
        statePath: join(runtimeDir, 'daemon.json'),
      },
      displayName: 'G037 Stage 6A fixture',
      kind: 'current-project',
      projectIdentity: {
        dataRootSource: 'project-root',
        projectId: 'g037-stage6a-fixture',
        projectScope: buildProjectScopeSummary(),
        projectScopeId: 'project-scope-g037-stage6a-fixture',
        schemaMigrationVersion: null,
        workspaceMode: 'standard',
      },
      scopeId: 'project:g037-stage6a-fixture',
    },
  });
}

function buildProjectScopeSummary() {
  return {
    contractVersion: 1,
    controlRoot: fixtureProjectRoot,
    controlRootIncludedInFolders: true,
    currentFolderId: 'folder-g037-stage6a-fixture',
    currentFolderPath: fixtureProjectRoot,
    dataRoot: fixtureProjectRoot,
    dataRootSource: 'project-root',
    displayName: 'G037 Stage 6A fixture',
    folderCount: 1,
    folders: [
      {
        displayName: 'G037 Fixture',
        folderId: 'folder-g037-stage6a-fixture',
        path: fixtureProjectRoot,
        realpath: fixtureProjectRoot,
        role: 'primary-source',
        state: 'active',
      },
    ],
    projectId: 'g037-stage6a-fixture',
    projectRootWriteAllowed: true,
    projectScopeId: 'project-scope-g037-stage6a-fixture',
    standardWriteAllowed: true,
    storageKind: 'standard',
  };
}

function buildEpisode(input, status) {
  const episodeId = stringFrom(input?.episodeId) || `episode-${serverState.episodeStarts.length + 1}`;
  return {
    createdAt: new Date().toISOString(),
    episodeId,
    hostIntent: input?.hostIntent ?? null,
    language: stringFrom(input?.language) ?? 'typescript',
    outcomeReason: stringFrom(input?.reason),
    query: stringFrom(input?.query) ?? 'PrimeInjectionPackage smoke',
    searchMeta: input?.searchMeta ?? null,
    sessionKey: stringFrom(input?.sessionId) ?? 'mcp-session',
    sourceRefs: Array.isArray(input?.sourceRefs) ? input.sourceRefs : [],
    status,
    taskId: stringFrom(input?.taskId),
    turnKey: stringFrom(input?.turnId),
    updatedAt: new Date().toISOString(),
    version: 1,
  };
}

function writeDaemonState({ residentUrl, token: daemonToken }) {
  const runtimeDir = join(fixtureProjectRoot, '.asd');
  const state = {
    schemaVersion: 1,
    dashboardUrl: residentUrl,
    dataRoot: fixtureProjectRoot,
    databasePath: join(runtimeDir, 'alembic.db'),
    host: '127.0.0.1',
    lastReadyAt: new Date().toISOString(),
    mode: 'daemon',
    pid: process.pid,
    port: report.mockResident.port,
    projectId: 'g037-stage6a-fixture',
    projectRoot: fixtureProjectRoot,
    schemaMigrationVersion: null,
    startedAt: new Date().toISOString(),
    token: daemonToken,
    url: residentUrl,
    version: '0.2.0-fixture',
  };
  writeFileSync(join(runtimeDir, 'daemon.json'), `${JSON.stringify(state, null, 2)}\n`, {
    mode: 0o600,
  });
}

async function callJsonTool(client, name, args, timeoutMs) {
  const result = await withTimeout(
    client.callTool({ name, arguments: args }, undefined, { timeout: timeoutMs }),
    timeoutMs + 2000,
    () => `MCP ${name} timed out`
  );
  const text = result.content?.find((item) => item.type === 'text')?.text;
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error(`MCP ${name} returned no text content: ${JSON.stringify(result)}`);
  }
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`MCP ${name} returned invalid JSON: ${error.message}\n${text}`);
  }
}

function summarizePackage(value) {
  if (!value || typeof value !== 'object') {
    return null;
  }
  return {
    injectionStatus: value.injection?.status ?? null,
    selectedCount: value.injection?.selectedCount ?? null,
    selectedKnowledgeCount: Array.isArray(value.selectedKnowledge)
      ? value.selectedKnowledge.length
      : null,
    sourcePath: Array.isArray(value.trace?.sourcePath) ? value.trace.sourcePath : [],
    sourceRefs: Array.isArray(value.trace?.sourceRefs) ? value.trace.sourceRefs : [],
    vectorUsed: value.vector?.vectorUsed ?? null,
    version: value.version ?? null,
  };
}

function summarizeSearchCall(call) {
  return {
    method: call.method,
    mode: call.mode,
    query: call.query,
    requestBodyKeys: call.requestBodyKeys,
    hasPrimeInjectionPackage: Boolean(call.searchMeta?.primeInjectionPackage),
  };
}

function summarizeEpisodeExchange(exchange) {
  return {
    episodeId: exchange.episodeId ?? exchange.response?.episodeId ?? null,
    requestHasPrimeInjectionPackage: Boolean(exchange.request?.searchMeta?.primeInjectionPackage),
    requestSearchMetaKeys:
      exchange.request?.searchMeta && typeof exchange.request.searchMeta === 'object'
        ? Object.keys(exchange.request.searchMeta).sort()
        : [],
    responseStatus: exchange.response?.status ?? null,
  };
}

async function gitHead(relativePath) {
  const { execFile } = await import('node:child_process');
  return new Promise((resolveHead) => {
    execFile('git', ['-C', join(workspaceRoot, relativePath), 'rev-parse', 'HEAD'], (error, stdout) => {
      resolveHead(error ? null : stdout.trim());
    });
  });
}

function listen(httpServer) {
  return new Promise((resolveListen, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(0, '127.0.0.1', () => {
      httpServer.off('error', reject);
      resolveListen();
    });
  });
}

function closeServer(httpServer) {
  return new Promise((resolveClose) => {
    httpServer.close(() => resolveClose());
  });
}

function readJsonBody(req) {
  return new Promise((resolveBody) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) {
        resolveBody(null);
        return;
      }
      try {
        resolveBody(JSON.parse(text));
      } catch {
        resolveBody({ _raw: text });
      }
    });
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json',
  });
  res.end(JSON.stringify(payload));
}

function parseArgs(args) {
  const parsed = { ...defaults, daemonStartBlocked: false, daemonStartBlockedReason: '', output: '' };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--fixture-project') {
      parsed.fixtureProject = args[index + 1] || parsed.fixtureProject;
      index += 1;
    } else if (arg === '--plugin') {
      parsed.plugin = args[index + 1] || parsed.plugin;
      index += 1;
    } else if (arg === '--runtime') {
      parsed.runtime = args[index + 1] || parsed.runtime;
      index += 1;
    } else if (arg === '--timeout-ms') {
      const timeout = Number.parseInt(args[index + 1] || '', 10);
      if (Number.isFinite(timeout) && timeout > 0) {
        parsed.timeoutMs = timeout;
      }
      index += 1;
    } else if (arg === '--output') {
      parsed.output = args[index + 1] || '';
      index += 1;
    } else if (arg === '--daemon-start-blocked') {
      parsed.daemonStartBlocked = true;
    } else if (arg === '--daemon-start-blocked-reason') {
      parsed.daemonStartBlockedReason = args[index + 1] || '';
      index += 1;
    } else if (arg === '-h' || arg === '--help') {
      printHelpAndExit();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return parsed;
}

function printHelpAndExit() {
  process.stdout.write(`Probe PrimeInjectionPackage through real AlembicPlugin MCP runtime and a local resident fixture.

Usage:
  node AlembicTest/scripts/probe-prime-injection-package-smoke.mjs [options]

Options:
  --fixture-project <path>          Temporary fixture project path.
  --plugin <path>                   AlembicPlugin repository. Default: AlembicPlugin
  --runtime <path>                  Embedded Plugin runtime root.
  --timeout-ms <ms>                 MCP call timeout. Default: 60000
  --output <path>                   JSON evidence output.
  --daemon-start-blocked            Record that real daemon start was attempted and blocked.
  --daemon-start-blocked-reason <s> Blocking reason summary.
  -h, --help                        Show this help.
`);
  process.exit(0);
}

function resolveWorkspacePath(input) {
  if (input.startsWith('/')) {
    return resolve(input);
  }
  return resolve(workspaceRoot, input);
}

function displayWorkspacePath(value) {
  const relative = value.startsWith(workspaceRoot)
    ? value.slice(workspaceRoot.length + 1)
    : value;
  return relative || '.';
}

function stringFrom(value) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function withTimeout(promise, timeoutMs, messageFactory) {
  let timer = null;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(messageFactory())), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
