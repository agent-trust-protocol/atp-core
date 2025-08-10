# ATP Development Workflow

## Seamless Agent Orchestration

This workflow enables automatic delegation from Claude Code to BMAD-METHOD agents based on task requirements.

## Current Sprint (7 Days)

Based on scratchpad analysis, here's the prioritized workflow:

### 🔥 **CRITICAL PATH - Track A: Build Fixes**

**Owner**: BUILD-AGENT → bmad-dev + bmad-qa  
**Status**: 🔴 BLOCKING - Must complete first

#### BUILD-FIX.1.1: PostCSS Toolchain
```yaml
steps:
  1. Claude Code BUILD-AGENT analyzes issue
  2. Delegates to bmad-architect for solution design
  3. bmad-dev implements PostCSS configuration fix
  4. bmad-qa validates build process
  5. Claude Code confirms resolution

accept_criteria:
  - autoprefixer available in production
  - npm run build succeeds
  - Docker build includes PostCSS
```

#### BUILD-FIX.1.2: TypeScript Path Aliases
```yaml
steps:
  1. BUILD-AGENT identifies @/* resolution issues
  2. bmad-dev fixes tsconfig.json paths
  3. Updates Next.js configuration
  4. bmad-qa tests all imports

accept_criteria:
  - @/components resolves correctly
  - No import errors in production
  - Docker build handles aliases
```

#### BUILD-FIX.1.3: Docker Multi-Stage Build
```yaml
steps:
  1. BUILD-AGENT reviews Dockerfile.production
  2. bmad-architect designs build stages
  3. bmad-dev implements multi-stage build
  4. Tests with full monorepo context

accept_criteria:
  - Docker image builds successfully
  - All dependencies included
  - Image size optimized
```

#### BUILD-FIX.1.4: CI/CD Guards
```yaml
steps:
  1. BUILD-AGENT creates GitHub Actions workflow
  2. bmad-dev implements build checks
  3. Adds test execution
  4. bmad-qa validates pipeline

accept_criteria:
  - CI runs on every PR
  - Build failures block merge
  - All tests must pass
```

### 🎨 **Track B: Visual Policy Editor**

**Owner**: UI-AGENT → bmad-ux-expert + bmad-dev  
**Status**: 🟡 Ready after Track A

#### UI-MOD.3.1: React Flow Canvas
```yaml
steps:
  1. UI-AGENT scaffolds policy editor page
  2. bmad-ux-expert designs node interface
  3. bmad-dev implements React Flow
  4. Integrates with Next.js app

accept_criteria:
  - Canvas renders in /policy-editor
  - Nodes are draggable
  - Connections work
```

#### UI-MOD.3.2: Node Palette
```yaml
steps:
  1. UI-AGENT defines node types
  2. bmad-ux-expert creates UI components
  3. bmad-dev implements drag-drop
  4. Adds node configuration panels

accept_criteria:
  - Condition nodes available
  - Action nodes available
  - Logical operators work
```

#### UI-MOD.3.3: Schema Validation
```yaml
steps:
  1. UI-AGENT integrates ATP schema
  2. bmad-dev adds validation logic
  3. Real-time error feedback
  4. Export to valid JSON

accept_criteria:
  - Invalid policies highlighted
  - Export produces valid ATP JSON
  - Schema errors shown clearly
```

### 🔧 **Track C: Policy Storage API**

**Owner**: API-AGENT → bmad-architect + bmad-dev  
**Status**: 🟢 Can run parallel

#### POL-API.1: CRUD Endpoints
```yaml
steps:
  1. API-AGENT designs REST API
  2. bmad-architect defines schema
  3. bmad-dev implements endpoints
  4. bmad-qa writes tests

accept_criteria:
  - POST /api/policies
  - GET /api/policies/:id
  - PUT /api/policies/:id
  - DELETE /api/policies/:id
```

