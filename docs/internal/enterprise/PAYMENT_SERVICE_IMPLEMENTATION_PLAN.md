# Payment Service Implementation Plan
## From MVP to Full Production

---

## 📋 Overview

**Strategy:** Build MVP first (2-3 weeks) → Validate with developers → Build Full Production (4-6 weeks)

**Current Status:**
- ✅ SDK Client (complete)
- ⏳ MVP Backend (next)
- 🔮 Full Production (future)

---

# Phase 1: MVP (2-3 Weeks)

## 🎯 MVP Goals

**Purpose:** Prove the concept and validate developer interest with minimal investment

**What Works:**
- ✅ Create payment mandates (intent & cart)
- ✅ Store mandates in database
- ✅ Basic mandate validation
- ✅ Mock payment execution (no real money)
- ✅ Query transaction history
- ✅ Basic monitoring integration

**What Doesn't Work (Yet):**
- ❌ Real payment processing
- ❌ Actual money movement
- ❌ Payment processor integrations
- ❌ Advanced fraud detection
- ❌ Multi-currency conversions

---

## MVP Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Application                       │
│                   (Using ATP SDK v1.1.0)                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RPC Gateway (Port 3000)                   │
│                   Routes payment requests                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Payment Service (Port 3007) - MVP                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Controllers (HTTP Endpoints)                         │  │
│  │  ├─ /ap2/mandates/intent      (Create)              │  │
│  │  ├─ /ap2/mandates/cart        (Create)              │  │
│  │  ├─ /ap2/payments/execute     (Mock Execute)        │  │
│  │  ├─ /acp/checkout/create      (Create)              │  │
│  │  ├─ /acp/checkout/complete    (Mock Complete)       │  │
│  │  └─ /payments/transactions    (Query)               │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Services (Business Logic)                            │  │
│  │  ├─ MandateService       (Validate & store)         │  │
│  │  ├─ MockPaymentProcessor (Simulate payments)        │  │
│  │  ├─ PolicyEnforcer       (Check limits)             │  │
│  │  └─ AuditLogger          (Log everything)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Integration Layer                                     │  │
│  │  ├─ Identity Service   (Verify DIDs)                │  │
│  │  ├─ Credentials Service (Sign mandates)             │  │
│  │  └─ Audit Service      (Log transactions)           │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database (Shared)                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ payment_mandates                                      │  │
│  │  ├─ id, type, user_did, agent_did                   │  │
│  │  ├─ max_amount, currency, restrictions              │  │
│  │  └─ status, created_at, expires_at                  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ payment_transactions                                  │  │
│  │  ├─ id, type (ap2/acp), status                      │  │
│  │  ├─ user_did, agent_did, merchant_id                │  │
│  │  ├─ amount, currency, mandate_id                    │  │
│  │  └─ created_at, metadata                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ payment_policies                                      │  │
│  │  ├─ id, name, agent_did                             │  │
│  │  ├─ limits (max, daily, monthly)                    │  │
│  │  └─ allowed_merchants, requires_approval            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## MVP File Structure

```
packages/payment-service/
├── src/
│   ├── index.ts                    # Express server setup
│   │
│   ├── controllers/
│   │   ├── mandate.controller.ts   # AP2 mandate endpoints
│   │   ├── checkout.controller.ts  # ACP checkout endpoints
│   │   ├── policy.controller.ts    # Payment policy management
│   │   └── transaction.controller.ts # Query transactions
│   │
│   ├── services/
│   │   ├── mandate.service.ts      # Mandate business logic
│   │   ├── mock-processor.service.ts # Mock payment execution
│   │   ├── policy-enforcer.service.ts # Check spending limits
│   │   └── audit.service.ts        # Audit logging
│   │
│   ├── models/
│   │   ├── mandate.model.ts        # Mandate data structure
│   │   ├── transaction.model.ts    # Transaction data structure
│   │   └── policy.model.ts         # Policy data structure
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts      # DID authentication
│   │   └── validation.middleware.ts # Request validation
│   │
│   └── utils/
│       ├── crypto.util.ts          # Signing utilities
│       └── validators.util.ts      # Input validation
│
├── migrations/
│   └── 004_payments.sql            # Database schema
│
├── Dockerfile                       # Container config
├── package.json                     # Dependencies
└── tsconfig.json                    # TypeScript config
```

---

## MVP Implementation Steps

### Week 1: Core Service Setup

