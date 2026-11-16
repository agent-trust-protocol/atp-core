// SDK-produced public documents only; private keys never leave this process.
import { readFileSync } from 'node:fs';
const { CryptoUtils, DidAtpDocument } = await import(process.env.ATP_SDK_MODULE || 'atp-sdk');
const input = JSON.parse(readFileSync(0, 'utf8'));
const keys = await CryptoUtils.generateHybridKeyPair();
const result = await DidAtpDocument.create('example.com', ['agents', 'python'], keys, {
  created: '2026-11-14T12:00:00.000Z',
  service: [{ id: '#demo', type: 'Demo', serviceEndpoint: 'https://example.com/🤖/café',
    // Exercise RFC 8785 number rendering and UTF-16 property ordering.
    extension: { tiny: 1e-7, integer: 1e20, fraction: 0.000001, '😀': 1, '\ufffd': 2 } }]
});
const verified = await DidAtpDocument.verify(result.document);
const checked = [];
for (const document of input) checked.push(await DidAtpDocument.verify(document));
process.stdout.write(JSON.stringify({ ...result, verified, checked }));
