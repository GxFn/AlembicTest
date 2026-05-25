#!/usr/bin/env node
import { spawn, execFile } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const scriptDir = dirname(fileURLToPath(import.meta.url));
const testRepoRoot = resolve(scriptDir, '..');
const workspaceRoot = resolve(testRepoRoot, '..');
const dashboardRoot = resolve(workspaceRoot, 'AlembicDashboard');
const alembicRoot = resolve(workspaceRoot, 'Alembic');

const expectedDashboardHead = '30b376cd3b5539d3fac0db2e019c4136bb98212d';
const expectedAlembicHead = 'aa5419434d51aa4d944c3614ecebd8aff47a009f';
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const secretMarker = 'sk-test-raw-provider-secret-llmi-p9';
const providerOnlyMarker = 'providerRawPromptSecret';
const projectionMarker = 'TIMELINE_PROJECTION_SAFE_SUMMARY';
const fullArtifactMarker = 'FULL_REDACTED_PROMPT_MARKER';
const jobId = 'llmi-p9-dashboard-artifact-fixture';
const sessionId = 'session-llmi-p9-dashboard-fixture';

function usage() {
  return [
    'Usage: ALEMBIC_TEST_MODE=1 node scripts/probe-dashboard-artifact-detail.mjs [--out <path>] [--artifact-delay-ms <ms>]',
    '',
    'Runs the LLMI-P9 Dashboard artifact detail test-mode probe.',
    'The probe starts a fixture Alembic API, a temporary Dashboard Vite server,',
    'and headless Chrome. It verifies real Dashboard DOM behavior for artifact',
    'detail success, loading, failure, empty states, metrics, trace envelope,',
    'artifact metadata, and secret-boundary projection.',
  ].join('\n');
}

function parseArgs(argv) {
  const defaults = {
    out: join(testRepoRoot, 'tmp', 'llm-input-dashboard-artifact-detail-test-mode.json'),
    artifactDelayMs: 700,
  };
  const args = { ...defaults };
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
    if (arg === '--artifact-delay-ms') {
      const value = Number(argv[i + 1]);
      if (!Number.isFinite(value) || value < 0) {
        throw new Error('--artifact-delay-ms requires a non-negative number');
      }
      args.artifactDelayMs = value;
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

function sanitizeText(text) {
  return String(text || '')
    .replace(/\u001b\[[0-9;]*m/g, '')
    .replace(new RegExp(secretMarker, 'g'), '<redacted-fixture-secret>')
    .replace(/\/Users\/[^/\s]+\/Documents\/AlembicWorkspace/g, '<workspace>');
}

async function git(args, cwd) {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: 1024 * 1024 * 5 });
  return stdout.trim();
}

async function commandOutput(file, args, cwd) {
  const startedAt = Date.now();
  const { stdout, stderr } = await execFileAsync(file, args, {
    cwd,
    maxBuffer: 1024 * 1024 * 20,
  });
  return {
    command: [file, ...args].join(' '),
    cwd,
    durationMs: Date.now() - startedAt,
    stdout: sanitizeText(stdout),
    stderr: sanitizeText(stderr),
  };
}

async function getFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : null;
      server.close(() => {
        if (!port) reject(new Error('Unable to allocate a free port'));
        else resolvePort(port);
      });
    });
  });
}

function jsonResponse(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
  });
  res.end(JSON.stringify(payload));
}

function textResponse(res, statusCode, text, mimeType = 'text/plain; charset=utf-8') {
  res.writeHead(statusCode, {
    'content-type': mimeType,
    'access-control-allow-origin': '*',
  });
  res.end(text);
}

