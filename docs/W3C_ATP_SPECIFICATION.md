# Agent Trust Protocol™ (ATP) Specification v1.0

**Status**: Draft Specification for W3C Submission  
**Date**: January 2025  
**Authors**: Larry Lewis (Sovr INC.), ATP Development Team  
**Contact**: larry@sovrlabs.com

## Abstract

The Agent Trust Protocol (ATP) is a comprehensive security framework for AI agents that combines W3C Decentralized Identifiers (DIDs), Verifiable Credentials (VCs), and quantum-safe cryptography to enable secure, verifiable, and trustworthy agent-to-agent interactions. This specification defines the protocol's architecture, message formats, cryptographic requirements, and interoperability standards.

## 1. Introduction

### 1.1 Purpose

ATP addresses the critical need for:
- **Identity**: Decentralized, cryptographically verifiable agent identities
- **Trust**: Quantifiable trust relationships between AI agents
- **Security**: Quantum-safe cryptographic protection
- **Interoperability**: Cross-platform agent communication standards

### 1.2 Scope

This specification covers:
- Agent identity management using W3C DIDs
- Trust scoring and reputation systems
- Quantum-safe cryptographic operations
- Secure messaging protocols
- Verifiable credential issuance and verification
- Audit and compliance mechanisms

## 2. Conformance

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

## 3. Terminology

- **Agent**: An autonomous software entity capable of performing tasks
- **DID**: Decentralized Identifier as defined by W3C DID Core
- **Trust Score**: Numeric value (0-1) representing trust level
- **Quantum-Safe**: Resistant to attacks by quantum computers
- **VC**: Verifiable Credential as defined by W3C VC Data Model

## 4. Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Identity Service│    │Credential Service│   │Permission Service│
│   (DIDs)        │    │   (VCs)         │    │   (RBAC)        │
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                       │
         └──────────────────────┼───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │    RPC Gateway        │
                    │  (JSON-RPC 2.0)       │
                    └───────────┬───────────┘
                                │
                    ┌───────────┴───────────┐
                    │    Audit Logger       │
                    │  (Immutable Logs)     │
                    └───────────────────────┘
```

## 5. Agent Identity (DID)

### 5.1 DID Method: `did:atp`

ATP defines a new DID method with the following syntax:

```
did:atp:<network>:<unique-identifier>
```

Example: `did:atp:mainnet:z6MkukG4UkfY7RDATt51tYQHJuQSd2XstDanvqSbJHQyxdvu`

### 5.2 DID Document Structure

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://atp.dev/ns/v1"
  ],
  "id": "did:atp:mainnet:z6MkukG4UkfY7RDATt51tYQHJuQSd2XstDanvqSbJHQyxdvu",
  "verificationMethod": [{
    "id": "#key-1",
    "type": "Ed25519VerificationKey2020",
    "controller": "did:atp:mainnet:z6MkukG4UkfY7RDATt51tYQHJuQSd2XstDanvqSbJHQyxdvu",
    "publicKeyMultibase": "z6MkukG4UkfY7RDATt51tYQHJuQSd2XstDanvqSbJHQyxdvu"
  }, {
    "id": "#key-2",
    "type": "DilithiumVerificationKey2024",
    "controller": "did:atp:mainnet:z6MkukG4UkfY7RDATt51tYQHJuQSd2XstDanvqSbJHQyxdvu",
    "publicKeyMultibase": "z8FqT3Xz9Bc2YPqQfZvvKqVxGRSqwELBv3d6umccPsQKQvBNL"
  }],
  "authentication": ["#key-1", "#key-2"],
  "assertionMethod": ["#key-1"],
  "keyAgreement": ["#key-1"],
  "service": [{
    "id": "#atp-gateway",
    "type": "ATPGateway",
    "serviceEndpoint": "https://gateway.atp.example.com"
  }]
}
```

### 5.3 DID Operations

#### 5.3.1 Create (Register)
```http
POST /identity/register
Content-Type: application/json

{
  "publicKey": "z6MkukG4UkfY7RDATt51tYQHJuQSd2XstDanvqSbJHQyxdvu",
  "metadata": {
    "name": "AI Assistant Bot",
    "capabilities": ["text-generation", "data-analysis"]
  }
}
```

#### 5.3.2 Resolve
```http
GET /identity/resolve/{did}
```

#### 5.3.3 Update
```http
PUT /identity/update/{did}
Authorization: DID-JWT

{
  "verificationMethod": [...],
  "service": [...]
}
```

## 6. Cryptographic Requirements

### 6.1 Hybrid Signature Scheme

ATP MUST support hybrid signatures combining:
1. **Classical**: Ed25519 for current security
2. **Post-Quantum**: CRYSTALS-Dilithium for quantum resistance

### 6.2 Signature Format

```json
{
  "type": "HybridSignature2024",
  "created": "2024-01-15T12:00:00Z",
  "verificationMethod": "did:atp:mainnet:z6Mk...#key-1",
  "proofPurpose": "authentication",
  "classical": {
    "algorithm": "Ed25519",
    "signature": "base64url..."
  },
  "postQuantum": {
    "algorithm": "Dilithium3",
    "signature": "base64url..."
  }
}
```

### 6.3 Key Rotation

Agents MUST support key rotation with a minimum grace period of 24 hours.

## 7. Trust Model

### 7.1 Trust Levels

