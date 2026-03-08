# Crypto Troubleshooting Guide

## Issue: "@noble/ed25519 Cannot read properties of undefined (reading 'getRandomValues')"

### Root Cause
The `@noble/ed25519` library expects `crypto.getRandomValues` to be available globally, but in Node.js ES modules environments (especially Node.js 18 and older), the Web Crypto API is not automatically polyfilled in the global scope.

### Solution
The issue has been resolved by implementing proper crypto polyfills in the shared utilities:

1. **Global Crypto Polyfill**: Added `globalThis.crypto = webcrypto` polyfill
2. **SHA-512 Setup**: Configured `ed25519.etc.sha512Sync` for synchronous hashing
3. **Centralized Configuration**: Created `@atp/shared/crypto-setup` module for consistent setup

### Files Modified
- `/packages/shared/src/crypto-setup.ts` - New centralized crypto setup
- `/packages/shared/package.json` - Added `@noble/hashes` dependency
- `/packages/identity-service/src/utils/crypto.ts` - Updated to use shared setup
- `/packages/identity-service/package.json` - Added `@noble/hashes` dependency
- `/packages/vc-service/src/utils/crypto.ts` - Updated to use shared setup
- `/packages/vc-service/package.json` - Added `@noble/hashes` dependency
- `/packages/rpc-gateway/src/services/auth.ts` - Updated crypto initialization
- `/packages/rpc-gateway/package.json` - Added crypto dependencies
- `/examples/simple-agent/src/agent.ts` - Updated to use shared setup
- `/examples/simple-agent/package.json` - Added `@noble/hashes` dependency

### Dependencies Added
- `@noble/hashes@^1.3.0` - For SHA-512 synchronous hashing

### Testing
All crypto functionality has been tested and verified:
- ✅ Key pair generation
- ✅ Message signing
- ✅ Signature verification
- ✅ DID registration flow
- ✅ Complete identity service functionality

### Usage
The crypto setup is automatically initialized when importing from `@atp/shared`:

```typescript
import { initializeCrypto } from '@atp/shared';

// Initialize crypto polyfills (called automatically on import)
initializeCrypto();
```

### Verification
To verify the fix is working, run:

```bash
npm run build
# All packages should build successfully

# Test crypto functionality
cd packages/identity-service
node -e "import('./dist/utils/crypto.js').then(m => m.CryptoUtils.generateKeyPair()).then(console.log)"
```

### Node.js Compatibility
This fix ensures compatibility with:
- Node.js 18.x and newer (with Web Crypto API)
- ES Modules environments
- TypeScript compilation targets ES2022+

The solution follows the official @noble/ed25519 documentation recommendations for Node.js environments.