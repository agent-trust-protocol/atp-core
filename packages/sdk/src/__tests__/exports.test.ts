import * as sdk from '../index.js';

describe('top-level compatibility exports', () => {
  it.each(['createAgent', 'registerAgent', 'verifyAgent', 'getTrustLevel'] as const)(
    '%s is exported as a function',
    (name) => {
      expect(typeof (sdk as Record<string, unknown>)[name]).toBe('function');
    }
  );
});
