declare module 'hi-base32' {
  export function encode(input: string | Buffer | Uint8Array, options?: { type?: 'string' | 'buffer'; padding?: boolean }): string;
  export function decode(input: string, options?: { type?: 'string' | 'buffer'; padding?: boolean }): string | Buffer;
}