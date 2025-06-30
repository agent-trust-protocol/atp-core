-- ATP™ Staging Database Initialization
-- =====================================

-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ATP schemas
CREATE SCHEMA IF NOT EXISTS atp_identity;
CREATE SCHEMA IF NOT EXISTS atp_credentials;
CREATE SCHEMA IF NOT EXISTS atp_permissions;
CREATE SCHEMA IF NOT EXISTS atp_audit;
CREATE SCHEMA IF NOT EXISTS atp_metrics;

-- Set default permissions
GRANT USAGE ON SCHEMA atp_identity TO atp_user;
GRANT USAGE ON SCHEMA atp_credentials TO atp_user;
GRANT USAGE ON SCHEMA atp_permissions TO atp_user;
GRANT USAGE ON SCHEMA atp_audit TO atp_user;
GRANT USAGE ON SCHEMA atp_metrics TO atp_user;

GRANT CREATE ON SCHEMA atp_identity TO atp_user;
GRANT CREATE ON SCHEMA atp_credentials TO atp_user;
GRANT CREATE ON SCHEMA atp_permissions TO atp_user;
GRANT CREATE ON SCHEMA atp_audit TO atp_user;
GRANT CREATE ON SCHEMA atp_metrics TO atp_user;

-- Identity Management Tables
CREATE TABLE IF NOT EXISTS atp_identity.agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    did VARCHAR(255) UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    trust_level VARCHAR(50) NOT NULL DEFAULT 'BASIC',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS atp_identity.did_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    did VARCHAR(255) UNIQUE NOT NULL,
    document JSONB NOT NULL,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Multi-Factor Authentication Tables
CREATE TABLE IF NOT EXISTS atp_identity.mfa_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    did VARCHAR(255) NOT NULL REFERENCES atp_identity.agents(did) ON DELETE CASCADE,
    method VARCHAR(50) NOT NULL, -- 'totp', 'hardware', 'sms', 'email'
    secret_encrypted TEXT, -- For TOTP secrets
    backup_codes_encrypted TEXT, -- JSON array of encrypted backup codes
    hardware_public_key TEXT, -- For hardware keys (FIDO2/WebAuthn)
    hardware_challenge TEXT, -- Temporary challenge data
    qr_code TEXT, -- QR code URL for TOTP setup
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'disabled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    last_used_at TIMESTAMP WITH TIME ZONE,
    disabled_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(did, method)
);

CREATE TABLE IF NOT EXISTS atp_identity.mfa_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    did VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'setup', 'verification_success', 'verification_failed', 'disabled'
    method VARCHAR(50) NOT NULL, -- 'totp', 'backup', 'hardware'
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- Verifiable Credentials Tables
CREATE TABLE IF NOT EXISTS atp_credentials.credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credential_id VARCHAR(255) UNIQUE NOT NULL,
    issuer_did VARCHAR(255) NOT NULL,
    subject_did VARCHAR(255) NOT NULL,
    credential_type VARCHAR(100) NOT NULL,
    credential_data JSONB NOT NULL,
    proof JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS atp_credentials.schemas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schema_id VARCHAR(255) UNIQUE NOT NULL,
    schema_name VARCHAR(100) NOT NULL,
    schema_version VARCHAR(20) NOT NULL,
    schema_definition JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permissions and Access Control Tables
CREATE TABLE IF NOT EXISTS atp_permissions.policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    policy_document JSONB NOT NULL,
    trust_level_required VARCHAR(50) NOT NULL,
    created_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS atp_permissions.grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subject_did VARCHAR(255) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    policy_id VARCHAR(255) REFERENCES atp_permissions.policies(policy_id),
    granted_by VARCHAR(255) NOT NULL,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Audit and Logging Tables
