import { PQCAlgorithm } from '@atp/shared';
export interface QuantumSafeKeyPair {
    publicKey: string;
    privateKey: string;
    pqcPublicKey?: string;
    pqcPrivateKey?: string;
    algorithm: PQCAlgorithm;
    isQuantumSafe: boolean;
    hybridMode: boolean;
}
export declare class CryptoUtils {
    private static cryptoManager;
    static generateQuantumSafeKeyPair(quantumSafe?: boolean): Promise<QuantumSafeKeyPair>;
    static generateKeyPair(): Promise<{
        publicKey: string;
        privateKey: string;
    }>;
    static sign(message: string, privateKeyHex: string): Promise<string>;
    static verify(message: string, signatureHex: string, publicKeyHex: string): Promise<boolean>;
    static signQuantumSafe(message: string, keyPair: QuantumSafeKeyPair): Promise<{
        signature: string;
        isQuantumSafe: boolean;
    }>;
    static verifyQuantumSafe(message: string, signatureHex: string, keyPair: QuantumSafeKeyPair): Promise<boolean>;
    static generateDID(publicKeyHex: string): string;
    static generateQuantumSafeDID(keyPair: QuantumSafeKeyPair): string;
    static encodeMultibase(bytes: Buffer): string;
    static base58Encode(buffer: Buffer): string;
    static sha256(data: string): string;
}
//# sourceMappingURL=crypto.d.ts.map