# IP Protection & Security Best Practices

This document outlines how the ATP SDK is configured to protect intellectual property while providing a production-ready SDK.

## What's Included in the NPM Package

The published `atp-sdk` package on NPM includes:

### ✅ Public Distribution (Safe)
- **dist/** - Compiled JavaScript (minified, not source code)
  - Type definitions (`.d.ts` files)
  - CommonJS and ESM modules
  - Source maps for debugging
  
- **docs/** - API documentation and guides
  - API reference
  - Best practices guides
  - Configuration documentation
  
- **examples/** - Usage examples
  - Educational code showing HOW to use the SDK
  - Does not reveal internal implementation details
  
- **README.md** - Project overview and quick start
- **LICENSE** - Apache 2.0 open source license
- **NOTICE** - Trademark and IP attribution
- **CHANGELOG.md** - Version history

## What's NOT Included (Protected)

The following are explicitly excluded from NPM via `.npmignore`:

### 🔒 Proprietary Protection
- **src/** - TypeScript source code
  - Not published; users get compiled code only
  - Algorithm implementations remain private
  
- **test-integration-*.js** - Integration test files
  - May reveal service endpoints or configurations
  - Could expose API patterns
  
- **scripts/** - Build and deployment scripts
  - May contain infrastructure details
  - Could reveal deployment targets or credentials

### 🔐 Security
- **.env* files** - Environment variables
  - API keys never published
  - Configuration secrets protected
  
- **jest.config.js** - Test configuration
  - May reveal testing patterns or infrastructure

### 📦 Development Files
- **tsconfig.json** - Build configuration
- **.eslintrc** - Linting configuration  
- **.github/** - GitHub workflows (may contain secrets)
- **node_modules/** - Dependencies
- **package-lock.json** - Lock file

## IP Strategy

### 1. **Code Protection**
- Source TypeScript is compiled to JavaScript
- Users receive only compiled, transpiled code
- Compiled code is difficult to reverse-engineer
- Type definitions provide API contract without implementation

### 2. **Transparency with Safety**
- Examples teach *how to use* the SDK
- Examples don't reveal *how it's implemented*
- Documentation provides integration guidance
- Implementation details remain proprietary

### 3. **Standard Implementations**
- Cryptographic algorithms follow NIST standards:
  - EdDSA (RFC 8032) - Well-established standard
  - ML-DSA/Dilithium (FIPS 204) - NIST standardized
  - Zero-Knowledge Proofs - Academic research patterns
  
- These are *not* proprietary inventions
- Implementations follow published standards
- Details are documented in academic literature

### 4. **Third-Party Attribution**
- NOTICE file properly attributes all components
- Dependencies are clearly listed in package.json
- All open-source licenses are respected
- No unlicensed code included

## Audit Trail

To verify what's in the published package:

```bash
# Check what would be published
npm pack --dry-run

# View detailed contents
npm pack --dry-run 2>&1 | grep "npm notice"

# For published packages, inspect on npm registry
npm view atp-sdk dist.tarball
tar -tzf atp-sdk-1.2.0.tgz | grep -E '\.(ts|env|test)$'
```

Expected: Only `.js`, `.d.ts`, `.md`, and documentation files should be present.

## Compliance & Standards

- **License**: Apache 2.0
  - Permits commercial use
  - Requires attribution
  - Open source distribution allowed
  
- **Cryptography**: NIST-approved algorithms
  - ML-DSA for post-quantum safety
  - EdDSA for standard signatures
  - No proprietary crypto
  
- **Patents**: Third-party implementations use
  - MIT-licensed noble/ed25519
  - MIT-licensed noble/hashes
  - MIT-licensed noble/post-quantum
  - Apache 2.0-licensed did-jwt

## Recommendations for Users

When integrating the ATP SDK:

1. ✅ **Keep API keys in environment variables**
   - Never commit `.env` files
   - Use `.env.example` with placeholder values
   
2. ✅ **Review type definitions**
   - `.d.ts` files show public API surface
   - TypeScript ensures type safety
   
3. ✅ **Follow example patterns**
   - Examples demonstrate best practices
   - Use as reference for integration
   
4. ✅ **Monitor dependency updates**
   - Check `npm audit` for vulnerabilities
   - Review CHANGELOG for security updates

## Questions?

For questions about licensing, IP protection, or usage rights:
- See LICENSE file for Apache 2.0 details
- See NOTICE for trademark and attribution information
- Review docs/ for API and integration guidance
- Visit https://agenttrustprotocol.com/developers for support
