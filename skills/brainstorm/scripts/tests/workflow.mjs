#!/usr/bin/env node

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, spawnSync } from 'node:child_process';

const BRAINSTORM_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SERVER = path.join(BRAINSTORM_DIR, 'scripts/serve-preview.cjs');
const WORKFLOW = path.join(BRAINSTORM_DIR, 'scripts/workflow.mjs');

function run(args, expectedStatus = 0) {
  const result = spawnSync(process.execPath, [WORKFLOW, ...args], {
    cwd: BRAINSTORM_DIR,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  assert.equal(result.status, expectedStatus, result.stderr || result.stdout);
  return JSON.parse(result.stdout || result.stderr);
}

function waitForServer(child) {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error(`server timed out: ${stderr}`)), 10_000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
      const newline = stdout.indexOf('\n');
      if (newline < 0) return;
      clearTimeout(timeout);
      try { resolve(JSON.parse(stdout.slice(0, newline))); } catch (error) { reject(error); }
    });
    child.stderr.on('data', (chunk) => { stderr += chunk.toString(); });
    child.once('exit', (code) => reject(new Error(`server exited ${code}: ${stderr}`)));
  });
}

async function stopServer(child) {
  if (child.exitCode !== null) return;
  const exited = new Promise((resolve) => child.once('exit', resolve));
  try { child.kill('SIGTERM'); } catch {}
  await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(resolve, 4_000)),
  ]);
}

const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-workflow-test-'));
const workspaceProfile = path.join(temporary, 'wb-design-profile');
fs.cpSync(path.join(BRAINSTORM_DIR, 'profile'), workspaceProfile, { recursive: true });
const productKnowledgeFile = path.join(workspaceProfile, 'knowledge', 'fund-detail.md');
fs.mkdirSync(path.dirname(productKnowledgeFile), { recursive: true });
fs.writeFileSync(productKnowledgeFile, '# Fund detail product knowledge\n\nPreserve the risk acknowledgement.\n');
const workflowContractsFile = path.join(workspaceProfile, 'quality', 'workflow-contracts.json');
const workflowContracts = JSON.parse(fs.readFileSync(workflowContractsFile, 'utf8'));
workflowContracts.templates['基金详情页.html'].contextFiles = ['knowledge/fund-detail.md'];
fs.writeFileSync(workflowContractsFile, `${JSON.stringify(workflowContracts, null, 2)}\n`);
const port = 4600 + Math.floor(Math.random() * 200);
const server = spawn(process.execPath, [
  SERVER,
  '--project-dir', temporary,
  '--run-label', 'workflow-contract-test',
  '--port', String(port),
], { cwd: BRAINSTORM_DIR, stdio: ['ignore', 'pipe', 'pipe'] });

