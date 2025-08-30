
Architecture Doc: Visual Trust Policy Editor + Gateway Integration

Purpose:
Define the system architecture and components needed to power the Visual Trust Policy Editor and enforce its policies at runtime in the ATP Gateway.

Components:
1. Visual Policy Editor (Frontend)
- React-based canvas
- Outputs ATP-compatible policy JSON
- Integrated into Admin Dashboard

2. Policy Export Format
- JSON schema aligns with ATP Gateway engine
- Supports rule chaining, logical ops, trust levels

3. Policy Storage Layer
- Org-scoped, versioned, access-controlled

4. Gateway Runtime
- Loads policy.json per org
- Evaluates DID, TrustLevel, VCs, target tool

Policy Enforcement Flow:
1. Build policy -> export/store
2. Gateway loads policy
3. On agent request -> evaluate context
4. Apply outcome -> log result

Inputs Required:
- agent_did, trust_level, tool_id, vc_ids[], org_id

Policy JSON Schema:
(if/then, and/or conditions)

Deployment Considerations:
- No live-editing
- Hot reload
- Debug mode (optional)

Future Enhancements:
- Version diffing, rollback
- ZK-proof predicates
- Trace replay

Security:
- Inputs validated
- Authenticated admin-only deployment
- Sandboxed execution

Integration Points:
- Editor -> API -> Storage
- Storage -> Gateway -> Audit Log

Owner: Gateway Architect
Version: v1.0
