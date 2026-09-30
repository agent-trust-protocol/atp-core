# Agent Trust Protocol starter

Run `npm start` after installing dependencies. This calls `Agent.quickstart` from `atp-sdk` and prints the identity created at runtime.

Without ATP services, the SDK generates ephemeral local keys. That identifier is not publicly resolvable and will change on the next run. Persist keys securely and configure DID resolution before relying on it across systems.

The optional `.atp.json` file is configuration metadata from the local wizard; the starter does not load or enforce its profile and capabilities. Wire policy evaluation into your own runtime.
