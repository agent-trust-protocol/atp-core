/**
 * Error raised when a request carries invalid client input — bad encoding, an
 * out-of-range value, or a missing/empty field.
 *
 * Controllers map a `ValidationError` to HTTP 400 (Bad Request). Any other
 * thrown error is treated as a server-side fault and mapped to HTTP 500, so a
 * client (and monitoring) can distinguish a malformed request from an
 * infrastructure failure such as a storage outage.
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
    // Restore the prototype chain so `instanceof ValidationError` works when
    // compiled to ES5/CommonJS targets.
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}
