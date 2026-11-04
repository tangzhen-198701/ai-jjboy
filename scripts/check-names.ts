import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const ignored = new Set(['node_modules', 'dist', '.git', 'data', 'outputs', '.DS_Store']);
const exceptions = new Set(['AGENTS.md', 'README.md', 'SKILL.md', '实施方案.md']);
const validName = /^\.?[a-z0-9]+(?:[.-][a-z0-9]+)*$/;
const failures: string[] = [];

async function visit(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (!exceptions.has(entry.name) && !validName.test(entry.name)) failures.push(path);
    if (entry.isDirectory()) await visit(path);
  }
}

await visit('.');
if (failures.length > 0) {
  console.error('Use lowercase kebab-case file and directory names:', failures);
  process.exitCode = 1;
} else {
  console.info('File and directory naming checks passed.');
}
