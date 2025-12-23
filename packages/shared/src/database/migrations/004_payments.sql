-- Payment Protocol Tables for ATP (AP2 & ACP)
-- Migration: 004_payments

-- Payment mandates (Intent & Cart) for AP2
CREATE TABLE IF NOT EXISTS payment_mandates (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(20) NOT NULL CHECK (type IN ('intent', 'cart')),

  -- Common fields
  user_did VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired', 'used')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Intent mandate fields
  purpose TEXT,
  max_amount DECIMAL(20,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',
  restrictions JSONB,
  expires_at TIMESTAMP,
  revoked_at TIMESTAMP,

  -- Cart mandate fields (NULL for intent mandates)
  intent_mandate_id VARCHAR(255),
  merchant VARCHAR(255),
  items JSONB,
  total DECIMAL(20,2),
  cart_hash VARCHAR(255),

  -- Verifiable credential
  verifiable_credential JSONB,

  -- Foreign key
  FOREIGN KEY (intent_mandate_id) REFERENCES payment_mandates(id) ON DELETE RESTRICT,

  -- Validation constraint
  CONSTRAINT mandate_type_check CHECK (
    (type = 'intent' AND intent_mandate_id IS NULL AND purpose IS NOT NULL) OR
    (type = 'cart' AND intent_mandate_id IS NOT NULL AND items IS NOT NULL)
  )
);

-- Payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(255) PRIMARY KEY,
  protocol_type VARCHAR(10) NOT NULL CHECK (protocol_type IN ('ap2', 'acp')),
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),

  -- Identity
  user_did VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,
  merchant_id VARCHAR(255) NOT NULL,

  -- Amount
  amount DECIMAL(20,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,

  -- References
  mandate_id VARCHAR(255),
  checkout_session_id VARCHAR(255),
  payment_method_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,

  -- Failure handling
  failure_reason TEXT,
  retry_count INT DEFAULT 0,

  -- Metadata
  metadata JSONB,

  -- MVP mock processor fields
  mock_processor_response JSONB,
  mock_transaction_id VARCHAR(255),
  mock_success BOOLEAN,

  -- Foreign key
  FOREIGN KEY (mandate_id) REFERENCES payment_mandates(id) ON DELETE RESTRICT
);

-- Payment methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id VARCHAR(255) PRIMARY KEY,
  user_did VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('card', 'bank', 'crypto', 'stablecoin')),

  -- Tokenized details (PCI-safe)
  details JSONB NOT NULL,

  -- Status
  is_default BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'blocked')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP,
  last_used_at TIMESTAMP,

  -- Metadata
  metadata JSONB
);

-- Payment policies
CREATE TABLE IF NOT EXISTS payment_policies (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,

  -- Limits
  max_transaction_amount DECIMAL(20,2) NOT NULL,
  daily_limit DECIMAL(20,2),
  monthly_limit DECIMAL(20,2),

  -- Restrictions
  allowed_merchants TEXT[],
  allowed_categories TEXT[],
  blocked_merchants TEXT[],

  -- Approval rules
  requires_approval BOOLEAN DEFAULT true,
  notification_threshold DECIMAL(20,2),

  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  metadata JSONB
);

-- ACP checkout sessions
CREATE TABLE IF NOT EXISTS acp_checkout_sessions (
  id VARCHAR(255) PRIMARY KEY,
  merchant_id VARCHAR(255) NOT NULL,
  agent_did VARCHAR(255) NOT NULL,

  -- Status
  status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'pending', 'completed', 'expired', 'cancelled')),

  -- Items
  items JSONB NOT NULL,

  -- Pricing
  subtotal DECIMAL(20,2) NOT NULL,
  tax DECIMAL(20,2),
  shipping DECIMAL(20,2),
  total DECIMAL(20,2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'USD',

  -- Addresses
  shipping_address JSONB,
  billing_address JSONB,

  -- Customer
  customer_email VARCHAR(255),

  -- Payment
  payment_intent VARCHAR(255),
  shared_payment_token VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,

  -- Metadata
  metadata JSONB
);