**Day 1-2: Service Infrastructure**
```bash
# Create service structure
mkdir -p packages/payment-service/src/{controllers,services,models,middleware,utils}

# Initialize package
cd packages/payment-service
npm init -y

# Install dependencies
npm install express cors body-parser pg
npm install -D @types/express @types/node typescript
```

**Day 3-4: Database Schema**
```sql
-- migrations/004_payments.sql

-- Payment mandates (Intent & Cart)
CREATE TABLE payment_mandates (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(20) CHECK (type IN ('intent', 'cart')),
  user_did VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,
  purpose TEXT,
  max_amount DECIMAL(20,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  restrictions JSONB,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'used')),

  -- Intent mandate specific
  intent_mandate_id VARCHAR(255) REFERENCES payment_mandates(id),

  -- Cart mandate specific
  items JSONB,
  total DECIMAL(20,2),
  merchant VARCHAR(255),
  cart_hash VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,

  CONSTRAINT mandate_type_check CHECK (
    (type = 'intent' AND intent_mandate_id IS NULL) OR
    (type = 'cart' AND intent_mandate_id IS NOT NULL)
  )
);

-- Payment transactions
CREATE TABLE payment_transactions (
  id VARCHAR(255) PRIMARY KEY,
  protocol_type VARCHAR(10) CHECK (protocol_type IN ('ap2', 'acp')),
  status VARCHAR(20) CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  user_did VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,
  merchant_id VARCHAR(255) NOT NULL,

  amount DECIMAL(20,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,

  mandate_id VARCHAR(255) REFERENCES payment_mandates(id),
  checkout_session_id VARCHAR(255),
  payment_method_id VARCHAR(255),

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  failure_reason TEXT,
  metadata JSONB,

  -- Mock payment fields
  mock_processor_response JSONB,
  mock_transaction_id VARCHAR(255)
);

-- Payment policies
CREATE TABLE payment_policies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,

  max_transaction_amount DECIMAL(20,2) NOT NULL,
  daily_limit DECIMAL(20,2),
  monthly_limit DECIMAL(20,2),

  allowed_merchants TEXT[],
  allowed_categories TEXT[],
  blocked_merchants TEXT[],

  requires_approval BOOLEAN DEFAULT true,
  notification_threshold DECIMAL(20,2),

  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_mandates_user ON payment_mandates(user_did);
CREATE INDEX idx_mandates_agent ON payment_mandates(agent_did);
CREATE INDEX idx_mandates_status ON payment_mandates(status);
CREATE INDEX idx_mandates_created ON payment_mandates(created_at);

CREATE INDEX idx_transactions_user ON payment_transactions(user_did);
CREATE INDEX idx_transactions_agent ON payment_transactions(agent_did);
CREATE INDEX idx_transactions_status ON payment_transactions(status);
CREATE INDEX idx_transactions_created ON payment_transactions(created_at);
CREATE INDEX idx_transactions_merchant ON payment_transactions(merchant_id);

CREATE INDEX idx_policies_agent ON payment_policies(agent_did);
CREATE INDEX idx_policies_status ON payment_policies(status);
```

**Day 5: Express Server Setup**
```typescript
// src/index.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { mandateRouter } from './controllers/mandate.controller';
import { checkoutRouter } from './controllers/checkout.controller';
import { policyRouter } from './controllers/policy.controller';
import { transactionRouter } from './controllers/transaction.controller';

const app = express();
const PORT = process.env.PORT || 3007;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'payment-service', version: '1.0.0-mvp' });
});

// Routes
app.use('/ap2', mandateRouter);
app.use('/acp', checkoutRouter);
app.use('/payments/policies', policyRouter);
app.use('/payments/transactions', transactionRouter);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`💳 Payment Service (MVP) listening on port ${PORT}`);
});
```

### Week 2: Core Functionality

