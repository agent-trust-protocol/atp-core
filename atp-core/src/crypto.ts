import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes } from 'crypto';

export class Ed25519Crypto {
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    
    return {
      privateKey: Buffer.from(privateKey).toString('hex'),
      publicKey: Buffer.from(publicKey).toString('hex')
    };
  }

  static sign(message: string, privateKey: string): string {
    const messageBytes = Buffer.from(message, 'utf8');
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const signature = ed25519.sign(messageBytes, privateKeyBytes);
    return Buffer.from(signature).toString('hex');
  }

  static verify(message: string, signature: string, publicKey: string): boolean {
    try {
      const messageBytes = Buffer.from(message, 'utf8');
      const signatureBytes = Buffer.from(signature, 'hex');
      const publicKeyBytes = Buffer.from(publicKey, 'hex');
      return ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch (error) {
      return false;
    }
  }

  static generateDID(publicKey: string): string {
    const hash = Buffer.from(randomBytes(16)).toString('hex');
    return `did:atp:${publicKey.substring(0, 8)}${hash}`;
  }
}