-- ATP Demo Seed Data
-- ==================
-- Run after init-db.sql to populate the database with demo agents,
-- credentials, permissions, and payment data so first-time users see
-- a working system rather than empty dashboards.
--
-- Usage:
--   psql "$DATABASE_URL" -f scripts/seed-demo-data.sql
--
-- Safe to re-run: all inserts use ON CONFLICT DO NOTHING.

-- ────────────────────────────────────────────────────────────────────
-- Demo agent DIDs
-- ────────────────────────────────────────────────────────────────────

INSERT INTO atp_identity.agents (did, public_key, algorithm, trust_level, status, metadata)
VALUES
  (
    'did:atp:demo-user-alice',
    'alice_ed25519_pubkey_base58_placeholder',
    'ed25519',
    'VERIFIED',
    'active',
    '{"displayName": "Alice (Demo User)", "role": "end_user"}'
  ),
  (
    'did:atp:demo-agent-shopper',
    'shopper_ed25519_pubkey_base58_placeholder',
    'ed25519',
    'BASIC',
    'active',
    '{"displayName": "ShopperBot v1 (Demo Agent)", "role": "ai_agent", "capabilities": ["browse", "purchase"]}'
  ),
  (
    'did:atp:demo-agent-researcher',
    'researcher_ed25519_pubkey_base58_placeholder',
    'ed25519',
    'VERIFIED',
    'active',
    '{"displayName": "ResearchAssistant (Demo Agent)", "role": "ai_agent", "capabilities": ["read", "summarise"]}'
  ),
  (
    'did:atp:demo-org-acme',
    'acme_ed25519_pubkey_base58_placeholder',
    'ed25519',
    'ENTERPRISE',
    'active',
    '{"displayName": "ACME Corp (Demo Org)", "role": "organisation"}'
  )
ON CONFLICT (did) DO NOTHING;

INSERT INTO atp_identity.did_documents (did, document, version)
VALUES
  (
    'did:atp:demo-user-alice',
    '{
      "@context": ["https://www.w3.org/ns/did/v1"],
      "id": "did:atp:demo-user-alice",
      "verificationMethod": [{
        "id": "did:atp:demo-user-alice#key-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:atp:demo-user-alice",
        "publicKeyMultibase": "alice_ed25519_pubkey_base58_placeholder"
      }],
      "authentication": ["did:atp:demo-user-alice#key-1"]
    }',
    1
  ),
  (
    'did:atp:demo-agent-shopper',
    '{
      "@context": ["https://www.w3.org/ns/did/v1"],
      "id": "did:atp:demo-agent-shopper",
      "verificationMethod": [{
        "id": "did:atp:demo-agent-shopper#key-1",
        "type": "Ed25519VerificationKey2020",
        "controller": "did:atp:demo-agent-shopper",
        "publicKeyMultibase": "shopper_ed25519_pubkey_base58_placeholder"
      }],
      "authentication": ["did:atp:demo-agent-shopper#key-1"]
    }',
    1
  )
ON CONFLICT (did) DO NOTHING;

-- ────────────────────────────────────────────────────────────────────
-- Demo credential schemas
-- ────────────────────────────────────────────────────────────────────

INSERT INTO atp_credentials.schemas (name, description, schema, version, issuer_did, is_active)
VALUES
  (
    'AgentIdentityCredential',
    'Verifiable credential certifying an AI agent''s identity and basic capabilities',
    '{
      "$schema": "https://json-schema.org/draft/2020-12",
      "type": "object",
      "required": ["agentDid", "agentName", "capabilities"],
      "properties": {
        "agentDid":    { "type": "string" },
        "agentName":   { "type": "string" },
        "capabilities":{ "type": "array", "items": { "type": "string" } }
      }
    }',
    '1.0.0',
    'did:atp:demo-org-acme',
    TRUE
  ),
  (
    'PurchaseAuthorizationCredential',
    'Authorises an AI agent to make purchases on behalf of a user up to a spending limit',
    '{
      "$schema": "https://json-schema.org/draft/2020-12",
      "type": "object",
      "required": ["userDid", "agentDid", "maxAmount", "currency"],
      "properties": {
        "userDid":   { "type": "string" },
        "agentDid":  { "type": "string" },
        "maxAmount": { "type": "number", "minimum": 0 },
        "currency":  { "type": "string", "enum": ["USD", "EUR", "GBP"] }
      }
    }',
    '1.0.0',
    'did:atp:demo-org-acme',
    TRUE
  ),
  (
    'ResearchAccessCredential',
    'Grants read-only access to research datasets and APIs',
    '{
      "$schema": "https://json-schema.org/draft/2020-12",
      "type": "object",
      "required": ["agentDid", "accessLevel"],
      "properties": {
        "agentDid":    { "type": "string" },
        "accessLevel": { "type": "string", "enum": ["public", "restricted", "confidential"] }
      }
    }',
    '1.0.0',
    'did:atp:demo-org-acme',
    TRUE
  )