**Day 1-2: Mandate Management**
```typescript
// src/services/mandate.service.ts
import { v4 as uuidv4 } from 'uuid';
import { db } from '@atp/shared/database';
import { CryptoUtils } from '../utils/crypto.util';

export class MandateService {
  async createIntentMandate(params: IntentMandateParams): Promise<IntentMandate> {
    // 1. Validate user DID exists
    const userExists = await this.verifyDID(params.userDid);
    if (!userExists) throw new Error('Invalid user DID');

    // 2. Verify agent DID
    const agentExists = await this.verifyDID(params.agentDid);
    if (!agentExists) throw new Error('Invalid agent DID');

    // 3. Create mandate
    const mandate = {
      id: `mandate_${uuidv4()}`,
      type: 'intent',
      userDid: params.userDid,
      agentDid: params.agentDid,
      purpose: params.purpose,
      maxAmount: params.maxAmount,
      currency: params.currency || 'USD',
      restrictions: params.restrictions,
      status: 'active',
      createdAt: new Date(),
      expiresAt: params.expiresAt
    };

    // 4. Store in database
    await db.query(`
      INSERT INTO payment_mandates (
        id, type, user_did, agent_did, purpose,
        max_amount, currency, restrictions, status, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      mandate.id, mandate.type, mandate.userDid, mandate.agentDid,
      mandate.purpose, mandate.maxAmount, mandate.currency,
      JSON.stringify(mandate.restrictions), mandate.status, mandate.expiresAt
    ]);

    // 5. Create verifiable credential
    const vc = await this.createMandateCredential(mandate);

    // 6. Log to audit
    await this.logAudit('mandate.created', mandate);

    return { ...mandate, verifiableCredential: vc };
  }

  async createCartMandate(params: CartMandateParams): Promise<CartMandate> {
    // 1. Verify intent mandate exists and is valid
    const intentMandate = await this.getMandate(params.intentMandateId);
    if (!intentMandate || intentMandate.status !== 'active') {
      throw new Error('Invalid or expired intent mandate');
    }

    // 2. Validate cart total doesn't exceed intent mandate max
    if (params.total > intentMandate.maxAmount) {
      throw new Error(`Cart total exceeds mandate limit`);
    }

    // 3. Calculate immutable hash of cart
    const cartHash = CryptoUtils.hash(JSON.stringify({
      items: params.items,
      total: params.total,
      merchant: params.merchant
    }));

    // 4. Create cart mandate
    const mandate = {
      id: `cart_${uuidv4()}`,
      type: 'cart',
      intentMandateId: params.intentMandateId,
      merchant: params.merchant,
      items: params.items,
      total: params.total,
      currency: params.currency,
      cartHash,
      status: 'active',
      createdAt: new Date()
    };

    // 5. Store in database
    await db.query(`
      INSERT INTO payment_mandates (
        id, type, intent_mandate_id, merchant, items,
        total, currency, cart_hash, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      mandate.id, mandate.type, mandate.intentMandateId, mandate.merchant,
      JSON.stringify(mandate.items), mandate.total, mandate.currency,
      mandate.cartHash, mandate.status
    ]);

    // 6. Create verifiable credential
    const vc = await this.createMandateCredential(mandate);

    return { ...mandate, verifiableCredential: vc };
  }

  private async verifyDID(did: string): Promise<boolean> {
    // Call identity service to verify DID
    // For MVP, simple check
    return did.startsWith('did:atp:');
  }

  private async createMandateCredential(mandate: any): Promise<any> {
    // Create VC for mandate (simplified for MVP)
    return {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      type: ['VerifiableCredential', 'PaymentMandateCredential'],
      issuer: 'did:atp:payment-service',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: mandate.id,
        type: mandate.type,
        mandate: mandate
      }
    };
  }

  private async logAudit(action: string, data: any): Promise<void> {
    // Log to audit service
    console.log(`[AUDIT] ${action}:`, data);
  }
}
```

**Day 3-4: Mock Payment Processor**
```typescript
// src/services/mock-processor.service.ts
export class MockPaymentProcessor {
  async executeAP2Payment(params: AP2PaymentParams): Promise<PaymentResult> {
    // Simulate payment processing delay
    await this.delay(500);

    // 90% success rate for demo
    const success = Math.random() > 0.1;

    if (success) {
      const transaction = {
        id: `txn_${uuidv4()}`,
        protocolType: 'ap2',
        status: 'completed',
        userDid: params.userDid,
        agentDid: params.agentDid,
        merchantId: params.merchant,
        amount: params.amount,
        currency: params.currency,
        mandateId: params.cartMandateId,
        completedAt: new Date(),
        mockProcessorResponse: {
          processor: 'MOCK_PROCESSOR',
          authCode: `AUTH_${Math.random().toString(36).substr(2, 9)}`,
          network: 'MOCK_NETWORK'
        },
        mockTransactionId: `mock_${uuidv4()}`
      };

      // Store transaction
      await this.storeTransaction(transaction);

      // Log to audit
      await this.logAudit('payment.completed', transaction);

      return {
        success: true,
        transactionId: transaction.id,
        status: 'completed',
        amount: transaction.amount,
        currency: transaction.currency,
        receipt: {
          url: `https://atp.dev/receipts/${transaction.id}`,
          number: transaction.mockTransactionId
        }
      };
    } else {
      // Simulate failure
      const transaction = {
        id: `txn_${uuidv4()}`,
        protocolType: 'ap2',
        status: 'failed',
        ...params,
        failureReason: 'Simulated payment failure (10% failure rate for testing)'
      };

      await this.storeTransaction(transaction);
      await this.logAudit('payment.failed', transaction);

      return {
        success: false,
        transactionId: transaction.id,
        status: 'failed',
        error: {
          code: 'MOCK_FAILURE',
          message: 'Simulated payment failure',
          details: 'This is a mock payment processor for MVP testing'
        }
      };
    }
  }

  async executeACPPayment(params: ACPPaymentParams): Promise<PaymentResult> {
    // Similar to AP2 but for ACP protocol
    await this.delay(500);
    // ... similar logic
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async storeTransaction(transaction: any): Promise<void> {
    await db.query(`
      INSERT INTO payment_transactions (
        id, protocol_type, status, user_did, agent_did, merchant_id,
        amount, currency, mandate_id, completed_at, failure_reason,
        mock_processor_response, mock_transaction_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `, [/* transaction fields */]);
  }
}
```

**Day 5: Policy Enforcement**
```typescript
// src/services/policy-enforcer.service.ts
export class PolicyEnforcerService {
  async checkTransactionLimits(
    agentDid: string,
    amount: number,
    merchant: string
  ): Promise<PolicyCheckResult> {
    // 1. Get policies for agent
    const policies = await this.getPoliciesForAgent(agentDid);

    // 2. Check max transaction amount
    for (const policy of policies) {
      if (amount > policy.maxTransactionAmount) {
        return {
          allowed: false,
          reason: `Transaction exceeds max amount of ${policy.maxTransactionAmount}`
        };
      }

      // 3. Check daily limit
      const dailySpent = await this.getDailySpending(agentDid);
      if (dailySpent + amount > policy.dailyLimit) {
        return {
          allowed: false,
          reason: `Would exceed daily limit of ${policy.dailyLimit}`
        };
      }

      // 4. Check merchant whitelist
      if (policy.allowedMerchants?.length > 0) {
        if (!policy.allowedMerchants.includes(merchant)) {
          return {
            allowed: false,
            reason: `Merchant ${merchant} not in allowed list`
          };
        }
      }

      // 5. Check if requires approval
      if (policy.requiresApproval && amount > policy.notificationThreshold) {
        return {
          allowed: false,
          reason: 'Requires manual approval',
          requiresApproval: true
        };
      }
    }

    return { allowed: true };
  }
}
```

### Week 3: Integration & Testing

**Day 1-2: Docker & Monitoring**
```yaml
# docker-compose.yml (add to existing)

