#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const testDir = path.dirname(fileURLToPath(import.meta.url));
const brainstormDir = path.resolve(testDir, '..', '..');
const pluginSkillsDir = path.resolve(brainstormDir, '..');
const copyScript = path.join(pluginSkillsDir, 'setup-profile', 'scripts', 'copy-bundled-profile.mjs');
const { resolveProfile } = require('../lib/profile-selection.cjs');

function check(condition, message) {
  if (!condition) throw new Error(message);
}

function runCopy(workspaceDir, extraArgs = []) {
  const result = spawnSync(process.execPath, [copyScript, '--workspace', workspaceDir, '--json', ...extraArgs], {
    encoding: 'utf8',
  });
  if (result.status !== 0) throw new Error(`copy failed: ${result.stderr || result.stdout}`);
  return JSON.parse(result.stdout);
}

const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-profile-selection-'));

try {
  const initial = resolveProfile({ projectDir, skillDir: brainstormDir });
  check(initial.source === 'bundled', `expected bundled, got ${initial.source}`);
  check(initial.profileDir === path.join(brainstormDir, 'profile'), 'bundled path mismatch');
  check(initial.complete === true && initial.issues.length === 0, 'bundled profile should be complete');

  const created = runCopy(projectDir);
  check(created.status === 'created', `expected created, got ${created.status}`);
  check(created.targetProfileDir === path.join(projectDir, 'wb-design-profile'), 'copy target mismatch');
  check(
    !fs.readdirSync(projectDir).some((entry) => entry.startsWith('.wb-design-profile-copy-')),
    'copy staging directory was not cleaned up',
  );

  const workspace = resolveProfile({ projectDir, skillDir: brainstormDir });
  check(workspace.source === 'workspace', `expected workspace, got ${workspace.source}`);
  check(workspace.profileDir === created.targetProfileDir, 'workspace path mismatch');
  check(workspace.complete === true, 'copied workspace profile should be complete');

  const marker = path.join(created.targetProfileDir, 'preserve-me.txt');
  fs.writeFileSync(marker, 'user-owned');
  const existing = runCopy(projectDir);
  check(existing.status === 'existing', `expected existing, got ${existing.status}`);
  check(fs.readFileSync(marker, 'utf8') === 'user-owned', 'existing profile was overwritten');

  const brokenProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-broken-profile-'));
  fs.mkdirSync(path.join(brokenProjectDir, 'wb-design-profile'));
  const sentinel = path.join(brokenProjectDir, 'wb-design-profile', 'preserve-me.txt');
  fs.writeFileSync(sentinel, 'user-owned');
  const incompleteCopy = runCopy(brokenProjectDir);
  check(incompleteCopy.status === 'incomplete', 'copy did not report an incomplete existing profile');
  check(incompleteCopy.complete === false, 'incomplete copy result was marked complete');
  check(fs.readFileSync(sentinel, 'utf8') === 'user-owned', 'inspection changed an incomplete profile');

  const bestEffort = resolveProfile({ projectDir: brokenProjectDir, skillDir: brainstormDir });
  check(bestEffort.source === 'workspace', 'incomplete workspace profile was not selected');
  check(bestEffort.complete === false, 'incomplete workspace profile was marked complete');
  check(bestEffort.issues.some((issue) => issue.includes('PROFILE.md')), 'missing PROFILE.md was not reported');

  const bundledOverride = resolveProfile({
    projectDir: brokenProjectDir,
    skillDir: brainstormDir,
    useBundled: true,
  });
  check(bundledOverride.source === 'bundled', 'bundled override did not bypass workspace profile');

  const repaired = runCopy(brokenProjectDir, ['--repair']);
  check(repaired.status === 'repaired' && repaired.complete === true, 'missing entries were not repaired');
  check(fs.readFileSync(sentinel, 'utf8') === 'user-owned', 'repair overwrote existing workspace content');
  const repairedSelection = resolveProfile({ projectDir: brokenProjectDir, skillDir: brainstormDir });
  check(repairedSelection.complete === true, 'repaired workspace profile remained incomplete');
  fs.rmSync(brokenProjectDir, { recursive: true, force: true });

  const invalidProjectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brainstorm-invalid-profile-'));
  fs.writeFileSync(path.join(invalidProjectDir, 'wb-design-profile'), 'not a directory');
  let invalidFailedClearly = false;
  try {
    resolveProfile({ projectDir: invalidProjectDir, skillDir: brainstormDir });
  } catch (error) {
    invalidFailedClearly = error.message.includes('--use-bundled-profile');
  }
  check(invalidFailedClearly, 'unusable workspace path did not explain the bundled fallback');
  check(
    resolveProfile({ projectDir: invalidProjectDir, skillDir: brainstormDir, useBundled: true }).source === 'bundled',
    'bundled override did not bypass an unusable workspace path',
  );
  fs.rmSync(invalidProjectDir, { recursive: true, force: true });

  console.log('profile-selection: all checks passed');
} catch (error) {
  console.error(`profile-selection: FAIL ${error.message}`);
  process.exitCode = 1;
} finally {
  fs.rmSync(projectDir, { recursive: true, force: true });
}
