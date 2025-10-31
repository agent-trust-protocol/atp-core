// Local smoke test: build SDK first, then run with `node packages/sdk/examples/00-quickstart-local.js`
import { DIDUtils } from '../dist/index.js';
import { createQuickConfig } from '../dist/index.js';

(async () => {
  try {
    const { did, document, keyPair } = await DIDUtils.generateDID({ network: 'local', method: 'atp' });
    console.log('✅ DID generated (local):', did);
    console.log('Public key length:', keyPair.publicKey?.length || 'n/a');

    const cfg = createQuickConfig('http://localhost');
    console.log('Config services:', cfg.services);

    console.log('🎉 Local SDK smoke test passed (no network calls).');
  } catch (e) {
    console.error('❌ Local SDK smoke test failed:', e?.message || e);
    process.exitCode = 1;
  }
})();