services:
  # ... existing services ...

  payment-service:
    build:
      context: .
      dockerfile: packages/payment-service/Dockerfile
    ports:
      - "3007:3007"
    environment:
      - NODE_ENV=development
      - PORT=3007
      - DATABASE_URL=postgresql://atp_user:dev_password@postgres:5432/atp_development
      - IDENTITY_SERVICE_URL=http://identity-service:3001
      - CREDENTIALS_SERVICE_URL=http://vc-service:3002
      - AUDIT_SERVICE_URL=http://audit-logger:3005
    depends_on:
      - postgres
      - identity-service
      - vc-service
      - audit-logger
    networks:
      - atp-network
    restart: unless-stopped

volumes:
  # ... existing volumes ...
  payment_data:
```

**Day 3: Monitoring Integration**
```typescript
// Update packages/monitoring-service/src/types/metrics.ts

export interface SystemMetrics {
  // ... existing fields ...

  // Payment Metrics (NEW)
  payments?: {
    totalTransactions: number;
    completedTransactions: number;
    failedTransactions: number;
    totalVolume: number;
    volumeByProtocol: {
      ap2: number;
      acp: number;
    };
    activeMandates: number;
    avgTransactionAmount: number;
  };
}
```

**Day 4-5: Testing**
```bash
# Run integration tests
npm run test:integration

# Test endpoints
curl -X POST http://localhost:3007/ap2/mandates/intent \
  -H "Content-Type: application/json" \
  -d '{
    "userDid": "did:atp:user123",
    "agentDid": "did:atp:agent456",
    "purpose": "Shopping",
    "maxAmount": 500,
    "currency": "USD"
  }'