function makeFixture() {
  const now = Date.now();
  const artifactRefInput = `/api/v1/jobs/${jobId}/artifacts/llm-input-full-redacted.md`;
  const artifactRefOutput = `/api/v1/jobs/${jobId}/artifacts/llm-output-full-redacted.md`;
  const artifactRefMissing = `/api/v1/jobs/${jobId}/artifacts/missing-artifact.md`;
  const job = {
    id: jobId,
    kind: 'bootstrap',
    status: 'completed',
    source: 'LLMI-P9 fixture',
    createdAt: '2026-05-25T00:00:00.000Z',
    updatedAt: '2026-05-25T00:00:08.000Z',
    startedAt: '2026-05-25T00:00:01.000Z',
    completedAt: '2026-05-25T00:00:08.000Z',
    progress: {
      current: 4,
      total: 4,
      percent: 100,
      status: 'completed',
      sessionId,
      activeTask: 'Dashboard artifact detail fixture',
      currentDimension: 'agent-input',
      totalToolCalls: 0,
    },
    summary: {
      dimensions: 1,
      createdCandidates: 0,
      failedCandidates: 0,
      retainedProcessEvents: 4,
    },
  };
  const commonMetrics = {
    inputTokens: 1420,
    outputTokens: 312,
    visibleTextChars: 188,
    retainedArtifactChars: 920,
    redactedSecretCount: 1,
  };
  const commonTrace = {
    traceId: 'trace-llmi-p9-dashboard-fixture',
    sessionId,
    provider: 'fixture-provider',
    model: 'fixture-model',
    phase: 'agent-input',
  };
  const developerViews = [
    {
      eventId: 'evt-llmi-p9-input',
      jobId,
      sequence: 1,
      kind: 'llm.input',
      phase: 'agent-input',
      title: 'LLMI P9 llm.input projection',
      summary: `${projectionMarker}: developer-safe prompt summary only.`,
      content: 'Short retained projection: section names, dimensions, and safety summary only.',
      severity: 'info',
      sourceClass: 'developer-facing',
      displayPolicy: 'summary',
      dimensionId: 'agent-input',
      targetName: 'Dashboard',
      artifactRefs: [
        {
          kind: 'llm.input.full-redacted',
          ref: artifactRefInput,
          label: 'Full redacted llm.input artifact',
          mimeType: 'text/markdown',
        },
      ],
      metadata: {
        llmMetrics: commonMetrics,
        traceEnvelope: commonTrace,
        artifactRetained: true,
        artifactRef: 'llm-input-full-redacted.md',
        artifactKind: 'llm.input.full-redacted',
        artifactOriginalChars: 1520,
        artifactRetainedChars: 920,
        artifactRedactionState: 'redacted',
        artifactStorage: 'job-artifacts',
        artifactDataRootScoped: true,
        artifactPath: '.asd/job-artifacts/llmi-p9-dashboard-artifact-fixture/llm-input-full-redacted.md',
        contentOriginalChars: 1520,
        contentRetainedChars: 188,
        contentTruncated: true,
        contentTruncatedChars: 1332,
        contentTruncationLimit: 240,
        retention: 'artifact',
      },
      timestamp: now,
    },
    {
      eventId: 'evt-llmi-p9-output',
      jobId,
      sequence: 2,
      kind: 'llm.output',
      phase: 'agent-input',
      title: 'LLMI P9 llm.output projection',
      summary: `${projectionMarker}: output summary only, full answer retained as artifact.`,
      content: 'Output projection: final recommendation and status summary.',
      severity: 'success',
      sourceClass: 'developer-facing',
      displayPolicy: 'summary',
      dimensionId: 'agent-input',
      targetName: 'Dashboard',
      artifactRefs: [
        {
          kind: 'llm.output.full-redacted',
          ref: artifactRefOutput,
          label: 'Full redacted llm.output artifact',
          mimeType: 'text/markdown',
        },
      ],
      metadata: {
        llmMetrics: {
          outputTokens: 540,
          visibleTextChars: 86,
          retainedArtifactChars: 460,
          finishReason: 'stop',
        },
        traceEnvelope: {
          ...commonTrace,
          traceId: 'trace-llmi-p9-dashboard-output-fixture',
        },
        artifactRetained: true,
        artifactRef: 'llm-output-full-redacted.md',
        artifactKind: 'llm.output.full-redacted',
        artifactOriginalChars: 620,
        artifactRetainedChars: 460,
        artifactRedactionState: 'redacted',
        artifactStorage: 'job-artifacts',
        artifactDataRootScoped: true,
        retention: 'artifact',
      },
      timestamp: now + 1000,
    },
    {
      eventId: 'evt-llmi-p9-missing',
      jobId,
      sequence: 3,
      kind: 'llm.input',
      phase: 'agent-input',
      title: 'LLMI P9 missing artifact fixture',
      summary: 'Fixture event with a missing artifactRef for failure state validation.',
      severity: 'warning',
      sourceClass: 'developer-facing',
      displayPolicy: 'summary',
      dimensionId: 'agent-input',
      targetName: 'Dashboard',
      artifactRefs: [
        {
          kind: 'llm.input.missing',
          ref: artifactRefMissing,
          label: 'Missing artifact fixture',
          mimeType: 'text/markdown',
        },
      ],
      metadata: {
        llmMetrics: { inputTokens: 12 },
        traceEnvelope: { ...commonTrace, traceId: 'trace-llmi-p9-missing-fixture' },
        artifactRetained: false,
        artifactRef: 'missing-artifact.md',
        artifactKind: 'llm.input.missing',
        artifactRedactionState: 'missing',
      },
      timestamp: now + 2000,
    },
    {
      eventId: 'evt-llmi-p9-empty',
      jobId,
      sequence: 4,
      kind: 'llm.reflection',
      phase: 'agent-input',
      title: 'LLMI P9 no artifactRef fixture',
      summary: 'Fixture event with metrics and trace but no artifactRef.',
      severity: 'info',
      sourceClass: 'developer-facing',
      displayPolicy: 'summary',
      dimensionId: 'agent-input',
      targetName: 'Dashboard',
      artifactRefs: [],
      metadata: {
        llmMetrics: { visibleTextChars: 41 },
        traceEnvelope: { ...commonTrace, traceId: 'trace-llmi-p9-empty-fixture' },
      },
      timestamp: now + 3000,
    },
  ];
  const artifacts = {
    'llm-input-full-redacted.md': [
      '# Full redacted llm.input artifact',
      '',
      `${fullArtifactMarker}: complete retained prompt body after redaction.`,
      '',
      '- Developer summary: prompt layering and observation ledger retained.',
      '- Secret boundary: fixture token was replaced with [REDACTED_SECRET].',
      '- Provider-only raw fields are omitted from this artifact.',
    ].join('\n'),
    'llm-output-full-redacted.md': [
      '# Full redacted llm.output artifact',
      '',
      `${fullArtifactMarker}: complete retained output body after redaction.`,
      '',
      '- Output status: accepted.',
      '- Hidden reasoning omitted from developer-visible projection.',
    ].join('\n'),
  };
  return {
    artifactRefInput,
    artifactRefMissing,
    artifactRefOutput,
    artifacts,
    developerViews,
    job,
  };
}

