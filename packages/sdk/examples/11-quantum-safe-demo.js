// Quantum-Safe Crypto Demo
// Run with: node packages/sdk/examples/11-quantum-safe-demo.js
//
// This example demonstrates quantum-safe cryptography in action

import { CryptoUtils } from '../dist/index.js';

async function main() {
  console.log('🔐 ATP SDK - Quantum-Safe Cryptography Demo\n');

  try {
    // 1. Generate hybrid quantum-safe key pair (Ed25519 + ML-DSA)
    console.log('1️⃣ Generating hybrid quantum-safe key pair (Ed25519 + ML-DSA)...');
    const keyPair = await CryptoUtils.generateKeyPair(true); // quantumSafe = true
    
    console.log(`\n✅ Key pair generated:`);
    console.log(`   Quantum-Safe: ${keyPair.quantumSafe ? '✅ Yes' : '❌ No'}`);
    console.log(`   Public Key Length: ${keyPair.publicKey.length} hex chars (${keyPair.publicKey.length / 2} bytes)`);
    console.log(`   Private Key Length: ${keyPair.privateKey.length} hex chars (${keyPair.privateKey.length / 2} bytes)`);
    console.log(`   Algorithm: Hybrid Ed25519 + ML-DSA65`);

    // 2. Sign a message with hybrid signature
    console.log('\n2️⃣ Signing message with hybrid quantum-safe signature...');
    const message = 'Hello, quantum-safe world!';
    const signature = await CryptoUtils.signData(message, keyPair.privateKey, true);
    
    console.log(`\n✅ Message signed:`);
    console.log(`   Message: "${message}"`);
    console.log(`   Signature Length: ${signature.length} hex chars (${signature.length / 2} bytes)`);
    console.log(`   Signature Preview: ${signature.substring(0, 64)}...`);

    // 3. Verify the signature
    console.log('\n3️⃣ Verifying hybrid signature...');
    const isValid = await CryptoUtils.verifySignature(message, signature, keyPair.publicKey, true);
    
    console.log(`\n${isValid ? '✅' : '❌'} Signature verification: ${isValid ? 'VALID' : 'INVALID'}`);

    // 4. Test with tampered message (should fail)
    console.log('\n4️⃣ Testing signature verification with tampered message...');
    const tamperedMessage = 'Hello, tampered world!';
    const isValidTampered = await CryptoUtils.verifySignature(tamperedMessage, signature, keyPair.publicKey, true);
    
    console.log(`\n${isValidTampered ? '❌' : '✅'} Tampered message verification: ${isValidTampered ? 'VALID (ERROR!)' : 'INVALID (correctly rejected)'}`);

    // 5. Compare with Ed25519-only (for reference)
    console.log('\n5️⃣ Generating Ed25519-only key pair for comparison...');
    const ed25519KeyPair = await CryptoUtils.generateKeyPair(false); // quantumSafe = false
    
    console.log(`\n   Ed25519-Only Key Pair:`);
    console.log(`   Public Key Length: ${ed25519KeyPair.publicKey.length} hex chars (${ed25519KeyPair.publicKey.length / 2} bytes)`);
    console.log(`   Private Key Length: ${ed25519KeyPair.privateKey.length} hex chars (${ed25519KeyPair.privateKey.length / 2} bytes)`);
    console.log(`   Quantum-Safe: ${ed25519KeyPair.quantumSafe ? 'Yes' : 'No'}`);

    const ed25519Sig = await CryptoUtils.signData(message, ed25519KeyPair.privateKey, false);
    console.log(`   Signature Length: ${ed25519Sig.length} hex chars (${ed25519Sig.length / 2} bytes)`);

    console.log('\n📊 Size Comparison:');
    console.log(`   Hybrid Public Key: ${(keyPair.publicKey.length / 2).toLocaleString()} bytes (${((keyPair.publicKey.length / 2) / (ed25519KeyPair.publicKey.length / 2)).toFixed(1)}x larger)`);
    console.log(`   Hybrid Signature: ${(signature.length / 2).toLocaleString()} bytes (${((signature.length / 2) / (ed25519Sig.length / 2)).toFixed(1)}x larger)`);
    console.log(`   Overhead: ~${((signature.length / 2) / (ed25519Sig.length / 2) - 1) * 100}%`);

    console.log('\n✅ Quantum-safe cryptography demo completed!');
    console.log('\n💡 Key Takeaways:');
    console.log('   - Hybrid mode provides protection against both classical and quantum attacks');
    console.log('   - Slightly larger keys/signatures are a small price for quantum-safe security');
    console.log('   - All new ATP agents use quantum-safe cryptography by default');

  } catch (error) {
    console.error('\n❌ Demo failed:', error.message);
    console.error('\nHint: Ensure @noble/post-quantum is installed:');
    console.error('   cd packages/sdk && npm install');
    process.exitCode = 1;
  }
}

main();

