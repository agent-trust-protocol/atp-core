import { PolicyRule, PermissionGrant, Scope } from '../models/permission.js';

export interface PolicyContext {
  subject: string;
  action: Scope;
  resource?: string;
  grant: PermissionGrant;
  context?: Record<string, any>;
}

export interface PolicyResult {
  allowed: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Safe expression evaluator (replaces expr-eval which has prototype pollution
// vulnerabilities - GHSA-8gw3-rxh4-v6jx, GHSA-jc85-fpwf-qm7x).
// Supports: ==, ===, !=, !==, >, <, >=, <=, &&, ||, !, dotted property
// access, string/number/boolean literals, and safe allow-listed methods
// (includes, startsWith, endsWith, length).
// ---------------------------------------------------------------------------

type Primitive = string | number | boolean | null | undefined;
type CtxValue = Primitive | CtxValue[] | Record<string, unknown>;

function getPath(obj: Record<string, CtxValue>, path: string): CtxValue {
  return path.split('.').reduce((cur: CtxValue, key) => {
    if (cur !== null && cur !== undefined && typeof cur === 'object' && !Array.isArray(cur)) {
      return (cur as Record<string, CtxValue>)[key];
    }
    return undefined;
  }, obj as CtxValue);
}

class SafeEvaluator {
  private pos = 0;
  private expr: string;
  private ctx: Record<string, CtxValue>;

  constructor(expr: string, ctx: Record<string, CtxValue>) {
    this.expr = expr.trim();
    this.ctx = ctx;
  }

  evaluate(): boolean | null {
    try {
      const result = this.parseOr();
      this.skip();
      // If there are unconsumed characters, the expression was invalid
      if (this.pos < this.expr.length) return null;
      return typeof result === 'boolean' ? result : null;
    } catch {
      return null;
    }
  }

  private skip() {
    while (this.pos < this.expr.length && /\s/.test(this.expr[this.pos])) this.pos++;
  }

  private peek(s: string): boolean {
    this.skip();
    return this.expr.startsWith(s, this.pos);
  }

  private consume(s: string): boolean {
    this.skip();
    if (this.expr.startsWith(s, this.pos)) { this.pos += s.length; return true; }
    return false;
  }

  private parseOr(): CtxValue {
    let left = this.parseAnd();
    while (this.peek('||')) { this.consume('||'); left = left || this.parseAnd(); }
    return left;
  }

  private parseAnd(): CtxValue {
    let left = this.parseNot();
    while (this.peek('&&')) { this.consume('&&'); left = left && this.parseNot(); }
    return left;
  }

  private parseNot(): CtxValue {
    if (this.consume('!')) {
      const val = this.parseComparison();
      return !val;
    }
    return this.parseComparison();
  }

  private parseComparison(): CtxValue {
    const left = this.parsePrimary();
    this.skip();
    for (const op of ['===', '!==', '==', '!=', '>=', '<=', '>', '<']) {
      if (this.consume(op)) {
        const right = this.parsePrimary();
        switch (op) {
          case '===': return left === right;
          case '!==': return left !== right;
          case '==':  return left == right; // eslint-disable-line eqeqeq
          case '!=':  return left != right; // eslint-disable-line eqeqeq
          case '>':   return (left as number) > (right as number);
          case '<':   return (left as number) < (right as number);
          case '>=':  return (left as number) >= (right as number);
          case '<=':  return (left as number) <= (right as number);
        }
      }
    }
    return left;
  }

  private parsePrimary(): CtxValue {
    this.skip();
    // String literal
    if (this.expr[this.pos] === '"' || this.expr[this.pos] === "'") {
      const quote = this.expr[this.pos++];
      let s = '';
      while (this.pos < this.expr.length && this.expr[this.pos] !== quote) {
        s += this.expr[this.pos++];
      }
      this.pos++; // closing quote
      return s;
    }
    // Parenthesised
    if (this.consume('(')) {
      const val = this.parseOr();
      this.consume(')');
      return val;
    }
    // Number
    const numMatch = this.expr.slice(this.pos).match(/^-?\d+(\.\d+)?/);
    if (numMatch) { this.pos += numMatch[0].length; return parseFloat(numMatch[0]); }
    // Keyword or identifier chain
    const idMatch = this.expr.slice(this.pos).match(/^[a-zA-Z_$][a-zA-Z0-9_$.]*/);;
    if (idMatch) {
      this.pos += idMatch[0].length;
      const token = idMatch[0];
      if (token === 'true') return true;
      if (token === 'false') return false;
      if (token === 'null') return null;
      if (token === 'undefined') return undefined;
      // Method call: token.includes("x") etc.
      if (this.consume('(')) {
        const arg = this.parsePrimary();
        this.consume(')');
        // token is like "context.grant.scopes.includes"
        const dotIdx = token.lastIndexOf('.');
        if (dotIdx !== -1) {
          const objPath = token.slice(0, dotIdx);
          const method = token.slice(dotIdx + 1);
          const obj = getPath(this.ctx, objPath);
          const SAFE_METHODS = ['includes', 'startsWith', 'endsWith'];
          if (SAFE_METHODS.includes(method) && (Array.isArray(obj) || typeof obj === 'string')) {
            return (obj as string[]).includes(arg as string);
          }
        }
        return null;
      }
      // Property access
      return getPath(this.ctx, token);
    }
    return null;
  }
}

/**
 * Tie-break precedence for rules of EQUAL priority — more restrictive effects
 * first (deny-wins). A ranked table (rather than a binary deny check) gives any
 * future effect a defined precedence instead of relying on sort stability.
 * Lower rank = evaluated first.
 */
const EFFECT_PRECEDENCE: Record<string, number> = {
  deny: 0,
  allow: 1,
};

export class PolicyEngine {
  private rules: Map<string, PolicyRule> = new Map();

  addRule(rule: PolicyRule): void {
    if (rule.active) {
      this.rules.set(rule.id, rule);
    }
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  async evaluate(context: PolicyContext): Promise<PolicyResult> {
    const applicableRules = Array.from(this.rules.values())
      .filter(rule => rule.active)
      .sort((a, b) => {
        // Primary: higher priority number wins.
        if (b.priority !== a.priority) return b.priority - a.priority;
        // Tie-break at equal priority by effect restrictiveness (deny-wins) via a
        // ranked table, so any future effect gets a defined precedence instead of
        // relying on sort stability. Lower rank = evaluated first.
        return (EFFECT_PRECEDENCE[a.effect] ?? 99) - (EFFECT_PRECEDENCE[b.effect] ?? 99);
      });

    for (const rule of applicableRules) {
      try {
        const result = this.evaluateRule(rule, context);
        if (result === true) {
          return {
            allowed: rule.effect === 'allow',
            reason: `Policy rule '${rule.name}' ${rule.effect}ed access`,
          };
        }
      } catch (error) {
        console.warn(`Error evaluating policy rule ${rule.id}:`, error);
      }
    }

    return {
      allowed: false,
      reason: 'No applicable policy rules found - default deny',
    };
  }

  private evaluateRule(rule: PolicyRule, context: PolicyContext): boolean | null {
    try {
      const safeContext = this.createSafeContext(context);
      return new SafeEvaluator(rule.condition, safeContext).evaluate();
    } catch (error) {
      console.error('Policy evaluation error:', error);
      return null;
    }
  }

  private createSafeContext(context: PolicyContext): Record<string, CtxValue> {
    return {
      subject: context.subject,
      action: context.action,
      resource: context.resource,
      grant: {
        id: context.grant.id,
        grantor: context.grant.grantor,
        grantee: context.grant.grantee,
        scopes: context.grant.scopes,
        resource: context.grant.resource,
        createdAt: context.grant.createdAt,
        expiresAt: context.grant.expiresAt,
      } as unknown as CtxValue,
      context: (context.context || {}) as CtxValue,
      now: Date.now(),
    };
  }

  getDefaultRules(): PolicyRule[] {
    return [
      {
        id: 'default-time-check',
        name: 'Check Grant Expiration',
        condition: '!context.grant.expiresAt || context.grant.expiresAt > context.now',
        effect: 'allow',
        priority: 1000,
        active: true,
      },
      {
        id: 'admin-override',
        name: 'Admin Override',
        condition: 'context.grant.scopes.includes("admin")',
        effect: 'allow',
        priority: 900,
        active: true,
      },
      {
        id: 'self-access',
        name: 'Self Access',
        condition: 'context.subject === context.resource',
        effect: 'allow',
        priority: 800,
        active: true,
      },
    ];
  }
}
