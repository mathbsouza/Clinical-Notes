import { mkdirSync } from 'node:fs';
import { basename, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const [, , assetName, releaseTag = 'references', outputDir = 'references'] = process.argv;

if (!assetName) {
  console.error('Usage: npm run refs:retrieve -- <asset-name> [release-tag] [output-dir]');
  process.exit(1);
}

const destination = resolve(outputDir);
mkdirSync(destination, { recursive: true });

const result = spawnSync(
  'gh',
  ['release', 'download', releaseTag, '--pattern', assetName, '--dir', destination, '--clobber'],
  { stdio: 'inherit' }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Retrieved ${basename(assetName)} into ${destination}.`);
