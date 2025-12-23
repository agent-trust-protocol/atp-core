/**
 * Example 12: Zero-Knowledge Proof Agent-to-Agent Authentication
 *
 * This example demonstrates ATP's ZKP authentication system, which allows agents
 * to prove claims about themselves (trust level, credentials, behavior) without
 * revealing the actual values.
 *
 * Key Features Demonstrated:
 * - Challenge-response authentication protocol
 * - Trust level proofs (prove >= threshold without revealing exact score)
 * - Identity proofs (prove DID ownership)
 * - Behavior-based proofs (ATP's unique differentiator)
 * - Mutual authentication (both agents verify each other)
 */

import { Agent, ZKProofType } from '../dist/index.js';

// Helper to log with timestamps
function log(message, data = null) {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
}

// Divider for readability
function section(title) {
  console.log('\n' + '='.repeat(60));
  console.log(`  ${title}`);
  console.log('='.repeat(60) + '\n');
}

async function main() {
  console.log('\n🔐 ATP Zero-Knowledge Proof Authentication Demo\n');
  console.log('This demo shows how AI agents can authenticate each other');
  console.log('using cryptographic proofs without revealing sensitive data.\n');

  // ==========================================
  // SECTION 1: Create Agents
  // ==========================================
  section('1. Creating Agents');

  log('Creating Alice (Service Provider)...');
  const alice = await Agent.create('Alice-Service');
  log(`Alice DID: ${alice.getDID()}`);

  log('Creating Bob (Client Agent)...');
  const bob = await Agent.create('Bob-Client');
  log(`Bob DID: ${bob.getDID()}`);

  log('Creating Charlie (Another Client)...');
  const charlie = await Agent.create('Charlie-Client');
  log(`Charlie DID: ${charlie.getDID()}`);

  // ==========================================
  // SECTION 2: Basic Authentication Challenge
  // ==========================================
  section('2. Basic Authentication (Trust Level Proof)');

  log('Alice requires agents to prove trust level >= 0.5 to access her service');

  // Alice creates a challenge for Bob
  const challenge = await alice.requestAuth(bob.getDID(), [
    {
      type: ZKProofType.TRUST_LEVEL,
      params: { minTrustLevel: 0.5 }
    }
  ]);

  log('Challenge created:', {
    id: challenge.id,
    verifier: challenge.verifierDid,
    prover: challenge.proverDid,
    requirements: challenge.requirements.length,
    expiresAt: challenge.expiresAt
  });

  // Bob responds with a zero-knowledge proof
  log('Bob generating ZK proof (proves trust >= 0.5 without revealing exact score)...');
  const response = await bob.respondToChallenge(challenge);

  log('Proof generated:', {
    proofCount: response.proofs.length,
    proofTypes: response.proofs.map(p => p.type),
    timestamp: response.timestamp
  });

  // Alice verifies Bob's proof
  log('Alice verifying proof...');
  const result = await alice.verifyAuthResponse(response);

  log('Verification result:', {
    verified: result.verified,
    prover: result.proverDid,
    timestamp: result.timestamp
  });

  console.log('\n✅ Bob authenticated successfully!');
  console.log('   Alice knows: Bob\'s trust level >= 0.5');
  console.log('   Alice does NOT know: Bob\'s exact trust score');

  // ==========================================
  // SECTION 3: Identity Verification
  // ==========================================
  section('3. Identity Verification');

  log('Alice requires proof of DID ownership...');

  const identityChallenge = await alice.requestAuth(charlie.getDID(), [
    { type: ZKProofType.IDENTITY, params: {} }
  ]);

  const identityResponse = await charlie.respondToChallenge(identityChallenge);
  const identityResult = await alice.verifyAuthResponse(identityResponse);

  log('Identity verification:', {
    verified: identityResult.verified,
    prover: identityResult.proverDid
  });

  console.log('\n✅ Charlie proved DID ownership cryptographically!');

  // ==========================================
  // SECTION 4: Behavior-Based Proofs (ATP Differentiator)
  // ==========================================
  section('4. Behavior-Based Proofs (ATP Unique Feature)');

  console.log('Behavior proofs allow agents to prove compliance history');
  console.log('without revealing individual interactions.\n');

  // Simulate Bob's interaction history
  log('Simulating Bob\'s interaction history...');
  for (let i = 0; i < 50; i++) {
    bob.recordInteraction(`task-${i}`, 'success');
  }

  const bobStats = bob.getBehaviorStats();
  log('Bob\'s behavior stats:', bobStats);

  // Simulate Charlie with some violations
  log('Simulating Charlie\'s interaction history (with some violations)...');
  for (let i = 0; i < 45; i++) {
    charlie.recordInteraction(`task-${i}`, 'success');
  }
  for (let i = 45; i < 50; i++) {
    charlie.recordInteraction(`violation-${i}`, 'violation');
  }

  const charlieStats = charlie.getBehaviorStats();
  log('Charlie\'s behavior stats:', charlieStats);

  // === No Violations Proof ===
  console.log('\n--- No Violations Proof ---\n');

  log('Bob proving "no violations" without revealing interaction details...');
  const bobNoViolationsProof = await bob.proveBehavior({
    type: 'no_violations'
  });

  const bobClean = await alice.verifyBehaviorProof(bobNoViolationsProof, {
    type: 'no_violations'
  });

  log(`Bob's no-violations proof verified: ${bobClean}`);
  console.log('✅ Bob has a clean record!');

  // Charlie tries the same but has violations
  log('Charlie attempting no-violations proof...');
  try {
    await charlie.proveBehavior({ type: 'no_violations' });
  } catch (error) {
    log('Charlie cannot prove no_violations: ' + error.message);
    console.log('❌ Charlie has violations in their history');
  }

  // === Success Rate Proof ===
  console.log('\n--- Success Rate Proof ---\n');

  log('Charlie proving success rate >= 85% (without revealing exact rate)...');
  const charlieSuccessProof = await charlie.proveBehavior({
    type: 'success_rate',
    threshold: 85
  });

  const charlieSuccess = await alice.verifyBehaviorProof(charlieSuccessProof, {
    type: 'success_rate',
    threshold: 85
  });

  log(`Charlie's success rate proof verified: ${charlieSuccess}`);
  console.log('✅ Charlie proved 85%+ success rate (actual: 90%)');
  console.log('   Alice knows: Charlie\'s success rate >= 85%');
  console.log('   Alice does NOT know: Exact rate is 90%');

  // === Policy Compliance Proof ===
  console.log('\n--- Policy Compliance Proof ---\n');

  log('Bob proving compliance with rate-limit-policy...');
  const policyProof = await bob.proveBehavior({
    type: 'policy_compliance',
    policyId: 'rate-limit-policy'
  });

  const policyValid = await alice.verifyBehaviorProof(policyProof, {
    type: 'policy_compliance',
    policyId: 'rate-limit-policy'
  });

  log(`Bob's policy compliance proof verified: ${policyValid}`);

  // ==========================================
  // SECTION 5: Mutual Authentication
  // ==========================================
  section('5. Mutual Authentication');

  console.log('Both agents authenticate each other simultaneously.\n');

  log('Alice and Bob performing mutual authentication...');
  log('Alice requires: trust level >= 0.5 from Bob');
  log('Bob requires: trust level >= 0.6 from Alice\n');

  const mutualResult = await alice.mutualAuth(
    bob.getDID(),
    // What Alice requires from Bob
    [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } }],
    // What Bob requires from Alice
    [{ type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.6 } }]
  );

  log('Mutual authentication results:', {
    aliceVerifiedBob: mutualResult.myResult.verified,
    bobVerifiedAlice: mutualResult.theirResult.verified
  });

  if (mutualResult.myResult.verified && mutualResult.theirResult.verified) {
    console.log('\n✅ Mutual authentication successful!');
    console.log('   Both agents verified each other cryptographically');
  }

  // ==========================================
  // SECTION 6: Combined Requirements
  // ==========================================
  section('6. Combined Requirements');

  console.log('Alice requires BOTH trust level AND identity proof.\n');

  const combinedChallenge = await alice.requestAuth(bob.getDID(), [
    { type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } },
    { type: ZKProofType.IDENTITY, params: {} }
  ]);

  log('Challenge with multiple requirements:', {
    requirementCount: combinedChallenge.requirements.length,
    types: combinedChallenge.requirements.map(r => r.type)
  });

  const combinedResponse = await bob.respondToChallenge(combinedChallenge);
  const combinedResult = await alice.verifyAuthResponse(combinedResponse);

  log('Combined verification:', {
    verified: combinedResult.verified,
    proofCount: combinedResponse.proofs.length
  });

  console.log('\n✅ Bob proved both trust level AND identity!');

  // ==========================================
  // SUMMARY
  // ==========================================
  section('Summary');

  console.log('Zero-Knowledge Proof Authentication enables:');
  console.log('');
  console.log('  1. Trust Level Proofs');
  console.log('     - Prove trust >= threshold without revealing exact score');
  console.log('');
  console.log('  2. Identity Proofs');
  console.log('     - Cryptographically prove DID ownership');
  console.log('');
  console.log('  3. Behavior-Based Proofs (ATP Unique!)');
  console.log('     - no_violations: Prove clean interaction history');
  console.log('     - success_rate: Prove performance above threshold');
  console.log('     - policy_compliance: Prove adherence to specific policies');
  console.log('');
  console.log('  4. Mutual Authentication');
  console.log('     - Both agents verify each other simultaneously');
  console.log('');
  console.log('  5. Credential Proofs (with selective disclosure)');
  console.log('     - Prove credential possession without revealing all claims');
  console.log('');
  console.log('All proofs are cryptographically verifiable and reveal');
  console.log('ONLY the minimum information necessary for verification.');
  console.log('');
  console.log('🔐 Privacy-Preserving • 🛡️ Cryptographically Secure • ⚡ Fast');
}

// Run the demo
main().catch(console.error);
