import { readFileSync } from 'fs';
import { resolve } from 'path';
import * as sdk from '../index';

const pkg = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf8'));

describe('package metadata', () => {
  test('VERSION and SDK_INFO match package.json', () => {
    expect(sdk.VERSION).toBe(pkg.version);
    expect(sdk.SDK_INFO.version).toBe(pkg.version);
  });
  test('documented utilities are exported', () => {
    for (const name of ['Agent', 'ATPClient', 'CryptoUtils', 'DidAtp', 'DidAtpDocument', 'DidAtpResolver', 'JWTUtils', 'jcsCanonicalize', 'createQuickConfig', 'ProtocolDetector', 'UniversalMonitor', 'MCPAdapter'])
      expect((sdk as Record<string, unknown>)[name]).toBeDefined();
  });
  test('Protocol enum is a runtime value', () => {
    expect(sdk.Protocol.MCP).toBeDefined();
  });
});
