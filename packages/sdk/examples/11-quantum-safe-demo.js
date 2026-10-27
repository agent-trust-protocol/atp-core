// Hybrid Ed25519 + ML-DSA-65 Signature Demo
// Run with: node packages/sdk/examples/11-quantum-safe-demo.js
//
// ATP identities carry two independent key pairs. A hybrid signature is one
// signature from each; a verifier should require both to validate.

import { CryptoUtils } from '../dist/index.js';

async function main() {
  console.log('🔐 ATP SDK - Hybrid Signature Demo (Ed25519 + ML-DSA-65)\n');

  try {
    console.log('1️⃣ Generating hybrid key pair...');
    const { ed25519, mlDsa65 } = await CryptoUtils.generateHybridKeyPair();
    console.log(`   Ed25519 public key:   ${ed25519.publicKey.length} bytes`);
    console.log(`   ML-DSA-65 public key: ${mlDsa65.publicKey.length} bytes`);
    console.log(`   e1 fingerprint:  ${CryptoUtils.e1Fingerprint(ed25519.publicKey)}`);
    console.log(`   pq1 fingerprint: ${CryptoUtils.pq1Fingerprint(mlDsa65.publicKey)}`);

    console.log('\n2️⃣ Signing a message with both algorithms...');
    const message = 'Hello, quantum-safe world!';
    const edSig = await CryptoUtils.signEd25519(message, ed25519.secretKey);
    const pqSig = CryptoUtils.signMlDsa65(message, mlDsa65.secretKey);
    console.log(`   Ed25519 signature:   ${edSig.length} bytes`);
    console.log(`   ML-DSA-65 signature: ${pqSig.length} bytes`);

    const verifyHybrid = async (msg) =>
      (await CryptoUtils.verifyEd25519(msg, edSig, ed25519.publicKey)) &&
      CryptoUtils.verifyMlDsa65(msg, pqSig, mlDsa65.publicKey);

    console.log('\n3️⃣ Verifying both signatures...');
    const isValid = await verifyHybrid(message);
    console.log(`   ${isValid ? '✅ VALID' : '❌ INVALID'}`);

    console.log('\n4️⃣ Verifying against a tampered message...');
    const isValidTampered = await verifyHybrid('Hello, tampered world!');
    console.log(`   ${isValidTampered ? '❌ VALID (ERROR!)' : '✅ INVALID (correctly rejected)'}`);

    if (!isValid || isValidTampered) throw new Error('hybrid verification behaved unexpectedly');

    console.log('\n📊 Size comparison:');
    console.log(`   Public keys: ${ed25519.publicKey.length + mlDsa65.publicKey.length} bytes hybrid vs ${ed25519.publicKey.length} bytes Ed25519-only`);
    console.log(`   Signatures:  ${edSig.length + pqSig.length} bytes hybrid vs ${edSig.length} bytes Ed25519-only`);

    console.log('\n✅ Hybrid signature demo completed.');
    console.log('   Security still depends on key storage and on verifiers checking both signatures.');
  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    process.exitCode = 1;
  }
}

main();
