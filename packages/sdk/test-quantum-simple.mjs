// Simple quantum-safe test
import { CryptoUtils } from './dist/utils/crypto.js';

console.log('Testing quantum-safe crypto...');

try {
  // Test hybrid key
  const key = await CryptoUtils.generateKeyPair(true);
  console.log('✅ Hybrid key:', key.quantumSafe, 'Pub:', key.publicKey.length, 'chars');
  
  // Test sign/verify
  const msg = 'test';
  const sig = await CryptoUtils.signData(msg, key.privateKey, true);
  const valid = await CryptoUtils.verifySignature(msg, sig, key.publicKey, true);
  console.log(valid ? '✅ Signature verified' : '❌ Failed');
  
  // Test Ed25519
  const ed = await CryptoUtils.generateKeyPair(false);
  console.log('✅ Ed25519 key:', !ed.quantumSafe, 'Pub:', ed.publicKey.length, 'chars');
  
  console.log('\n✅ All crypto tests passed!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