| Level | Value | Name | Requirements |
|-------|-------|------|--------------|
| 0 | 0.0 | Unknown | No verification |
| 1 | 0.25 | Basic | Identity verified |
| 2 | 0.5 | Verified | Credentials validated |
| 3 | 0.75 | Trusted | Established history |
| 4 | 1.0 | Privileged | Administrative access |

### 7.2 Trust Score Calculation

```
TrustScore = W1×InteractionScore + W2×CredentialScore + W3×ReputationScore
```

Where:
- W1, W2, W3 = Weight factors (sum to 1.0)
- InteractionScore = Based on successful interactions
- CredentialScore = Based on verified credentials
- ReputationScore = Based on network feedback

## 8. Message Protocol

### 8.1 Message Format

All ATP messages MUST use JSON-RPC 2.0:

```json
{
  "jsonrpc": "2.0",
  "method": "atp.message.send",
  "params": {
    "from": "did:atp:mainnet:sender123",
    "to": "did:atp:mainnet:recipient456",
    "payload": {
      "type": "text",
      "content": "Hello, quantum world!",
      "timestamp": "2024-01-15T12:00:00Z"
    },
    "signature": {
      "type": "HybridSignature2024",
      "classical": "...",
      "postQuantum": "..."
    }
  },
  "id": "msg-12345"
}
```

### 8.2 Transport Requirements

- MUST support WebSocket for real-time communication
- MUST support HTTPS for RESTful operations
- SHOULD support WebRTC for P2P communication
- MAY support additional transports

## 9. Verifiable Credentials

### 9.1 ATP Credential Types

1. **Identity Credentials**: Verify agent identity
2. **Capability Credentials**: Attest to agent abilities
3. **Trust Credentials**: Record trust relationships
4. **Compliance Credentials**: Regulatory compliance

### 9.2 Credential Format

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://atp.dev/credentials/v1"
  ],
  "type": ["VerifiableCredential", "ATPCapabilityCredential"],
  "issuer": "did:atp:mainnet:issuer789",
  "issuanceDate": "2024-01-15T12:00:00Z",
  "expirationDate": "2025-01-15T12:00:00Z",
  "credentialSubject": {
    "id": "did:atp:mainnet:agent123",
    "capability": "data-analysis",
    "level": "expert",
    "trustScore": 0.85
  },
  "proof": {
    "type": "HybridSignature2024",
    "created": "2024-01-15T12:00:00Z",
    "verificationMethod": "did:atp:mainnet:issuer789#key-1",
    "classical": "...",
    "postQuantum": "..."
  }
}
```

## 10. Security Considerations

### 10.1 Threat Model

ATP protects against:
- **Identity spoofing**: Via cryptographic signatures
- **Man-in-the-middle**: Via TLS and end-to-end encryption
- **Replay attacks**: Via timestamps and nonces
- **Quantum attacks**: Via post-quantum cryptography

### 10.2 Privacy

- DIDs are pseudonymous by default
- Agents MAY use pairwise DIDs for enhanced privacy
- Zero-knowledge proofs SHOULD be used for sensitive claims

## 11. Interoperability

### 11.1 Protocol Bridges

ATP MUST provide bridges to:
- **MCP** (Model Context Protocol): Via security wrapper
- **DIDComm**: Via message translation
- **OIDC**: Via credential mapping

### 11.2 Data Formats

- MUST support JSON-LD for semantic interoperability
- MUST support JWT for token-based auth
- SHOULD support CBOR for efficient encoding

## 12. Compliance

### 12.1 Standards Compliance

ATP implementations MUST comply with:
- W3C DID Core 1.0
- W3C Verifiable Credentials 1.1
- NIST Post-Quantum Cryptography standards
- JSON-RPC 2.0 specification

### 12.2 Regulatory Compliance

ATP supports compliance with:
- GDPR (right to be forgotten via DID deactivation)
- CCPA (data portability via VC export)
- SOC 2 (audit logging requirements)

## 13. Implementation Requirements

### 13.1 Minimum Viable Implementation

An ATP implementation MUST:
1. Support DID creation and resolution
2. Implement hybrid signature verification
3. Calculate and maintain trust scores
4. Support basic message exchange
5. Provide audit logging

### 13.2 Reference Implementation

The reference implementation is available at:
https://github.com/agent-trust-protocol/core

## 14. Test Vectors

### 14.1 DID Creation Test

Input:
```json
{
  "publicKey": "z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK"
}
```

Expected Output:
```json
{
  "did": "did:atp:testnet:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK",
  "document": { ... }
}
```

### 14.2 Signature Verification Test

[Additional test vectors would be included]

## 15. References

1. [DID Core] W3C Decentralized Identifiers v1.0
2. [VC Data Model] W3C Verifiable Credentials Data Model v1.1
3. [JSON-RPC] JSON-RPC 2.0 Specification
4. [NIST PQC] NIST Post-Quantum Cryptography Standards
5. [Ed25519] EdDSA and Ed25519
6. [Dilithium] CRYSTALS-Dilithium Algorithm Specification

## Appendix A: JSON Schemas

[JSON schemas for all message types would be included]

## Appendix B: Error Codes

| Code | Name | Description |
|------|------|-------------|
| -32001 | DID_NOT_FOUND | DID does not exist |
| -32002 | INVALID_SIGNATURE | Signature verification failed |
| -32003 | INSUFFICIENT_TRUST | Trust level too low |
| -32004 | CREDENTIAL_EXPIRED | Credential has expired |
| -32005 | QUANTUM_SIG_REQUIRED | Post-quantum signature required |

---

**Copyright © 2025 Agent Trust Protocol Contributors. Licensed under Apache 2.0.**