CREATE TABLE IF NOT EXISTS atp_audit.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(255) NOT NULL,
    actor VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB,
    hash VARCHAR(64) NOT NULL,
    previous_hash VARCHAR(64),
    signature TEXT,
    ipfs_hash VARCHAR(255),
    block_number INTEGER,
    nonce VARCHAR(255),
    encrypted BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS atp_audit.chain_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    last_block_number INTEGER DEFAULT 0,
    last_block_hash VARCHAR(64),
    chain_length INTEGER DEFAULT 0,
    last_verification TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    integrity_status VARCHAR(20) DEFAULT 'valid'
);

-- Metrics and Analytics Tables
CREATE TABLE IF NOT EXISTS atp_metrics.service_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(15,6) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    labels JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS atp_metrics.api_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service VARCHAR(100) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms INTEGER NOT NULL,
    user_agent TEXT,
    ip_address INET,
    request_size INTEGER,
    response_size INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agents_did ON atp_identity.agents(did);
CREATE INDEX IF NOT EXISTS idx_agents_trust_level ON atp_identity.agents(trust_level);
CREATE INDEX IF NOT EXISTS idx_agents_status ON atp_identity.agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_created_at ON atp_identity.agents(created_at);

CREATE INDEX IF NOT EXISTS idx_mfa_configs_did ON atp_identity.mfa_configs(did);
CREATE INDEX IF NOT EXISTS idx_mfa_configs_method ON atp_identity.mfa_configs(method);
CREATE INDEX IF NOT EXISTS idx_mfa_configs_status ON atp_identity.mfa_configs(status);
CREATE INDEX IF NOT EXISTS idx_mfa_configs_last_used ON atp_identity.mfa_configs(last_used_at);

CREATE INDEX IF NOT EXISTS idx_mfa_audit_did ON atp_identity.mfa_audit_log(did);
CREATE INDEX IF NOT EXISTS idx_mfa_audit_action ON atp_identity.mfa_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_mfa_audit_timestamp ON atp_identity.mfa_audit_log(timestamp);

CREATE INDEX IF NOT EXISTS idx_credentials_issuer ON atp_credentials.credentials(issuer_did);
CREATE INDEX IF NOT EXISTS idx_credentials_subject ON atp_credentials.credentials(subject_did);
CREATE INDEX IF NOT EXISTS idx_credentials_type ON atp_credentials.credentials(credential_type);
CREATE INDEX IF NOT EXISTS idx_credentials_status ON atp_credentials.credentials(status);

CREATE INDEX IF NOT EXISTS idx_grants_subject ON atp_permissions.grants(subject_did);
CREATE INDEX IF NOT EXISTS idx_grants_resource ON atp_permissions.grants(resource);
CREATE INDEX IF NOT EXISTS idx_grants_status ON atp_permissions.grants(status);

CREATE INDEX IF NOT EXISTS idx_events_source ON atp_audit.events(source);
CREATE INDEX IF NOT EXISTS idx_events_action ON atp_audit.events(action);
CREATE INDEX IF NOT EXISTS idx_events_actor ON atp_audit.events(actor);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON atp_audit.events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_block_number ON atp_audit.events(block_number);

CREATE INDEX IF NOT EXISTS idx_metrics_service ON atp_metrics.service_metrics(service_name);
CREATE INDEX IF NOT EXISTS idx_metrics_name ON atp_metrics.service_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON atp_metrics.service_metrics(timestamp);

