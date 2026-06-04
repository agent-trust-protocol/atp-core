# ATP Pricing Recommendation — June 2026

**Prepared for:** ATP eng + GTM
**Buyer focus (set in scope):** Enterprise-led primary (security / platform leaders at mid-market and enterprise companies)
**Meter:** open — recommend what fits ATP's value
**Research date:** 2026-06-04
**Status of current page:** the live `/pricing` page leads with "OpenCore free + Enterprise call-us + calculator." Recommendation below is to **rebuild it** along the Langfuse template; an interim "soft hide" is suggested at the bottom.

---

## TL;DR — three-line answer

1. **Meter: hybrid base + usage. Two customer-facing units — registered agent DIDs (governance footprint) and policy evaluations or audit events (consumption).** No single VC/analyst we surveyed endorses per-DID alone; the entire 2025–2026 cohort (a16z, Bessemer, ICONIQ, Poyar) endorses hybrid base-plus-usage as the default. Per-DID by itself failed at Salesforce Agentforce (three repricings in 18 months). Source: ICONIQ State of AI Jan 2026; Bessemer AI Pricing Playbook Feb 2026; Monetizely teardown of Agentforce.
2. **Tier shape: copy Langfuse exactly — two pricing pages, three tiers each.** `/pricing` shows Cloud (Developer / Team / Enterprise with **a visible "starts at" anchor on Enterprise**), and `/pricing/self-host` shows OSS (free, MIT, no limits) + Enterprise license key with the gated feature list published verbatim. This is the most-copied template among OSS-led security/observability companies in 2026, including Snyk, Sysdig/Falco, and GitHub.
3. **Don't hide the OSS pricing page; hide the *current* one.** The Wiz/SGNL/Astrix "contact sales for everything, no anchors" model is the dated pattern in 2026 — works for pure CNAPP, fails for OSS-adjacent products where buyers can compare you to a self-host alternative they could deploy in an afternoon. ATP is OSS-adjacent. Publish anchors.

---

## 1. What the market is actually doing

### 1.1 Meter trends (1H 2026)