async function startFixtureApi(fixture, artifactDelayMs) {
  const requests = [];
  const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', 'http://127.0.0.1');
    requests.push({ method: req.method, path: url.pathname, query: url.search, at: new Date().toISOString() });
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      res.end();
      return;
    }
    if (url.pathname === '/api/v1/health') {
      jsonResponse(res, 200, { success: true, data: { status: 'healthy', testMode: true } });
      return;
    }
    if (url.pathname === '/api/v1/modules/test-mode') {
      jsonResponse(res, 200, {
        success: true,
        data: {
          enabled: true,
          bootstrapDims: ['agent-input'],
          rescanDims: ['agent-input'],
          terminal: { enabled: true, toolset: 'fixture' },
          sandbox: { mode: 'enforce', available: true },
        },
      });
      return;
    }
    if (url.pathname === '/api/v1/jobs') {
      jsonResponse(res, 200, { success: true, data: { jobs: [fixture.job] } });
      return;
    }
    if (url.pathname === `/api/v1/jobs/${jobId}`) {
      jsonResponse(res, 200, { success: true, data: { job: fixture.job } });
      return;
    }
    if (url.pathname === `/api/v1/jobs/${jobId}/events`) {
      const afterSequence = Number(url.searchParams.get('afterSequence') || 0);
      const developerViews = fixture.developerViews.filter((event) => event.sequence > afterSequence);
      jsonResponse(res, 200, {
        success: true,
        data: {
          jobId,
          count: fixture.developerViews.length,
          retainedCount: fixture.developerViews.length,
          nextSequence: 5,
          hiddenCount: 2,
          developerViews,
          endpointCapability: {
            available: true,
            endpoint: `/api/v1/jobs/${jobId}/events`,
            supportedKinds: ['workflow', 'llm.input', 'llm.output', 'llm.reflection', 'tool'],
            supportedSourceClasses: ['developer-facing', 'machine-only', 'raw-provider', 'secret'],
            supportedDisplayPolicies: ['full', 'summary', 'hidden'],
            supportedRetentionPolicies: ['inline', 'artifact'],
          },
        },
      });
      return;
    }
    const artifactMatch = url.pathname.match(new RegExp(`^/api/v1/jobs/${jobId}/artifacts/([^/]+)$`));
    if (artifactMatch) {
      const artifactId = decodeURIComponent(artifactMatch[1]);
      const artifact = fixture.artifacts[artifactId];
      if (!artifact) {
        textResponse(res, 404, 'missing artifact for fixture');
        return;
      }
      await new Promise((resolveDelay) => setTimeout(resolveDelay, artifactDelayMs));
      textResponse(res, 200, artifact, 'text/markdown; charset=utf-8');
      return;
    }
    jsonResponse(res, 404, { success: false, error: `Unhandled fixture route: ${url.pathname}` });
  });
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : null;
  assert(port, 'Fixture API did not bind to a port');
  return {
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolveClose) => server.close(resolveClose)),
    requests,
  };
}

