/// <reference types="node" />
/// <reference types="node" />
export declare class CryptoUtils {
    static generateKeyPair(): Promise<{
        publicKey: string;
        privateKey: string;
    }>;
    static sign(message: string, privateKeyHex: string): Promise<string>;
    static verify(message: string, signatureHex: string, publicKeyHex: string): Promise<boolean>;
    static generateDID(publicKeyHex: string): string;
    static encodeMultibase(bytes: Buffer): string;
    static base58Encode(buffer: Buffer): string;
    static sha256(data: string): string;
}
//# sourceMappingURL=crypto.d.ts.map