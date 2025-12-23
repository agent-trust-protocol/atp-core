export declare class CryptoUtils {
    static sign(message: string, privateKeyHex: string): Promise<string>;
    static verify(message: string, signatureHex: string, publicKeyHex: string): Promise<boolean>;
}
//# sourceMappingURL=crypto.d.ts.map