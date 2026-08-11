import { basename, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const [, , filePath, releaseTag = 'references'] = process.argv;

if (!filePath) {
  console.error('Usage: npm run refs:upload -- <path-to-file> [release-tag]');
  process.exit(1);
}

const absolutePath = resolve(filePath);

if (!existsSync(absolutePath)) {
  console.error(`File not found: ${absolutePath}`);
  process.exit(1);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('gh', ['release', 'view', releaseTag]);
run('gh', ['release', 'upload', releaseTag, absolutePath, '--clobber']);

console.log(`Uploaded ${basename(absolutePath)} to GitHub release ${releaseTag}.`);