ON CONFLICT DO NOTHING;

-- Demo issued credentials
INSERT INTO atp_credentials.credentials (
  credential_id, issuer_did, subject_did, type, claims,
  status, issued_at, expires_at
)
SELECT
  'vc:demo:agent-identity-shopper',
  'did:atp:demo-org-acme',
  'did:atp:demo-agent-shopper',
  'AgentIdentityCredential',
  '{"agentDid": "did:atp:demo-agent-shopper", "agentName": "ShopperBot v1", "capabilities": ["browse", "purchase"]}',
  'active',
  NOW(),
  NOW() + INTERVAL '1 year'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_credentials.credentials WHERE credential_id = 'vc:demo:agent-identity-shopper'
);

INSERT INTO atp_credentials.credentials (
  credential_id, issuer_did, subject_did, type, claims,
  status, issued_at, expires_at
)
SELECT
  'vc:demo:purchase-auth-shopper',
  'did:atp:demo-org-acme',
  'did:atp:demo-agent-shopper',
  'PurchaseAuthorizationCredential',
  '{"userDid": "did:atp:demo-user-alice", "agentDid": "did:atp:demo-agent-shopper", "maxAmount": 500, "currency": "USD"}',
  'active',
  NOW(),
  NOW() + INTERVAL '90 days'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_credentials.credentials WHERE credential_id = 'vc:demo:purchase-auth-shopper'
);

-- ────────────────────────────────────────────────────────────────────
-- Demo permissions
-- ────────────────────────────────────────────────────────────────────

-- Role: agent (basic shopping agent role)
INSERT INTO atp_permissions.roles (name, description, is_system, metadata)
VALUES
  ('agent:shopper',    'Shopping agent with purchase capabilities',   FALSE, '{"demo": true}'),
  ('agent:researcher', 'Research agent with read-only data access',    FALSE, '{"demo": true}'),
  ('org:admin',        'Organisation administrator',                    FALSE, '{"demo": true}')
ON CONFLICT (name) DO NOTHING;

-- Grants for demo shopper agent
INSERT INTO atp_permissions.grants (
  subject_did, resource, action, conditions, granted_by, expires_at, status
)
SELECT
  'did:atp:demo-agent-shopper',
  'marketplace:*',
  'purchase',
  '{"maxAmount": 500, "currency": "USD"}',
  'did:atp:demo-user-alice',
  NOW() + INTERVAL '90 days',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_permissions.grants
  WHERE subject_did = 'did:atp:demo-agent-shopper'
    AND resource = 'marketplace:*'
    AND action = 'purchase'
);

INSERT INTO atp_permissions.grants (
  subject_did, resource, action, conditions, granted_by, expires_at, status
)
SELECT
  'did:atp:demo-agent-researcher',
  'dataset:public:*',
  'read',
  '{}',
  'did:atp:demo-org-acme',
  NOW() + INTERVAL '1 year',
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_permissions.grants
  WHERE subject_did = 'did:atp:demo-agent-researcher'
    AND resource = 'dataset:public:*'
    AND action = 'read'
);

-- ────────────────────────────────────────────────────────────────────
-- Demo audit events (seed a short chain so the dashboard is not empty)
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  genesis_hash  VARCHAR(64) := ENCODE(DIGEST('genesis:atp:demo', 'sha256'), 'hex');
  event1_hash   VARCHAR(64);
  event2_hash   VARCHAR(64);
