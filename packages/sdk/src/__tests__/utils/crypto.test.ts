/**
 * Tests for CryptoUtils
 */

import { CryptoUtils } from '../../utils/crypto.js';

describe('CryptoUtils', () => {
  describe('generateKeyPair', () => {
    it('should generate a valid Ed25519 key pair', async () => {
      const keyPair = await CryptoUtils.generateKeyPair();
      
      expect(keyPair).toHaveProperty('publicKey');
      expect(keyPair).toHaveProperty('privateKey');
      expect(typeof keyPair.publicKey).toBe('string');
      expect(typeof keyPair.privateKey).toBe('string');
      expect(keyPair.publicKey).toMatch(/^[0-9a-fA-F]{64}$/);
      expect(keyPair.privateKey).toMatch(/^[0-9a-fA-F]{64}$/);
    });

    it('should generate different key pairs on each call', async () => {
      const keyPair1 = await CryptoUtils.generateKeyPair();
      const keyPair2 = await CryptoUtils.generateKeyPair();
      
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
});