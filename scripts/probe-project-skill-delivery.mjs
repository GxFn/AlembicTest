#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path, { basename, dirname, join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const workspaceRoot = resolve(import.meta.dirname, '..', '..');
const defaults = {
  project: 'BiliDili',
  plugin: 'AlembicPlugin',
  timeoutMs: 60_000,
  cleanup: true,
  testMode: false,
  bootstrapDims: '',
  rescanDims: '',
};

const options = parseArgs(process.argv.slice(2));
const projectRoot = resolveWorkspacePath(options.project);
const pluginRoot = resolveWorkspacePath(options.plugin);
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const runtimeSkillName = `alembic-test-runtime-delivery-${stamp}`;
const conflictSkillName = `alembic-test-conflict-${stamp}`;
const outputPath = options.output
  ? resolve(options.output)
  : join(
      workspaceRoot,
      'AlembicTest',
      'tmp',
      `project-skill-delivery-probe-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    );

const report = {
  ok: false,
  startedAt: new Date().toISOString(),
  durationMs: 0,
  project: basename(projectRoot),
  projectRootRelative: relative(workspaceRoot, projectRoot) || '.',
  pluginRootRelative: relative(workspaceRoot, pluginRoot) || '.',
  runtimeSkillName,
  conflictSkillName,
  testMode: {
    requested: options.testMode,
    bootstrapDims: options.bootstrapDims,
    rescanDims: options.rescanDims,
    inheritedEnv: {
      ALEMBIC_TEST_MODE: process.env.ALEMBIC_TEST_MODE || null,
      ALEMBIC_TEST_BOOTSTRAP_DIMS: process.env.ALEMBIC_TEST_BOOTSTRAP_DIMS || null,
      ALEMBIC_TEST_RESCAN_DIMS: process.env.ALEMBIC_TEST_RESCAN_DIMS || null,
    },
  },
  toolDiscovery: {},
  status: null,
  listBefore: null,
  createExport: null,
  runtimeLoad: null,
  listAfterExport: null,
  conflict: null,
  filesystem: {},
  git: {},
  globalBoundary: {},
  cleanup: {},
  checks: {},
  stderrTail: [],
};

const startedAt = Date.now();
const stderr = [];

try {
  report.git.before = gitStatus(projectRoot);
  report.globalBoundary.before = inspectGlobalBoundary([runtimeSkillName, conflictSkillName]);
  const testModeEnv = buildTestModeEnv(options);
  report.testMode.mcpEnv = {
    ALEMBIC_TEST_MODE: testModeEnv.ALEMBIC_TEST_MODE || null,
    ALEMBIC_TEST_BOOTSTRAP_DIMS: testModeEnv.ALEMBIC_TEST_BOOTSTRAP_DIMS || null,
    ALEMBIC_TEST_RESCAN_DIMS: testModeEnv.ALEMBIC_TEST_RESCAN_DIMS || null,
  };

  const pluginRequire = createRequire(join(pluginRoot, 'package.json'));
  const { Client } = await import(
    pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/index.js')).href
  );
  const { StdioClientTransport } = await import(
    pathToFileURL(pluginRequire.resolve('@modelcontextprotocol/sdk/client/stdio.js')).href
  );

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [join(pluginRoot, 'dist', 'bin', 'codex-mcp.js')],
    cwd: pluginRoot,
    env: {
      ...process.env,
      ...testModeEnv,
      ALEMBIC_CHANNEL_ID: 'codex',
      ALEMBIC_CODEX_MCP_MODE: '1',
      ALEMBIC_MCP_MODE: '1',
      ALEMBIC_MCP_TIER: 'agent',
      ALEMBIC_PLUGIN_HOST: 'codex',
      ALEMBIC_PROJECT_DIR: projectRoot,
      ALEMBIC_QUIET: '1',
      ALEMBIC_RUNTIME_MODE: 'plugin',
      CODEX_WORKSPACE_DIR: projectRoot,
      INIT_CWD: projectRoot,
      PWD: projectRoot,
    },
    stderr: 'pipe',
  });
  transport.stderr?.on('data', (chunk) => stderr.push(String(chunk)));

  const client = new Client({
    name: 'alembic-test-project-skill-delivery-probe',
    version: '0.1.0',
  });

  try {
    await withTimeout(
      client.connect(transport, { timeout: options.timeoutMs }),
      options.timeoutMs + 2_000,
      () => `MCP connect timed out\n${stderr.join('')}`
    );

    const toolsResult = await withTimeout(
      client.listTools(undefined, { timeout: options.timeoutMs }),
      options.timeoutMs + 2_000,
      () => `MCP tools/list timed out\n${stderr.join('')}`
    );
    const toolNames = toolsResult.tools.map((tool) => tool.name).sort();
    report.toolDiscovery = {
      hasAlembicProjectSkill: toolNames.includes('alembic_project_skill'),
      hasLegacyAlembicSkill: toolNames.includes('alembic_skill'),
      toolNames,
    };

    report.status = await callJsonTool(client, 'alembic_codex_status', {}, options.timeoutMs);
    report.listBefore = await callJsonTool(
      client,
      'alembic_project_skill',
      { operation: 'list' },
      options.timeoutMs
    );

    const runtimeContent = buildSkillContent(runtimeSkillName, stamp);
    report.createExport = await callJsonTool(
      client,
      'alembic_project_skill',
      {
        operation: 'create',
        name: runtimeSkillName,
        description: `AlembicTest runtime delivery sentinel ${stamp}`,
        content: runtimeContent,
        overwrite: true,
        authorizeProjectSkillExport: true,
        createdBy: 'external-ai',
      },
      options.timeoutMs
    );

    const runtimeReceipt = report.createExport?.data?.deliveryReceipt ?? null;
    const runtimeExport = report.createExport?.data?.runtimeExport ?? null;
    report.filesystem.runtimeSkill = inspectRuntimeSkill(projectRoot, runtimeSkillName);
    report.runtimeLoad = await callJsonTool(
      client,
      'alembic_project_skill',
      { operation: 'load', name: runtimeSkillName },
      options.timeoutMs
    );
    report.listAfterExport = await callJsonTool(
      client,
      'alembic_project_skill',
      { operation: 'list' },
      options.timeoutMs
    );
    report.git.afterRuntimeExport = gitStatus(projectRoot);

    prepareConflictTarget(projectRoot, conflictSkillName, stamp);
    const conflictBefore = inspectRuntimeSkill(projectRoot, conflictSkillName);
    report.conflict = {
      before: conflictBefore,
      result: await callJsonTool(
        client,
        'alembic_project_skill',
        {
          operation: 'create',
          name: conflictSkillName,
          description: `AlembicTest conflict sentinel ${stamp}`,
          content: buildSkillContent(conflictSkillName, stamp),
          overwrite: true,
          authorizeProjectSkillExport: true,
          createdBy: 'external-ai',
        },
        options.timeoutMs
      ),
    };
    report.conflict.after = inspectRuntimeSkill(projectRoot, conflictSkillName);
    report.git.afterConflict = gitStatus(projectRoot);

    report.checks = {
      mcpToolVisible: report.toolDiscovery.hasAlembicProjectSkill === true,
      pluginRouteReceipt:
        report.createExport?.success === true &&
        runtimeReceipt?.route === 'plugin' &&
        runtimeReceipt?.skillName === runtimeSkillName,
      runtimeExported:
        runtimeExport?.status === 'exported' ||
        report.createExport?.data?.runtimeExportStatus === 'exported',
      runtimeSymlink:
        report.filesystem.runtimeSkill?.skillPathExists === true &&
        report.filesystem.runtimeSkill?.skillPathIsSymlink === true,
      markerMatchesReceipt: markerMatchesReceipt(report.filesystem.runtimeSkill?.marker, runtimeReceipt),
      runtimeLoadUsesCodexRuntime:
        report.runtimeLoad?.success === true &&
        report.runtimeLoad?.data?.source === 'codex-runtime' &&
        typeof report.runtimeLoad?.data?.content === 'string' &&
        report.runtimeLoad.data.content.includes(`sentinel ${stamp}`),
      conflictBlocked:
        report.conflict?.result?.data?.runtimeExport?.conflictStatus === 'different-existing' ||
        report.conflict?.result?.data?.conflictStatus === 'different-existing' ||
        report.conflict?.result?.data?.runtimeExport?.status === 'blocked' ||
        report.conflict?.result?.data?.runtimeExportStatus === 'blocked',
      conflictFilePreserved:
        report.conflict?.after?.skillPathExists === true &&
        report.conflict?.after?.skillPathIsSymlink === false &&
        readTextOrEmpty(report.conflict.after.skillPath).includes(`non-managed sentinel ${stamp}`),
      gitOnlyExpectedRuntimeExport: gitOnlyHasExpectedRuntimeArtifacts(report.git.afterRuntimeExport, [
        runtimeSkillName,
      ]),
      noGlobalHomeSkillWrites: inspectGlobalBoundary([runtimeSkillName, conflictSkillName]).homeHits.length === 0,
      testModeRequested: options.testMode === true && testModeEnv.ALEMBIC_TEST_MODE === '1',
    };
  } finally {
    await client.close().catch(() => {});
  }
} finally {
  if (options.cleanup) {
    report.cleanup = cleanupTestArtifacts(projectRoot, [runtimeSkillName, conflictSkillName]);
    report.git.afterCleanup = gitStatus(projectRoot);
  }
  report.globalBoundary.after = inspectGlobalBoundary([runtimeSkillName, conflictSkillName]);
  report.stderrTail = stderr.join('').split(/\n/).filter(Boolean).slice(-80);
  report.durationMs = Date.now() - startedAt;
  report.ok =
    report.checks.mcpToolVisible &&
    report.checks.pluginRouteReceipt &&
    report.checks.runtimeExported &&
    report.checks.runtimeSymlink &&
    report.checks.markerMatchesReceipt &&
    report.checks.runtimeLoadUsesCodexRuntime &&
    report.checks.conflictBlocked &&
    report.checks.conflictFilePreserved &&
    report.checks.gitOnlyExpectedRuntimeExport &&
    report.checks.noGlobalHomeSkillWrites;
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(
    `${JSON.stringify({ outputPath, ok: report.ok, checks: report.checks, testMode: report.testMode }, null, 2)}\n`
  );
}

function parseArgs(argv) {
  const out = { ...defaults };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--project' || arg === '--plugin' || arg === '--output' || arg === '--timeout-ms') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      i += 1;
      if (arg === '--project') out.project = value;
      if (arg === '--plugin') out.plugin = value;
      if (arg === '--output') out.output = value;
      if (arg === '--timeout-ms') out.timeoutMs = Number.parseInt(value, 10);
      continue;
    }
    if (arg === '--no-cleanup') {
      out.cleanup = false;
      continue;
    }
    if (arg === '--test-mode') {
      out.testMode = true;
      continue;
    }
    if (arg === '--bootstrap-dims' || arg === '--rescan-dims') {
      const value = argv[i + 1];
      if (!value || value.startsWith('--')) throw new Error(`${arg} requires a value`);
      i += 1;
      if (arg === '--bootstrap-dims') out.bootstrapDims = value;
      if (arg === '--rescan-dims') out.rescanDims = value;
      continue;
    }
    throw new Error(`Unknown option: ${arg}`);
  }
  return out;
}

function buildTestModeEnv(parsedOptions) {
  const env = {};
  if (parsedOptions.testMode) env.ALEMBIC_TEST_MODE = '1';
  if (parsedOptions.bootstrapDims) env.ALEMBIC_TEST_BOOTSTRAP_DIMS = parsedOptions.bootstrapDims;
  if (parsedOptions.rescanDims) env.ALEMBIC_TEST_RESCAN_DIMS = parsedOptions.rescanDims;
  return env;
}

function resolveWorkspacePath(value) {
  return path.isAbsolute(value) ? resolve(value) : resolve(workspaceRoot, value);
}

async function callJsonTool(client, name, args, timeoutMs) {
  const result = await withTimeout(
    client.callTool({ name, arguments: args }, undefined, { timeout: timeoutMs }),
    timeoutMs + 2_000,
    () => `${name} timed out\n${stderr.join('')}`
  );
  const text = result.content?.find((item) => item.type === 'text')?.text ?? '';
  try {
    return JSON.parse(text);
  } catch {
    return { success: false, errorCode: 'NON_JSON_TOOL_RESULT', text };
  }
}

function buildSkillContent(name, stampValue) {
  return `---\nname: ${name}\ndescription: AlembicTest Project Skill delivery sentinel ${stampValue}. Trigger when validating CSSD runtime delivery.\n---\n\n# AlembicTest Project Skill Delivery Sentinel\n\nUse this skill only as evidence for Test-2026-05-24-05.\n\nThe sentinel ${stampValue} proves Codex project runtime loading can read the symlinked SKILL.md content.\n`;
}

