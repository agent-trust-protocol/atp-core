# ATP 2.0 Extraction Archive

Product/enterprise code extracted from the public `atp-core` (ATP 1.x) repository
on 2026-07-24, branch `claude/atp-1x-scope-modules-q2jmmr`. All paths mirror their
original repo-relative locations, so this tree can be overlaid onto the ATP 2.0
backend repo directly.

## Contents

### Multi-tenant org administration
- `packages/atp-cloud/` — tenant manager, enterprise onboarding, cloud gateway, analytics (includes `src/tenant-service/billing-service.ts` and `src/cloud-gateway/usage-tracker.ts`)
- `src/app/cloud/`, `src/app/api/cloud/` — cloud/tenants/analytics UI + API

### Billing / payments
- `packages/payment-service/` — mandates, checkout, transactions (AP2/ACP)
- `packages/sdk/src/client/payments.ts` + `packages/sdk/src/__tests__/client/payments.test.ts` — `PaymentsClient` removed from the public SDK
- `src/app/pricing/`

### Studio / Guardian surfaces
- `src/app/dashboard/`, `src/app/policy-editor/`, `src/app/policy-testing/`, `src/app/monitoring/`, `src/app/api/monitoring/`, `src/app/api/workflows/`
- `src/workflow-engine/` — full visual workflow engine
- `src/app/integrations/openclaw/agents/` — live agent dashboard page
- `src/app/api/health/route.ts` — original workflow mock health API (replaced by a minimal health endpoint in atp-core)
- `src/components/atp/` — dashboard/editor components: Workflow* (6 files + backup), advanced-metrics, dashboard-stats, enhanced-dashboard, enhanced-workflow-designer, enterprise-dashboard, live-agent-dashboard, live-policy-dashboard, monitoring-dashboard, user-management, policy-testing-framework, visual-policy-editor(-demo), workflow-designer-layout
- `scripts/dev/start-workflow-engine.js`, `scripts/dev/start-workflow-simple.js`

### Enterprise operations
- `packages/shared/src/auth/enterprise-sso.ts`, `enterprise-rbac.ts`, `enterprise-middleware.ts`
- `packages/shared/src/compliance/` — compliance framework + monitoring
- `src/app/enterprise/`, `src/app/api/enterprise/`
- `docs/ENTERPRISE.md`, `docs/ENTERPRISE-DEPLOYMENT-GUIDE.md`, `docs/ENTERPRISE-SECURITY-DOCUMENTATION.md`, `docs/COMPLIANCE-CERTIFICATION-GUIDE.md`
- `docs/internal/` — internal sales / IP / pitch material

### Deployment gates / infra
- `railway.*.json` (7 service configs)
- `docker-compose.production.yml`, `docker-compose.staging.yml`
- `nginx/`, `production/`, `scripts/deploy/`

## Notes for re-integration
- The public SDK's `ATPClient` no longer constructs `PaymentsClient`; ATP 2.0 should
  re-attach it (see `packages/sdk/src/client/payments.ts` here).
- `packages/shared` in atp-core no longer exports `./compliance` or the enterprise
  auth modules; imports of those symbols must resolve to this archive's copies.
- Conformance gate (`npm run conformance`, 510 tests) and the sdk/shared Jest suites
  (843 tests) pass in atp-core after extraction.
