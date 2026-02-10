import { NextRequest, NextResponse } from 'next/server'
import { checkApiAuth } from '@/lib/api-auth'
import { query, queryOne, execute, initializeAppTables } from '@/lib/db'
import { randomBytes, createHash } from 'crypto'

export const dynamic = 'force-dynamic'

// Ensure tables exist on first request
let tablesInitialized = false;
async function ensureTables() {
  if (!tablesInitialized) {
    try {
      await initializeAppTables();
      tablesInitialized = true;
    } catch (e) {
      console.error('[SDK Keys] Failed to initialize tables:', e);
    }
  }
}

/**
 * API Key Interfaces
 */
interface CreateKeyRequest {
  name: string
  permissions?: string[]
  environment?: 'development' | 'staging' | 'production'
  expiresIn?: number
  rateLimit?: {
    requestsPerMinute?: number
    requestsPerDay?: number
  }
  description?: string
  ipWhitelist?: string[]
}

const DEFAULT_RATE_LIMITS = {
  development: { requestsPerMinute: 100, requestsPerDay: 10000 },
  staging: { requestsPerMinute: 500, requestsPerDay: 50000 },
  production: { requestsPerMinute: 1000, requestsPerDay: 100000 }
}

const AVAILABLE_PERMISSIONS = [
  'read:agents', 'write:agents', 'read:credentials', 'write:credentials',
  'read:audit', 'write:audit', 'read:permissions', 'write:permissions',
  'read:metrics', 'admin:keys'
] as const

