import * as ed25519 from '@noble/ed25519';
import { createHash } from 'crypto';
import { initializeCrypto } from '@atp/shared';
// Initialize crypto polyfills
initializeCrypto();
export class CryptoUtils {
    static async generateKeyPair() {
        const privateKeyBytes = ed25519.utils.randomPrivateKey();
        const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);
        return {
            privateKey: Buffer.from(privateKeyBytes).toString('hex'),
            publicKey: Buffer.from(publicKeyBytes).toString('hex'),
        };
    }
    static async sign(message, privateKeyHex) {
        const messageBytes = Buffer.from(message, 'utf8');
        const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
        const signature = await ed25519.sign(messageBytes, privateKeyBytes);
        return Buffer.from(signature).toString('hex');
    }
    static async verify(message, signatureHex, publicKeyHex) {
        try {
            const messageBytes = Buffer.from(message, 'utf8');
            const signatureBytes = Buffer.from(signatureHex, 'hex');
            const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
            return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
        }
        catch {
            return false;
        }
    }
    static generateDID(publicKeyHex) {
        const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
        const multibase = this.encodeMultibase(publicKeyBytes);
        return `did:atp:${multibase}`;
    }
    static encodeMultibase(bytes) {
        const ed25519Prefix = Buffer.from([0xed, 0x01]);
        const prefixedKey = Buffer.concat([ed25519Prefix, bytes]);
        return 'z' + this.base58Encode(prefixedKey);
    }
    static base58Encode(buffer) {
        const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        let result = '';
        let num = BigInt('0x' + buffer.toString('hex'));
        while (num > 0) {
            const remainder = num % 58n;
            num = num / 58n;
            result = alphabet[Number(remainder)] + result;
        }
        for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
            result = '1' + result;
        }
        return result;
    }
    static sha256(data) {
        return createHash('sha256').update(data).digest('hex');
    }
}
