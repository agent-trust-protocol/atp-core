/**
 * Tests for CryptoUtils
 */

import { CryptoUtils } from '../../utils/crypto';

describe('CryptoUtils', () => {
  describe('generateKeyPair', () => {
    it('should generate a valid Ed25519 key pair', async () => {
      const keyPair = await CryptoUtils.generateKeyPair(false);
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('quantumSafe');
      expect(keyPair.quantumSafe).toBe(false);
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      expect(keyPair.publicKey).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(keyPair.privateKey).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should generate a valid hybrid quantum-safe key pair', async () => {
      const keyPair = await CryptoUtils.generateKeyPair(true);
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair).toHaveProperty('quantumSafe');
      expect(keyPair.quantumSafe).toBe(true);
      expect(keyPair).toHaveProperty('ed25519PublicKey');
      expect(keyPair).toHaveProperty('ed25519PrivateKey');
      expect(keyPair).toHaveProperty('mlDsaPublicKey');
      expect(keyPair).toHaveProperty('mlDsaPrivateKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      // Combined public key: 32 bytes Ed25519 + 1952 bytes ML-DSA = 1984 bytes = 3968 hex chars
      expect(keyPair.publicKey.length).toBe(3968);
      // Combined private key: 32 bytes Ed25519 + 4032 bytes ML-DSA = 4064 bytes = 8128 hex chars
      // Note: ML-DSA-65 private key size updated in @noble/post-quantum
      expect(keyPair.privateKey.length).toBe(8128);
      // Ed25519 components should be 64 hex chars each
      expect(keyPair.ed25519PublicKey).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(keyPair.ed25519PrivateKey).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should generate different key pairs on each call', async () => {
      const keyPair1 = await CryptoUtils.generateKeyPair(false);
      const keyPair2 = await CryptoUtils.generateKeyPair(false);
      
      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('signData and verifySignature', () => {
    let keyPair: { publicKey: string; privateKey: string };
    
    beforeAll(async () => {
      keyPair = await CryptoUtils.generateKeyPair();
    });

    it('should sign and verify string data', async () => {
      const data = 'Hello, ATP!';
      const signature = await CryptoUtils.signData(data, keyPair.privateKey);
      
      expect(typeof signature).toBe('string');
      expect(signature).toMatch(/^[0-9a-fA-F]+$/);
      
      const isValid = await CryptoUtils.verifySignature(data, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });

    it('should sign and verify Buffer data', async () => {
      const data = Buffer.from('Hello, ATP!', 'utf8');
      const signature = await CryptoUtils.signData(data, keyPair.privateKey);
      
      const isValid = await CryptoUtils.verifySignature(data, signature, keyPair.publicKey);
      expect(isValid).toBe(true);
    });

    it('should fail verification with wrong signature', async () => {
      const data = 'Hello, ATP!';
      const signature = await CryptoUtils.signData(data, keyPair.privateKey);
      const wrongSignature = signature.replace('0', '1');
      
      const isValid = await CryptoUtils.verifySignature(data, wrongSignature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should fail verification with wrong public key', async () => {
      const otherKeyPair = await CryptoUtils.generateKeyPair();
      const data = 'Hello, ATP!';
      const signature = await CryptoUtils.signData(data, keyPair.privateKey);
      
      const isValid = await CryptoUtils.verifySignature(data, signature, otherKeyPair.publicKey);
      expect(isValid).toBe(false);
    });

    it('should fail verification with modified data', async () => {
      const data = 'Hello, ATP!';
      const signature = await CryptoUtils.signData(data, keyPair.privateKey);
      
      const isValid = await CryptoUtils.verifySignature('Modified data', signature, keyPair.publicKey);
      expect(isValid).toBe(false);
    });
  });

  describe('hash', () => {
    it('should hash string data consistently', () => {
      const data = 'Hello, ATP!';
      const hash1 = CryptoUtils.hash(data);
      const hash2 = CryptoUtils.hash(data);
      
      expect(hash1).toBe(hash2);
      expect(typeof hash1).toBe('string');
      expect(hash1).toMatch(/^[0-9a-fA-F]{64}$/); // SHA-256 produces 64 char hex
    });

    it('should hash Buffer data', () => {
      const data = Buffer.from('Hello, ATP!', 'utf8');
      const hash = CryptoUtils.hash(data);
      
      expect(typeof hash).toBe('string');
      expect(hash).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should produce different hashes for different data', () => {
      const hash1 = CryptoUtils.hash('data1');
      const hash2 = CryptoUtils.hash('data2');
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('randomBytes', () => {
    it('should generate random bytes of specified length', () => {
      const bytes = CryptoUtils.randomBytes(32);
      
      expect(Buffer.isBuffer(bytes)).toBe(true);
      expect(bytes.length).toBe(32);
    });

    it('should generate different random bytes on each call', () => {
      const bytes1 = CryptoUtils.randomBytes(16);
      const bytes2 = CryptoUtils.randomBytes(16);
      
      expect(bytes1.equals(bytes2)).toBe(false);
    });
  });

  describe('randomString', () => {
    it('should generate random hex string of default length', () => {
      const str = CryptoUtils.randomString();
      
      expect(typeof str).toBe('string');
      expect(str).toMatch(/^[0-9a-fA-F]{32}$/); // Default length 32
    });

    it('should generate random hex string of specified length', () => {
      const str = CryptoUtils.randomString(16);
      
      expect(typeof str).toBe('string');
      expect(str).toMatch(/^[0-9a-fA-F]{16}$/);
      expect(str.length).toBe(16);
    });

    it('should generate different strings on each call', () => {
      const str1 = CryptoUtils.randomString(16);
      const str2 = CryptoUtils.randomString(16);
      
      expect(str1).not.toBe(str2);
    });
  });

  describe('deriveKey', () => {
    it('should derive key from password and salt', () => {
      const password = 'mypassword';
      const salt = 'mysalt';
      const key = CryptoUtils.deriveKey(password, salt);
      
      expect(typeof key).toBe('string');
      expect(key).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should produce same key for same password and salt', () => {
      const password = 'mypassword';
      const salt = 'mysalt';
      const key1 = CryptoUtils.deriveKey(password, salt);
      const key2 = CryptoUtils.deriveKey(password, salt);
      
      expect(key1).toBe(key2);
    });

    it('should produce different keys for different salts', () => {
      const password = 'mypassword';
      const key1 = CryptoUtils.deriveKey(password, 'salt1');
      const key2 = CryptoUtils.deriveKey(password, 'salt2');
      
      expect(key1).not.toBe(key2);
    });
  });

  describe('createKeyFingerprint', () => {
    it('should create fingerprint from public key', () => {
      const publicKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fingerprint = CryptoUtils.createKeyFingerprint(publicKey);
      
      expect(typeof fingerprint).toBe('string');
      expect(fingerprint).toMatch(/^[0-9a-fA-F]{16}$/);
      expect(fingerprint.length).toBe(16);
    });

    it('should produce same fingerprint for same public key', () => {
      const publicKey = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const fingerprint1 = CryptoUtils.createKeyFingerprint(publicKey);
      const fingerprint2 = CryptoUtils.createKeyFingerprint(publicKey);
      
      expect(fingerprint1).toBe(fingerprint2);
    });
  });

  describe('isValidHex', () => {
    it('should validate correct hex strings', () => {
      expect(CryptoUtils.isValidHex('1234567890abcdef')).toBe(true);
      expect(CryptoUtils.isValidHex('ABCDEF123456')).toBe(true);
      expect(CryptoUtils.isValidHex('00')).toBe(true);
    });

    it('should reject invalid hex strings', () => {
      expect(CryptoUtils.isValidHex('xyz')).toBe(false);
      expect(CryptoUtils.isValidHex('123')).toBe(false); // Odd length
      expect(CryptoUtils.isValidHex('')).toBe(false);
      expect(CryptoUtils.isValidHex('12 34')).toBe(false); // Contains space
    });
  });

  describe('constantTimeEqual', () => {
    it('should return true for equal strings', () => {
      const str1 = 'hello';
      const str2 = 'hello';
      
      expect(CryptoUtils.constantTimeEqual(str1, str2)).toBe(true);
    });

    it('should return false for different strings', () => {
      const str1 = 'hello';
      const str2 = 'world';
      
      expect(CryptoUtils.constantTimeEqual(str1, str2)).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      const str1 = 'hello';
      const str2 = 'hello world';
      
      expect(CryptoUtils.constantTimeEqual(str1, str2)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(CryptoUtils.constantTimeEqual('', '')).toBe(true);
      expect(CryptoUtils.constantTimeEqual('', 'hello')).toBe(false);
    });
  });

  describe('generateX25519KeyPair', () => {
    it('should generate a valid X25519 key pair', () => {
      const keyPair = CryptoUtils.generateX25519KeyPair();

      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(keyPair.publicKey).toMatch(/^[0-9a-fA-F]{64}$/); // 32 bytes = 64 hex
      expect(keyPair.privateKey).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should generate different key pairs each time', () => {
      const keyPair1 = CryptoUtils.generateX25519KeyPair();
      const keyPair2 = CryptoUtils.generateX25519KeyPair();

      expect(keyPair1.publicKey).not.toBe(keyPair2.publicKey);
      expect(keyPair1.privateKey).not.toBe(keyPair2.privateKey);
    });
  });

  describe('deriveSharedSecret', () => {
    it('should derive same shared secret from both sides', () => {
      const alice = CryptoUtils.generateX25519KeyPair();
      const bob = CryptoUtils.generateX25519KeyPair();

      const aliceShared = CryptoUtils.deriveSharedSecret(alice.privateKey, bob.publicKey);
      const bobShared = CryptoUtils.deriveSharedSecret(bob.privateKey, alice.publicKey);

      expect(aliceShared).toBe(bobShared);
      expect(aliceShared).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should derive different secrets for different keys', () => {
      const alice = CryptoUtils.generateX25519KeyPair();
      const bob = CryptoUtils.generateX25519KeyPair();
      const charlie = CryptoUtils.generateX25519KeyPair();

      const aliceBob = CryptoUtils.deriveSharedSecret(alice.privateKey, bob.publicKey);
      const aliceCharlie = CryptoUtils.deriveSharedSecret(alice.privateKey, charlie.publicKey);

      expect(aliceBob).not.toBe(aliceCharlie);
    });
  });

  describe('deriveEncryptionKey', () => {
    it('should derive a 32-byte encryption key', () => {
      const sharedSecret = CryptoUtils.randomString(64); // 32 bytes hex
      const key = CryptoUtils.deriveEncryptionKey(sharedSecret);

      expect(Buffer.isBuffer(key)).toBe(true);
      expect(key.length).toBe(32); // AES-256 key
    });

    it('should derive same key for same inputs', () => {
      const sharedSecret = CryptoUtils.randomString(64);
      const key1 = CryptoUtils.deriveEncryptionKey(sharedSecret);
      const key2 = CryptoUtils.deriveEncryptionKey(sharedSecret);

      expect(key1.equals(key2)).toBe(true);
    });

    it('should derive different keys for different info', () => {
      const sharedSecret = CryptoUtils.randomString(64);
      const key1 = CryptoUtils.deriveEncryptionKey(sharedSecret, 'info1');
      const key2 = CryptoUtils.deriveEncryptionKey(sharedSecret, 'info2');

      expect(key1.equals(key2)).toBe(false);
    });
  });

  describe('encrypt and decrypt', () => {
    let key: Buffer;

    beforeEach(() => {
      key = CryptoUtils.randomBytes(32);
    });

    it('should encrypt and decrypt string data', () => {
      const plaintext = 'Hello, Agent Trust Protocol!';
      const encrypted = CryptoUtils.encrypt(plaintext, key);
      const decrypted = CryptoUtils.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should encrypt and decrypt Buffer data', () => {
      const plaintext = Buffer.from('Binary data here', 'utf8');
      const encrypted = CryptoUtils.encrypt(plaintext, key);
      const decrypted = CryptoUtils.decrypt(encrypted, key);

      expect(decrypted).toBe('Binary data here');
    });

    it('should produce different ciphertext for same plaintext (due to IV)', () => {
      const plaintext = 'Same message';
      const encrypted1 = CryptoUtils.encrypt(plaintext, key);
      const encrypted2 = CryptoUtils.encrypt(plaintext, key);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to same plaintext
      expect(CryptoUtils.decrypt(encrypted1, key)).toBe(plaintext);
      expect(CryptoUtils.decrypt(encrypted2, key)).toBe(plaintext);
    });

    it('should fail decryption with wrong key', () => {
      const plaintext = 'Secret message';
      const encrypted = CryptoUtils.encrypt(plaintext, key);
      const wrongKey = CryptoUtils.randomBytes(32);

      expect(() => {
        CryptoUtils.decrypt(encrypted, wrongKey);
      }).toThrow();
    });

    it('should fail decryption with tampered ciphertext', () => {
      const plaintext = 'Secret message';
      const encrypted = CryptoUtils.encrypt(plaintext, key);

      // Tamper with the ciphertext (last byte)
      const tampered = encrypted.slice(0, -2) + 'ff';

      expect(() => {
        CryptoUtils.decrypt(tampered, key);
      }).toThrow();
    });

    it('should handle empty string', () => {
      const plaintext = '';
      const encrypted = CryptoUtils.encrypt(plaintext, key);
      const decrypted = CryptoUtils.decrypt(encrypted, key);

      expect(decrypted).toBe('');
    });

    it('should handle large data', () => {
      const plaintext = 'A'.repeat(10000);
      const encrypted = CryptoUtils.encrypt(plaintext, key);
      const decrypted = CryptoUtils.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle unicode characters', () => {
      const plaintext = '你好世界 🌍 مرحبا';
      const encrypted = CryptoUtils.encrypt(plaintext, key);
      const decrypted = CryptoUtils.decrypt(encrypted, key);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('encryptForRecipient and decryptFromSender', () => {
    it('should encrypt and decrypt message between two parties', () => {
      // Alice and Bob each have their own key pairs
      const bob = CryptoUtils.generateX25519KeyPair();

      // Alice encrypts a message for Bob using his public key
      const message = 'Hello Bob, this is Alice!';
      const encrypted = CryptoUtils.encryptForRecipient(message, bob.publicKey);

      // Bob decrypts the message using his private key
      const decrypted = CryptoUtils.decryptFromSender(encrypted, bob.privateKey);

      expect(decrypted).toBe(message);
    });

    it('should include ephemeral public key in encrypted format', () => {
      const bob = CryptoUtils.generateX25519KeyPair();
      const message = 'Test message';

      const encrypted = CryptoUtils.encryptForRecipient(message, bob.publicKey);

      expect(encrypted).toContain(':');
      const [ephemeralKey] = encrypted.split(':');
      expect(ephemeralKey).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should produce different ciphertext each time (forward secrecy)', () => {
      const bob = CryptoUtils.generateX25519KeyPair();
      const message = 'Same message';

      const encrypted1 = CryptoUtils.encryptForRecipient(message, bob.publicKey);
      const encrypted2 = CryptoUtils.encryptForRecipient(message, bob.publicKey);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt correctly
      expect(CryptoUtils.decryptFromSender(encrypted1, bob.privateKey)).toBe(message);
      expect(CryptoUtils.decryptFromSender(encrypted2, bob.privateKey)).toBe(message);
    });

    it('should fail decryption with wrong private key', () => {
      const bob = CryptoUtils.generateX25519KeyPair();
      const charlie = CryptoUtils.generateX25519KeyPair();

      const message = 'For Bob only';
      const encrypted = CryptoUtils.encryptForRecipient(message, bob.publicKey);

      // Charlie cannot decrypt a message intended for Bob
      expect(() => {
        CryptoUtils.decryptFromSender(encrypted, charlie.privateKey);
      }).toThrow();
    });

    it('should throw error for invalid format', () => {
      const bob = CryptoUtils.generateX25519KeyPair();

      expect(() => {
        CryptoUtils.decryptFromSender('invalid-no-colon', bob.privateKey);
      }).toThrow('Invalid encrypted message format');
    });

    it('should handle complex JSON message', () => {
      const bob = CryptoUtils.generateX25519KeyPair();
      const message = JSON.stringify({
        type: 'payment',
        amount: 100,
        currency: 'USD',
        metadata: { orderId: '12345', timestamp: Date.now() }
      });

      const encrypted = CryptoUtils.encryptForRecipient(message, bob.publicKey);
      const decrypted = CryptoUtils.decryptFromSender(encrypted, bob.privateKey);

      expect(JSON.parse(decrypted)).toEqual(JSON.parse(message));
    });

    it('should handle Buffer plaintext', () => {
      const bob = CryptoUtils.generateX25519KeyPair();
      const message = Buffer.from('Binary message', 'utf8');

      const encrypted = CryptoUtils.encryptForRecipient(message, bob.publicKey);
      const decrypted = CryptoUtils.decryptFromSender(encrypted, bob.privateKey);

      expect(decrypted).toBe('Binary message');
    });
  });
});