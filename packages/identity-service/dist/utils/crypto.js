import * as ed25519 from '@noble/ed25519';
import { createHash } from 'crypto';
import { initializeCrypto, CryptoAgilityManager, defaultPQCConfig, PQCAlgorithm } from '@atp/shared';
// Initialize crypto polyfills
initializeCrypto();
export class CryptoUtils {
    static cryptoManager = new CryptoAgilityManager(defaultPQCConfig);
    // Enhanced quantum-safe key pair generation
    static async generateQuantumSafeKeyPair(quantumSafe = true) {
        if (quantumSafe) {
            // Generate hybrid Ed25519 + Dilithium keys
            const provider = await this.cryptoManager.getCurrentProvider();
            const keyPair = await provider.generateKeyPair();
            return {
                // For now, extract Ed25519 keys from hybrid (implementation needed)
                publicKey: Buffer.from(keyPair.publicKey.keyData.slice(0, 32)).toString('hex'),
                privateKey: Buffer.from(keyPair.privateKey.keyData.slice(0, 32)).toString('hex'),
                pqcPublicKey: Buffer.from(keyPair.publicKey.keyData).toString('hex'),
                pqcPrivateKey: Buffer.from(keyPair.privateKey.keyData).toString('hex'),
                algorithm: PQCAlgorithm.CRYSTALS_DILITHIUM,
                isQuantumSafe: true,
                hybridMode: true
            };
        }
        else {
            // Generate classical Ed25519 keys only
            const classicalKeys = await this.generateKeyPair();
            return {
                publicKey: classicalKeys.publicKey,
                privateKey: classicalKeys.privateKey,
                algorithm: PQCAlgorithm.ED25519,
                isQuantumSafe: false,
                hybridMode: false
            };
        }
    }
    // Backward compatible method
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
    // Quantum-safe signing with hybrid algorithms
    static async signQuantumSafe(message, keyPair) {
        const messageBytes = Buffer.from(message, 'utf8');
        if (keyPair.isQuantumSafe && keyPair.pqcPrivateKey) {
            // Use quantum-safe hybrid signing
            const provider = await this.cryptoManager.getCurrentProvider();
            const privateKey = {
                algorithm: { name: keyPair.algorithm },
                extractable: true,
                type: 'private',
                usages: ['sign'],
                keyData: Buffer.from(keyPair.pqcPrivateKey, 'hex')
            };
            const signature = await provider.sign(messageBytes, privateKey);
            return {
                signature: Buffer.from(signature).toString('hex'),
                isQuantumSafe: true
            };
        }
        else {
            // Fall back to classical Ed25519
            const signature = await this.sign(message, keyPair.privateKey);
            return {
                signature,
                isQuantumSafe: false
            };
        }
    }
    // Quantum-safe verification
    static async verifyQuantumSafe(message, signatureHex, keyPair) {
        const messageBytes = Buffer.from(message, 'utf8');
        const signatureBytes = Buffer.from(signatureHex, 'hex');
        if (keyPair.isQuantumSafe && keyPair.pqcPublicKey) {
            try {
                const provider = await this.cryptoManager.getCurrentProvider();
                const publicKey = {
                    algorithm: { name: keyPair.algorithm },
                    extractable: true,
                    type: 'public',
                    usages: ['verify'],
                    keyData: Buffer.from(keyPair.pqcPublicKey, 'hex')
                };
                return await provider.verify(messageBytes, signatureBytes, publicKey);
            }
            catch {
                // Fall back to classical verification
                return this.verify(message, signatureHex, keyPair.publicKey);
            }
        }
        else {
            // Use classical Ed25519 verification
            return this.verify(message, signatureHex, keyPair.publicKey);
        }
    }
    static generateDID(publicKeyHex) {
        const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
        const multibase = this.encodeMultibase(publicKeyBytes);
        return `did:atp:${multibase}`;
    }
    // Enhanced DID generation for quantum-safe keys
    static generateQuantumSafeDID(keyPair) {
        // Use the classical public key for backward compatibility
        // The quantum-safe keys are stored in the DID document
        return this.generateDID(keyPair.publicKey);
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