async function waitForHttp(url, timeoutMs = 20000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return true;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message || 'unknown error'}`);
}

async function startDashboardDevServer(apiBaseUrl) {
  const port = await getFreePort();
  const child = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', String(port), '--strictPort'], {
    cwd: dashboardRoot,
    env: {
      ...process.env,
      VITE_API_URL: apiBaseUrl,
      BROWSER: 'none',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = [];
  child.stdout.on('data', (chunk) => output.push(sanitizeText(chunk.toString())));
  child.stderr.on('data', (chunk) => output.push(sanitizeText(chunk.toString())));
  const url = `http://127.0.0.1:${port}`;
  await waitForHttp(url, 30000);
  return {
    child,
    output,
    port,
    url,
    close: () => terminateProcess(child),
  };
}

function terminateProcess(child) {
  return new Promise((resolveTerminate) => {
    if (!child || child.killed || child.exitCode !== null) {
      resolveTerminate();
      return;
    }
    child.once('exit', () => resolveTerminate());
    child.kill('SIGTERM');
    setTimeout(() => {
      if (child.exitCode === null && !child.killed) child.kill('SIGKILL');
      resolveTerminate();
    }, 2500).unref();
  });
}

async function startChrome() {
  assert(existsSync(chromePath), `Chrome executable not found at ${chromePath}`);
  assert(typeof WebSocket === 'function', 'Global WebSocket is required for CDP automation');
  const debugPort = await getFreePort();
  const profileDir = await mkdtemp(join(tmpdir(), 'alembic-dashboard-cdp-'));
  const child = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-background-networking',
    '--disable-sync',
    '--window-size=1440,1100',
    `--user-data-dir=${profileDir}`,
    `--remote-debugging-port=${debugPort}`,
    'about:blank',
  ], {
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const output = [];
  child.stdout.on('data', (chunk) => output.push(sanitizeText(chunk.toString())));
  child.stderr.on('data', (chunk) => output.push(sanitizeText(chunk.toString())));
  try {
    const versionUrl = `http://127.0.0.1:${debugPort}/json/version`;
    await waitForHttp(versionUrl, 20000);
    const version = await (await fetch(versionUrl)).json();
    const newTargetResponse = await fetch(`http://127.0.0.1:${debugPort}/json/new?about:blank`, {
      method: 'PUT',
    });
    const newTargetText = await newTargetResponse.text();
    const newTarget = JSON.parse(newTargetText);
    return {
      child,
      debugPort,
      output,
      profileDir,
      version,
      webSocketDebuggerUrl: newTarget.webSocketDebuggerUrl,
      close: async () => {
        await terminateProcess(child);
        await rm(profileDir, { force: true, recursive: true });
      },
    };
  } catch (error) {
    await terminateProcess(child);
    await rm(profileDir, { force: true, recursive: true });
    throw error;
  }
}

