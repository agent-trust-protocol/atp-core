const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtemp, writeFile, rm } = require('node:fs/promises');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const { loadNycConfig } = require('@istanbuljs/load-nyc-config');

test('coverage loader accepts YAML using scoped js-yaml 4 override', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'atp-nyc-'));
  try {
    await writeFile(join(dir, '.nycrc.yml'), 'all: true\ninclude:\n  - src/**/*.ts\n');
    const config = await loadNycConfig({ cwd: dir });
    assert.equal(config.all, true);
    assert.deepEqual(config.include, ['src/**/*.ts']);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
