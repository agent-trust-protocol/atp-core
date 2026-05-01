/**
 * ATP Agent Registration
 *
 * Registers OpenClaw agents with ATP and assigns quantum-safe identities
 */

import type { ATPClient, TrustLevel } from 'atp-sdk';
import type { AgentMetadata, AgentRegistrationOptions } from './types.js';

/**
 * Register a OpenClaw agent with ATP
 *
 * @param client - ATP client instance
 * @param options - Registration options
 * @returns Agent metadata with DID and keys
 */
export async function registerAgentWithAtp(
  client: ATPClient,
  options: AgentRegistrationOptions
): Promise<AgentMetadata> {
  const {
    name,
    role,
    trustLevel = 'verified',
    capabilities = [],
    policyProfile = 'default',
    metadata = {},
    quantumSafe = true,
    requireMFA = false
  } = options;

  // Normalize trust level
  const normalizedTrustLevel = normalizeTrustLevel(trustLevel);

  // Register agent with ATP Identity Service
  const registration = await client.identity.registerAgent({
    name,
    role,
    trustLevel: normalizedTrustLevel,
    capabilities,
    policyProfile,
    metadata: {
      ...metadata,
      source: 'openclaw',
      quantumSafe,
      requireMFA
    },
    cryptoOptions: {
      quantumSafe,
      keyType: quantumSafe ? 'hybrid-ed25519-dilithium' : 'ed25519'
    }
  });

  // Generate policy profile if not exists
  if (policyProfile !== 'default') {
    await ensurePolicyProfile(client, policyProfile, role);
  }

  // Assign initial permissions based on role
  await assignRolePermissions(client, registration.did, role, normalizedTrustLevel);

  // Create agent metadata
  const agentMeta: AgentMetadata = {
    did: registration.did,
    publicKey: registration.publicKey,
    privateKey: registration.privateKey,
    trustScore: getTrustScoreFromLevel(normalizedTrustLevel),
    trustLevel: normalizedTrustLevel,
    policyProfileId: policyProfile,
    role,
    capabilities,
    registeredAt: new Date(),
    lastTrustUpdate: new Date(),
    didDocument: registration.didDocument
  };

  // Log registration audit event
  await client.audit.log({
    eventType: 'agent-registered',
    agentDid: registration.did,
    severity: 'info',
    metadata: {
      name,
      role,
      trustLevel: normalizedTrustLevel,
      policyProfile,
      quantumSafe
    }
  });

  console.log(`✅ Registered OpenClaw agent: ${name} (${registration.did})`);

  return agentMeta;
}

/**
 * Normalize trust level from string to TrustLevel enum
 */
function normalizeTrustLevel(level: string | TrustLevel): TrustLevel {
  const levelMap: Record<string, TrustLevel> = {
    'basic': 'BASIC' as TrustLevel,
    'verified': 'VERIFIED' as TrustLevel,
    'elevated': 'ELEVATED' as TrustLevel,
    'privileged': 'PRIVILEGED' as TrustLevel
  };

  if (typeof level === 'string') {
    const lowerLevel = level.toLowerCase();
    return levelMap[lowerLevel] || ('VERIFIED' as TrustLevel);
  }

  return level;
}

/**
 * Get numeric trust score from trust level
 */
function getTrustScoreFromLevel(level: TrustLevel): number {
  const scoreMap: Record<string, number> = {
    'BASIC': 0.5,
    'VERIFIED': 0.75,
    'ELEVATED': 0.9,
    'PRIVILEGED': 0.95
  };

  return scoreMap[level] || 0.75;
}

/**
 * Ensure policy profile exists
 */
async function ensurePolicyProfile(
  client: ATPClient,
  profileId: string,
  role: string
): Promise<void> {
  try {
    await client.permissions.getPolicy(profileId);
  } catch (error) {
    // Profile doesn't exist, create it
    await client.permissions.createPolicy({
      id: profileId,
      name: `${role} Policy Profile`,
      description: `Auto-generated policy for ${role} agents`,
      rules: getDefaultRulesForRole(role)
    });
  }
}

/**
 * Get default permission rules for a role
 */
function getDefaultRulesForRole(role: string): any[] {
  const commonRules = [
    {
      action: 'read',
      resource: 'public-*',
      effect: 'allow'
    }
  ];

  const roleSpecificRules: Record<string, any[]> = {
    'content_writer': [
      { action: 'write', resource: 'content-*', effect: 'allow' },
      { action: 'read', resource: 'research-*', effect: 'allow' }
    ],
    'trader': [
      { action: 'execute', resource: 'trade-*', effect: 'allow', conditions: ['trust >= 0.9'] },
      { action: 'read', resource: 'market-*', effect: 'allow' }
    ],
    'researcher': [
      { action: 'read', resource: '*', effect: 'allow' },
      { action: 'search', resource: 'external-*', effect: 'allow' }
    ]
  };

  return [...commonRules, ...(roleSpecificRules[role] || [])];
}

/**
 * Assign role-based permissions to agent
 */
async function assignRolePermissions(
  client: ATPClient,
  agentDid: string,
  role: string,
  trustLevel: TrustLevel
): Promise<void> {
  const permissions = getDefaultRulesForRole(role);

  for (const permission of permissions) {
    await client.permissions.grant({
      grantee: agentDid,
      permission: {
        action: permission.action,
        resource: permission.resource,
        effect: permission.effect,
        conditions: permission.conditions || []
      },
      expiresAt: null, // Permanent unless revoked
      metadata: {
        source: 'openclaw-auto-grant',
        role,
        trustLevel
      }
    });
  }
}

/**
 * Update agent trust score
 */
export async function updateAgentTrust(
  client: ATPClient,
  agentMeta: AgentMetadata,
  delta: number,
  reason: string,
  evidence?: Record<string, any>
): Promise<AgentMetadata> {
  const newScore = Math.max(0, Math.min(1, agentMeta.trustScore + delta));

  await client.identity.updateTrustLevel({
    did: agentMeta.did,
    trustScore: newScore,
    reason,
    evidence
  });

  // Log trust update
  await client.audit.log({
    eventType: 'trust-score-updated',
    agentDid: agentMeta.did,
    severity: delta < 0 ? 'warning' : 'info',
    metadata: {
      previousScore: agentMeta.trustScore,
      newScore,
      delta,
      reason,
      evidence
    }
  });

  return {
    ...agentMeta,
    trustScore: newScore,
    trustLevel: getTrustLevelFromScore(newScore),
    lastTrustUpdate: new Date()
  };
}

/**
 * Get trust level from numeric score
 */
function getTrustLevelFromScore(score: number): TrustLevel {
  if (score >= 0.95) return 'PRIVILEGED' as TrustLevel;
  if (score >= 0.9) return 'ELEVATED' as TrustLevel;
  if (score >= 0.7) return 'VERIFIED' as TrustLevel;
  return 'BASIC' as TrustLevel;
}