```

---

## MVP Success Criteria

**Must Have:**
- ✅ Create intent mandates via API
- ✅ Create cart mandates via API
- ✅ Execute mock payments
- ✅ Store transactions in database
- ✅ Query transaction history
- ✅ Basic policy enforcement
- ✅ Integration with identity service
- ✅ Monitoring metrics

**Nice to Have:**
- ⚠️ Rate limiting
- ⚠️ Request caching
- ⚠️ WebSocket events

**Explicitly Out of Scope:**
- ❌ Real payment processing
- ❌ Actual money movement
- ❌ Crypto wallet integration
- ❌ Multi-currency conversion
- ❌ Advanced fraud detection

---

## MVP Deliverables

1. **Working Service**
   - Payment service running on port 3007
   - All endpoints functional
   - Database migrations applied

2. **Documentation**
   - API documentation
   - Integration guide
   - Testing instructions

3. **Demo/Examples**
   - Updated SDK example (08-payment-protocols.js)
   - Postman collection
   - Video walkthrough

4. **Metrics**
   - Service uptime tracking
   - Transaction count
   - Success/failure rates

---

# Phase 2: Full Production (4-6 Weeks)

## 🎯 Production Goals

**Purpose:** Build enterprise-grade payment infrastructure with real money processing

**What Changes from MVP:**
- ✅ Real payment processor integrations (Stripe, PayPal, Coinbase)
- ✅ Actual money movement
- ✅ Multi-currency support
- ✅ Advanced fraud detection
- ✅ PCI DSS compliance
- ✅ Hardware security modules (HSM)
- ✅ High availability (99.99% SLA)
- ✅ Advanced monitoring & alerting

---

## Full Production Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│            (Web, Mobile, Desktop, CLI, APIs)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Load Balancer (HAProxy/NGINX)                │
│                   SSL Termination (TLS 1.3)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    RPC Gateway (Port 3000)                   │
│            Rate Limiting, Request Routing, Auth             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Payment Service (Port 3007) - PRODUCTION             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Layer (Express + TypeScript)                     │  │
│  │  ├─ Rate Limiting (Redis-backed)                    │  │
│  │  ├─ Request Validation (Zod schemas)                │  │
│  │  ├─ Authentication (DID JWT verification)           │  │
│  │  └─ Error Handling (Sentry integration)             │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Business Logic Layer                                 │  │
│  │  ├─ MandateService     (Mandate lifecycle)          │  │
│  │  ├─ PaymentOrchestrator (Route to processors)       │  │
│  │  ├─ FraudDetection     (ML-based scoring)           │  │
│  │  ├─ PolicyEngine       (Advanced rules)             │  │
│  │  └─ WebhookHandler     (Process callbacks)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Payment Processor Adapters                           │  │
│  │  ├─ StripeAdapter      (Cards, ACH, Wallets)        │  │
│  │  ├─ PayPalAdapter      (PayPal accounts)            │  │
│  │  ├─ CoinbaseAdapter    (Crypto: BTC, ETH, USDC)     │  │
│  │  ├─ PlaidAdapter       (Bank transfers)             │  │
│  │  └─ AdyenAdapter       (International cards)        │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Security & Compliance                                 │  │
│  │  ├─ HSM Integration    (Hardware key storage)        │  │
│  │  ├─ PCI Vault          (Tokenize card data)         │  │
│  │  ├─ KYC/AML            (Identity verification)      │  │
│  │  └─ Encryption         (Field-level encryption)     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│   Stripe      │ │   PayPal      │ │   Coinbase    │
│   API         │ │   API         │ │   Commerce    │
└───────────────┘ └───────────────┘ └───────────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Primary (Leader)                   │
│                 Write Operations + Replication               │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
┌──────────────────────┐ ┌──────────────────────┐
│ PostgreSQL Replica 1 │ │ PostgreSQL Replica 2 │
│   Read Operations    │ │   Read Operations    │
└──────────────────────┘ └──────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                Redis Cluster (Caching & Queues)              │
│  ├─ Transaction Cache (Hot data)                            │
│  ├─ Rate Limiting (Token bucket)                            │
│  └─ Job Queue (Background processing)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Production Features

### 1. Real Payment Processing

**Stripe Integration:**
```typescript
// src/adapters/stripe.adapter.ts
import Stripe from 'stripe';