BEGIN
  -- Only seed if chain is empty
  IF (SELECT COUNT(*) FROM atp_audit.events) = 0 THEN
    event1_hash := ENCODE(DIGEST(genesis_hash || 'did:atp:demo-user-alice:REGISTER', 'sha256'), 'hex');
    event2_hash := ENCODE(DIGEST(event1_hash  || 'did:atp:demo-agent-shopper:GRANT', 'sha256'), 'hex');

    INSERT INTO atp_audit.events (
      event_id, source, action, resource, actor, details,
      hash, previous_hash, block_number, nonce, encrypted
    ) VALUES
      (
        'evt_demo_0001',
        'identity-service',
        'REGISTER',
        'did:atp:demo-user-alice',
        'system',
        '{"message": "Demo user Alice registered", "demo": true}',
        event1_hash,
        genesis_hash,
        1,
        'demo-nonce-0001',
        FALSE
      ),
      (
        'evt_demo_0002',
        'permission-service',
        'GRANT',
        'marketplace:*',
        'did:atp:demo-user-alice',
        '{"message": "Purchase permission granted to ShopperBot", "agentDid": "did:atp:demo-agent-shopper", "demo": true}',
        event2_hash,
        event1_hash,
        2,
        'demo-nonce-0002',
        FALSE
      );

    UPDATE atp_audit.chain_state SET
      last_block_number = 2,
      last_block_hash   = event2_hash,
      chain_length      = 2,
      last_verification = NOW()
    WHERE id = 1;
  END IF;
END $$;

-- ────────────────────────────────────────────────────────────────────
-- Demo payment data
-- ────────────────────────────────────────────────────────────────────

INSERT INTO atp_payments.payment_methods (user_did, type, details, is_default, status)
SELECT
  'did:atp:demo-user-alice',
  'card',
  '{"last4": "4242", "brand": "Visa", "expiryMonth": 12, "expiryYear": 2027}',
  TRUE,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_payments.payment_methods
  WHERE user_did = 'did:atp:demo-user-alice' AND type = 'card'
);

INSERT INTO atp_payments.intent_mandates (
  user_did, agent_did, purpose, max_amount, currency,
  restrictions, status, expires_at
)
SELECT
  'did:atp:demo-user-alice',
  'did:atp:demo-agent-shopper',
  'Online shopping for household supplies',
  500.00,
  'USD',
  '{"categories": ["grocery", "household"], "dailyLimit": 100}',
  'active',
  NOW() + INTERVAL '90 days'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_payments.intent_mandates
  WHERE user_did  = 'did:atp:demo-user-alice'
    AND agent_did = 'did:atp:demo-agent-shopper'
    AND status    = 'active'
);

INSERT INTO atp_payments.payment_policies (
  name, agent_did, max_transaction_amount, daily_limit,
  monthly_limit, allowed_categories, requires_approval, status
)
SELECT
  'ShopperBot Default Policy',
  'did:atp:demo-agent-shopper',
  200.00,
  100.00,
  500.00,
  ARRAY['grocery', 'household', 'electronics'],
  FALSE,
  'active'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_payments.payment_policies
  WHERE agent_did = 'did:atp:demo-agent-shopper' AND status = 'active'
);

-- Sample completed transaction
INSERT INTO atp_payments.transactions (
  protocol_type, status, user_did, agent_did, merchant_id,
  amount, currency, mock_transaction_id, mock_success,
  created_at, completed_at
)
SELECT
  'ap2',
  'completed',
  'did:atp:demo-user-alice',
  'did:atp:demo-agent-shopper',
  'merchant:demo-grocery-store',
  42.99,
  'USD',
  'mock_txn_demo_001',
  TRUE,
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours' + INTERVAL '3 seconds'
WHERE NOT EXISTS (
  SELECT 1 FROM atp_payments.transactions WHERE mock_transaction_id = 'mock_txn_demo_001'
);

-- ────────────────────────────────────────────────────────────────────
-- Done
-- ────────────────────────────────────────────────────────────────────

SELECT 'Demo seed data loaded successfully.' AS status;
