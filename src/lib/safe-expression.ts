/**
 * Agent Trust Protocol™
 * Sandboxed expression evaluator for workflow conditions and policy rules.
 *
 * Supports the minimum needed to express edge conditions:
 *   data.x, data['y'], nested member access
 *   literals: number, string (single/double-quoted), boolean, null
 *   binary ops: === !== == != < <= > >= && || + - * / %
 *   unary ops: ! -
 *   parentheses
 *
 * Anything else (identifiers other than `data`, function calls, template
 * literals, `new`, prototype access via `__proto__` / `constructor` /
 * `prototype`) is rejected at parse time. There is no access to `globalThis`,
 * `process`, `require`, or `this` — execution is a pure AST walk over the
 * supplied `data` object.
 */

type AstNode =
  | { type: 'literal'; value: number | string | boolean | null }
  | { type: 'ident'; name: 'data' }
  | { type: 'member'; object: AstNode; property: string }
  | { type: 'unary'; op: '!' | '-'; arg: AstNode }
  | { type: 'binary'; op: string; left: AstNode; right: AstNode };

const FORBIDDEN_PROPS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  'valueOf',
  'toString'
]);

class Parser {
  private pos = 0;
  constructor(private readonly src: string) {}

  parse(): AstNode {
    const node = this.parseOr();
    this.skipWs();
    if (this.pos < this.src.length) {
      throw new Error(`unexpected token at position ${this.pos}`);
    }
    return node;
  }