try {
  const info = await waitForServer(server);
  const common = ['--run-dir', info.runDir, '--stage', 'solutions'];
  const workflowDir = path.join(info.stateDir, 'workflow', 'stages', 'solutions');
  const prepared = run([
    'prepare', ...common,
    '--kind', 'solutions',
    '--approach', 'rework',
    '--brand-mode', 'preserve',
    '--template', '基金详情页.html',
    '--output', 'solutions.html:3',
  ]);
  assert.equal(prepared.status, 'prepared');
  assert.equal(prepared.outputs.length, 1);
  assert.ok(prepared.contextBytes > 0);
  assert.ok(prepared.contextBytes < 20_000, `solutions context was ${prepared.contextBytes} bytes`);
  assert.ok(prepared.contextFiles.every((file) => !file.includes('SKILL.md')));
  assert.equal(fs.realpathSync(prepared.contextFiles[0]), fs.realpathSync(path.join(workflowDir, 'worker-brief.md')));
  assert.equal(
    prepared.contextFiles.filter((file) => fs.realpathSync(file) === fs.realpathSync(productKnowledgeFile)).length,
    1,
    'rework must include each profile-declared context file exactly once',
  );

  const fragments = path.join(workflowDir, 'fragments');
  const sourceTemplate = fs.readFileSync(path.join(info.profileDir, 'screens/基金详情页.html'), 'utf8');
  const sourceParts = (await import('../lib/workflow-contract.cjs')).default.extractTemplateParts(sourceTemplate);
  for (const [index, name] of ['solutions.screen-1.html', 'solutions.screen-2.html', 'solutions.screen-3.html'].entries()) {
    const file = path.join(fragments, name);
    const seeded = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(seeded, /WORKFLOW_SCREEN_/);
    assert.match(seeded, new RegExp(`brainstorm-option-${index + 1}`));
    assert.match(seeded, /易方达中证军工指数/);
  }
  const brief = fs.readFileSync(path.join(workflowDir, 'worker-brief.md'), 'utf8');
  assert.doesNotMatch(brief, /workflow\.mjs" validate|workflow\.mjs" report/);
  assert.match(brief, /Edit exactly[^]*solutions\.screen-1\.html/);
  assert.match(brief, /brand identity anchors/i);
  assert.match(brief, /Brand mode: `preserve`/);
  assert.ok(brief.includes(fs.realpathSync(productKnowledgeFile)));
  assert.ok(fs.existsSync(path.join(fragments, 'solutions.base.css')));
  const captionsFile = path.join(fragments, 'solutions.captions.json');
  const captions = JSON.parse(fs.readFileSync(captionsFile, 'utf8'))
    .map((caption, index) => ({
      title: caption.title.replace('待命名', '证据优先'),
      subtitle: caption.subtitle.replaceAll('待填写', '保留真实数据并强化风险决策'),
      recommended: index === 1,
    }));
  fs.writeFileSync(captionsFile, `${JSON.stringify(captions, null, 2)}\n`);
  fs.writeFileSync(path.join(fragments, 'solutions.styles.css'), `
.brainstorm-option-1 .wb-fd-stats-card { border: 1px solid var(--wb-app-divider); }
.brainstorm-option-2 .wb-fd-performance-card { border: 1px solid var(--wb-app-divider); }
.brainstorm-option-3 .wb-fd-manager-photo { box-shadow: 0 0 0 2px var(--wb-app-divider); }
`);

  const topLevelBodyChild = (text, classToken) => {
    const body = text.match(/<div class="wb-app-page-body"[^>]*>/);
    assert.ok(body, 'missing page body');
    const tags = [...text.slice(body.index + body[0].length).matchAll(/<\/?div\b[^>]*>/g)];
    let depth = 0;
    let start = null;
    for (const tag of tags) {
      const absolute = body.index + body[0].length + tag.index;
      if (!tag[0].startsWith('</')) {
        if (depth === 0) start = absolute;
        depth += 1;
      } else {
        depth -= 1;
        if (depth === 0 && start !== null) {
          const end = absolute + tag[0].length;
          const child = text.slice(start, end);
          if (new RegExp(`class="[^"]*\\b${classToken}\\b`).test(child)) return { start, end, child };
          start = null;
        }
      }
    }
    throw new Error(`missing top-level child containing ${classToken}`);
  };
  const moveAnchorBefore = (file, anchor, before) => {
    const text = fs.readFileSync(file, 'utf8');
    const moving = topLevelBodyChild(text, anchor);
    const target = topLevelBodyChild(text, before);
    assert.ok(moving.start > target.start, `${anchor} must start after ${before} in the fixture`);
    const without = `${text.slice(0, moving.start)}${text.slice(moving.end)}`;
    fs.writeFileSync(file, `${without.slice(0, target.start)}${moving.child}\n\n    ${without.slice(target.start)}`);
  };
  moveAnchorBefore(path.join(fragments, 'solutions.screen-2.html'), 'wb-fd-performance-card', 'wb-fd-stats-card');
  moveAnchorBefore(path.join(fragments, 'solutions.screen-3.html'), 'wb-fd-manager-photo', 'wb-fd-stats-card');

  const assembled = run(['assemble', ...common]);
  assert.equal(assembled.status, 'assembled');
  assert.equal(assembled.artifacts.length, 1);
  const solutionFile = path.join(info.screenDir, 'solutions.html');
  const canonical = fs.readFileSync(solutionFile, 'utf8');
  assert.match(canonical, /^<!DOCTYPE html>/);
  assert.match(canonical, /<meta charset="UTF-8">/);

  const finalScreen = path.join(fragments, 'solutions.screen-3.html');
  const validFinalScreen = fs.readFileSync(finalScreen, 'utf8');
  fs.writeFileSync(finalScreen, '<div class="wb-app-page"></div>\n<div class="wb-app-page"></div>\n');
  const invalidBoundary = run(['assemble', ...common], 2);
  assert.equal(invalidBoundary.status, 'error');
  assert.match(invalidBoundary.message, /exactly one \.wb-app-page root/);
  assert.equal(fs.readFileSync(solutionFile, 'utf8'), canonical, 'transactional assembly must preserve all outputs');
  fs.writeFileSync(finalScreen, validFinalScreen);
  run(['assemble', ...common]);

  fs.appendFileSync(solutionFile, '\n<!-- direct screen edit -->\n');
  const drifted = run(['validate', ...common, '--allow-browser-unavailable'], 1);
  assert.equal(drifted.status, 'blocked');
  assert.ok(drifted.findings.some((finding) => finding.code === 'assembled-drift'));

  run(['assemble', ...common]);
  const contentFile = path.join(fragments, 'solutions.screen-1.html');
  const completeContent = fs.readFileSync(contentFile, 'utf8');
  fs.writeFileSync(contentFile, completeContent.replace('不构成投资建议', '仅供参考'));
  run(['assemble', ...common]);
  const missingRequired = run(['validate', ...common, '--allow-browser-unavailable'], 1);
  assert.equal(missingRequired.status, 'blocked');
  assert.ok(missingRequired.findings.some((finding) => finding.code === 'required-text'));
  fs.writeFileSync(contentFile, completeContent);
  run(['assemble', ...common]);
  const passed = run(['validate', ...common]);
  assert.equal(passed.status, 'passed');
  assert.ok(passed.browser.every((item) => item.status === 'passed'));
  assert.ok(passed.browser.every((item) => fs.existsSync(item.screenshot)));

  const unresolvedStyles = path.join(fragments, 'solutions.styles.css');
  const validStyles = fs.readFileSync(unresolvedStyles, 'utf8');
  fs.appendFileSync(unresolvedStyles, '\n.brainstorm-option-1 .wb-fd-stats-card { background: var(--wb-app-surface-100); }\n');
  run(['assemble', ...common]);
  const unresolvedToken = run(['validate', ...common, '--allow-browser-unavailable'], 1);
  assert.equal(unresolvedToken.status, 'blocked');
  assert.ok(unresolvedToken.findings.some((finding) => finding.code === 'unresolved-css-variable'));
  fs.writeFileSync(unresolvedStyles, validStyles);
  run(['assemble', ...common]);
  const repassed = run(['validate', ...common]);
  assert.equal(repassed.status, 'passed');

  const exploreCommon = ['--run-dir', info.runDir, '--stage', 'brand-exploration'];
  const explored = run([
    'prepare', ...exploreCommon,
    '--kind', 'solutions',
    '--approach', 'rework',
    '--brand-mode', 'explore',
    '--template', '基金详情页.html',
    '--output', 'brand-exploration.html:3',
  ]);
  assert.equal(explored.status, 'prepared');
  const exploreDir = path.join(info.stateDir, 'workflow/stages/brand-exploration');
  const exploreContract = JSON.parse(fs.readFileSync(path.join(exploreDir, 'generation-contract.json'), 'utf8'));
  assert.equal(exploreContract.brandMode, 'explore');
  assert.match(fs.readFileSync(path.join(exploreDir, 'worker-brief.md'), 'utf8'), /Brand mode: `explore`/);

  const selectedScreen = fs.readFileSync(path.join(fragments, 'solutions.screen-2.html'), 'utf8');
  const selected = run(['select', ...common, '--choice', '2']);
  assert.equal(selected.status, 'selected');
  assert.equal(selected.choice, 2);
  const selection = JSON.parse(fs.readFileSync(path.join(workflowDir, 'selection.json'), 'utf8'));
  const selectedStyles = fs.readFileSync(selection.styles.absolute, 'utf8');
  assert.match(selectedStyles, /\.wb-fd-hero/);
  assert.match(selectedStyles, /\.brainstorm-option-2/);

  const composeCommon = ['--run-dir', info.runDir, '--stage', 'new-screen-solutions'];
  const composed = run([
    'prepare', ...composeCommon,
    '--kind', 'solutions',
    '--approach', 'compose',
    '--template', '基金详情页.html',
    '--output', 'new-screen-solutions.html:3',
  ]);
  const composeFragments = path.join(
    info.stateDir,
    'workflow/stages/new-screen-solutions/fragments',
  );
  assert.ok(composed.contextFiles.some(
    (file) => fs.realpathSync(file) === fs.realpathSync(path.join(info.profileDir, 'screens/基金详情页.html')),
  ));
  assert.match(
    fs.readFileSync(path.join(composeFragments, 'new-screen-solutions.screen-1.html'), 'utf8'),
    /WORKFLOW_SCREEN_1/,
  );

  const blankComposeCommon = ['--run-dir', info.runDir, '--stage', 'blank-page-solutions'];
  const blankComposed = run([
    'prepare', ...blankComposeCommon,
    '--kind', 'solutions',
    '--approach', 'compose',
    '--output', 'blank-page-solutions.html:3',
  ]);
  const blankComposeDir = path.join(
    info.stateDir,
    'workflow/stages/blank-page-solutions',
  );
  const blankComposeFragments = path.join(blankComposeDir, 'fragments');
  const blankContract = JSON.parse(fs.readFileSync(path.join(blankComposeDir, 'generation-contract.json'), 'utf8'));
  assert.equal(blankContract.template, null);
  assert.equal(blankContract.templateSha256, null);
  assert.ok(blankComposed.contextFiles.some(
    (file) => fs.realpathSync(file) === fs.realpathSync(path.join(info.profileDir, 'PROFILE.md')),
  ));
  for (const [index, name] of [
    'blank-page-solutions.screen-1.html',
    'blank-page-solutions.screen-2.html',
    'blank-page-solutions.screen-3.html',
  ].entries()) {
    const file = path.join(blankComposeFragments, name);
    assert.match(fs.readFileSync(file, 'utf8'), new RegExp(`WORKFLOW_SCREEN_${index + 1}`));
    fs.writeFileSync(file, `<div class="wb-app-page">
  <preview-chrome variant="inner" title="新页面"></preview-chrome>
  <main class="wb-app-page-body"><section class="wb-app-card">新页面方案 ${index + 1}</section></main>
</div>\n`);
  }
  fs.writeFileSync(
    path.join(blankComposeFragments, 'blank-page-solutions.captions.json'),
    `${JSON.stringify([
      { title: '方案 A', subtitle: '全新页面方向 A', recommended: false },
      { title: '方案 B', subtitle: '全新页面方向 B', recommended: true },
      { title: '方案 C', subtitle: '全新页面方向 C', recommended: false },
    ], null, 2)}\n`,
  );
  run(['assemble', ...blankComposeCommon]);
  const blankValidation = run(['validate', ...blankComposeCommon]);
  assert.equal(blankValidation.status, 'passed');
  run(['select', ...blankComposeCommon, '--choice', '2']);

  const blankFinalCommon = ['--run-dir', info.runDir, '--stage', 'blank-page'];
  const blankPromoted = run([
    'prepare', ...blankFinalCommon,
    '--kind', 'screen',
    '--output', 'blank-page.html:1',
    '--from-stage', 'blank-page-solutions',
  ]);
  assert.equal(blankPromoted.contextFiles.length, 1);
  run(['assemble', ...blankFinalCommon]);
  const blankFinalValidation = run(['validate', ...blankFinalCommon]);
  assert.equal(blankFinalValidation.status, 'passed');

  const finalCommon = ['--run-dir', info.runDir, '--stage', 'fund-detail'];
  const promoted = run([
    'prepare', ...finalCommon,
    '--kind', 'screen',
    '--template', '基金详情页.html',
    '--output', 'fund-detail.html:1',
    '--from-stage', 'solutions',
  ]);
  assert.equal(promoted.contextFiles.length, 1);
  assert.equal(
    fs.realpathSync(promoted.contextFiles[0]),
    fs.realpathSync(path.join(info.stateDir, 'workflow/stages/fund-detail/worker-brief.md')),
  );
  assert.ok(promoted.contextBytes < 5_000, `promoted context was ${promoted.contextBytes} bytes`);
  const promotedScreen = path.join(info.stateDir, 'workflow/stages/fund-detail/fragments/fund-detail.screen-1.html');
  assert.equal(fs.readFileSync(promotedScreen, 'utf8'), selectedScreen);
  run(['assemble', ...finalCommon]);
  const promotedValidation = run(['validate', ...finalCommon]);
  assert.equal(promotedValidation.status, 'passed');
  const selectedFinal = run(['select', ...finalCommon, '--choice', '1']);
  assert.equal(selectedFinal.status, 'selected');

  const interactive = run(['report', ...common]);
  assert.equal(interactive.executionMode, 'interactive');
  assert.equal(interactive.tokens.totalTokens, null);

  const eventsFile = path.join(temporary, 'codex.events.jsonl');
  fs.writeFileSync(eventsFile, `${JSON.stringify({
    type: 'turn.completed',
    usage: {
      input_tokens: 100,
      cached_input_tokens: 80,
      output_tokens: 20,
      reasoning_output_tokens: 5,
    },
  })}\n`);
  const metered = run(['report', ...common, '--codex-events', eventsFile]);
  assert.equal(metered.executionMode, 'codex-exec');
  assert.equal(metered.tokens.totalTokens, 120);
  assert.equal(metered.tokens.uncachedInputTokens, 20);
  assert.equal(metered.tokens.cacheHitRate, 0.8);

  console.log('test-workflow: all checks passed');
} finally {
  await stopServer(server);
  fs.rmSync(temporary, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
}
