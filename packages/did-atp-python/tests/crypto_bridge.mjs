// Ephemeral public-key/signature exchange against the published SDK. Never emits secret keys.
import { readFileSync } from 'node:fs';
const { CryptoUtils } = await import(process.env.ATP_SDK_MODULE || 'atp-sdk');
const input = JSON.parse(readFileSync(0, 'utf8'));
const unhex = s => Uint8Array.from(Buffer.from(s, 'hex'));
const hex = b => Buffer.from(b).toString('hex');
const output = [];
for (const item of input) {
  const message = unhex(item.message);
  const verified = await CryptoUtils.verifyEd25519(message, unhex(item.edSignature), unhex(item.edPublic))
    && CryptoUtils.verifyMlDsa65(message, unhex(item.pqSignature), unhex(item.pqPublic));
  const keys = await CryptoUtils.generateHybridKeyPair();
  const tampered = Uint8Array.from([...message, 33]);
  output.push({ verified, tamperedEd: await CryptoUtils.verifyEd25519(tampered, unhex(item.edSignature), unhex(item.edPublic)),
    tamperedPq: CryptoUtils.verifyMlDsa65(tampered, unhex(item.pqSignature), unhex(item.pqPublic)), edPublic: hex(keys.ed25519.publicKey), pqPublic: hex(keys.mlDsa65.publicKey),
    edSignature: hex(await CryptoUtils.signEd25519(message, keys.ed25519.secretKey)),
    pqSignature: hex(CryptoUtils.signMlDsa65(message, keys.mlDsa65.secretKey)) });
}
process.stdout.write(JSON.stringify(output));
