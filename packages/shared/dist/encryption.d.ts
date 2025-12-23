export interface EncryptedData {
    data: string;
    iv: string;
    salt: string;
    tag: string;
    algorithm: string;
    keyDerivation: string;
}
export interface E2EEncryptedMessage {
    encryptedData: EncryptedData;
    encryptedKey: string;
    senderPublicKey: string;
    signature: string;
    timestamp: string;
    messageId: string;
}
export interface KeyExchangeData {
    ephemeralPublicKey: string;
    signature: string;
    timestamp: string;
}
/**
 * ATP™ Enhanced Encryption Service
 * Provides military-grade end-to-end encryption with:
 * - AES-256-GCM for symmetric encryption
 * - Ed25519 for asymmetric operations
 * - ECDH key exchange for forward secrecy
 * - HMAC for message authentication
 */
export declare class ATPEncryptionService {
    private static readonly ALGORITHM;
    private static readonly KEY_LENGTH;
    private static readonly IV_LENGTH;
    private static readonly SALT_LENGTH;
    private static readonly TAG_LENGTH;
    /**
     * Generate a cryptographically secure random key
     */
    static generateKey(): Buffer;
    /**
     * Encrypt data with a specific key (for key manager integration)
     */
    static encryptWithKey(data: string | Buffer, key: Buffer): string;
    /**
     * Decrypt data with a specific key (for key manager integration)
     */
    static decryptWithKey(encryptedData: string, key: Buffer): string;
    /**
     * Generate initialization vector
     */
    static generateIV(): Buffer;
    /**
     * Generate salt for key derivation
     */
    static generateSalt(): Buffer;
    /**
     * Derive key from password using scrypt
     */
    static deriveKey(password: string, salt: Buffer): Promise<Buffer>;
    /**
     * Encrypt data using AES-256-GCM
     */
    static encrypt(data: string, key: Buffer): EncryptedData;
    /**
     * Decrypt data using AES-256-GCM
     */
    static decrypt(encryptedData: EncryptedData, key: Buffer): string;
    /**
     * Encrypt data with password-based encryption
     */
    static encryptWithPassword(data: string, password: string): Promise<EncryptedData>;
    /**
     * Decrypt data with password-based encryption
     */
    static decryptWithPassword(encryptedData: EncryptedData, password: string): Promise<string>;
    /**
     * Generate Ed25519 key pair for asymmetric operations
     */
    static generateKeyPair(): Promise<{
        publicKey: string;
        privateKey: string;
    }>;
    /**
     * Perform ECDH key exchange using Ed25519 keys
     */
    static performKeyExchange(privateKeyHex: string, publicKeyHex: string): Promise<Buffer>;
    /**
     * Sign data using Ed25519
     */
    static sign(data: string, privateKeyHex: string): Promise<string>;
    /**
     * Verify signature using Ed25519
     */
    static verify(data: string, signatureHex: string, publicKeyHex: string): Promise<boolean>;
    /**
     * End-to-end encrypt message between two parties
     */
    static encryptE2E(message: string, senderPrivateKey: string, recipientPublicKey: string, messageId?: string): Promise<E2EEncryptedMessage>;
    /**
     * End-to-end decrypt message
     */
    static decryptE2E(encryptedMessage: E2EEncryptedMessage, recipientPrivateKey: string, senderPublicKey?: string): Promise<string>;
    /**
     * Generate secure message ID
     */
    static generateMessageId(): string;
    /**
     * Constant-time comparison for security-sensitive operations
     */
    static constantTimeEqual(a: Buffer, b: Buffer): boolean;
    /**
     * Generate secure session key for real-time communication
     */
    static generateSessionKey(): {
        key: string;
        keyId: string;
        expiresAt: string;
    };
    /**
     * Encrypt data for storage (at rest)
     */
    static encryptForStorage(data: string, masterKey: string): Promise<EncryptedData>;
    /**
     * Decrypt data from storage
     */
    static decryptFromStorage(encryptedData: EncryptedData, masterKey: string): Promise<string>;
    /**
     * Hash data using SHA-256 for integrity verification
     */
    static hash(data: string): string;
    /**
     * Generate HMAC for message authentication
     */
    static generateHMAC(data: string, key: Buffer): string;
    /**
     * Verify HMAC
     */
    static verifyHMAC(data: string, hmac: string, key: Buffer): boolean;
}
//# sourceMappingURL=encryption.d.ts.map