  // Precedence: || < && < equality < relational < additive < multiplicative < unary < primary
  private parseOr(): AstNode {
    let left = this.parseAnd();
    while (this.match('||')) left = { type: 'binary', op: '||', left, right: this.parseAnd() };
    return left;
  }
  private parseAnd(): AstNode {
    let left = this.parseEquality();
    while (this.match('&&')) left = { type: 'binary', op: '&&', left, right: this.parseEquality() };
    return left;
  }
  private parseEquality(): AstNode {
    let left = this.parseRelational();
    for (let op = this.matchOneOf(['===', '!==', '==', '!=']); op; op = this.matchOneOf(['===', '!==', '==', '!='])) {
      left = { type: 'binary', op, left, right: this.parseRelational() };
    }
    return left;
  }
  private parseRelational(): AstNode {
    let left = this.parseAdditive();
    for (let op = this.matchOneOf(['<=', '>=', '<', '>']); op; op = this.matchOneOf(['<=', '>=', '<', '>'])) {
      left = { type: 'binary', op, left, right: this.parseAdditive() };
    }
    return left;
  }
  private parseAdditive(): AstNode {
    let left = this.parseMultiplicative();
    for (let op = this.matchOneOf(['+', '-']); op; op = this.matchOneOf(['+', '-'])) {
      left = { type: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }
  private parseMultiplicative(): AstNode {
    let left = this.parseUnary();
    for (let op = this.matchOneOf(['*', '/', '%']); op; op = this.matchOneOf(['*', '/', '%'])) {
      left = { type: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }
  private parseUnary(): AstNode {
    if (this.match('!')) return { type: 'unary', op: '!', arg: this.parseUnary() };
    if (this.match('-')) return { type: 'unary', op: '-', arg: this.parseUnary() };
    return this.parseMember();
  }
  private parseMember(): AstNode {
    let node = this.parsePrimary();
    for (;;) {
      this.skipWs();
      const next = this.peek();
      if (next === '.') {
        this.pos++;
        const name = this.readIdentifier();
        if (FORBIDDEN_PROPS.has(name)) throw new Error(`forbidden property: ${name}`);
        node = { type: 'member', object: node, property: name };
      } else if (next === '[') {
        this.pos++;
        const key = this.parseOr();
        this.skipWs();
        if (this.peek() !== ']') throw new Error("expected ']'");
        this.pos++;
        if (key.type !== 'literal' || (typeof key.value !== 'string' && typeof key.value !== 'number')) {
          throw new Error('computed member access must use a string or number literal');
        }
        const prop = String(key.value);
        if (FORBIDDEN_PROPS.has(prop)) throw new Error(`forbidden property: ${prop}`);
        node = { type: 'member', object: node, property: prop };
      } else {
        return node;
      }
    }
  }
  private parsePrimary(): AstNode {
    this.skipWs();
    const c = this.peek();
    if (c === '(') {
      this.pos++;
      const node = this.parseOr();
      this.skipWs();
      if (this.peek() !== ')') throw new Error("expected ')'");
      this.pos++;
      return node;
    }
    if (c === '"' || c === "'") return { type: 'literal', value: this.readString(c) };
    if (c && /[0-9]/.test(c)) return { type: 'literal', value: this.readNumber() };
    if (c && /[A-Za-z_]/.test(c)) {
      const name = this.readIdentifier();
      if (name === 'true') return { type: 'literal', value: true };
      if (name === 'false') return { type: 'literal', value: false };
      if (name === 'null') return { type: 'literal', value: null };
      if (name === 'data') return { type: 'ident', name: 'data' };
      throw new Error(`unknown identifier: ${name} (only 'data' is allowed)`);
    }
    throw new Error(`unexpected character at position ${this.pos}: ${JSON.stringify(c)}`);
  }

  private skipWs(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) this.pos++;
  }
  private peek(): string | undefined {
    this.skipWs();
    return this.src[this.pos];
  }
  private match(s: string): boolean {
    this.skipWs();
    if (this.src.startsWith(s, this.pos)) {
      this.pos += s.length;
      return true;
    }
    return false;
  }
  private matchOneOf(opts: string[]): string | null {
    for (const o of opts) if (this.match(o)) return o;
    return null;
  }
  private readIdentifier(): string {
    this.skipWs();
    const start = this.pos;
    while (this.pos < this.src.length && /[A-Za-z0-9_$]/.test(this.src[this.pos])) this.pos++;
    if (start === this.pos) throw new Error('expected identifier');
    return this.src.slice(start, this.pos);
  }
  private readNumber(): number {
    this.skipWs();
    const start = this.pos;
    while (this.pos < this.src.length && /[0-9.]/.test(this.src[this.pos])) this.pos++;
    const n = Number(this.src.slice(start, this.pos));
    if (!Number.isFinite(n)) throw new Error('invalid number literal');
    return n;
  }
  private readString(quote: string): string {
    this.pos++; // consume opening quote
    let out = '';
    while (this.pos < this.src.length && this.src[this.pos] !== quote) {
      const ch = this.src[this.pos];
      if (ch === '\\') {
        const next = this.src[this.pos + 1];
        if (next === undefined) throw new Error('unterminated string');
        out += next;
        this.pos += 2;
      } else {
        out += ch;
        this.pos++;
      }
    }
    if (this.src[this.pos] !== quote) throw new Error('unterminated string');
    this.pos++;
    return out;
  }
}

function evalNode(node: AstNode, data: unknown): unknown {
  switch (node.type) {
    case 'literal':
      return node.value;
    case 'ident':
      return data;
    case 'member': {
      const obj = evalNode(node.object, data);
      if (obj === null || obj === undefined) return undefined;
      if (typeof obj !== 'object') return undefined;
      if (FORBIDDEN_PROPS.has(node.property)) return undefined;
      return (obj as Record<string, unknown>)[node.property];
    }
    case 'unary': {
      const v = evalNode(node.arg, data);
      if (node.op === '!') return !v;
      return -(Number(v));
    }
    case 'binary': {
      // Short-circuit for && and ||
      if (node.op === '&&') return evalNode(node.left, data) && evalNode(node.right, data);
      if (node.op === '||') return evalNode(node.left, data) || evalNode(node.right, data);
      const l = evalNode(node.left, data) as never;
      const r = evalNode(node.right, data) as never;
      switch (node.op) {
        case '===': return l === r;
        case '!==': return l !== r;
        case '==': return l == r; // eslint-disable-line eqeqeq
        case '!=': return l != r; // eslint-disable-line eqeqeq
        case '<': return l < r;
        case '<=': return l <= r;
        case '>': return l > r;
        case '>=': return l >= r;
        case '+': return (l as never) + (r as never);
        case '-': return Number(l) - Number(r);
        case '*': return Number(l) * Number(r);
        case '/': return Number(l) / Number(r);
        case '%': return Number(l) % Number(r);
      }
      throw new Error(`unsupported operator: ${node.op}`);
    }
  }
}

/**
 * Evaluate a sandboxed boolean expression against `data`.
 * Throws on parse errors so callers can choose how to handle them; never
 * silently swallows them (which would mask attacker-supplied expressions).
 */
export function evaluateSafeExpression(expression: string, data: unknown): unknown {
  if (typeof expression !== 'string') {
    throw new Error('expression must be a string');
  }
  if (expression.length > 1024) {
    throw new Error('expression too long (max 1024 chars)');
  }
  const ast = new Parser(expression).parse();
  return evalNode(ast, data);
}
