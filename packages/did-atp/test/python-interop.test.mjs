import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseAtpV2PathDid, isAtpV2PathDid, AtpDidParseError } from '../dist/index.js';
const cases = JSON.parse(readFileSync(new URL('./python-interop-invalid.json', import.meta.url), 'utf8'));
test('shared Python/TypeScript malformed identifiers have matching error codes', () => {
  for (const c of cases) {
    assert.equal(isAtpV2PathDid(c.value), false);
    assert.throws(() => parseAtpV2PathDid(c.value), e => e instanceof AtpDidParseError && e.code === c.code);
  }
});