class CdpSession {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.id = 0;
    this.pending = new Map();
    this.eventWaiters = new Map();
    this.socket = null;
  }

  connect() {
    return new Promise((resolveConnect, reject) => {
      this.socket = new WebSocket(this.wsUrl);
      this.socket.addEventListener('open', () => resolveConnect());
      this.socket.addEventListener('error', (event) => reject(new Error(`CDP websocket error: ${event.message || 'unknown'}`)), { once: true });
      this.socket.addEventListener('message', (event) => this.handleMessage(event.data));
    });
  }

  handleMessage(data) {
    const message = JSON.parse(data);
    if (message.id && this.pending.has(message.id)) {
      const { resolveSend, reject } = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message || JSON.stringify(message.error)));
      else resolveSend(message.result || {});
      return;
    }
    if (message.method && this.eventWaiters.has(message.method)) {
      const waiters = this.eventWaiters.get(message.method);
      this.eventWaiters.delete(message.method);
      for (const waiter of waiters) waiter(message.params || {});
    }
  }

  send(method, params = {}) {
    const id = ++this.id;
    this.socket.send(JSON.stringify({ id, method, params }));
    return new Promise((resolveSend, reject) => {
      this.pending.set(id, { resolveSend, reject });
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`Timed out waiting for CDP response: ${method}`));
        }
      }, 15000).unref();
    });
  }

  waitForEvent(method, timeoutMs = 15000) {
    return new Promise((resolveEvent, reject) => {
      const waiters = this.eventWaiters.get(method) || [];
      waiters.push(resolveEvent);
      this.eventWaiters.set(method, waiters);
      setTimeout(() => {
        const current = this.eventWaiters.get(method) || [];
        const next = current.filter((waiter) => waiter !== resolveEvent);
        if (next.length === 0) this.eventWaiters.delete(method);
        else this.eventWaiters.set(method, next);
        reject(new Error(`Timed out waiting for CDP event: ${method}`));
      }, timeoutMs).unref();
    });
  }

  async evaluate(expression, returnByValue = true) {
    const result = await this.send('Runtime.evaluate', {
      awaitPromise: true,
      expression,
      returnByValue,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.text || 'Runtime.evaluate failed');
    }
    return returnByValue ? result.result?.value : result.result;
  }

  async waitForExpression(expression, timeoutMs = 10000, intervalMs = 120) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const value = await this.evaluate(expression);
      if (value) return value;
      await new Promise((resolveDelay) => setTimeout(resolveDelay, intervalMs));
    }
    throw new Error(`Timed out waiting for expression: ${expression}`);
  }

  close() {
    if (this.socket) this.socket.close();
  }
}

async function captureScreenshot(cdp, path) {
  const result = await cdp.send('Page.captureScreenshot', {
    captureBeyondViewport: true,
    format: 'png',
    fromSurface: true,
  });
  await writeFile(path, Buffer.from(result.data, 'base64'));
}

function boolMap(values, text) {
  return Object.fromEntries(values.map((value) => [value, text.includes(value)]));
}

