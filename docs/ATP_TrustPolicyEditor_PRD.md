
# 🧠 PRD: Visual Trust Policy Editor (ATP Enterprise)

## 📌 Overview

The Visual Trust Policy Editor allows enterprise users to define, simulate, and enforce trust policies for agents without writing code. It powers ATP's programmable authorization engine and enhances explainability, auditability, and enterprise usability.

## 🎯 Goal

Deliver a visual, rule-based UI that enables:

- Defining trust conditions (agent, credential, context)
- Assigning outcomes (grant, throttle, deny)
- Exporting policy to JSON for enforcement in ATP Gateway
- Previewing or simulating policy matches

## 👤 Users

- **Enterprise platform admins**: define who gets access to which tools
- **Security analysts**: audit, simulate, and trace trust decisions
- **DevOps/SREs**: configure real-time policies based on risk scores or credential status

## 🖼️ UI Components

| Component | Description |
|----------|-------------|
| **Node Canvas** | Visual editor to define agent conditions → rules → actions |
| **Condition Builder** | IF agent has VC X, is TrustLevel Y, called API Z... |
| **Action Panel** | THEN allow / deny / log / alert / rate-limit |
| **Simulation Viewer** | Test sample agent input against policy ("Why allowed?") |
| **JSON Export** | Serialize to ATP Gateway-compatible policy JSON |

## 🧱 Functional Requirements

- [ ] Drag-and-drop node interface (agent input → logic → output)
- [ ] Support logical operators (AND, OR, NOT)
- [ ] Reference agent DIDs, VCs, tool names, TrustLevels
- [ ] Support outcomes: `allow`, `deny`, `throttle`, `log`, `alert`
- [ ] Validate that output policy is JSON-valid
- [ ] Allow import/export of policies
- [ ] Integrate with admin dashboard (enterprise-only)

## 📦 Output Format (Example)

```json
{
  "if": {
    "vc": "com.atp.security.certified",
    "trust_level": ">=3",
    "tool": "api://clinical-db"
  },
  "then": "allow"
}
```

## 🛠️ Architecture Handoff Notes

- Output JSON must be consumed by the **ATP Gateway** as a trust evaluation policy
- Gateway must support:
  - JSON policy loading per org/tenant
  - In-memory policy cache with reload support
  - Runtime evaluation against incoming request context (DID, VC, endpoint)
- Optional: if multiple rules match, select by priority or evaluation order

## 🔄 Data Flow

1. **Admin builds policy visually** (via drag-drop nodes)
2. **Policy saved as JSON** (in ATP-compatible schema)
3. **Preview mode** simulates agent behavior against rules
4. **Policy is deployed to ATP Gateway** (via API or file)
5. **Gateway enforces rules in runtime per request**
6. **Audit logs record policy decisions**

## ❗ Edge Cases & Questions

| Scenario | Expected Behavior |
|----------|-------------------|
| VC format invalid | Show validation error, block export |
| Conflicting rules | Allow user to set precedence or warn during export |
| Unknown agent ID | Match fallback rule or deny by default |
| Deprecated policy | Archive but retain version in audit log |
| Node loop in UI | Disallow circular links between blocks |

## 🧪 QA & Testing Scope

### 🧪 Core Test Cases

- [ ] Create a policy with 2 nodes, export valid JSON
- [ ] Run simulation with expected "allow" outcome
- [ ] Run simulation with "deny" path + explanation
- [ ] Import previously saved policy
- [ ] UI blocks circular node creation
- [ ] Error validation for incomplete condition or action blocks

### 🌐 Compatibility & Performance

- [ ] Works on Chrome, Safari, Firefox latest
- [ ] Responsive for laptop + large display
- [ ] Handles 10+ rule nodes smoothly

### 🔐 Security Tests

- [ ] Exported JSON escapes unsafe inputs
- [ ] Policy cannot inject invalid keys or executable content
- [ ] Editor blocks client-side JS injection (XSS)

## 🛠️ Non-Goals

- Not a full policy language parser
- Not live agent monitoring (that happens in Dashboard)
- Not open to end-users; enterprise-facing only

## 🔄 Milestones

| Week | Goal |
|------|------|
| 1 | Design wireframes + schema validation lib |
| 2 | Node editor MVP (conditions + actions) |
| 3 | JSON output + test mode UI |
| 4 | Dashboard integration + demo session |

## ✅ Success Criteria

- Can define + export a working policy in <5 minutes
- 100% visual (no YAML or JSON required)
- MVP pilot feedback from 2 enterprise users
- Simulates real ATP trust decisions (unit tested)

## 🧠 Notes

- Use-case driven templates may come later (e.g. "block unverified vendor agent")
- Future: connect to real audit logs for live rule tracing

**Owner:** PM – You  
**Tech leads:** Gateway + Admin UI lead  
**Target delivery:** Mid-Q4 2025
