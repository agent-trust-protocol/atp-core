# Migration Guide

This guide documents notable changes and safe upgrade steps.

## v1.1.x → v1.1.x (Docs/Defaults Alignment)

- Package import name unified to `atp-sdk`.
  - Before: `@atp/sdk`
  - After: `atp-sdk`
  - Action: Update imports and mocks.

- Default Audit service port changed to `3005`.
  - Before: `ATP_AUDIT_URL` defaulted to `${baseUrl}:3006`
  - After: default is `${baseUrl}:3005`
  - Action: If you rely on envs, no change. If hardcoded, update URLs.

### Code changes that may affect you

- SDK metadata `SDK_INFO.name` now reports `atp-sdk`.
- No breaking API changes to exported classes/functions.

### Recommended checks

- Ensure services are reachable at the documented ports or override with env vars:
  - `ATP_GATEWAY_URL`, `ATP_IDENTITY_URL`, `ATP_CREDENTIALS_URL`, `ATP_PERMISSIONS_URL`, `ATP_AUDIT_URL`.
- Re-run your quickstart after upgrading:

```bash
npm install atp-sdk@latest
node -e "import('atp-sdk').then(async m=>{const a=await m.Agent.create('upgrade-check'); console.log(a.getName())})"
```

## Future (v1.2+)

- Additional protocol adapters may be added without breaking existing APIs.
- Any deprecations will be announced here with upgrade paths.
