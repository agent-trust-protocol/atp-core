# ATP Multi-Repository Structure Plan

## Overview

The Agent Trust Protocol (ATP) project will be restructured into three focused repositories to improve maintainability, deployment flexibility, and team collaboration.

## Repository Architecture

### 1. Core ATP Repository (Current)
**Repository:** `agent-trust-protocol` (this repository)  
**Purpose:** Core protocol development and services  
**Scope:** Developer-focused, protocol implementation  

**Contents:**
- `packages/audit-logger/` - Audit logging service
- `packages/identity-service/` - Identity management
- `packages/permission-service/` - Permission and policy management
- `packages/protocol-integrations/` - MCP and A2A protocol integrations
- `packages/rpc-gateway/` - RPC gateway service
- `packages/sdk/` - Core ATP SDK
- `packages/shared/` - Shared utilities and types
- `packages/vc-service/` - Verifiable credentials service
- `packages/monitoring-service/` - Real-time monitoring service
- Core documentation and examples
- Development and testing infrastructure

**Target Audience:** Protocol developers, contributors, system integrators

### 2. Website Repository (To be created)
**Repository:** `agent-trust-protocol-website`  
**Purpose:** Public website, marketing, and documentation  
**Scope:** Public-facing content and marketing materials  

**Contents:**
- Next.js website application (currently in `website-repo/`)
- Marketing pages and content
- Public documentation
- API reference documentation  
- Examples and tutorials
- Sales and promotional materials
- Public demo applications

**Target Audience:** End users, potential customers, developers learning ATP

### 3. Enterprise Repository (To be created)
**Repository:** `agent-trust-protocol-enterprise`  
**Purpose:** Enterprise features and ATP Cloud infrastructure  
**Scope:** Commercial offerings and advanced features  

**Contents:**
- `packages/atp-cloud/` - Multi-tenant cloud platform
- Enterprise-specific features
- Advanced monitoring and analytics
- Enterprise deployment configurations
- White-label solutions
- Commercial licensing and compliance tools

**Target Audience:** Enterprise customers, system administrators, DevOps teams

## Implementation Plan

### Phase 1: Repository Preparation (Current)
- [ ] Document current structure and dependencies
- [ ] Identify components for each repository  
- [ ] Create migration scripts and procedures
- [ ] Set up cross-repository linking strategy

### Phase 2: Website Repository Creation
- [ ] Create `agent-trust-protocol-website` repository
- [ ] Extract website content from current repository
- [ ] Set up independent build and deployment pipeline
- [ ] Configure domain and hosting
- [ ] Update cross-references and links

### Phase 3: Enterprise Repository Creation  
- [ ] Create `agent-trust-protocol-enterprise` repository
- [ ] Extract ATP Cloud and enterprise features
- [ ] Set up enterprise-specific CI/CD
- [ ] Configure private package registry if needed
- [ ] Set up enterprise customer access controls

### Phase 4: Core Repository Cleanup
- [ ] Remove website-specific content from core repo
- [ ] Remove enterprise-specific content from core repo
- [ ] Update documentation and README
- [ ] Streamline core repository for protocol development
- [ ] Set up submodule or package linking as needed

### Phase 5: Cross-Repository Integration
- [ ] Set up shared CI/CD pipelines
- [ ] Configure cross-repository dependency management
- [ ] Create unified documentation strategy
- [ ] Set up synchronized release processes
- [ ] Implement cross-repository testing

## Benefits

### Developer Experience
- **Focused repositories** for specific concerns
- **Faster clones and builds** due to smaller repository sizes
- **Clear separation** between protocol development and applications
- **Independent versioning** and release cycles

### Deployment and Operations
- **Independent deployments** for different components  
- **Scalable infrastructure** management
- **Environment-specific configurations**
- **Improved security** through access controls

### Business and Commercial
- **Enterprise feature isolation** for commercial offerings
- **Public/private content separation**
- **Customer-specific customizations**
- **Licensing and compliance** management

## Migration Strategy

### Non-Disruptive Approach
1. **Create new repositories** without affecting current development
2. **Set up parallel pipelines** to ensure continuity  
3. **Gradual migration** of content and references
4. **Thorough testing** at each step
5. **Coordinated cutover** when ready

### Rollback Plan
- Maintain current repository as primary until migration is complete
- Keep full history in all repositories for reference
- Document all changes for easy reversal if needed

## Cross-Repository Dependencies

### Package Management
- Core SDK published as npm package
- Enterprise packages as private npm packages  
- Website using public SDK package

### Documentation Linking
- Cross-repository documentation links
- Synchronized API documentation
- Shared example repositories

### CI/CD Integration
- Shared testing infrastructure
- Coordinated release processes  
- Cross-repository deployment triggers

## Timeline

**Estimated Duration:** 2-3 weeks  
**Phase 1-2:** 1 week (Website extraction)  
**Phase 3-4:** 1 week (Enterprise extraction and cleanup)  
**Phase 5:** 1 week (Integration and testing)  

## Next Steps

1. **Review and approve** this structure plan
2. **Create GitHub repositories** for website and enterprise
3. **Set up basic structure** and CI/CD pipelines  
4. **Begin content migration** starting with website
5. **Test and validate** each phase before proceeding

---

*This plan ensures the ATP project maintains its current functionality while evolving into a more maintainable and scalable multi-repository architecture.*