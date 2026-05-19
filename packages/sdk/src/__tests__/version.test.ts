import { VERSION } from '../index.js';
import pkg from '../../package.json';

describe('VERSION', () => {
  it('matches package.json version (prevents drift)', () => {
    expect(VERSION).toBe(pkg.version);
  });
});