CREATE INDEX IF NOT EXISTS idx_api_requests_service ON atp_metrics.api_requests(service);
CREATE INDEX IF NOT EXISTS idx_api_requests_endpoint ON atp_metrics.api_requests(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_requests_timestamp ON atp_metrics.api_requests(timestamp);

-- Insert initial data
INSERT INTO atp_identity.agents (did, public_key, trust_level, metadata) VALUES
('did:atp:staging:system', 'staging-system-public-key', 'ENTERPRISE', '{"name":"ATP Staging System","type":"system","environment":"staging"}')
ON CONFLICT (did) DO NOTHING;

INSERT INTO atp_permissions.policies (policy_id, name, description, policy_document, trust_level_required, created_by) VALUES
('atp:policy:public-read', 'Public Read Access', 'Allow read access to public resources', '{"effect":"allow","actions":["read"],"resources":["public:*"]}', 'BASIC', 'did:atp:staging:system'),
('atp:policy:verified-write', 'Verified Write Access', 'Allow write access for verified agents', '{"effect":"allow","actions":["read","write"],"resources":["protected:*"]}', 'VERIFIED', 'did:atp:staging:system'),
('atp:policy:admin-full', 'Full Admin Access', 'Full administrative access', '{"effect":"allow","actions":["*"],"resources":["*"]}', 'ENTERPRISE', 'did:atp:staging:system')
ON CONFLICT (policy_id) DO NOTHING;

INSERT INTO atp_audit.chain_state (id, last_block_number, last_block_hash, chain_length, integrity_status) VALUES
(1, 0, '0000000000000000000000000000000000000000000000000000000000000000', 0, 'valid')
ON CONFLICT (id) DO UPDATE SET 
    last_verification = NOW();

-- Create views for common queries
CREATE OR REPLACE VIEW atp_identity.active_agents AS
SELECT * FROM atp_identity.agents WHERE status = 'active';

CREATE OR REPLACE VIEW atp_credentials.active_credentials AS
SELECT * FROM atp_credentials.credentials WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW());

CREATE OR REPLACE VIEW atp_permissions.active_grants AS
SELECT * FROM atp_permissions.grants WHERE status = 'active' AND (expires_at IS NULL OR expires_at > NOW());

CREATE OR REPLACE VIEW atp_audit.recent_events AS
SELECT * FROM atp_audit.events WHERE timestamp > NOW() - INTERVAL '24 hours' ORDER BY timestamp DESC;

-- Grant permissions on views
GRANT SELECT ON atp_identity.active_agents TO atp_user;
GRANT SELECT ON atp_credentials.active_credentials TO atp_user;
GRANT SELECT ON atp_permissions.active_grants TO atp_user;
GRANT SELECT ON atp_audit.recent_events TO atp_user;

-- Create stored procedures for common operations
CREATE OR REPLACE FUNCTION atp_audit.add_event(
    p_source VARCHAR(100),
    p_action VARCHAR(100),
    p_resource VARCHAR(255),
    p_actor VARCHAR(255),
    p_details JSONB,
    p_hash VARCHAR(64),
    p_previous_hash VARCHAR(64),
    p_signature TEXT DEFAULT NULL,
    p_ipfs_hash VARCHAR(255) DEFAULT NULL,
    p_block_number INTEGER DEFAULT NULL,
    p_nonce VARCHAR(255) DEFAULT NULL,
    p_encrypted BOOLEAN DEFAULT FALSE
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
    event_id_str VARCHAR(255);
BEGIN
    new_id := uuid_generate_v4();
    event_id_str := 'evt_' || REPLACE(new_id::text, '-', '');
    
    INSERT INTO atp_audit.events (
        id, event_id, source, action, resource, actor, details,
        hash, previous_hash, signature, ipfs_hash, block_number, nonce, encrypted
    ) VALUES (
        new_id, event_id_str, p_source, p_action, p_resource, p_actor, p_details,
        p_hash, p_previous_hash, p_signature, p_ipfs_hash, p_block_number, p_nonce, p_encrypted
    );
    
    -- Update chain state
    UPDATE atp_audit.chain_state SET
        last_block_number = COALESCE(p_block_number, last_block_number),
        last_block_hash = p_hash,
        chain_length = chain_length + 1,
        last_verification = NOW()
    WHERE id = 1;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION atp_audit.add_event TO atp_user;

-- Final permissions grant
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA atp_identity TO atp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA atp_credentials TO atp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA atp_permissions TO atp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA atp_audit TO atp_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA atp_metrics TO atp_user;

GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA atp_identity TO atp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA atp_credentials TO atp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA atp_permissions TO atp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA atp_audit TO atp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA atp_metrics TO atp_user;