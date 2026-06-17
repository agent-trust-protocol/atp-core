declare module 'canonicalize' {
  /** RFC 8785 JSON Canonicalization Scheme. Returns undefined for undefined input. */
  export default function canonicalize(input: unknown): string | undefined;
}
