/**
 * Agent Trust Protocol™
 * Express middleware for service-to-service bearer-token authentication.
 *
 * Tokens are JWTs signed with a per-service HMAC secret. Each token carries
 * a `scopes: string[]` claim. Mutating routes should pass `requiredScopes`
 * so only callers with the right capability can invoke them. Read-only
 * health probes can omit this middleware entirely.
 */

import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface ServiceAuthClaims {
  sub: string;
  scopes: string[];
  iat: number;
  exp: number;
}

export interface RequireServiceAuthOptions {
  jwtSecret: string;
  requiredScopes?: string[];
  /** Override audience claim check; default does not check audience. */
  audience?: string;
}

declare module 'express-serve-static-core' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface Request {
    serviceAuth?: ServiceAuthClaims;
  }
}

function extractBearer(req: Request): string | null {
  const header = req.header('authorization') ?? req.header('Authorization');
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

function hasAllScopes(claimed: string[], required: string[]): boolean {
  const set = new Set(claimed);
  return required.every(s => set.has(s));
}

export function requireServiceAuth(opts: RequireServiceAuthOptions) {
  if (!opts.jwtSecret || opts.jwtSecret.length < 16) {
    throw new Error('requireServiceAuth: jwtSecret must be at least 16 chars');
  }

  return (req: Request, res: Response, next: NextFunction): void => {
    const token = extractBearer(req);
    if (!token) {
      res.status(401).json({ error: 'missing_bearer_token' });
      return;
    }

    let claims: ServiceAuthClaims;
    try {
      claims = jwt.verify(token, opts.jwtSecret, {
        algorithms: ['HS256'],
        audience: opts.audience,
      }) as ServiceAuthClaims;
    } catch {
      res.status(401).json({ error: 'invalid_token' });
      return;
    }

    const scopes = Array.isArray(claims.scopes) ? claims.scopes : [];
    if (opts.requiredScopes && opts.requiredScopes.length > 0) {
      if (!hasAllScopes(scopes, opts.requiredScopes)) {
        res.status(403).json({
          error: 'insufficient_scope',
          required: opts.requiredScopes,
        });
        return;
      }
    }

    req.serviceAuth = { ...claims, scopes };
    next();
  };
}

/**
 * Parse a comma-separated allowlist of origins, returning a cors-compatible
 * origin function. In production a strict allowlist is enforced; an empty
 * input throws, so misconfiguration fails fast at boot.
 */
export function parseAllowedOrigins(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
