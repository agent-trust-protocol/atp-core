# Security tooling reference catalog

Documentation-only research index. Listing does not imply endorsement, installation, approval for production, or a passing security review. Confirm upstream ownership, licenses, version pinning, and data egress before integration.

## Application Security

- **[Strix](https://github.com/usestrix/strix)** — Automated application security testing.
- **[Nuclei](https://github.com/projectdiscovery/nuclei)** — Template-based vulnerability scanning.
- **[Semgrep](https://github.com/semgrep/semgrep)** — Static application security analysis.

## Cloud and Supply Chain

- **[Cloudflare Security Audit](https://github.com/cloudflare/security-audit-skill)** — Cloudflare configuration review.
- **[Trivy](https://github.com/aquasecurity/trivy)** — Dependencies, containers and IaC.
- **[TruffleHog](https://github.com/trufflesecurity/trufflehog)** — Secrets exposure detection.

## AI Agent Security

- **[NVIDIA SkillSpector](https://github.com/NVIDIA/SkillSpector)** — AI-agent skill and MCP risk inspection.
- **[OpenAI Codex Security](https://github.com/openai/codex-security)** — AI-assisted code security review.
- **[Claude Code Security Review](https://github.com/anthropics/claude-code-security-review)** — AI-assisted pull request review.

## Adversarial Testing

- **[BLA (Blind LLM Agents)](https://github.com/qybaihe/bla)** — Agent security research; verify exact project before adoption.
- **[Microsoft PyRIT](https://github.com/Azure/PyRIT)** — Generative-AI red teaming.

## Malware Detection

- **[ClamAV](https://github.com/Cisco-Talos/clamav)** — Malware scanning.

## ATP integration boundaries

- **ATP Core:** use scanners as supporting evidence; never replace cryptographic verification, mandate validation, or fail-closed authorization decisions with a scanner score.
- **ATP Studio:** evaluate static analysis and dependency checks in CI; do not execute untrusted scanner templates against production systems without approval.
- **ATP Shield:** evaluate SkillSpector, TruffleHog, and adversarial test fixtures for local agent tools. Treat scanner output as untrusted evidence and keep authorization enforcement independent.
- **SovrLabs:** maintain an inventory of candidate tools and a reproducible review process; do not treat references as deployed controls.

## Adoption checklist

1. Verify the exact upstream repository and its maintainer; especially confirm BLA before implementation.
2. Review license, maintenance status, release provenance, and permissions.
3. Pin versions and isolate execution; minimize secrets and outbound network access.
4. Start in a sandbox or non-production CI job and capture reproducible evidence.
5. Obtain explicit approval before enabling enforcement or any active scanning of live assets.
