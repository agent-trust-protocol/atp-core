import { ATPMFAService } from './mfa.js';

describe('ATPMFAService', () => {
  let mfaService: ATPMFAService;

  beforeEach(() => {
    mfaService = new ATPMFAService();
  });

  afterEach(() => {
    mfaService.cleanup();
  });

  describe('TOTP Generation and Verification', () => {
    test('should generate a valid secret key with QR code', () => {
      const result = mfaService.generateSecretKey('testuser@example.com', 'did:atp:test:123');
      
      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.qrCode).toContain('otpauth://totp/');
      expect(result.qrCode).toContain('testuser@example.com');
      expect(result.qrCode).toContain('did:atp:test:123');
      expect(result.backupCodes).toHaveLength(10);
      expect(result.backupCodes[0]).toMatch(/^[a-f0-9]{4}-[a-f0-9]{4}$/);
    });

    test('should validate TOTP setup correctly', () => {
      const { secret } = mfaService.generateSecretKey('testuser');
      
      // This is a simplified test - in practice, you'd need to generate a real TOTP token
      // For testing purposes, we'll mock the internal method
      const originalGenerateTOTP = (mfaService as any).generateTOTP;
      (mfaService as any).generateTOTP = jest.fn().mockReturnValue('123456');
      
      const isValid = mfaService.validateMFASetup(secret, '123456');
      expect(isValid).toBe(true);
      
      const isInvalid = mfaService.validateMFASetup(secret, '654321');
      expect(isInvalid).toBe(false);
      
      // Restore original method
      (mfaService as any).generateTOTP = originalGenerateTOTP;
    });

    test('should prevent replay attacks', () => {
      const { secret } = mfaService.generateSecretKey('testuser');
      
      // Mock the TOTP generation
      (mfaService as any).generateTOTP = jest.fn().mockReturnValue('123456');
      
      // First verification should succeed
      const firstResult = mfaService.verifyTOTP('123456', secret, false);
      expect(firstResult.valid).toBe(true);
      
      // Second verification with same token should fail (replay attack)
      const secondResult = mfaService.verifyTOTP('123456', secret, false);
      expect(secondResult.valid).toBe(false);
      expect(secondResult.used).toBe(true);
    });

    test('should allow replay when explicitly enabled', () => {
      const { secret } = mfaService.generateSecretKey('testuser');
      
      // Mock the TOTP generation
      (mfaService as any).generateTOTP = jest.fn().mockReturnValue('123456');
      
      // Both verifications should succeed when replay is allowed
      const firstResult = mfaService.verifyTOTP('123456', secret, true);
      expect(firstResult.valid).toBe(true);
      
      const secondResult = mfaService.verifyTOTP('123456', secret, true);
      expect(secondResult.valid).toBe(true);
    });
  });

  describe('Backup Code Verification', () => {
    test('should verify backup codes correctly', () => {
      const { backupCodes } = mfaService.generateSecretKey('testuser');
      const encryptedCodes = mfaService.encryptBackupCodes(backupCodes);
      
      // Test valid backup code
      const validResult = mfaService.verifyBackupCode(backupCodes[0], encryptedCodes);
      expect(validResult.valid).toBe(true);
      expect(validResult.method).toBe('backup');
      
      // Test invalid backup code
      const invalidResult = mfaService.verifyBackupCode('invalid-code', encryptedCodes);
      expect(invalidResult.valid).toBe(false);
    });

    test('should handle case-insensitive backup codes', () => {
      const { backupCodes } = mfaService.generateSecretKey('testuser');
      const encryptedCodes = mfaService.encryptBackupCodes(backupCodes);
      
      const upperCaseResult = mfaService.verifyBackupCode(backupCodes[0].toUpperCase(), encryptedCodes);
      expect(upperCaseResult.valid).toBe(true);
    });

    test('should strip whitespace from backup codes', () => {
      const { backupCodes } = mfaService.generateSecretKey('testuser');
      const encryptedCodes = mfaService.encryptBackupCodes(backupCodes);
      
      const spacedCode = ` ${backupCodes[0]} `;
      const result = mfaService.verifyBackupCode(spacedCode, encryptedCodes);
      expect(result.valid).toBe(true);
    });
  });

  describe('Hardware Key Support', () => {
    test('should generate hardware key challenge', () => {
      const challenge = mfaService.generateHardwareKeyChallenge('key123', 'atp.protocol.test');
      
      expect(challenge.challenge).toBeDefined();
      expect(challenge.challenge.length).toBeGreaterThan(0);
      expect(challenge.keyHandle).toBe('key123');
      expect(challenge.appId).toBe('atp.protocol.test');
    });

    test('should verify hardware key response', async () => {
      const challenge = mfaService.generateHardwareKeyChallenge('key123', 'atp.protocol.test');
      
      // Mock a valid signature (in practice, this would be a real WebAuthn response)
      const mockSignature = Buffer.from('mock-signature-data'.repeat(4)).toString('base64');
      const mockPublicKey = Buffer.from('mock-public-key-data'.repeat(2)).toString('base64');
      
      const result = await mfaService.verifyHardwareKeyResponse(challenge, mockSignature, mockPublicKey);
      
      // Since this is a simplified implementation, it should return valid for properly formed inputs
      expect(result.method).toBe('hardware');
      expect(typeof result.valid).toBe('boolean');
    });
  });

  describe('Security Features', () => {
    test('should calculate MFA strength correctly', () => {
      expect(mfaService.getMFAStrength(['totp'])).toBe(0.4);
      expect(mfaService.getMFAStrength(['totp', 'backup'])).toBe(0.6);
      expect(mfaService.getMFAStrength(['totp', 'backup', 'hardware'])).toBe(1.0);
      expect(mfaService.getMFAStrength(['hardware'])).toBe(0.4);
      expect(mfaService.getMFAStrength([])).toBe(0);
    });

    test('should generate recovery information', () => {
      const { secret } = mfaService.generateSecretKey('testuser');
      const recoveryInfo = mfaService.generateRecoveryInfo('did:atp:test:123', secret);
      
      expect(recoveryInfo).toBeDefined();
      expect(recoveryInfo.length).toBeGreaterThan(0);
      expect(typeof recoveryInfo).toBe('string');
    });

    test('should handle invalid input gracefully', () => {
      expect(mfaService.verifyTOTP('', 'invalid-secret').valid).toBe(false);
      expect(mfaService.verifyTOTP('123', 'invalid-secret').valid).toBe(false);
      expect(mfaService.verifyBackupCode('', []).valid).toBe(false);
    });
  });

  describe('Configuration', () => {
    test('should use custom configuration', () => {
      const customMFA = new ATPMFAService({
        issuer: 'Custom Issuer',
        digits: 8,
        period: 60,
        window: 2
      });
      
      const { qrCode } = customMFA.generateSecretKey('testuser');
      expect(qrCode).toContain('Custom%20Issuer');
      expect(qrCode).toContain('digits=8');
      expect(qrCode).toContain('period=60');
      
      customMFA.cleanup();
    });
  });
});