function inspectRuntimeSkill(root, name) {
  const dir = join(root, '.agents', 'skills', name);
  const skillPath = join(dir, 'SKILL.md');
  const markerPath = join(dir, '.alembic-managed.json');
  const skillPathExists = existsSync(skillPath);
  let skillPathIsSymlink = false;
  let symlinkTarget = null;
  if (skillPathExists) {
    const stat = lstatSync(skillPath);
    skillPathIsSymlink = stat.isSymbolicLink();
    if (skillPathIsSymlink) symlinkTarget = readlinkSync(skillPath);
  }
  return {
    dir,
    dirExists: existsSync(dir),
    marker: readJsonOrNull(markerPath),
    markerPath,
    markerPathExists: existsSync(markerPath),
    skillPath,
    skillPathExists,
    skillPathIsSymlink,
    symlinkTarget,
  };
}

function markerMatchesReceipt(marker, receipt) {
  if (!marker || !receipt) return false;
  return (
    marker.generatedSkillId === receipt.managedMarker?.generatedSkillId &&
    marker.generationHash === receipt.managedMarker?.generationHash &&
    marker.projectScopeId === receipt.projectScopeId &&
    marker.route === receipt.route &&
    marker.skillName === receipt.skillName &&
    marker.sourcePath === receipt.asset?.path
  );
}

