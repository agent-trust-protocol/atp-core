# Technical Stack

## Application Framework
- **Backend**: Express.js 4.18.2 (microservices architecture)
- **Frontend**: Next.js 14.0.0 with App Router
- **Runtime**: Node.js 18+ with ES modules

## Database System
- **Primary**: PostgreSQL (production)
- **Development**: better-sqlite3 8.7.0 (local development)
- **Storage**: Multi-tenant architecture with organization-scoped isolation

## JavaScript Framework
- **Language**: TypeScript 5.8.3 with strict typing
- **Package Management**: npm with Lerna monorepo workspace
- **Module System**: ES modules throughout

## Import Strategy
- **Backend**: Node.js ES modules
- **Frontend**: Next.js with TypeScript path mapping (@/*)

## CSS Framework
- **Styling**: Tailwind CSS 3.3.0
- **PostCSS**: 8.0.0 with autoprefixer 10.0.0
- **Animations**: tailwindcss-animate 1.0.7

## UI Component Library
- **Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React 0.294.0
- **Utilities**: class-variance-authority 0.7.0, clsx 2.0.0, tailwind-merge 2.0.0

## Fonts Provider
- **System**: Next.js built-in font optimization
- **Icons**: Lucide React icon library

## Icon Library
- **Primary**: Lucide React 0.294.0
- **Integration**: Radix UI Icons 1.3.0

## Application Hosting
- **Development**: Local development servers (localhost:3000-3007)
- **Production**: Docker containers with multi-service deployment
- **Demo**: ngrok tunnel for public access

## Database Hosting
- **Production**: PostgreSQL with connection pooling
- **Development**: SQLite for local development
- **Backup**: Automated database backups and recovery

## Asset Hosting
- **Static Assets**: Next.js public directory
- **Images**: Local storage with Next.js image optimization
- **SSL**: Self-signed certificates for development, production SSL

## Deployment Solution
- **Containerization**: Docker with docker-compose
- **Orchestration**: Multi-service deployment with health checks
- **Load Balancing**: Nginx with SSL termination
- **Monitoring**: Health check endpoints and logging

## Code Repository URL
- **Repository**: https://github.com/bigblackcoder/agent-trust-protocol
- **License**: Apache 2.0
- **Homepage**: https://atp.dev

## Additional Technologies

### Cryptography
- **Quantum-Safe**: Dilithium3 + Ed25519 hybrid signatures
- **Standards**: NIST PQC (FIPS 203, 204, 205)
- **DID/VC**: W3C Decentralized Identifiers and Verifiable Credentials
- **Custom DID Method**: did:atp for secure agent identity

### Testing
- **Framework**: Jest 30.4 with ts-jest
- **Coverage**: Unit and integration tests
- **CI/CD**: Automated testing pipeline
- **Test Files**: quantum-safe-server.test.js, integration.test.js, claude-atp-client.test.js

### Development Tools
- **Linting**: ESLint with TypeScript rules
- **Build**: TypeScript compilation with Lerna
- **Version Control**: Git with GitFlow workflow
- **Package Management**: Lerna monorepo with workspace configuration

### Microservices Architecture
- **Identity Service**: Port 3001, DID management and verification
- **VC Service**: Port 3002, Verifiable Credentials issuance and validation
- **Permission Service**: Port 3003, RBAC and capability-based access control
- **RPC Gateway**: Port 3000, WebSocket RPC with JSON-RPC 2.0
- **Audit Logger**: Port 3005, Immutable audit trail with IPFS integration
- **Protocol Integrations**: Ports 3006-3007, MCP and A2A protocol bridges 