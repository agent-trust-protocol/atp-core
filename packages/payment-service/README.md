# ATP Payment Service (MVP)

Payment service implementing **Google AP2** (Agent Payments Protocol) and **OpenAI ACP** (Agentic Commerce Protocol).

## ⚠️ MVP Mode

This is an **MVP (Minimum Viable Product)** implementation:
- ✅ All APIs functional
- ✅ Database persistence
- ✅ Mock payment processing
- ❌ **NO REAL MONEY** is processed
- ❌ No actual payment processor integrations

Perfect for:
- Testing the SDK
- Demonstrating payment flows
- Validating API design
- Developer feedback

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL running
- Database migration applied

### Run Locally

```bash
# Install dependencies
cd packages/payment-service
npm install

# Set environment variables
export DATABASE_URL="postgresql://atp_user:dev_password@localhost:5432/atp_development"
export PORT=3009

# Run in development mode
npm run dev

# Or build and run
npm run build
npm start
```

### Run with Docker

```bash
# From project root
docker-compose up payment-service
```

Service will be available at: `http://localhost:3009`

## 📡 API Endpoints

### Health Check
```
GET /health
```

### AP2 (Agent Payments Protocol)

**Create Intent Mandate:**
```
POST /ap2/mandates/intent
{
  "userDid": "did:atp:user123",
  "agentDid": "did:atp:agent456",
  "purpose": "Shopping assistant",
  "maxAmount": 500,
  "currency": "USD"
}
```

**Create Cart Mandate:**
```
POST /ap2/mandates/cart
{
  "intentMandateId": "mandate_intent_...",
  "merchant": "etsy.com",
  "items": [...],
  "total": 49.99,
  "currency": "USD"
}
```

**Execute Payment:**
```
POST /ap2/payments/execute
{
  "cartMandateId": "mandate_cart_...",
  "paymentMethod": {...}
}
```

**Get Mandate:**
```
GET /ap2/mandates/:id
```

**Revoke Mandate:**
```
POST /ap2/mandates/:id/revoke
```

### ACP (Agentic Commerce Protocol)

**Create Checkout:**
```
POST /acp/checkout/create
{
  "merchantId": "merchant-123",
  "agentDid": "did:atp:agent456",
  "items": [...]
}
```

**Complete Checkout:**
```
POST /acp/checkout/complete
{
  "sessionId": "acp_sess_...",
  "paymentMethodId": "pm-123"
}
```

### Payment Management

**Create Policy:**
```
POST /payments/policies
{
  "name": "Shopping Limits",
  "agentDid": "did:atp:agent456",
  "maxTransactionAmount": 100
}
```

**Query Transactions:**
```
GET /payments/transactions?agentDid=did:atp:agent456
```

## 🗄️ Database Schema

Tables created by migration `004_payments.sql`:
- `payment_mandates` - Intent & cart mandates
- `payment_transactions` - Transaction records
- `payment_methods` - User payment methods
- `payment_policies` - Agent spending policies
- `acp_checkout_sessions` - ACP checkout sessions
- `agent_spending` - Spending tracking

## 🧪 Testing

```bash
# Example: Create intent mandate
curl -X POST http://localhost:3009/ap2/mandates/intent \
  -H "Content-Type: application/json" \
  -d '{
    "userDid": "did:atp:user123",
    "agentDid": "did:atp:agent456",
    "purpose": "Test mandate",
    "maxAmount": 100,
    "currency": "USD"
  }'
```

## 📊 Mock Payment Behavior

The mock processor simulates realistic payment scenarios:
- **90% success rate** - Most payments succeed
- **10% failure rate** - Random failures (insufficient funds, card declined, etc.)
- **300-1000ms delay** - Realistic network latency
- **Transaction records** - All attempts logged to database

## 🔄 Next Steps (Full Production)

To move from MVP to production:

1. **Real Payment Processors**
   - Integrate Stripe for cards
   - Integrate Coinbase for crypto
   - Integrate PayPal for accounts

2. **Security**
   - HSM for key management
   - PCI DSS compliance
   - Fraud detection ML model

3. **High Availability**
   - Load balancing
   - Database replication
   - Redis caching

4. **Monitoring**
   - Prometheus metrics
   - Grafana dashboards
   - Alert system

## 📚 Documentation

- [Implementation Plan](../../PAYMENT_SERVICE_IMPLEMENTATION_PLAN.md)
- [Gap Analysis](../../PAYMENT_SERVICE_GAP_ANALYSIS.md)
- [Value Proposition](../../PAYMENT_PROTOCOLS_VALUE_PROPOSITION.md)

## 🤝 Contributing

This is MVP code. Contributions welcome for:
- Bug fixes
- API improvements
- Documentation
- Test coverage

## 📄 License

Apache 2.0 - Same as ATP project
