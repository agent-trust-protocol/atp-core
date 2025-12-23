import { ed25519 } from '@noble/curves/ed25519';
import { randomBytes } from 'crypto';
import Dilithium from 'dilithium-crystals';

export interface HybridKeyPair {
  ed25519: {
    privateKey: string;
    publicKey: string;
  };
  dilithium: {
    privateKey: string;
    publicKey: string;
  };
}

export interface HybridSignature {
  ed25519: string;
  dilithium: string;
}

export class QuantumSafeCrypto {
  private static dilithium = new Dilithium.Dilithium3();

  static generateHybridKeyPair(): HybridKeyPair {
    // Generate Ed25519 keypair
    const ed25519PrivateKey = ed25519.utils.randomPrivateKey();
    const ed25519PublicKey = ed25519.getPublicKey(ed25519PrivateKey);
    
    // Generate Dilithium3 keypair
    const dilithiumKeyPair = this.dilithium.keypair();
    
    return {
      ed25519: {
        privateKey: Buffer.from(ed25519PrivateKey).toString('hex'),
        publicKey: Buffer.from(ed25519PublicKey).toString('hex')
      },
      dilithium: {
        privateKey: Buffer.from(dilithiumKeyPair.privateKey).toString('hex'),
        publicKey: Buffer.from(dilithiumKeyPair.publicKey).toString('hex')
      }
    };
  }

  static hybridSign(message: string, keyPair: HybridKeyPair): HybridSignature {
    const messageBytes = Buffer.from(message, 'utf8');
    
    // Sign with Ed25519
    const ed25519PrivateKeyBytes = Buffer.from(keyPair.ed25519.privateKey, 'hex');
    const ed25519Signature = ed25519.sign(messageBytes, ed25519PrivateKeyBytes);
    
    // Sign with Dilithium3
    const dilithiumPrivateKeyBytes = Buffer.from(keyPair.dilithium.privateKey, 'hex');
    const dilithiumSignature = this.dilithium.sign(dilithiumPrivateKeyBytes, messageBytes);
    
    return {
      ed25519: Buffer.from(ed25519Signature).toString('hex'),
      dilithium: Buffer.from(dilithiumSignature).toString('hex')
    };
  }

  static hybridVerify(
    message: string, 
    signature: HybridSignature, 
    publicKeys: { ed25519: string; dilithium: string }
  ): boolean {
    try {
      const messageBytes = Buffer.from(message, 'utf8');
      
      // Verify Ed25519 signature
      const ed25519SignatureBytes = Buffer.from(signature.ed25519, 'hex');
      const ed25519PublicKeyBytes = Buffer.from(publicKeys.ed25519, 'hex');
      const ed25519Valid = ed25519.verify(ed25519SignatureBytes, messageBytes, ed25519PublicKeyBytes);
      
      // Verify Dilithium3 signature
      const dilithiumSignatureBytes = Buffer.from(signature.dilithium, 'hex');
      const dilithiumPublicKeyBytes = Buffer.from(publicKeys.dilithium, 'hex');
      const dilithiumValid = this.dilithium.verify(dilithiumPublicKeyBytes, messageBytes, dilithiumSignatureBytes);
      
      // Both signatures must be valid for hybrid verification
      return ed25519Valid && dilithiumValid;
    } catch (error) {
      console.error('Hybrid verification error:', error);
      return false;
    }
  }

  static generateQuantumSafeDID(ed25519PublicKey: string, dilithiumPublicKey: string): string {
    // Create a hash from both public keys for quantum-safe DID
    const combinedKeys = ed25519PublicKey + dilithiumPublicKey;
    const hash = Buffer.from(randomBytes(16)).toString('hex');
    return `did:atp:qs:${ed25519PublicKey.substring(0, 8)}${dilithiumPublicKey.substring(0, 8)}${hash}`;
  }

  static getSupportedAlgorithms(): string[] {
    return ['ed25519', 'dilithium3'];
  }
}