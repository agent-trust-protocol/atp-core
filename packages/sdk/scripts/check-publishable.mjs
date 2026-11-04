import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const local = Object.entries(pkg.dependencies || {}).filter(([, version]) => version.startsWith('file:'));
if (local.length) {
  console.error(
    'Publication blocked: replace local package dependencies with published versions first: ' +
      local.map(([name, version]) => `${name} (${version})`).join(', ')
  );
  process.exitCode = 1;
}
