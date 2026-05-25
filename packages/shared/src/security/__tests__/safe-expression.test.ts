/**
 * Tests for the sandboxed expression evaluator used by the workflow engine
 * (CWE-94 fix). Asserts that:
 *  - well-formed expressions evaluate correctly,
 *  - identifiers other than `data` are rejected at parse time,
 *  - prototype-walking / globals access is rejected,
 *  - the evaluator never falls through to the host JS runtime.
 */

import { evaluateSafeExpression } from '../safe-expression.js';

describe('evaluateSafeExpression', () => {
  describe('legitimate expressions', () => {
    test('member access and comparison', () => {
      expect(evaluateSafeExpression('data.x > 5', { x: 6 })).toBe(true);
      expect(evaluateSafeExpression('data.x > 5', { x: 4 })).toBe(false);
    });

    test('nested member access', () => {
      expect(evaluateSafeExpression('data.user.score >= 100', { user: { score: 100 } })).toBe(true);
    });

    test('logical operators short-circuit', () => {
      expect(evaluateSafeExpression('data.a && data.b', { a: true, b: false })).toBe(false);
      expect(evaluateSafeExpression('data.a || data.b', { a: false, b: true })).toBe(true);
    });

    test('arithmetic', () => {
      expect(evaluateSafeExpression('data.x + data.y * 2', { x: 1, y: 3 })).toBe(7);
    });

    test('string equality and bracket access', () => {
      expect(evaluateSafeExpression("data['name'] === 'alice'", { name: 'alice' })).toBe(true);
    });

    test('null / boolean literals', () => {
      expect(evaluateSafeExpression('data.x === null', { x: null })).toBe(true);
      expect(evaluateSafeExpression('!data.flag', { flag: false })).toBe(true);
    });
  });

  describe('rejected expressions (security)', () => {
    test('rejects unknown identifiers', () => {
      expect(() => evaluateSafeExpression('process.env.SECRET', {})).toThrow(/unknown identifier/);
    });

    test('rejects require()', () => {
      expect(() => evaluateSafeExpression("require('child_process')", {})).toThrow(/unknown identifier/);
    });

    test('rejects globalThis', () => {
      expect(() => evaluateSafeExpression('globalThis.x', {})).toThrow(/unknown identifier/);
    });

    test('rejects __proto__ via dot access', () => {
      expect(() => evaluateSafeExpression('data.__proto__', { x: 1 })).toThrow(/forbidden property/);
    });

    test('rejects constructor access', () => {
      expect(() => evaluateSafeExpression('data.constructor', { x: 1 })).toThrow(/forbidden property/);
    });

    test('rejects __proto__ via computed access', () => {
      expect(() => evaluateSafeExpression("data['__proto__']", { x: 1 })).toThrow(/forbidden property/);
    });

    test('rejects function calls', () => {
      // Any token following an identifier that the grammar does not expect
      // produces an "unexpected token" error.
      expect(() => evaluateSafeExpression('data.x()', { x: () => 1 })).toThrow(/unexpected token/);
    });

    test('rejects template literals', () => {
      expect(() => evaluateSafeExpression('`${data.x}`', { x: 1 })).toThrow();
    });

    test('rejects assignment', () => {
      expect(() => evaluateSafeExpression('data.x = 1', { x: 0 })).toThrow();
    });

    test('rejects overly long expression', () => {
      const long = 'data.x ' + '+ 0 '.repeat(300);
      expect(() => evaluateSafeExpression(long, { x: 1 })).toThrow(/too long/);
    });

    test('non-string expression rejected', () => {
      expect(() => evaluateSafeExpression({} as never, {})).toThrow();
    });
  });
});