| Source | Headline | Meter recommendation |
|---|---|---|
| [Bessemer, AI Pricing Playbook for Founders (Feb 2026)](https://www.bvp.com/assets/uploads/2026/02/The_AI_pricing_playbook_for_founders_Bessemer_Venture_Partners_2026.pdf) | Hybrid is now industry standard at **41% of AI vendors (up from 27% in 2025)**; pure per-seat fell from 21% → 15% | Hybrid base + usage; track CPT, CPR, CPAM internally |
| [ICONIQ, 2026 State of AI](https://www.iconiq.com/growth/reports/2026-state-of-ai-bi-annual-snapshot) | **58% still include a subscription/platform component; 35% consumption; 18% outcome (from 2% Q2 2025); 37% plan to change pricing model in the next 12 months** | Subscription floor + consumption tier |
| [a16z, Surviving AI Price Wars](https://a16z.com/surviving-ai-price-wars-without-destroying-your-business/) | "The most underused lever isn't the number — it's the unit"; outcome reframes comparison from cost-per-seat to cost-per-result | Pick a unit that maps to your value; premium products sustain 10–20% over peers |
| [Growth Unhinged (Poyar), 2026 State of B2B Monetization](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026) | **1,800 pricing changes among top 500 SaaS/AI in 2025 (3.6 per company)**; hybrid is biggest segment at 37% | Treat pricing as a live system, not a one-shot launch |
| [Simon-Kucher / Ramanujam (Lenny's, Jul 2025)](https://www.lennysnewsletter.com/p/pricing-and-scaling-your-ai-product-madhavan-ramanujam) | "~**5% of companies are in a true outcome-based pricing model**"; most "outcome" claims are marketing | Don't claim outcome unless you bill it |
| [Gartner Hype Cycle for Agentic AI 2026](https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai) | "FinOps for agentic AI" is now a distinct emerging category | Customers want predictability tools, not just a price |

**Single most important convergent finding:** every primary VC/analyst source endorses **hybrid base-plus-usage**. None endorse per-DID or per-agent as the headline customer-facing meter. The closest a major source comes is Bessemer's **CPAM (cost per agent minute)** and **CPR (cost per resolved request)** — and those are positioned as *internal cost units*, not customer-facing meters.

### 1.2 The Agentforce cautionary tale

Salesforce shipped **per-conversation pricing at $2/conversation in late 2024 → Flex Credits at $0.10/action in May 2025 → per-user seats at $125/user/month in early 2026** — three meters in 18 months. ([Monetizely teardown](https://www.getmonetizely.com/blogs/the-doomed-evolution-of-salesforces-agentforce-pricing); [SaaStr coverage](https://www.saastr.com/salesforce-now-has-3-pricing-models-for-agentforce-and-maybe-right-now-thats-the-way-to-do-it/)) The lesson, paraphrased across every analyst: *a conversation is not a unit of value.* This is directly relevant to ATP — a "registered agent DID" likewise is not a unit of value; **a policy evaluation or an audit event is**. Use DIDs as the *floor* (per-agent base fee) and evaluations/events as the *meter* (consumption).

### 1.3 Who actually publishes per-agent pricing today

Across every NHI/agent-identity vendor we surveyed, **only Aembit publishes an explicit per-agent price**: "AI Teams" tier at **$20/agent/month** for 10–500 agents (verified June 2026 against their own [GA announcement](https://aembit.io/blog/aembit-iam-for-agentic-ai-is-now-generally-available/)). SGNL ($740M to CrowdStrike Jan 2026 — [press release](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-sgnl-to-transform-identity-security-for-ai-era/)), Astrix, and Token Security all force a sales call with no anchor. WorkOS AgentOS, Auth0 for AI Agents, and Descope all bundle agent identity into per-MAU pricing rather than break out a per-agent SKU.

**Implication:** Aembit's $20/agent is the only concrete per-agent comp anchor for security buyers. Anchoring above $20 reads as premium; below reads as commodity. ATP's value (quantum-safe identity + policy + audit, not just NHI auth) supports $25–$40/agent at the floor.

### 1.4 The AI security category has consolidated — pricing visibility has collapsed

In a 12-month window, five of the nine guardrail/runtime-security vendors we tracked were acquired:
- **Pangea → CrowdStrike** ($260M, 2025)
- **Lakera → Check Point** (2025)
- **Prompt Security → SentinelOne** (2025)
- **Protect AI → Palo Alto Networks** (~$500M, April 2025; folded into Prisma AIRS)
- **CalypsoAI → F5** ($180M, March 2026)

Every acquired vendor removed public pricing post-acquisition. The remaining independents that still publish prices (Portkey ~$49/mo for 100K logged requests, Lakera Community $0 for 10K req, LiteLLM Enterprise ~$250–$2,500/mo) are the comp set we should anchor against — *not* the acquired enterprise-bundled ones.

---

## 2. Recommended pricing model

### 2.1 Meter

**Two customer-facing units, in this priority:**

1. **Registered agent DIDs** — the floor. The "seat-equivalent" for non-human identities. Easy to forecast, ties to governance scope (every DID is something your security team has to monitor). This is your *predictability* lever — the 40% of ICONIQ buyers who want budget certainty bias toward this.

2. **Policy evaluations + audit events** — the usage tier. Aligns price with the security work ATP actually performs. Two events are roughly equivalent in cost-of-goods to ATP and are easy to combine into a single "ATP units" meter the way Langfuse does ("units").

**Reject these as primary meters:**
- *Per signed credential alone* — too narrow; not all customers issue VCs.
- *Per audit event alone* — under-counts the policy-heavy workloads (the ones with the deepest pockets).
- *Per token mediated* — the LLM gateways already own this meter; ATP would be priced into a margin race against Portkey and LiteLLM.
- *Per seat* — fails for the same reason it's failing across the AI-native category (Bessemer's 21% → 15% drop). A platform team buys ATP; their seat count is irrelevant to ATP's value.

### 2.2 Tier structure

Three tiers, two pages, mirroring Langfuse exactly:

```
docs/pricing
├─ /pricing                         (Cloud, ATP-managed)
│   ├─ Developer    $0       1 org · 10 agent DIDs · 100K evals/mo · 7-day audit retention · community support
│   ├─ Team         $499/mo  3 orgs · 100 agent DIDs · 5M evals/mo · 90-day retention · email support · $0.05 / 1K eval overage
│   └─ Enterprise   from $4,000/mo   Unlimited orgs · 1,000+ agents · 3-yr retention · SSO · SCIM · audit export · SLA · CSM · contract terms
└─ /pricing/self-host               (OSS, run-it-yourself)
    ├─ Open Source  $0       MIT-licensed. Unlimited agents, evals, audit events. Community support.
    └─ Enterprise license   from $24,000/yr   Adds: SSO (SAML/OIDC), SCIM, audit-log export, advanced retention policies, server-side data masking, RBAC roles, support SLA
```

**Why these numbers:**
- **Developer $0 with 10 agents / 100K evals**: matches the Lakera Community / Helicone Free / Portkey Developer pattern (10K–100K free units/mo). 10 agents is enough to prototype, low enough to push real workloads to Team.
- **Team $499/mo**: anchors between Langfuse Pro ($199) and Langfuse Enterprise ($2,499). ATP plays a more sensitive role (signing, audit-of-record) than observability so the floor is higher. $0.05 per 1K evaluations overage matches Langfuse's $8/100K units shape.
- **Cloud Enterprise from $4,000/mo**: Langfuse anchors Enterprise at $2,499; ATP carries identity + policy + audit (three jobs to Langfuse's one) so $4K is defensible. Compare to Aembit's $20/agent × 200 agents = $4,000/mo for a mid-market footprint.
- **Self-host Enterprise license from $24,000/yr**: matches HashiCorp Vault Enterprise mid-range and is below the typical Wiz/Lacework floor (~$30K–$50K). Read as "we trust you to run it; we make money from the gates you need for procurement."

### 2.3 What's in each tier (comparison table groups)

Use the **5-group order** that appears on every best-in-class page (GitHub, HashiCorp, Langfuse, Vercel):

1. **Identity & access** — SSO (SAML/OIDC), SCIM, RBAC, API keys, IP allowlists
2. **Scale & quotas** — agent DIDs, policy evaluations/mo, audit events/mo, retention period, throughput
3. **Support & SLA** — response time, business hours vs. 24×7, dedicated CSM, uptime % commitment
4. **Compliance** — SOC 2 Type 2, ISO 27001, HIPAA BAA, FedRAMP Moderate (where you have it), data residency
5. **Deployment** — Cloud managed / Self-host containers / On-prem appliance / BYOC

**The Enterprise-tier gates (true upgrade triggers, in order of how often they appear across the page audit):**
- SSO → still moving down to mid-tier in 2026 (Linear Plus, Notion Business, Langfuse Pro). For ATP, *put SSO at Team* — security buyers expect it, putting it at Enterprise reads as gouging.
- SCIM → universally Enterprise across GitHub, Notion, Vercel, Langfuse. Real gate.
- Audit-log export + extended retention → real gate.
- Data residency / BYOC → real gate.
- 99.9%/99.99% SLA → real gate.

### 2.4 OSS vs. Cloud-managed positioning

Adopt Langfuse's exact wording: **"Self-host all core ATP features for free without any limitations. Only [list the gated features] require a commercial license."** ([Langfuse handbook on open source](https://langfuse.com/handbook/chapters/open-source)) Publish the gated-feature list verbatim on `/pricing/self-host` — buyers respect this; opacity reads as adversarial.

The exact set Langfuse paywalls in their self-host Enterprise license is: project-level RBAC roles, protected prompt labels, data retention policies, audit logs, server-side data masking, UI customization, organization creators, org management API + SCIM, instance management API. (Verified June 2026.) **Mirror this list structure for ATP**, adapted to ATP's domain (SCIM, audit-log export, retention policies, RBAC, data masking, instance management API).

---

## 3. Recommended page structure (section-by-section content prompts)

> Build this against the existing Next.js `src/app/pricing/page.tsx`. Keep it as one page; the self-host content can be a second tab on the same route or a `/pricing/self-host` sibling.

### Hero
- **Headline (pricing-led, not product-led — security buyers prefer this):** "Pricing built for security teams." or "Pay for the agents you govern, not the seats."
- **Subhead:** one sentence on hybrid meter ("Open-source core, plus a managed Cloud tier and Enterprise contracts when you're ready to scale.") — copy the cadence from HashiCorp ("Flexible, scalable pricing").
- Dual CTAs above the fold: **"Start free"** (linking to npm install / GitHub) and **"Talk to security sales"**. GitHub Enterprise does this; it converts both the technical evaluator and the procurement-driven buyer from the same row.

### Tier cards (4 cards, OSS + 3 cloud)
- OSS card (visually distinct — green, not gradient): "Open Source. Free forever. Self-host."
- Developer: "$0. Build with us."
- Team: "$499/mo. Production-grade. Self-serve."
- Enterprise: "**Starts at $4,000/mo**. Talk to sales." — the anchor matters; don't hide it.

### Comparison table
- Sticky header.
- 5 row-groups in the order above (Identity, Scale, Support, Compliance, Deployment).
- Self-host as a fourth column with explicit "OSS" / "Enterprise license" split inside the column where relevant.

### Calculator
- Build one. Inputs: number of agent DIDs, policy evaluations per month, audit-retention requirement (7d / 90d / 3yr).
- Output: Team or Enterprise recommendation, monthly estimate, "Talk to sales for >X agents."
- Rationale: every usage-priced vendor we audited ships one (Snowflake, Databricks, Confluent, Auth0, Langfuse). Seat-priced vendors don't. ATP is usage-priced. Build the calculator.

### Self-host section (or `/pricing/self-host` sibling page)
- Headline: "Self-host ATP. Forever free."
- Three bullets:
  - "**All core security primitives are MIT licensed.** Identity, policy evaluation, audit trail, ZKP, quantum-safe signing — every primitive ATP uses to secure agents is open source, no usage limits."
  - "Need SSO, SCIM, audit-log export, or extended retention? That's the **ATP Enterprise license key** — starts at $24,000/year."
  - "Want us to run it? **Try Cloud →**"
- Link out to a dedicated `/self-hosting/license-key` page enumerating exactly which features unlock with the key. (Mirror [Langfuse's page of the same name](https://langfuse.com/self-hosting/license-key).)

### FAQ (5 buckets is the universal pattern — fewer reads thin, more reads like a wall)
1. **"What's free vs. paid?"** — pin this first. Answer: every protocol primitive is free, forever, MIT-licensed. Paid is governance/compliance scaffolding.
2. **"How is ATP priced?"** — hybrid: base + usage. Reference the calculator.
3. **"What about security and compliance?"** — SOC 2 Type 2, data residency, HIPAA BAA on Enterprise.
4. **"Self-host vs. Cloud?"** — link to the comparison sub-page.
5. **"How do I trial Enterprise?"** — Enterprise trial, named contact, POC timeline.

### Trust strip (bottom)
- SOC 2 Type 2 logo, ISO 27001, HIPAA BAA, GDPR. Per the page audit (GitHub, Datadog, Langfuse), compliance certifications should appear as a feature row in the comparison table **and** as a logo strip at the bottom — not buried in a footer link.

---

## 4. Risks of the current model — and how the recommendation mitigates them

| Risk | Today | Mitigation |
|---|---|---|
| **No anchor → procurement can't approve a budget** | Current page is "OpenCore free + Enterprise contact-sales + calculator." A buyer needs a number to defend internally before they'll book the demo call. | Publish Team at $499/mo and Enterprise "from $4,000/mo." Even a soft anchor wins the short-list. (GitHub: "starting at $21/user/mo"; Langfuse: $2,499/mo; Datadog: "starting at $23/host.") |
| **Calculator without tiers leaks intent** | The current calculator suggests pricing is custom-everything. Sales-led without product-led on-ramps is a 2023 pattern. | Calculator stays, but it now *recommends a published tier* rather than producing a custom number. Recipe is Confluent's (cost estimator → eCKU SKU). |
| **Two-tier OSS-vs-Enterprise gap is too big to jump** | Free → "Contact sales" is a 100× jump for many buyers. They churn rather than convert. | Add a $499 Team tier. ICONIQ 2026 says quota attainment is at 62% (best in three years) for orgs with bottom-up entry points. Don't skip the middle. |
| **Per-DID-only would replay Agentforce** | Charging only per registered agent ignores load (some agents do 10× the policy work). | Hybrid meter: base per-agent + variable per-eval. Bessemer's CPAM + CPR shape. |
| **Hiding prices invites comparison to OSS-only competitors at $0** | When a buyer can self-host and your only public number is "Enterprise call us," the $0 wins. | Lead with the OSS option ourselves (`/pricing/self-host`), then sell the Enterprise license key. Snyk's playbook ("unlimited free tests for public/open-source repositories"). |

---

## 5. Comp anchors — what's defensible

| Meter | ATP recommended | Comp anchor | Source |
|---|---|---|---|
| Free dev tier — agent ceiling | 10 agent DIDs | Aembit Free: 3 AI agents · Lakera Community: 10K req/mo · Portkey Developer: 10K req/mo | [Aembit pricing](https://aembit.io/pricing/), [Lakera platform](https://platform.lakera.ai/pricing) |
| Free dev tier — usage ceiling | 100K evals/mo | Helicone Free: 10K req · Langfuse Hobby: 50K units · Lunary Free: 10K events | [Helicone](https://www.helicone.ai/pricing), [Langfuse](https://langfuse.com/pricing) |
| Mid (Team) — entry price | $499/mo | Langfuse Pro $199 · Stytch Scale $799 · LiteLLM Enterprise Basic $250 | [Langfuse](https://langfuse.com/pricing), [Stytch](https://stytch.com/pricing), [LiteLLM](https://docs.litellm.ai/docs/enterprise) |
| Mid (Team) — overage | $0.05 / 1K policy evals | Langfuse $8/100K units (=$0.08/1K) · Helicone per-request tiers · Aembit per-agent $20/mo | Langfuse public list; Aembit blog |
| Cloud Enterprise — starts-at anchor | $4,000/mo | Langfuse Enterprise $2,499/mo · Aembit AI Teams $20/agent × 200 agents = $4,000 | Langfuse; Aembit GA blog |
| Self-host Enterprise license | from $24,000/yr | HashiCorp Vault Enterprise mid-range, Snyk Ignite $1,260/dev/yr × 20 devs ≈ $25,000 | [HashiCorp Vault pricing](https://www.hashicorp.com/products/vault/pricing), [Snyk plans](https://snyk.io/plans/) |
| Premium positioning vs. peers | +10–20% over equivalent comp | [a16z: premium AI products sustain 10–20% over comp without churn impact](https://a16z.com/surviving-ai-price-wars-without-destroying-your-business/) | a16z |

---

## 6. What to do *right now* (interim, while the new page is being built)

The current `src/app/pricing/page.tsx` is the single biggest source of buyer friction we found. While the rebuild is in flight (1–2 sprints):

1. **Soft-hide the existing page, don't delete it.** Remove pricing links from the navbar, footer, quick-access, and the few cross-links in `enterprise/page.tsx` and `sales-guide/page.tsx`. Leave the page file in place so direct URLs / inbound marketing links don't 404, but it stops appearing on the marketing surface.
2. **Replace the page body** with a one-screen "Pricing is being updated" placeholder that anchors **"OSS free forever"** + **"Talk to sales"** with the same dual-CTA shape we'll use on the rebuild. This gets the dated tier cards off the page in an hour.
3. **Don't add a 301 redirect.** A redirect to `/` looks evasive to a buyer who Googled `agent trust protocol pricing`. The placeholder with two CTAs converts the same buyer.
4. **Pull the calculator out of the page in the interim** — running a calculator that outputs custom numbers while the rest of the page says "contact sales" is the worst-of-both-worlds combination. Bring it back as part of the rebuild, calibrated to the published Team-tier anchors.

Step 1 + 2 are about ~30 minutes of work; happy to ship them as a follow-up if you want.

---

## 7. Things we couldn't verify and should before pricing goes live

- **Aembit's $20/agent across the full 10–500 band** — confirmed from their GA blog post; the live pricing page returned 403 to our fetcher. Re-verify against the live page before quoting Aembit as a comp publicly.
- **Per-evaluation cost-of-goods on the ATP Cloud architecture** — the $0.05/1K overage is anchored to Langfuse's $8/100K, which is observability shape; ATP's eval work touches a Redis nonce store + Postgres audit + signing. Engineering needs to bottom-out the COGS before we publish the overage rate.
- **Whether SCIM should be Team or Enterprise** — the 2026 trend is SSO moving to mid-tier and SCIM staying Enterprise (Notion, Vercel, Langfuse). But ATP's buyer is the security team, not IT; they may want SCIM at Team. Worth a 30-min call with 3 design-partner customers before launch.
- **Whether to publish HIPAA BAA pricing separately** like Vercel ($350/mo) — depends on how many customers actually need it. If it's <15% of the pipeline, bundle into Enterprise. If higher, unbundle it as a $350/mo Team add-on like Vercel does.

---

## Sources (full bibliography)

**Pricing pages directly audited (2026-06-04):**
- [Aembit pricing](https://aembit.io/pricing/) · [Aembit GA announcement](https://aembit.io/blog/aembit-iam-for-agentic-ai-is-now-generally-available/)
- [Auth0 pricing](https://auth0.com/pricing) · [Auth0 FGA subscription plans](https://docs.fga.dev/subscription-plans)
- [Clerk pricing](https://clerk.com/pricing)
- [Confluent pricing](https://www.confluent.io/pricing/) · [cost estimator](https://www.confluent.io/pricing/cost-estimator/)
- [CrowdStrike pricing](https://www.crowdstrike.com/en-us/pricing/) · [SGNL acquisition release](https://www.crowdstrike.com/en-us/press-releases/crowdstrike-to-acquire-sgnl-to-transform-identity-security-for-ai-era/)
- [Databricks pricing](https://www.databricks.com/product/pricing)
- [Datadog pricing](https://www.datadoghq.com/pricing/)
- [Descope pricing](https://www.descope.com/pricing) · [2025 update](https://www.descope.com/blog/post/2025-pricing-update)
- [Frontegg pricing](https://frontegg.com/pricing)
- [GitHub pricing](https://github.com/pricing)
- [HashiCorp Terraform pricing](https://www.hashicorp.com/products/terraform/pricing) · [Vault pricing](https://www.hashicorp.com/products/vault/pricing)
- [Helicone pricing](https://www.helicone.ai/pricing)
- [Lakera platform pricing](https://platform.lakera.ai/pricing)
- [Langfuse pricing](https://langfuse.com/pricing) · [self-host pricing](https://langfuse.com/pricing-self-host) · [Enterprise license key](https://langfuse.com/self-hosting/license-key) · [Open-source handbook](https://langfuse.com/handbook/chapters/open-source)
- [LangSmith / LangChain pricing](https://www.langchain.com/pricing)
- [Linear pricing](https://linear.app/pricing)
- [LiteLLM Enterprise](https://docs.litellm.ai/docs/enterprise)
- [Lunary pricing](https://lunary.ai/pricing)
- [Notion pricing](https://www.notion.com/pricing)
- [Okta pricing](https://www.okta.com/pricing/) · [Ping Identity pricing](https://www.pingidentity.com/en/platform/pricing.html)
- [Pangea pricing](https://pangea.cloud/pricing/) · [CrowdStrike acquires Pangea](https://www.bankinfosecurity.com/crowdstrike-buys-pangea-for-260m-to-guard-enterprise-ai-use-a-29480)
- [Phoenix / Arize pricing](https://phoenix.arize.com/pricing/)
- [Portkey pricing](https://portkey.ai/pricing)
- [Snowflake pricing](https://www.snowflake.com/en/pricing-options/)
- [Snyk plans](https://snyk.io/plans/)
- [Stripe pricing](https://stripe.com/pricing) · [Stytch pricing](https://stytch.com/pricing)
- [Sysdig pricing](https://www.sysdig.com/pricing) · [Sysdig OSS](https://www.sysdig.com/opensource)
- [Vercel pricing](https://vercel.com/pricing)
- [Wiz pricing](https://www.wiz.io/pricing)
- [WorkOS pricing](https://workos.com/pricing) · [Astrix vs WorkOS](https://workos.com/blog/astrix-security-vs-workos-non-human-identity-enterprise-authentication)

**VC / analyst / operator sources:**
- a16z: [Surviving AI Price Wars](https://a16z.com/surviving-ai-price-wars-without-destroying-your-business/) · [How to Price Your Gen AI Feature: Revisited](https://a16z.com/pricing-packaging-ai-b2b-prosumer/) · [100 Enterprise CIOs on Gen AI 2025](https://a16z.com/ai-enterprise-2025/)
- Bessemer: [AI Pricing Playbook for Founders, Feb 2026 PDF](https://www.bvp.com/assets/uploads/2026/02/The_AI_pricing_playbook_for_founders_Bessemer_Venture_Partners_2026.pdf) · [State of AI 2025](https://www.bvp.com/atlas/the-state-of-ai-2025) · [AI Pricing & Monetization Playbook](https://www.bvp.com/atlas/the-ai-pricing-and-monetization-playbook)
- ICONIQ: [2026 State of AI](https://www.iconiq.com/growth/reports/2026-state-of-ai-bi-annual-snapshot) · [State of Go-to-Market 2026](https://www.iconiq.com/growth/reports/state-of-go-to-market-2026)
- [SaaStr summary of ICONIQ State of AI](https://www.saastr.com/the-execution-era-of-ai-5-key-takeaways-from-iconiqs-state-of-ai-report/)
- [Kyle Poyar, Growth Unhinged — 2026 State of B2B Monetization](https://www.growthunhinged.com/p/the-state-of-b2b-monetization-in-2026) · [Your Next Customer Might Be an AI Agent](https://www.growthunhinged.com/p/your-next-customer-might-be-an-ai-agent)
- [High Alpha 2025 SaaS Benchmarks (formerly OpenView)](https://www.highalpha.com/saas-benchmarks)
- [Madhavan Ramanujam on Lenny's Newsletter](https://www.lennysnewsletter.com/p/pricing-and-scaling-your-ai-product-madhavan-ramanujam)
- Simon-Kucher: [How to Win with AI in 2026](https://www.simon-kucher.com/en/insights/how-win-ai-2026) · [Value Monetization in the Age of AI](https://www.simon-kucher.com/en/insights/value-monetization-age-ai)
- Gartner: [Hype Cycle for Agentic AI 2026](https://www.gartner.com/en/articles/hype-cycle-for-agentic-ai) · [40% of agentic AI projects canceled by 2027](https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027) · [Enterprise AI coding agents market, May 2026](https://www.gartner.com/en/newsroom/press-releases/2026-05-20-gartner-says-the-market-for-enterprise-ai-coding-agents-is-entering-a-new-phase-of-expansion-and-competitive-realignment)
- [Monetizely — Doomed Evolution of Agentforce Pricing](https://www.getmonetizely.com/blogs/the-doomed-evolution-of-salesforces-agentforce-pricing) · [SaaStr on Agentforce 3-model pricing](https://www.saastr.com/salesforce-now-has-3-pricing-models-for-agentforce-and-maybe-right-now-thats-the-way-to-do-it/)

**Methodology:** 5 parallel research agents (one per scope angle: agent identity, AI guardrails, observability + identity comps, VC/analyst meter trends, enterprise pricing page conventions), then targeted verification fetches on the two highest-leverage single-source claims (Aembit $20/agent and Langfuse Enterprise license gate list — both confirmed). Limitations: several primary vendor pages returned HTTP 403 to direct fetch (Aembit, Langfuse, Portkey, Prompt Security, Lakera platform); for those we triangulated via official blog posts, vendor docs, and third-party teardowns. Specific items flagged as **unverified** are called out in section 7.
