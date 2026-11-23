import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';
const studio = process.env.ATP_STUDIO_SOURCE;
if (!studio) throw new Error('Set ATP_STUDIO_SOURCE to a separate, pinned Studio source checkout.');
export default defineConfig({
  css: { postcss: { plugins: [] } },
  resolve: { alias: [
    { find: /^@atp\/sdk\/runtime$/, replacement: resolve(studio, 'packages/sdk/src/runtime.ts') },
    { find: /^@atp\/sdk$/, replacement: resolve(studio, 'packages/sdk/src/index.ts') },
    { find: /^@atp\/crypto$/, replacement: resolve(studio, 'packages/crypto/src/index.ts') },
    { find: /^@atp\/contracts$/, replacement: resolve(studio, 'packages/contracts/src/index.ts') },
  ] },
  test: { include: process.env.ATP_PROOF_SDK_TESTS === '1' ? [
    resolve(studio, 'packages/sdk/src/agent-action-client.test.ts'),
    resolve(studio, 'packages/sdk/src/pairing.test.ts'),
  ] : ['langchain-studio-boundary.test.ts'] },
});