export class StripeAdapter implements PaymentProcessor {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16'
    });
  }

  async processPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      // 1. Create payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency.toLowerCase(),
        payment_method: params.paymentMethodId,
        confirm: true,
        metadata: {
          mandateId: params.mandateId,
          agentDid: params.agentDid,
          userDid: params.userDid
        }
      });

      // 2. Check status
      if (paymentIntent.status === 'succeeded') {
        return {
          success: true,
          transactionId: paymentIntent.id,
          status: 'completed',
          amount: params.amount,
          currency: params.currency,
          processorResponse: paymentIntent
        };
      } else {
        return {
          success: false,
          status: 'failed',
          error: {
            code: paymentIntent.status,
            message: 'Payment not completed'
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
  }

  async refund(transactionId: string, amount?: number): Promise<RefundResult> {
    // Implement refund logic
  }

  async captureWebhook(event: any): Promise<void> {
    // Handle Stripe webhooks
  }
}
```

**Coinbase Commerce (Crypto):**
```typescript
// src/adapters/coinbase.adapter.ts
import { Client, resources } from 'coinbase-commerce-node';

export class CoinbaseAdapter implements PaymentProcessor {
  private client: typeof Client;

  constructor() {
    Client.init(process.env.COINBASE_API_KEY);
    this.client = Client;
  }

  async processPayment(params: PaymentParams): Promise<PaymentResult> {
    try {
      // Create charge
      const chargeData = {
        name: `Payment via ATP`,
        description: `Mandate: ${params.mandateId}`,
        local_price: {
          amount: params.amount.toString(),
          currency: params.currency
        },
        pricing_type: 'fixed_price',
        metadata: {
          mandateId: params.mandateId,
          agentDid: params.agentDid,
          userDid: params.userDid
        }
      };

      const charge = await resources.Charge.create(chargeData);

      // Return hosted URL for user to complete payment
      return {
        success: true,
        transactionId: charge.id,
        status: 'pending',
        hostedUrl: charge.hosted_url,
        expiresAt: charge.expires_at
      };
    } catch (error) {
      return {
        success: false,
        status: 'failed',
        error: {
          code: error.code,
          message: error.message
        }
      };
    }
  }
}
```

### 2. Advanced Fraud Detection

```typescript
// src/services/fraud-detection.service.ts
import * as tf from '@tensorflow/tfjs-node';

export class FraudDetectionService {
  private model: tf.LayersModel;

  async initialize() {
    // Load pre-trained ML model
    this.model = await tf.loadLayersModel('file://./models/fraud-detection/model.json');
  }

  async assessRisk(transaction: PaymentTransaction): Promise<RiskAssessment> {
    // 1. Velocity checks
    const recentTransactions = await this.getRecentTransactions(
      transaction.agentDid,
      '1h'
    );

    // 2. Pattern analysis
    const features = this.extractFeatures(transaction, recentTransactions);

    // 3. ML prediction
    const tensor = tf.tensor2d([features]);
    const prediction = await this.model.predict(tensor) as tf.Tensor;
    const riskScore = (await prediction.data())[0];

    // 4. Rule-based checks
    const rules = await this.applyRules(transaction);

    // 5. Combine scores
    const finalScore = (riskScore * 0.7) + (rules.score * 0.3);

    return {
      riskScore: finalScore,
      level: this.getRiskLevel(finalScore),
      reasons: rules.triggeredRules,
      recommendation: finalScore > 0.8 ? 'block' : finalScore > 0.5 ? 'review' : 'allow'
    };
  }

  private extractFeatures(transaction: any, history: any[]): number[] {
    return [
      transaction.amount,
      history.length, // Transaction frequency
      this.calculateAvgAmount(history),
      this.calculateStdDev(history),
      transaction.merchant === 'new' ? 1 : 0,
      this.hourOfDay(transaction.createdAt),
      // ... more features
    ];
  }

  private async applyRules(transaction: any): Promise<RuleResult> {
    const rules = [];

    // Unusual amount
    if (transaction.amount > 10000) {
      rules.push({ rule: 'high_amount', weight: 0.3 });
    }

    // Unusual time
    const hour = new Date(transaction.createdAt).getHours();
    if (hour < 6 || hour > 22) {
      rules.push({ rule: 'unusual_time', weight: 0.2 });
    }

    // Suspicious merchant
    if (await this.isSuspiciousMerchant(transaction.merchantId)) {
      rules.push({ rule: 'suspicious_merchant', weight: 0.5 });
    }

    const score = rules.reduce((sum, r) => sum + r.weight, 0);
    return { score: Math.min(score, 1.0), triggeredRules: rules };
  }
}
```

### 3. Multi-Currency Support

```typescript
// src/services/currency.service.ts
import axios from 'axios';

export class CurrencyService {
  private rates: Map<string, number> = new Map();
  private lastUpdate: Date;

  async convert(amount: number, from: string, to: string): Promise<number> {
    if (from === to) return amount;

    // Update rates if stale
    if (!this.lastUpdate || Date.now() - this.lastUpdate.getTime() > 3600000) {
      await this.updateRates();
    }

    const fromRate = this.rates.get(from);
    const toRate = this.rates.get(to);

    if (!fromRate || !toRate) {
      throw new Error(`Unsupported currency: ${from} or ${to}`);
    }

    // Convert to USD first, then to target currency
    const usdAmount = amount / fromRate;
    return usdAmount * toRate;
  }

  private async updateRates(): Promise<void> {
    // Use multiple sources for reliability
    const sources = [
      this.fetchFromOpenExchangeRates(),
      this.fetchFromCurrencyLayer(),
      this.fetchFromCryptoCompare() // For crypto rates
    ];

    const results = await Promise.allSettled(sources);

    // Merge rates from successful sources
    for (const result of results) {
      if (result.status === 'fulfilled') {
        for (const [currency, rate] of Object.entries(result.value)) {
          this.rates.set(currency, rate as number);
        }
      }
    }

    this.lastUpdate = new Date();
  }
}
```

### 4. High Availability Setup

```yaml
# docker-compose.production.yml

services:
  # Payment Service - 3 instances for HA
  payment-service-1:
    <<: *payment-service-common
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '2'
          memory: 4G

  payment-service-2:
    <<: *payment-service-common
    deploy:
      replicas: 1

  payment-service-3:
    <<: *payment-service-common
    deploy:
      replicas: 1

  # Load Balancer
  haproxy:
    image: haproxy:2.8
    ports:
      - "443:443"
      - "8404:8404" # Stats
    volumes:
      - ./haproxy.cfg:/usr/local/etc/haproxy/haproxy.cfg:ro
      - ./certs:/etc/ssl/certs:ro
    depends_on:
      - payment-service-1
      - payment-service-2
      - payment-service-3

  # PostgreSQL Primary
  postgres-primary:
    image: postgres:15
    environment:
      POSTGRES_USER: atp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: atp_production
    volumes:
      - pg_primary_data:/var/lib/postgresql/data
    command: postgres -c wal_level=replica -c max_wal_senders=3

  # PostgreSQL Replicas
  postgres-replica-1:
    image: postgres:15
    environment:
      POSTGRES_USER: atp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      PGUSER: replicator
    volumes:
      - pg_replica_1_data:/var/lib/postgresql/data
    command: postgres -c hot_standby=on

  postgres-replica-2:
    image: postgres:15
    environment:
      POSTGRES_USER: atp_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - pg_replica_2_data:/var/lib/postgresql/data
    command: postgres -c hot_standby=on

  # Redis Cluster
  redis-master:
    image: redis:7-alpine
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_master_data:/data

  redis-replica-1:
    image: redis:7-alpine
    command: redis-server --slaveof redis-master 6379 --requirepass ${REDIS_PASSWORD}

  redis-replica-2:
    image: redis:7-alpine
    command: redis-server --slaveof redis-master 6379 --requirepass ${REDIS_PASSWORD}

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3100:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards

  # Log Aggregation
  loki:
    image: grafana/loki:latest
    volumes:
      - loki_data:/loki

volumes:
  pg_primary_data:
  pg_replica_1_data:
  pg_replica_2_data:
  redis_master_data:
  prometheus_data:
  grafana_data:
  loki_data:
```

### 5. Security Hardening

```typescript
// src/security/hsm.integration.ts
import { CloudHSM } from 'aws-sdk';

export class HSMKeyManager {
  private hsm: CloudHSM;

  async signMandate(mandate: PaymentMandate): Promise<string> {
    // Use Hardware Security Module for signing
    const keyId = process.env.HSM_KEY_ID;

    const signature = await this.hsm.sign({
      KeyId: keyId,
      Message: Buffer.from(JSON.stringify(mandate)),
      SigningAlgorithm: 'ECDSA_SHA_256'
    }).promise();

    return signature.Signature.toString('base64');
  }

  async verifySignature(mandate: any, signature: string): Promise<boolean> {
    const keyId = process.env.HSM_KEY_ID;

    const result = await this.hsm.verify({
      KeyId: keyId,
      Message: Buffer.from(JSON.stringify(mandate)),
      Signature: Buffer.from(signature, 'base64'),
      SigningAlgorithm: 'ECDSA_SHA_256'
    }).promise();

    return result.SignatureValid;
  }
}
```

```typescript
// src/security/pci-vault.ts
export class PCIVaultService {
  async tokenizeCard(cardData: CardData): Promise<string> {
    // Tokenize sensitive card data
    // Card data never touches ATP servers
    const response = await axios.post('https://vault.pci-compliant.com/tokenize', {
      cardNumber: cardData.number,
      expiryMonth: cardData.expiryMonth,
      expiryYear: cardData.expiryYear,
      cvv: cardData.cvv
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PCI_VAULT_API_KEY}`
      }
    });

    return response.data.token;
  }

  async detokenize(token: string): Promise<CardData> {
    // Retrieve card data from vault (only when needed for processing)
    const response = await axios.post('https://vault.pci-compliant.com/detokenize', {
      token
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.PCI_VAULT_API_KEY}`
      }
    });

    return response.data;
  }
}
```

---

## Production Implementation Timeline

### Month 1: Payment Processors

**Week 1: Stripe Integration**
- Card payments
- ACH transfers
- Apple/Google Pay
- Webhook handling

**Week 2: PayPal Integration**
- PayPal accounts
- Venmo
- PayPal Credit

**Week 3: Coinbase Commerce**
- Bitcoin
- Ethereum
- USDC/USDT stablecoins
- Webhook handling

**Week 4: Additional Processors**
- Adyen (international)
- Plaid (bank linking)
- Testing & validation

### Month 2: Security & Compliance

**Week 1: HSM Integration**
- AWS CloudHSM setup
- Key management
- Signing operations

**Week 2: PCI DSS Compliance**
- PCI vault integration
- Card data tokenization
- Security audit

**Week 3: KYC/AML**
- Identity verification (Jumio, Onfido)
- Transaction monitoring
- Suspicious activity reporting

**Week 4: Fraud Detection**
- ML model training
- Rule engine
- Real-time scoring

### Month 3: High Availability

**Week 1: Database Replication**
- PostgreSQL primary/replica setup
- Failover automation
- Backup strategy

**Week 2: Load Balancing**
- HAProxy configuration
- Health checks
- SSL termination

**Week 3: Redis Clustering**
- Cache layer
- Session storage
- Job queues

**Week 4: Monitoring & Alerting**
- Prometheus metrics
- Grafana dashboards
- PagerDuty integration

### Month 4-6: Testing & Launch

**Week 1-2: Integration Testing**
- End-to-end tests
- Load testing (10k TPS)
- Chaos engineering

**Week 3-4: Security Audit**
- Penetration testing
- Code review
- Vulnerability scanning

**Week 5-6: Pilot Program**
- Select 5-10 enterprise customers
- Real transaction testing
- Feedback iteration

**Week 7-8: Production Launch**
- Gradual rollout
- Monitor metrics
- 24/7 support ready

---

## Production Success Criteria

### Performance
- ✅ 99.99% uptime (52 minutes downtime/year)
- ✅ <100ms API response time (p99)
- ✅ 10,000 transactions/second capacity
- ✅ <1% payment failure rate

### Security
- ✅ PCI DSS Level 1 compliance
- ✅ SOC 2 Type II certification
- ✅ Zero data breaches
- ✅ <0.1% fraud rate

### Business
- ✅ $100M+ payment volume/month
- ✅ 50+ enterprise customers
- ✅ 99% customer satisfaction
- ✅ <5% churn rate

---

## Cost Estimate

### MVP (2-3 weeks):
- **Development**: $15k-$25k (1 senior dev, 3 weeks)
- **Infrastructure**: $100/month (basic AWS/DO setup)
- **Total**: ~$25k one-time

### Full Production (4-6 months):
- **Development**: $150k-$250k (2-3 devs, 6 months)
- **Infrastructure**: $5k-$10k/month (HA setup, HSM, monitoring)
- **Compliance**: $50k-$100k (audits, certifications)
- **Payment Processing**: Variable (2.9% + $0.30 per transaction)
- **Total**: ~$300k-$400k first year

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| **Payment processor downtime** | Multi-processor failover, circuit breakers |
| **Fraud attacks** | ML-based detection, velocity limits, manual review |
| **Database failure** | PostgreSQL replication, automated failover, backups |
| **DDoS attacks** | CloudFlare, rate limiting, IP blocking |
| **Compliance violations** | Regular audits, automated compliance checks |
| **Key compromise** | HSM storage, key rotation, multi-sig |

---

## Next Steps

1. **Approve MVP Plan** ✅
2. **Start MVP Development** (Week 1 begins)
3. **Deploy MVP** (Week 3)
4. **Gather Feedback** (Week 4-6)
5. **Decision Point**: Full Production or Iterate?

---

**What do you think?** Ready to start the MVP?
