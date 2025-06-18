# Agent Trust Protocol™ (ATP™)

**Open protocol for secure, decentralized AI agent authentication and trust**

Created and developed by **Larry Lewis**, Sovr INC DBA SovrLabs

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![GitHub](https://img.shields.io/github/stars/bigblackcoder/agent-trust-protocol)](https://github.com/bigblackcoder/agent-trust-protocol)
[![Contributors](https://img.shields.io/github/contributors/bigblackcoder/agent-trust-protocol)](https://github.com/bigblackcoder/agent-trust-protocol/graphs/contributors)

## 🤖 What is ATP™?

The Agent Trust Protocol™ (ATP™) establishes a comprehensive trust layer for AI agent ecosystems using decentralized identity, verifiable credentials, and cryptographic authentication. It bridges the security gap in agent-to-agent communication, providing a foundational trust infrastructure that complements emerging protocols like MCP (Model Context Protocol).

## 🎯 Key Features

### Core Trust Infrastructure
- **🔐 Decentralized Identity**: W3C DID-based agent identities with Ed25519 cryptographic keypairs
- **📜 Verifiable Credentials**: Issue and verify agent capabilities using W3C VC standards  
- **🛡️ Secure Communication**: JSON-RPC 2.0 over WebSocket with DID-based authentication
- **🎛️ Fine-grained Permissions**: Capability-based access control with time-bound tokens
- **📊 Trust Networks**: Dynamic relationship establishment and reputation management
- **📝 Immutable Audit Trail**: Complete interaction history for compliance and analysis

### Advanced Capabilities
- **🤝 Multi-Agent Coordination**: Orchestrate complex workflows across trusted agent networks
- **🔄 Real-time Collaboration**: Parallel processing with fault tolerance and failover
- **🛠️ Tool Delegation**: Secure sharing of capabilities and resources between agents
- **🔗 Protocol Integration**: Ready for MCP integration and cross-protocol interoperability
- **🏗️ Production Ready**: Docker deployment with native compilation and comprehensive testing

## 🚀 Quick Start

### Option 1: Docker Deployment (Recommended)

```bash
# Clone the repository
git clone https://github.com/bigblackcoder/agent-trust-protocol.git
cd agent-trust-protocol

# Start all services with Docker Compose
docker compose -f docker-compose-improved.yml up -d

# Verify services are running
curl http://localhost:3001/health  # Identity Service
curl http://localhost:3002/health  # VC Service  
curl http://localhost:3003/health  # Permission Service
curl http://localhost:3000/health  # RPC Gateway

# Register your first agent DID
curl -X POST http://localhost:3001/identity/register \
  -H "Content-Type: application/json" \
  -d '{"publicKey": "your-public-key-here"}'
```

### Option 2: Development Setup

```bash
# Install dependencies and build
npm install
npm run build

# Start services in development mode
npm run docker:up

# Run integration tests
npm run test:simple
npm run test:integration

# Try the advanced agent examples
cd examples/advanced-agents
npm run demo
```

### Option 3: Quick Test

```bash
# Run simple functionality test
npm run test:simple

# This will:
# 1. Start identity service container
# 2. Test DID registration and retrieval  
# 3. Validate core ATP functionality
# 4. Clean up automatically
```

## 🏗️ Architecture

ATP™ consists of modular microservices that can be deployed independently:

```
┌─────────────────────────────────────────────────────────────────┐
│                   Agent Trust Protocol™                        │
├─────────────┬─────────────────┬─────────────────┬───────────────┤
│Identity Svc │    VC Service   │Permission Svc   │  RPC Gateway  │
│   (DIDs)    │  (Credentials)  │  (Capabilities) │(Communication)│
│             │                 │                 │               │
│• DID Mgmt   │• Credential     │• Access Control │• JSON-RPC 2.0│
│• Key Pairs  │  Issuance      │• Policy Engine  │• WebSocket    │ 
│• Resolution │• Verification   │• Token Mgmt     │• Load Balance │
│• Rotation   │• Schemas        │• Audit Logs     │• Service Mesh │
└──────┬──────┴─────────┬───────┴─────────┬───────┴───────┬───────┘
       │                │                 │               │
       └────────────────┴─────────────────┴───────────────┘
                                  │
                    ┌─────────────▼─────────────┐
                    │     Agent Network         │
                    └─────────────┬─────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
   ┌────▼────┐              ┌────▼────┐              ┌────▼────┐
   │ Agent A │◄────────────►│ Agent B │◄────────────►│ Agent C │
   │         │   Trusted    │         │   Trusted    │         │
   │Data Anal│ Relationship │Security │ Relationship │Task Coord│ 
   └─────────┘              └─────────┘              └─────────┘
```

### Service Responsibilities

- **Identity Service**: DID creation, key management, agent registration
- **VC Service**: Credential issuance, verification, schema management  
- **Permission Service**: Capability grants, policy enforcement, access tokens
- **RPC Gateway**: Message routing, load balancing, protocol translation

## 🤝 Use Cases & Applications

### Enterprise AI Coordination
- **Federated ML**: Secure model training across organizational boundaries
- **Cross-Department Data Sharing**: Compliance-aware information exchange
- **Resource Optimization**: Dynamic capability allocation and load balancing

### Multi-Agent Workflows  
- **Data Processing Pipelines**: Coordinated analysis with security validation
- **Task Orchestration**: Complex workflow execution across specialized agents
- **Real-time Collaboration**: Parallel processing with fault tolerance

### Protocol Integration
- **MCP Bridge**: Trust layer for Model Context Protocol tool sharing
- **Cross-Ecosystem**: Universal agent identity across different protocols
- **Standards Compliance**: W3C DID/VC compatibility for interoperability

### Security & Compliance
- **Zero-Trust Architecture**: Verify every agent interaction cryptographically
- **Audit Trails**: Complete interaction history for regulatory compliance  
- **Threat Detection**: Behavioral analysis and anomaly detection

## 🔗 MCP Integration Strategy

ATP™ provides the trust foundation that MCP currently lacks:

### Current Benefits
- **DID Authentication**: Secure agent identity for MCP sessions
- **Trust Validation**: Multi-level relationship management for tool access
- **Capability Tokens**: ATP™ permissions authorize MCP tool usage  
- **Decentralized Discovery**: Find tools across verified agent networks

### Future Roadmap
1. **Transport Integration**: Use MCP's efficient transport for agent communication
2. **Tool Marketplace**: Decentralized MCP tool discovery and sharing
3. **Economic Models**: Token-based tool access and marketplace dynamics
4. **Cross-Protocol Bridge**: Universal agent identity across ecosystems

## 🛠️ Technical Stack

- **Runtime**: Node.js 18+ with ES modules and TypeScript
- **Transport**: JSON-RPC 2.0 over WebSocket, HTTP/2 ready
- **Cryptography**: Ed25519 signatures, Web Crypto API with polyfills
- **Standards**: W3C DID Core, W3C Verifiable Credentials, JSON-RPC 2.0
- **Storage**: SQLite with pluggable backends (PostgreSQL, MongoDB ready)
- **Deployment**: Docker with Alpine Linux and native compilation
- **Testing**: Jest with comprehensive integration test suite

## 📚 Documentation

- **[Getting Started Guide](docs/getting-started.md)** - Complete setup instructions
- **[API Reference](docs/api/README.md)** - Detailed API documentation  
- **[Advanced Examples](examples/advanced-agents/README.md)** - Multi-agent scenarios
- **[Docker Guide](docs/DOCKER_SQLITE_SOLUTIONS.md)** - Production deployment
- **[Architecture Overview](examples/advanced-agents/README.md#architecture-overview)** - System design

## 🧪 Examples & Demos

### Simple Agents
```bash
cd examples/simple-agent
npm run demo
# Demonstrates basic agent communication and capability sharing
```

### Advanced Agent Network
```bash  
cd examples/advanced-agents
npm run demo
# Interactive demo with:
# • Multi-agent collaboration
# • MCP integration concepts  
# • Trust network formation
# • Real-time coordination
```

### Integration Testing
```bash
npm run test:integration
# Comprehensive test suite covering:
# • Service health and API functionality
# • Cross-service integration workflows
# • Multi-agent interaction patterns
# • Error handling and edge cases
```

## 🗺️ Development Roadmap

### ✅ Phase 1: Foundation (Complete)
- Core DID/VC implementation with ES modules
- Production Docker deployment with native compilation
- Comprehensive integration test suite  
- Advanced agent communication examples

### 🚧 Phase 2: Protocol Integration (In Progress)
- MCP transport layer integration
- Cross-protocol identity bridging
- Economic incentive mechanisms
- Performance optimization and scaling

### 🔮 Phase 3: Ecosystem Development
- Decentralized tool marketplace
- Reputation and rating systems
- On-chain trust registry integration
- Developer SDKs and tooling

### 🌟 Phase 4: Advanced Features
- Zero-knowledge proof integration
- Multi-party computation support
- Quantum-resistant cryptography
- Governance and decentralized decision making

## 🤲 Contributing

We welcome contributions from the community! ATP™ is designed to be a foundational protocol for the AI agent ecosystem.

### How to Contribute
1. **Fork the repository** and create a feature branch
2. **Read the documentation** and understand the architecture
3. **Write tests** for any new functionality
4. **Follow coding standards** (TypeScript, ES modules, comprehensive testing)
5. **Submit a pull request** with clear description of changes

### Development Guidelines
- All code must include comprehensive tests
- Follow W3C standards for DID and VC implementations
- Maintain backward compatibility in public APIs
- Document new features and architectural decisions

### Areas for Contribution
- **Protocol Extensions**: New agent capabilities and interaction patterns
- **Integration Adapters**: Bridges to other agent frameworks and protocols
- **Performance Optimization**: Scaling improvements and benchmarking
- **Security Enhancements**: Cryptographic improvements and threat modeling
- **Developer Tools**: SDKs, CLIs, and debugging utilities

## 🌟 Why ATP™ Matters

As AI agents become more autonomous and interconnected, establishing trust between agents becomes critical infrastructure. ATP™ provides the missing security layer that enables:

### For Developers
- **Secure Foundation**: Build multi-agent applications with confidence
- **Standards Compliance**: W3C-compatible identity and credentials
- **Easy Integration**: RESTful APIs and WebSocket communication
- **Comprehensive Testing**: Battle-tested with extensive integration tests

### For Organizations  
- **Compliance Ready**: Complete audit trails and policy enforcement
- **Scalable Security**: Cryptographic trust without central authorities
- **Risk Management**: Behavioral monitoring and threat detection
- **Future Proof**: Compatible with emerging agent protocols

### For the Ecosystem
- **Interoperability**: Universal agent identity across platforms
- **Innovation Platform**: Foundation for advanced agent capabilities
- **Community Driven**: Open source with transparent development
- **Standards Evolution**: Contributing to W3C and other standards bodies

## 📊 Project Status

- **✅ Core Services**: Identity, VC, Permission, RPC Gateway fully implemented
- **✅ ES Module Support**: Complete TypeScript ES module migration  
- **✅ Docker Deployment**: Production-ready containers with native compilation
- **✅ Integration Tests**: Comprehensive test suite with 95%+ coverage
- **✅ Advanced Examples**: Multi-agent scenarios and MCP integration strategy
- **✅ Documentation**: Complete API docs and developer guides

**Ready for production use and real-world integration!** 🚀

## 📜 License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

Copyright 2024 Larry Lewis, Sovr INC DBA SovrLabs

## 🙏 Acknowledgments

ATP™ builds upon excellent prior work and standards:

- **[W3C DID Working Group](https://www.w3.org/2019/did-wg/)** - Decentralized Identifiers specification
- **[W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)** - Verifiable Credentials data model
- **[Model Context Protocol](https://github.com/anthropics/model-context-protocol)** - Tool sharing protocol for AI agents
- **[JSON-RPC 2.0](https://www.jsonrpc.org/specification)** - Lightweight remote procedure call protocol
- **[Node.js Community](https://nodejs.org/)** - JavaScript runtime and ecosystem

Special thanks to the open source community for the foundational technologies that make ATP™ possible.

---

## 🚀 Get Started Today

```bash
git clone https://github.com/bigblackcoder/agent-trust-protocol.git
cd agent-trust-protocol
npm run test:simple
```

**Building trust in the age of autonomous agents** 🤖🔐

*Created by Larry Lewis, Sovr INC DBA SovrLabs*