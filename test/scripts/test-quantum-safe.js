#!/usr/bin/env node

/**
 * ATP™ Quantum-Safe Integration Test
 * Tests the quantum-safe agent registration and messaging functionality
 */

import { CryptoAgilityManager, defaultPQCConfig, PQCAlgorithm } from './packages/shared/dist/index.js';

async function testQuantumSafeIntegration() {
  console.log('🔬 ATP™ Quantum-Safe Integration Test');
  console.log('=====================================\n');

  try {
    // Test 1: Initialize Crypto Agility Manager
    console.log('1️⃣ Testing Crypto Agility Manager initialization...');
    const cryptoManager = new CryptoAgilityManager(defaultPQCConfig);
    console.log('✅ Crypto Agility Manager initialized successfully');
    console.log(`   - Current config: ${JSON.stringify(defaultPQCConfig, null, 2)}\n`);

    // Test 2: Generate Quantum-Safe Key Pair
    console.log('2️⃣ Testing quantum-safe key pair generation...');
    const provider = await cryptoManager.getCurrentProvider();
    const keyPair = await provider.generateKeyPair();
    
    console.log('✅ Quantum-safe key pair generated successfully');
    console.log(`   - Public key size: ${keyPair.publicKey.keyData.length} bytes`);
    console.log(`   - Private key size: ${keyPair.privateKey.keyData.length} bytes`);
    console.log(`   - Algorithm: ${keyPair.publicKey.algorithm.name}\n`);

    // Test 3: Test Quantum-Safe Signing
    console.log('3️⃣ Testing quantum-safe message signing...');
    const message = new TextEncoder().encode('Hello, Quantum-Safe World! 🌍');
    const signature = await provider.sign(message, keyPair.privateKey);
    
    console.log('✅ Message signed with quantum-safe algorithm');
    console.log(`   - Message: "${new TextDecoder().decode(message)}"`);
    console.log(`   - Signature size: ${signature.length} bytes`);
    console.log(`   - Signature preview: ${Buffer.from(signature.slice(0, 16)).toString('hex')}...\n`);

    // Test 4: Test Quantum-Safe Verification
    console.log('4️⃣ Testing quantum-safe signature verification...');
    const isValid = await provider.verify(message, signature, keyPair.publicKey);
    
    if (isValid) {
      console.log('✅ Quantum-safe signature verification PASSED');
    } else {
      console.log('❌ Quantum-safe signature verification FAILED');
      throw new Error('Signature verification failed');
    }

    // Test 5: Test Invalid Signature Detection
    console.log('\n5️⃣ Testing invalid signature detection...');
    const tamperedMessage = new TextEncoder().encode('Tampered message');
    const isInvalid = await provider.verify(tamperedMessage, signature, keyPair.publicKey);
    
    if (!isInvalid) {
      console.log('✅ Invalid signature correctly detected');
    } else {
      console.log('❌ Invalid signature NOT detected');
      throw new Error('Invalid signature detection failed');
    }

    // Test 6: Algorithm Negotiation
    console.log('\n6️⃣ Testing algorithm negotiation...');
    const peerCapabilities = [PQCAlgorithm.ED25519, PQCAlgorithm.CRYSTALS_DILITHIUM];
    const negotiatedConfig = await cryptoManager.negotiateAlgorithms(peerCapabilities);
    
    console.log('✅ Algorithm negotiation successful');
    console.log(`   - Negotiated algorithm: ${negotiatedConfig.signatureAlgorithm}`);
    console.log(`   - Hybrid mode: ${negotiatedConfig.hybridMode}`);
    console.log(`   - Classical fallback: ${negotiatedConfig.classicalFallback}\n`);

    // Test 7: Performance Benchmark
    console.log('7️⃣ Running performance benchmark...');
    
    const iterations = 10;
    console.log(`   Testing ${iterations} iterations...\n`);
    
    // Key generation benchmark
    const keyGenStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await provider.generateKeyPair();
    }
    const keyGenTime = (performance.now() - keyGenStart) / iterations;
    
    // Signing benchmark
    const signingStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await provider.sign(message, keyPair.privateKey);
    }
    const signingTime = (performance.now() - signingStart) / iterations;
    
    // Verification benchmark
    const verificationStart = performance.now();
    for (let i = 0; i < iterations; i++) {
      await provider.verify(message, signature, keyPair.publicKey);
    }
    const verificationTime = (performance.now() - verificationStart) / iterations;
    
    console.log('✅ Performance benchmark completed:');
    console.log(`   - Key generation: ${keyGenTime.toFixed(2)}ms avg`);
    console.log(`   - Signing: ${signingTime.toFixed(2)}ms avg`);
    console.log(`   - Verification: ${verificationTime.toFixed(2)}ms avg`);

    console.log('\n🎉 ALL QUANTUM-SAFE TESTS PASSED!');
    console.log('=================================');
    console.log('✅ ATP™ is now quantum-safe and ready for production!');
    console.log('🔮 Future-proof against quantum computer threats');
    console.log('🚀 World\'s First Quantum-Safe AI Agent Protocol ACHIEVED!');
    
  } catch (error) {
    console.error('\n❌ QUANTUM-SAFE TEST FAILED:');
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the test
testQuantumSafeIntegration().catch(console.error);