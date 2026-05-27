#!/usr/bin/env node
// Syncs manifest.json's "version" to the version in package.json.
//
// Run automatically by the npm/pnpm "version" lifecycle script, so a single
// `pnpm version <patch|minor|major>` bumps BOTH files (web-ext builds the zip
// from the manifest version, which `pnpm version` alone would not touch).
//
// Uses a targeted string replace rather than JSON.parse/stringify so the
// manifest's existing formatting (inline arrays, etc.) is preserved.
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const { version } = require(path.join(root, 'package.json'));
const manifestPath = path.join(root, 'manifest.json');

const raw = fs.readFileSync(manifestPath, 'utf8');
// Match the top-level "version": "x.y.z" field (not "manifest_version", which
// has a numeric value and is not preceded by an opening quote on "version").
const updated = raw.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`);

if (updated === raw) {
  console.log(`manifest.json version already ${version} (no change)`);
} else {
  fs.writeFileSync(manifestPath, updated);
  console.log(`manifest.json version -> ${version}`);
}