-- Spending tracking for policy enforcement
CREATE TABLE IF NOT EXISTS agent_spending (
  id SERIAL PRIMARY KEY,
  agent_did VARCHAR(255) NOT NULL,
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('daily', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_spent DECIMAL(20,2) DEFAULT 0,
  transaction_count INT DEFAULT 0,
  last_transaction_at TIMESTAMP,

  UNIQUE(agent_did, period_type, period_start)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mandates_user ON payment_mandates(user_did);
CREATE INDEX IF NOT EXISTS idx_mandates_agent ON payment_mandates(agent_did);
CREATE INDEX IF NOT EXISTS idx_mandates_status ON payment_mandates(status);
CREATE INDEX IF NOT EXISTS idx_mandates_created ON payment_mandates(created_at);
CREATE INDEX IF NOT EXISTS idx_mandates_type ON payment_mandates(type);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON payment_transactions(user_did);
CREATE INDEX IF NOT EXISTS idx_transactions_agent ON payment_transactions(agent_did);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_merchant ON payment_transactions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_transactions_mandate ON payment_transactions(mandate_id);

CREATE INDEX IF NOT EXISTS idx_methods_user ON payment_methods(user_did);
CREATE INDEX IF NOT EXISTS idx_methods_status ON payment_methods(status);
CREATE INDEX IF NOT EXISTS idx_methods_default ON payment_methods(user_did, is_default) WHERE is_default = true;

CREATE INDEX IF NOT EXISTS idx_policies_agent ON payment_policies(agent_did);
CREATE INDEX IF NOT EXISTS idx_policies_status ON payment_policies(status);

CREATE INDEX IF NOT EXISTS idx_sessions_agent ON acp_checkout_sessions(agent_did);
CREATE INDEX IF NOT EXISTS idx_sessions_merchant ON acp_checkout_sessions(merchant_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON acp_checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON acp_checkout_sessions(created_at);

CREATE INDEX IF NOT EXISTS idx_spending_agent ON agent_spending(agent_did);
CREATE INDEX IF NOT EXISTS idx_spending_period ON agent_spending(period_start, period_end);

-- Trigger to update spending tracking
CREATE OR REPLACE FUNCTION update_agent_spending()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    -- Update daily spending
    INSERT INTO agent_spending (agent_did, period_type, period_start, period_end, total_spent, transaction_count, last_transaction_at)
    VALUES (
      NEW.agent_did,
      'daily',
      CURRENT_DATE,
      CURRENT_DATE,
      NEW.amount,
      1,
      NEW.completed_at
    )
    ON CONFLICT (agent_did, period_type, period_start)
    DO UPDATE SET
      total_spent = agent_spending.total_spent + NEW.amount,
      transaction_count = agent_spending.transaction_count + 1,
      last_transaction_at = NEW.completed_at;

    -- Update monthly spending
    INSERT INTO agent_spending (agent_did, period_type, period_start, period_end, total_spent, transaction_count, last_transaction_at)
    VALUES (
      NEW.agent_did,
      'monthly',
      DATE_TRUNC('month', CURRENT_DATE)::DATE,
      (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day')::DATE,
      NEW.amount,
      1,
      NEW.completed_at
    )
    ON CONFLICT (agent_did, period_type, period_start)
    DO UPDATE SET
      total_spent = agent_spending.total_spent + NEW.amount,
      transaction_count = agent_spending.transaction_count + 1,
      last_transaction_at = NEW.completed_at;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_agent_spending
AFTER INSERT OR UPDATE ON payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_agent_spending();

-- Comments
COMMENT ON TABLE payment_mandates IS 'AP2 payment mandates (intent and cart) with verifiable credentials';
COMMENT ON TABLE payment_transactions IS 'Payment transaction records for both AP2 and ACP protocols';
COMMENT ON TABLE payment_methods IS 'User payment methods with tokenized details';
COMMENT ON TABLE payment_policies IS 'Agent spending policies and limits';
COMMENT ON TABLE acp_checkout_sessions IS 'OpenAI ACP checkout sessions';
COMMENT ON TABLE agent_spending IS 'Spending tracking for policy enforcement';