function prepareConflictTarget(root, name, stampValue) {
  const dir = join(root, '.agents', 'skills', name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, 'SKILL.md'),
    `# Existing non-managed skill\n\nnon-managed sentinel ${stampValue}\n`,
    'utf8'
  );
}

function cleanupTestArtifacts(root, names) {
  const removed = [];
  for (const name of names) {
    const dir = join(root, '.agents', 'skills', name);
    if (existsSync(dir)) {
      rmSync(dir, { force: true, recursive: true });
      removed.push(relative(root, dir));
    }
  }
  return { removed };
}

function gitStatus(root) {
  try {
    return execFileSync('git', ['-C', root, 'status', '--short'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
      .split(/\n/)
      .filter(Boolean);
  } catch (error) {
    return [`git-status-failed: ${error instanceof Error ? error.message : String(error)}`];
  }
}

function gitOnlyHasExpectedRuntimeArtifacts(statusLines, names) {
  if (!Array.isArray(statusLines)) return false;
  if (statusLines.length === 0) return true;
  return statusLines.every((line) => {
    const file = line.slice(3);
    if (file === '.agents/' || file === '.agents') {
      return true;
    }
    return names.some((name) => file.startsWith(`.agents/skills/${name}`));
  });
}

function inspectGlobalBoundary(names) {
  const homeSkillRoot = join(os.homedir(), '.agents', 'skills');
  const homeHits = names
    .map((name) => join(homeSkillRoot, name))
    .filter((candidate) => existsSync(candidate));
  return { homeSkillRoot, homeHits };
}

function readJsonOrNull(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readTextOrEmpty(filePath) {
  try {
    return readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function withTimeout(promise, ms, describe) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(describe())), ms);
    }),
  ]);
}
