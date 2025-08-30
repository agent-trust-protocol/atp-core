import * as ed25519 from '@noble/ed25519';
import { initializeCrypto } from '@atp/shared';
// Initialize crypto polyfills
initializeCrypto();
export class CryptoUtils {
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
}
