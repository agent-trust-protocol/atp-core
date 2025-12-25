import { NextRequest, NextResponse } from 'next/server'
import { checkApiAuth } from '@/lib/api-auth'
import { randomBytes, createHash } from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * API Key Types and Interfaces
 */
interface APIKey {
  id: string
  name: string
  keyPrefix: string           // First 8 chars of key (for display)
  keyHash: string             // SHA-256 hash of full key (for verification)
  permissions: string[]       // e.g., ['read:agents', 'write:credentials']
  environment: 'development' | 'staging' | 'production'
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
  status: 'active' | 'revoked' | 'expired'
  rateLimit: {
    requestsPerMinute: number
    requestsPerDay: number
  }
  metadata?: {
    description?: string
    ipWhitelist?: string[]
    createdBy: string
  }
}

interface CreateKeyRequest {
  name: string
  permissions?: string[]
  environment?: 'development' | 'staging' | 'production'
  expiresIn?: number          // Days until expiration (optional)
  rateLimit?: {
    requestsPerMinute?: number
    requestsPerDay?: number
  }
  description?: string
  ipWhitelist?: string[]
}

// In-memory storage (replace with database in production)
const apiKeysStore = new Map<string, APIKey[]>()

/**
 * Default rate limits by environment
 */
const DEFAULT_RATE_LIMITS = {
  development: { requestsPerMinute: 100, requestsPerDay: 10000 },
  staging: { requestsPerMinute: 500, requestsPerDay: 50000 },
  production: { requestsPerMinute: 1000, requestsPerDay: 100000 }
}

/**
 * Available permission scopes
 */
const AVAILABLE_PERMISSIONS = [
  'read:agents',
  'write:agents',
  'read:credentials',
  'write:credentials',
  'read:audit',
  'write:audit',
  'read:permissions',
  'write:permissions',
  'read:metrics',
  'admin:keys'
] as const

