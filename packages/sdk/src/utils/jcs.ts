/**
 * JSON Canonicalization Scheme (JCS), RFC 8785.
 *
 * Recursively serializes a JSON value with object members sorted by their
 * UTF-16 code units and no insignificant whitespace. String and number
 * serialization delegate to JSON.stringify, whose ECMAScript algorithms are
 * exactly the ones RFC 8785 normatively requires.
 */
export function jcsCanonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const out = JSON.stringify(value);
    if (out === undefined) {
      throw new Error(`Value of type ${typeof value} is not JCS-serializable`);
    }
    return out;
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => jcsCanonicalize(item === undefined ? null : item)).join(',')}]`;
  }
  const entries = Object.keys(value as Record<string, unknown>)
    .sort()
    .filter((key) => (value as Record<string, unknown>)[key] !== undefined)
    .map((key) => `${JSON.stringify(key)}:${jcsCanonicalize((value as Record<string, unknown>)[key])}`);
  return `{${entries.join(',')}}`;
}