async function runDashboardDomProbe({ dashboardUrl, evidenceDir }) {
  const chrome = await startChrome();
  const cdp = new CdpSession(chrome.webSocketDebuggerUrl);
  await cdp.connect();
  try {
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 1100,
      deviceScaleFactor: 1,
      mobile: false,
    });
    const pageUrl = `${dashboardUrl}/jobs?job=${encodeURIComponent(jobId)}`;
    const load = cdp.waitForEvent('Page.loadEventFired', 20000).catch(() => null);
    await cdp.send('Page.navigate', { url: pageUrl });
    await load;
    await cdp.waitForExpression(
      `document.body.innerText.includes('${projectionMarker}') && document.body.innerText.includes('LLMI P9 llm.input projection')`,
      20000
    );
    const timelineText = await cdp.evaluate(`(() => {
      const node = document.querySelector('[aria-label="过程终端"], [aria-label="Process terminal"]');
      return node ? node.innerText : document.body.innerText;
    })()`);
    const mainListTextPath = join(evidenceDir, 'dashboard-artifact-detail-timeline.txt');
    await writeFile(mainListTextPath, sanitizeText(timelineText));

    await cdp.evaluate(`(() => {
      const event = document.querySelector('[data-process-event-sequence="1"]');
      const buttons = Array.from(event?.querySelectorAll('button') || []);
      const button = buttons.find((item) => /产物详情|Artifact details/.test(item.innerText));
      if (!button) throw new Error('detail button not found for sequence 1');
      button.click();
      return true;
    })()`);
    await cdp.waitForExpression(
      `document.body.innerText.includes('正在读取 artifact') || document.body.innerText.includes('Loading artifact')`,
      5000
    );
    const loadingText = await cdp.evaluate('document.body.innerText');
    const loadingScreenshot = join(evidenceDir, 'dashboard-artifact-detail-loading.png');
    await captureScreenshot(cdp, loadingScreenshot);

    await cdp.waitForExpression(`document.body.innerText.includes('${fullArtifactMarker}')`, 10000);
    const successText = await cdp.evaluate('document.body.innerText');
    const successHtml = await cdp.evaluate('document.documentElement.outerHTML');
    const successTextPath = join(evidenceDir, 'dashboard-artifact-detail-success.txt');
    const successHtmlPath = join(evidenceDir, 'dashboard-artifact-detail-success.html');
    const successScreenshot = join(evidenceDir, 'dashboard-artifact-detail-success.png');
    await writeFile(successTextPath, sanitizeText(successText));
    await writeFile(successHtmlPath, sanitizeText(successHtml));
    await captureScreenshot(cdp, successScreenshot);

    await cdp.evaluate(`(() => {
      const event = document.querySelector('[data-process-event-sequence="2"]');
      const buttons = Array.from(event?.querySelectorAll('button') || []);
      const button = buttons.find((item) => /产物详情|Artifact details/.test(item.innerText));
      if (!button) throw new Error('detail button not found for sequence 2');
      button.click();
      return true;
    })()`);
    await cdp.waitForExpression(`document.body.innerText.includes('complete retained output body')`, 10000);
    const outputText = await cdp.evaluate('document.body.innerText');
    const outputTextPath = join(evidenceDir, 'dashboard-artifact-detail-output-success.txt');
    const outputScreenshot = join(evidenceDir, 'dashboard-artifact-detail-output-success.png');
    await writeFile(outputTextPath, sanitizeText(outputText));
    await captureScreenshot(cdp, outputScreenshot);

    await cdp.evaluate(`(() => {
      const event = document.querySelector('[data-process-event-sequence="3"]');
      const buttons = Array.from(event?.querySelectorAll('button') || []);
      const button = buttons.find((item) => /产物详情|Artifact details/.test(item.innerText));
      if (!button) throw new Error('detail button not found for sequence 3');
      button.click();
      return true;
    })()`);
    await cdp.waitForExpression(
      `document.body.innerText.includes('missing artifact') || document.body.innerText.includes('artifact 读取失败') || document.body.innerText.includes('Artifact fetch failed') || document.body.innerText.includes('404')`,
      8000
    );
    const errorText = await cdp.evaluate('document.body.innerText');
    const errorScreenshot = join(evidenceDir, 'dashboard-artifact-detail-error.png');
    await captureScreenshot(cdp, errorScreenshot);

    await cdp.evaluate(`(() => {
      const event = document.querySelector('[data-process-event-sequence="4"]');
      const buttons = Array.from(event?.querySelectorAll('button') || []);
      const button = buttons.find((item) => /产物详情|Artifact details/.test(item.innerText));
      if (!button) throw new Error('detail button not found for sequence 4');
      button.click();
      return true;
    })()`);
    await cdp.waitForExpression(
      `document.body.innerText.includes('此事件没有 artifactRef') || document.body.innerText.includes('No artifactRef on this event')`,
      8000
    );
    const emptyText = await cdp.evaluate('document.body.innerText');
    const emptyScreenshot = join(evidenceDir, 'dashboard-artifact-detail-empty.png');
    await captureScreenshot(cdp, emptyScreenshot);

    return {
      browser: {
        product: chrome.version.Browser,
        protocolVersion: chrome.version['Protocol-Version'],
      },
      pageUrl,
      textEvidence: {
        empty: relative(testRepoRoot, join(evidenceDir, 'dashboard-artifact-detail-empty.png')),
        loading: relative(testRepoRoot, loadingScreenshot),
        outputSuccessText: relative(testRepoRoot, outputTextPath),
        successHtml: relative(testRepoRoot, successHtmlPath),
        successText: relative(testRepoRoot, successTextPath),
        timelineText: relative(testRepoRoot, mainListTextPath),
      },
      screenshots: {
        empty: relative(testRepoRoot, emptyScreenshot),
        error: relative(testRepoRoot, errorScreenshot),
        loading: relative(testRepoRoot, loadingScreenshot),
        outputSuccess: relative(testRepoRoot, outputScreenshot),
        success: relative(testRepoRoot, successScreenshot),
      },
      stateTextSamples: {
        empty: sanitizeText(emptyText).slice(0, 2000),
        error: sanitizeText(errorText).slice(0, 2000),
        loading: sanitizeText(loadingText).slice(0, 1000),
        outputSuccess: sanitizeText(outputText).slice(0, 2000),
        success: sanitizeText(successText).slice(0, 3000),
        timeline: sanitizeText(timelineText).slice(0, 2000),
      },
      assertions: {
        artifactDetailPanelVisible: /产物详情|Artifact details/.test(successText),
        fullArtifactSectionVisible: /完整 redacted artifact|Full redacted artifact/.test(successText),
        loadingStateVisible: /正在读取 artifact|Loading artifact/.test(loadingText),
        errorStateVisible: /missing artifact|artifact 读取失败|Artifact fetch failed|404/.test(errorText),
        emptyStateVisible: /此事件没有 artifactRef|No artifactRef on this event/.test(emptyText),
        timelineProjectionVisible: timelineText.includes(projectionMarker),
        fullArtifactAbsentFromTimeline: !timelineText.includes(fullArtifactMarker),
        fullArtifactVisibleInDetail: successText.includes(fullArtifactMarker),
        outputArtifactVisibleInDetail:
          outputText.includes(fullArtifactMarker) && outputText.includes('complete retained output body'),
        metricsVisible: successText.includes('Metrics') && successText.includes('inputTokens'),
        traceVisible: successText.includes('Trace envelope') && successText.includes('traceId'),
        artifactMetadataVisible: successText.includes('Artifact metadata') && successText.includes('artifactRetained'),
        secretAbsentFromTimeline: !timelineText.includes(secretMarker) && !timelineText.includes(providerOnlyMarker),
        secretAbsentFromDetail: !successText.includes(secretMarker) && !successText.includes(providerOnlyMarker),
        expectedLabels: boolMap([
          'Timeline 摘要投影',
          '完整 redacted artifact',
          'MIME 类型',
          'Artifact metadata',
          'Trace envelope',
          '产物',
        ], successText),
      },
    };
  } finally {
    cdp.close();
    await chrome.close();
  }
}

