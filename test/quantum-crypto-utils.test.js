/**
 * Unit Tests for Quantum Cryptography Utilities
 */

import { 
  generateHybridKeyPair, 
  createHybridSignature, 
  verifyHybridSignature,
  verifySignatureWithDID,
  generateKeysForDID
} from '../quantum-crypto-utils.js';

// Test suite for quantum cryptography utilities
describe('Quantum Cryptography Utilities', () => {
  
  // Test key generation
  test('generateHybridKeyPair should create valid key pairs', async () => {
    const keyPair = await generateHybridKeyPair();
    
    // Check Ed25519 keys
    expect(keyPair.ed25519).toBeDefined();
    expect(keyPair.ed25519.publicKey).toBeDefined();
    expect(keyPair.ed25519.privateKey).toBeDefined();
    expect(typeof keyPair.ed25519.publicKey).toBe('string');
    expect(typeof keyPair.ed25519.privateKey).toBe('string');
    
    // Check Dilithium keys
    expect(keyPair.dilithium).toBeDefined();
    expect(keyPair.dilithium.publicKey).toBeDefined();
    expect(keyPair.dilithium.privateKey).toBeDefined();
    expect(typeof keyPair.dilithium.publicKey).toBe('string');
    expect(typeof keyPair.dilithium.privateKey).toBe('string');
  });
  
  // Test signature creation
  test('createHybridSignature should create valid signatures', async () => {
    const keyPair = await generateHybridKeyPair();
    const message = 'Test message for signing';
    
    const signature = createHybridSignature(message, keyPair);
    
    // Check signature format
    expect(signature).toBeDefined();
    expect(signature.ed25519).toBeDefined();
    expect(signature.dilithium).toBeDefined();
    expect(typeof signature.ed25519).toBe('string');
    expect(typeof signature.dilithium).toBe('string');
    expect(signature.ed25519.length).toBeGreaterThan(0);
    expect(signature.dilithium.length).toBeGreaterThan(0);
  });
  
  // Test signature verification
  test('verifyHybridSignature should verify valid signatures', async () => {
    const keyPair = await generateHybridKeyPair();
    const message = 'Test message for verification';
    
    const signature = createHybridSignature(message, keyPair);
    
    // Verify with correct message
    const isValid = verifyHybridSignature(signature, message, {
      ed25519: { publicKey: keyPair.ed25519.publicKey },
      dilithium: { publicKey: keyPair.dilithium.publicKey }
    });
    
    expect(isValid).toBe(true);
    
    // Verify with incorrect message
    const isInvalid = verifyHybridSignature(signature, 'Wrong message', {
      ed25519: { publicKey: keyPair.ed25519.publicKey },
      dilithium: { publicKey: keyPair.dilithium.publicKey }
    });
    
    expect(isInvalid).toBe(false);
  });
  
  // Test DID-based key generation
  test('generateKeysForDID should create deterministic keys', async () => {
    const did = 'did:atp:test-did-1';
    
    // Generate keys twice for the same DID
    const keyPair1 = await generateKeysForDID(did);
    const keyPair2 = await generateKeysForDID(did);
    
    // Ed25519 keys should be deterministic
    expect(keyPair1.ed25519.publicKey).toBe(keyPair2.ed25519.publicKey);
    
    // Generate keys for a different DID
    const differentDID = 'did:atp:test-did-2';
    const differentKeyPair = await generateKeysForDID(differentDID);
    
    // Keys should be different for different DIDs
    expect(keyPair1.ed25519.publicKey).not.toBe(differentKeyPair.ed25519.publicKey);
  });
  
  // Test DID-based signature verification
  test('verifySignatureWithDID should verify signatures with DIDs', async () => {
    const did = 'did:atp:test-did-verification';
    const keyPair = await generateKeysForDID(did);
    const message = 'Test message for DID verification';
    
    const signature = createHybridSignature(message, keyPair);
    
    // Verify with correct DID and message
    const isValid = await verifySignatureWithDID(signature, message, did);
    
    expect(isValid).toBe(true);
    
    // Verify with incorrect message
    const isInvalidMessage = await verifySignatureWithDID(signature, 'Wrong message', did);
    
    expect(isInvalidMessage).toBe(false);
    
    // Verify with incorrect DID
    const isInvalidDID = await verifySignatureWithDID(signature, message, 'did:atp:wrong-did');
    
    expect(isInvalidDID).toBe(false);
  });
  
  // Test error handling
  test('createHybridSignature should throw on invalid input', async () => {
    expect(() => createHybridSignature(null, {})).toThrow();
    expect(() => createHybridSignature('message', null)).toThrow();
  });
  
  test('verifyHybridSignature should throw on invalid input', async () => {
    expect(() => verifyHybridSignature(null, 'message', {})).toThrow();
    expect(() => verifyHybridSignature({}, null, {})).toThrow();
    expect(() => verifyHybridSignature({}, 'message', null)).toThrow();
  });
});