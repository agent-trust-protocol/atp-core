// Local smoke test: build SDK first, then run with `node packages/sdk/examples/00-quickstart-local.js`
import { DidAtp, createQuickConfig } from '../dist/index.js';

(async () => {
  try {
    const { did, keyPair } = await DidAtp.generate('localhost', ['agents', 'quickstart']);
    console.log('✅ DID generated (local):', did);
    console.log('Ed25519 public key bytes:', keyPair.ed25519.publicKey.length);
    console.log('ML-DSA-65 public key bytes:', keyPair.mlDsa65.publicKey.length);
    if (!DidAtp.isValid(did)) throw new Error('generated DID failed validation');

    const cfg = createQuickConfig('http://localhost');
    console.log('Config services:', cfg.services);

    console.log('🎉 Local SDK smoke test passed (no network calls).');
  } catch (e) {
    console.error('❌ Local SDK smoke test failed:', e?.message || e);
    process.exitCode = 1;
  }
})();