#### POL-API.2: Versioning & Audit
```yaml
steps:
  1. API-AGENT adds version tracking
  2. bmad-dev implements audit logs
  3. Integrates with Audit Logger service
  4. Tests rollback functionality

accept_criteria:
  - Policy versions tracked
  - Can rollback to previous
  - Audit trail complete
```

### 🔒 **Track D: Security Updates**

**Owner**: SECURITY-AGENT → bmad-dev  
**Status**: 🟢 Can run parallel

#### Audit Logger IPFS Migration
```yaml
steps:
  1. SECURITY-AGENT evaluates Helia
  2. bmad-dev replaces IPFS client
  3. Adds feature toggle
  4. Tests integrity verification

accept_criteria:
  - Helia integration works
  - Feature flag controls usage
  - Hash chains verified
```

### ✅ **Track E: E2E Validation**

**Owner**: INTEGRATION-AGENT → bmad-qa + bmad-sm  
**Status**: 🟡 After core fixes

#### SDK Smoke Test
```yaml
steps:
  1. INTEGRATION-AGENT creates test flow
  2. bmad-qa implements E2E tests
  3. Tests DID → VC → Permission flow
  4. Documents green path

accept_criteria:
  - 3-line SDK integration works
  - Full flow completes
  - Documentation updated
```

## Execution Protocol

### Day 1-2: Critical Build Fixes
```bash
# Activate BUILD-AGENT for Track A
claude-code activate BUILD-AGENT
bmad-method --team "dev,qa,architect" --sprint "BUILD-FIX.1"
```

### Day 3-4: UI Development
```bash
# Activate UI-AGENT for Track B
claude-code activate UI-AGENT
bmad-method --team "ux-expert,dev" --sprint "UI-MOD.3"
```

### Day 5-6: API & Security
```bash
# Parallel execution
claude-code activate API-AGENT SECURITY-AGENT
bmad-method --parallel --sprints "POL-API,AUDIT-IPFS"
```

### Day 7: Integration Testing
```bash
# Final validation
claude-code activate INTEGRATION-AGENT
bmad-method --team "qa,sm" --sprint "E2E-VALIDATION"
```

## Success Metrics

### Track A - Build Fixes
- ✅ All builds pass (npm, Docker, CI)
- ✅ Zero TypeScript errors
- ✅ Production deployment ready

### Track B - Policy Editor
- ✅ Visual editor functional
- ✅ Valid JSON export
- ✅ User-friendly interface

### Track C - API
- ✅ All CRUD operations work
- ✅ Versioning implemented
- ✅ 100% test coverage

### Track D - Security
- ✅ IPFS/Helia working
- ✅ Audit trails intact
- ✅ Zero vulnerabilities

### Track E - Integration
- ✅ E2E flow passes
- ✅ SDK validated
- ✅ Documentation complete

## Monitoring

- **Real-time**: `.agent-os/monitoring/agent-monitor.ts`
- **Progress**: `.cursor/scratchpad.md`
- **Status**: `PROJECT_STATUS_BOARD.md`
- **Tasks**: TodoWrite tool

## Handoff Points

1. **Claude Code → BMAD**: Task complexity > threshold
2. **BMAD → Claude Code**: Task completion or blocker
3. **Agent → Agent**: Dependency completion
4. **All → Monitor**: Status updates

## Emergency Protocols

### Build Failure
```bash
claude-code emergency BUILD-AGENT
bmad-method --priority critical --agent dev
```

### Security Issue
```bash
claude-code emergency SECURITY-AGENT
bmad-method --priority critical --agent architect
```

### Production Down
```bash
claude-code emergency ALL
bmad-method --all-hands --priority critical
```

## Notes

- Track A is **CRITICAL PATH** - blocks all deployment
- Tracks C & D can run in parallel
- Track B depends on Track A completion
- Track E validates everything

This workflow ensures seamless coordination between Claude Code orchestration and BMAD-METHOD execution, with clear handoff points and success criteria for each track.