/**
 * GET /api/sdk/keys — List all API keys for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await checkApiAuth(request)
    if (!authResult.isAuthenticated) {
      return authResult.error || NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    await ensureTables();
    const userId = authResult.user?.id;

    const keys = await query(
      `SELECT id, name, key_prefix, permissions, environment, 
              created_at, last_used_at, expires_at, status, 
              rate_limit_rpm, rate_limit_rpd, description, ip_whitelist
       FROM api_keys WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );

    const safeKeys = keys.map(k => ({
      id: k.id,
      name: k.name,
      keyPrefix: k.key_prefix,
      permissions: k.permissions,
      environment: k.environment,
      createdAt: k.created_at,
      lastUsedAt: k.last_used_at,
      expiresAt: k.expires_at,
      status: k.status,
      rateLimit: { requestsPerMinute: k.rate_limit_rpm, requestsPerDay: k.rate_limit_rpd },
      metadata: { description: k.description, ipWhitelist: k.ip_whitelist }
    }));

    return NextResponse.json({
      success: true,
      data: { keys: safeKeys, total: safeKeys.length, availablePermissions: AVAILABLE_PERMISSIONS }
    })
  } catch (error) {
    console.error('API Keys GET error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch API keys', code: 'KEYS_FETCH_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sdk/keys — Create a new API key
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await checkApiAuth(request)
    if (!authResult.isAuthenticated) {
      return authResult.error || NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    await ensureTables();
    const userId = authResult.user?.id;
    const body: CreateKeyRequest = await request.json();

    if (!body.name || typeof body.name !== 'string' || body.name.length < 1) {
      return NextResponse.json(
        { success: false, error: 'Key name is required', code: 'INVALID_NAME' },
        { status: 400 }
      )
    }

    const permissions = body.permissions || ['read:agents', 'read:credentials'];
    const invalidPermissions = permissions.filter(p => !AVAILABLE_PERMISSIONS.includes(p as any));
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        { success: false, error: `Invalid permissions: ${invalidPermissions.join(', ')}`, code: 'INVALID_PERMISSIONS' },
        { status: 400 }
      )
    }

    const rawKey = `atp_${randomBytes(32).toString('hex')}`;
    const keyPrefix = rawKey.substring(0, 12);
    const keyHash = createHash('sha256').update(rawKey).digest('hex');
    const keyId = `key_${randomBytes(12).toString('hex')}`;
    const environment = body.environment || 'development';
    const defaults = DEFAULT_RATE_LIMITS[environment];

    let expiresAt: Date | null = null;
    if (body.expiresIn && body.expiresIn > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + body.expiresIn);
    }

    await execute(
      `INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, permissions, environment,
        expires_at, status, rate_limit_rpm, rate_limit_rpd, description, ip_whitelist)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10, $11, $12)`,
      [
        keyId, userId, body.name, keyPrefix, keyHash, permissions, environment,
        expiresAt,
        body.rateLimit?.requestsPerMinute || defaults.requestsPerMinute,
        body.rateLimit?.requestsPerDay || defaults.requestsPerDay,
        body.description || null,
        body.ipWhitelist || null,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key - it will not be shown again.',
      data: {
        id: keyId, name: body.name, key: rawKey, keyPrefix,
        permissions, environment,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt?.toISOString() || null,
        rateLimit: {
          requestsPerMinute: body.rateLimit?.requestsPerMinute || defaults.requestsPerMinute,
          requestsPerDay: body.rateLimit?.requestsPerDay || defaults.requestsPerDay,
        }
      },
      warning: 'Store this API key securely. It will not be displayed again.'
    }, { status: 201 })
  } catch (error) {
    console.error('API Keys POST error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create API key', code: 'KEY_CREATE_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sdk/keys — Revoke an API key
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await checkApiAuth(request)
    if (!authResult.isAuthenticated) {
      return authResult.error || NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    await ensureTables();
    const userId = authResult.user?.id;
    const { searchParams } = new URL(request.url);
    const keyId = searchParams.get('id');

    if (!keyId) {
      return NextResponse.json(
        { success: false, error: 'Key ID is required', code: 'MISSING_KEY_ID' },
        { status: 400 }
      )
    }

    const affected = await execute(
      `UPDATE api_keys SET status = 'revoked' WHERE id = $1 AND user_id = $2 AND status = 'active'`,
      [keyId, userId]
    );

    if (affected === 0) {
      return NextResponse.json(
        { success: false, error: 'API key not found or already revoked', code: 'KEY_NOT_FOUND' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
      data: { id: keyId, status: 'revoked', revokedAt: new Date().toISOString() }
    })
  } catch (error) {
    console.error('API Keys DELETE error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to revoke API key', code: 'KEY_REVOKE_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sdk/keys — Update an API key
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await checkApiAuth(request)
    if (!authResult.isAuthenticated) {
      return authResult.error || NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    await ensureTables();
    const userId = authResult.user?.id;
    const body = await request.json();
    const { id, name, permissions, rateLimit, description } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Key ID is required', code: 'MISSING_KEY_ID' },
        { status: 400 }
      )
    }

    const key = await queryOne(
      `SELECT * FROM api_keys WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (!key) {
      return NextResponse.json(
        { success: false, error: 'API key not found', code: 'KEY_NOT_FOUND' },
        { status: 404 }
      )
    }

    if (key.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot update a revoked or expired key', code: 'KEY_INACTIVE' },
        { status: 400 }
      )
    }

    if (permissions) {
      const invalid = permissions.filter((p: string) => !AVAILABLE_PERMISSIONS.includes(p as any));
      if (invalid.length > 0) {
        return NextResponse.json(
          { success: false, error: `Invalid permissions: ${invalid.join(', ')}`, code: 'INVALID_PERMISSIONS' },
          { status: 400 }
        )
      }
    }

    await execute(
      `UPDATE api_keys SET
        name = COALESCE($1, name),
        permissions = COALESCE($2, permissions),
        rate_limit_rpm = COALESCE($3, rate_limit_rpm),
        rate_limit_rpd = COALESCE($4, rate_limit_rpd),
        description = COALESCE($5, description)
       WHERE id = $6 AND user_id = $7`,
      [
        name || null,
        permissions || null,
        rateLimit?.requestsPerMinute || null,
        rateLimit?.requestsPerDay || null,
        description ?? null,
        id, userId,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'API key updated successfully',
      data: { id, name: name || key.name, permissions: permissions || key.permissions }
    })
  } catch (error) {
    console.error('API Keys PATCH error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update API key', code: 'KEY_UPDATE_ERROR' },
      { status: 500 }
    )
  }
}
