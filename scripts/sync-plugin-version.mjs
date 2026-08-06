#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const packagePath = path.join(repoDir, 'package.json');
const manifestPath = path.join(repoDir, '.codex-plugin', 'plugin.json');

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const manifestText = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestText);

if (process.argv.includes('--check')) {
  if (manifest.version !== packageJson.version) {
    console.error(
      `Version mismatch: package.json is ${packageJson.version}, but .codex-plugin/plugin.json is ${manifest.version}.`,
    );
    process.exitCode = 1;
  }
} else if (manifest.version !== packageJson.version) {
  const updatedManifest = manifestText.replace(
    /("version"\s*:\s*")[^"]+(")/,
    `$1${packageJson.version}$2`,
  );
  if (updatedManifest === manifestText) {
    throw new Error('Could not locate the plugin manifest version field.');
  }
  fs.writeFileSync(manifestPath, updatedManifest);
  console.log(`Synchronized plugin manifest to ${packageJson.version}.`);
}