async function sourceFolderRuntimeWrites() {
  const checks = [];
  for (const [name, root] of [
    ['Alembic', alembicRoot],
    ['AlembicDashboard', dashboardRoot],
    ['AlembicTest', testRepoRoot],
  ]) {
    checks.push({
      name,
      root: relative(workspaceRoot, root),
      hasAsdDirectory: existsSync(join(root, '.asd')),
      hasNestedAlembicDirectory: existsSync(join(root, 'Alembic')),
    });
  }
  return checks;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assert(process.env.ALEMBIC_TEST_MODE === '1', 'ALEMBIC_TEST_MODE=1 is required');
  const out = args.out;
  const evidenceDir = join(testRepoRoot, 'tmp', 'llm-input-dashboard-artifact-detail-test-mode');
  await mkdir(dirname(out), { recursive: true });
  await mkdir(evidenceDir, { recursive: true });

  const before = {
    alembicDashboardStatus: await git(['status', '--short'], dashboardRoot),
    alembicStatus: await git(['status', '--short'], alembicRoot),
    alembicTestStatus: await git(['status', '--short'], testRepoRoot),
    runtimeWrites: await sourceFolderRuntimeWrites(),
  };
  const versions = {
    alembicHead: await git(['rev-parse', 'HEAD'], alembicRoot),
    dashboardHead: await git(['rev-parse', 'HEAD'], dashboardRoot),
    node: process.version,
  };
  assert(versions.dashboardHead === expectedDashboardHead, 'Unexpected AlembicDashboard HEAD', versions);
  assert(versions.alembicHead === expectedAlembicHead, 'Unexpected Alembic HEAD', versions);

  const fixture = makeFixture();
  assert(!Object.values(fixture.artifacts).join('\n').includes(secretMarker), 'Fixture artifact leaked secret marker');
  assert(!Object.values(fixture.artifacts).join('\n').includes(providerOnlyMarker), 'Fixture artifact leaked provider-only marker');

  const api = await startFixtureApi(fixture, args.artifactDelayMs);
  let dashboard;
  try {
    dashboard = await startDashboardDevServer(api.baseUrl);
    const dom = await runDashboardDomProbe({ dashboardUrl: dashboard.url, evidenceDir });
    const contractTest = await commandOutput('npm', ['run', 'test'], dashboardRoot);
    const after = {
      alembicDashboardStatus: await git(['status', '--short'], dashboardRoot),
      alembicStatus: await git(['status', '--short'], alembicRoot),
      alembicTestStatus: await git(['status', '--short'], testRepoRoot),
      runtimeWrites: await sourceFolderRuntimeWrites(),
    };
    const apiEvidence = {
      artifactFetches: api.requests.filter((request) => request.path.includes('/artifacts/')),
      eventFetches: api.requests.filter((request) => request.path.endsWith('/events')),
      jobListFetches: api.requests.filter((request) => request.path === '/api/v1/jobs'),
      requestCount: api.requests.length,
    };
    const { expectedLabels, ...domAssertions } = dom.assertions;
    const assertions = {
      ...domAssertions,
      expectedLabelsVisible: Object.values(expectedLabels).every(Boolean),
      apiFetchedEvents: apiEvidence.eventFetches.length >= 1,
      apiFetchedArtifacts: apiEvidence.artifactFetches.length >= 4,
      apiFetchedSuccessArtifact: apiEvidence.artifactFetches.some((request) => request.path.endsWith('/llm-input-full-redacted.md')),
      apiFetchedOutputArtifact: apiEvidence.artifactFetches.some((request) => request.path.endsWith('/llm-output-full-redacted.md')),
      apiFetchedMissingArtifact: apiEvidence.artifactFetches.some((request) => request.path.endsWith('/missing-artifact.md')),
      apiArtifactsSecretSafe: Object.values(fixture.artifacts).every((artifact) =>
        !artifact.includes(secretMarker) && !artifact.includes(providerOnlyMarker)
      ),
      dashboardContractTestsPassed: /# pass 12/.test(contractTest.stdout) || /pass 12/.test(contractTest.stdout),
      productRepoStatusUnchanged:
        before.alembicDashboardStatus === after.alembicDashboardStatus &&
        before.alembicStatus === after.alembicStatus,
      noNewSourceRuntimeDataWritten: JSON.stringify(before.runtimeWrites) === JSON.stringify(after.runtimeWrites),
      dashboardSourceHasNoRuntimeData: after.runtimeWrites
        .filter((item) => item.name === 'AlembicDashboard')
        .every((item) => !item.hasAsdDirectory && !item.hasNestedAlembicDirectory),
    };
    const failedAssertions = Object.entries(assertions)
      .filter(([, value]) => value !== true)
      .map(([key]) => key);
    const evidence = {
      testId: 'Test-2026-05-25-08',
      name: 'LLMI-P9-Dashboard-Artifact-Detail-TestMode',
      generatedAt: new Date().toISOString(),
      testMode: process.env.ALEMBIC_TEST_MODE,
      config: {
        artifactDelayMs: args.artifactDelayMs,
        dashboardUrl: dashboard.url,
        fixtureApiUrl: api.baseUrl,
        jobId,
        sessionId,
      },
      versions,
      fixtureSummary: {
        developerViewKinds: fixture.developerViews.map((event) => `${event.sequence}:${event.kind}`),
        artifactRefs: [fixture.artifactRefInput, fixture.artifactRefOutput, fixture.artifactRefMissing],
        secretMarkerPresentOnlyInFixtureControl: true,
      },
      expectedLabelPresence: expectedLabels,
      apiEvidence,
      dom,
      contractTest,
      gitStatus: {
        before,
        after,
      },
      assertions,
      failedAssertions,
      result: failedAssertions.length === 0 ? 'PASS' : 'FAIL',
      dashboardDevServerOutput: dashboard.output.join('').slice(-4000),
    };
    await writeFile(out, JSON.stringify(evidence, null, 2));
    console.log(JSON.stringify({
      result: evidence.result,
      out: relative(process.cwd(), out),
      dashboardUrl: dashboard.url,
      jobId,
      failedAssertions,
      screenshots: dom.screenshots,
    }, null, 2));
    if (failedAssertions.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (dashboard) await dashboard.close();
    await api.close();
  }
}

main().catch(async (error) => {
  console.error(error.stack || error.message);
  if (error.details) console.error(JSON.stringify(error.details, null, 2));
  process.exitCode = 1;
});