/**
 * GET /api/sdk/keys
 * List all API keys for the authenticated user
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

    const userId = authResult.user?.id
    const userKeys = apiKeysStore.get(userId) || []

    // Filter out sensitive data (keyHash)
    const safeKeys = userKeys.map(key => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
      environment: key.environment,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
      expiresAt: key.expiresAt,
      status: key.status,
      rateLimit: key.rateLimit,
      metadata: key.metadata ? {
        description: key.metadata.description,
        ipWhitelist: key.metadata.ipWhitelist
      } : undefined
    }))

    return NextResponse.json({
      success: true,
      data: {
        keys: safeKeys,
        total: safeKeys.length,
        availablePermissions: AVAILABLE_PERMISSIONS
      }
    })
  } catch (error) {
    console.error('API Keys GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch API keys',
        code: 'KEYS_FETCH_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/sdk/keys
 * Create a new API key
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

    const userId = authResult.user?.id
    const body: CreateKeyRequest = await request.json()

    // Validate request
    if (!body.name || typeof body.name !== 'string' || body.name.length < 1) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key name is required',
          code: 'INVALID_NAME'
        },
        { status: 400 }
      )
    }

    // Validate permissions
    const permissions = body.permissions || ['read:agents', 'read:credentials']
    const invalidPermissions = permissions.filter(p => !AVAILABLE_PERMISSIONS.includes(p as any))
    if (invalidPermissions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          code: 'INVALID_PERMISSIONS',
          availablePermissions: AVAILABLE_PERMISSIONS
        },
        { status: 400 }
      )
    }

    // Generate API key
    const rawKey = generateAPIKey()
    const keyPrefix = rawKey.substring(0, 8)
    const keyHash = hashAPIKey(rawKey)

    const environment = body.environment || 'development'
    const defaultRateLimits = DEFAULT_RATE_LIMITS[environment]

    // Calculate expiration
    let expiresAt: string | undefined
    if (body.expiresIn && body.expiresIn > 0) {
      const expirationDate = new Date()
      expirationDate.setDate(expirationDate.getDate() + body.expiresIn)
      expiresAt = expirationDate.toISOString()
    }

    const newKey: APIKey = {
      id: generateKeyId(),
      name: body.name,
      keyPrefix,
      keyHash,
      permissions,
      environment,
      createdAt: new Date().toISOString(),
      expiresAt,
      status: 'active',
      rateLimit: {
        requestsPerMinute: body.rateLimit?.requestsPerMinute || defaultRateLimits.requestsPerMinute,
        requestsPerDay: body.rateLimit?.requestsPerDay || defaultRateLimits.requestsPerDay
      },
      metadata: {
        description: body.description,
        ipWhitelist: body.ipWhitelist,
        createdBy: userId
      }
    }

    // Store the key
    const userKeys = apiKeysStore.get(userId) || []
    userKeys.push(newKey)
    apiKeysStore.set(userId, userKeys)

    // Return the full key ONLY on creation (this is the only time it's visible)
    return NextResponse.json({
      success: true,
      message: 'API key created successfully. Save this key - it will not be shown again.',
      data: {
        id: newKey.id,
        name: newKey.name,
        key: rawKey,                    // Full key - shown ONLY once
        keyPrefix: newKey.keyPrefix,
        permissions: newKey.permissions,
        environment: newKey.environment,
        createdAt: newKey.createdAt,
        expiresAt: newKey.expiresAt,
        rateLimit: newKey.rateLimit
      },
      warning: 'Store this API key securely. It will not be displayed again.'
    }, { status: 201 })
  } catch (error) {
    console.error('API Keys POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create API key',
        code: 'KEY_CREATE_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/sdk/keys
 * Revoke an API key (soft delete)
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

    const userId = authResult.user?.id
    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key ID is required',
          code: 'MISSING_KEY_ID'
        },
        { status: 400 }
      )
    }

    const userKeys = apiKeysStore.get(userId) || []
    const keyIndex = userKeys.findIndex(k => k.id === keyId)

    if (keyIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found',
          code: 'KEY_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // Soft delete - mark as revoked
    userKeys[keyIndex].status = 'revoked'
    apiKeysStore.set(userId, userKeys)

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
      data: {
        id: keyId,
        status: 'revoked',
        revokedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('API Keys DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to revoke API key',
        code: 'KEY_REVOKE_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/sdk/keys
 * Update an API key (name, permissions, rate limits)
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

    const userId = authResult.user?.id
    const body = await request.json()
    const { id, name, permissions, rateLimit, description } = body

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Key ID is required',
          code: 'MISSING_KEY_ID'
        },
        { status: 400 }
      )
    }

    const userKeys = apiKeysStore.get(userId) || []
    const keyIndex = userKeys.findIndex(k => k.id === id)

    if (keyIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: 'API key not found',
          code: 'KEY_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    const key = userKeys[keyIndex]

    if (key.status !== 'active') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot update a revoked or expired key',
          code: 'KEY_INACTIVE'
        },
        { status: 400 }
      )
    }

    // Update allowed fields
    if (name) key.name = name
    if (permissions) {
      const invalidPermissions = permissions.filter((p: string) => !AVAILABLE_PERMISSIONS.includes(p as any))
      if (invalidPermissions.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid permissions: ${invalidPermissions.join(', ')}`,
            code: 'INVALID_PERMISSIONS'
          },
          { status: 400 }
        )
      }
      key.permissions = permissions
    }
    if (rateLimit) {
      if (rateLimit.requestsPerMinute) key.rateLimit.requestsPerMinute = rateLimit.requestsPerMinute
      if (rateLimit.requestsPerDay) key.rateLimit.requestsPerDay = rateLimit.requestsPerDay
    }
    if (description !== undefined) {
      key.metadata = key.metadata || { createdBy: userId }
      key.metadata.description = description
    }

    apiKeysStore.set(userId, userKeys)

    return NextResponse.json({
      success: true,
      message: 'API key updated successfully',
      data: {
        id: key.id,
        name: key.name,
        permissions: key.permissions,
        rateLimit: key.rateLimit,
        metadata: key.metadata
      }
    })
  } catch (error) {
    console.error('API Keys PATCH error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update API key',
        code: 'KEY_UPDATE_ERROR'
      },
      { status: 500 }
    )
  }
}

/**
 * Generate a secure API key
 * Format: atp_<environment>_<random_hex>
 */
function generateAPIKey(): string {
  const randomPart = randomBytes(32).toString('hex')
  return `atp_${randomPart}`
}

/**
 * Generate a unique key ID
 */
function generateKeyId(): string {
  return `key_${randomBytes(12).toString('hex')}`
}

/**
 * Hash an API key for secure storage
 */
function hashAPIKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

/**
 * Verify an API key against stored hash
 * Note: This is an internal helper. For middleware use, import from a separate lib file.
 */
function verifyAPIKey(providedKey: string, storedHash: string): boolean {
  const providedHash = hashAPIKey(providedKey)
  // Constant-time comparison to prevent timing attacks
  if (providedHash.length !== storedHash.length) return false
  let result = 0
  for (let i = 0; i < providedHash.length; i++) {
    result |= providedHash.charCodeAt(i) ^ storedHash.charCodeAt(i)
  }
  return result === 0
}
