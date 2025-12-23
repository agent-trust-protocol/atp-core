-- ATP™ Quantum-Safe Migration Script
-- ===================================
-- This script adds quantum-safe support to existing ATP databases

-- Add quantum-safe fields to agents table
ALTER TABLE atp_identity.agents 
ADD COLUMN IF NOT EXISTS pqc_public_key TEXT,
ADD COLUMN IF NOT EXISTS algorithm VARCHAR(50) NOT NULL DEFAULT 'ed25519',
ADD COLUMN IF NOT EXISTS is_quantum_safe BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hybrid_mode BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS supported_algorithms TEXT[] DEFAULT ARRAY['ed25519'];

-- Create quantum-safe key pairs table
CREATE TABLE IF NOT EXISTS atp_identity.key_pairs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    did VARCHAR(255) NOT NULL REFERENCES atp_identity.agents(did) ON DELETE CASCADE,
    -- Classical keys
    private_key_encrypted TEXT NOT NULL,
    public_key TEXT NOT NULL,
    -- Quantum-safe keys
    pqc_private_key_encrypted TEXT,
    pqc_public_key TEXT,
    -- Algorithm information
    algorithm VARCHAR(50) NOT NULL DEFAULT 'ed25519',
    is_quantum_safe BOOLEAN NOT NULL DEFAULT FALSE,
    hybrid_mode BOOLEAN NOT NULL DEFAULT FALSE,
    key_version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    rotated_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active'
);

-- Add quantum-safe fields to audit events
ALTER TABLE atp_audit.events 
ADD COLUMN IF NOT EXISTS pqc_signature TEXT,
ADD COLUMN IF NOT EXISTS signature_algorithm VARCHAR(50) DEFAULT 'ed25519',
ADD COLUMN IF NOT EXISTS is_quantum_safe BOOLEAN DEFAULT FALSE;

-- Create new indexes for quantum-safe fields
CREATE INDEX IF NOT EXISTS idx_agents_algorithm ON atp_identity.agents(algorithm);
CREATE INDEX IF NOT EXISTS idx_agents_quantum_safe ON atp_identity.agents(is_quantum_safe);
CREATE INDEX IF NOT EXISTS idx_agents_hybrid_mode ON atp_identity.agents(hybrid_mode);

CREATE INDEX IF NOT EXISTS idx_key_pairs_did ON atp_identity.key_pairs(did);
CREATE INDEX IF NOT EXISTS idx_key_pairs_algorithm ON atp_identity.key_pairs(algorithm);
CREATE INDEX IF NOT EXISTS idx_key_pairs_quantum_safe ON atp_identity.key_pairs(is_quantum_safe);
CREATE INDEX IF NOT EXISTS idx_key_pairs_status ON atp_identity.key_pairs(status);

CREATE INDEX IF NOT EXISTS idx_events_signature_algorithm ON atp_audit.events(signature_algorithm);
CREATE INDEX IF NOT EXISTS idx_events_quantum_safe ON atp_audit.events(is_quantum_safe);

-- Update stored procedure for quantum-safe events
CREATE OR REPLACE FUNCTION atp_audit.add_event(
    p_source VARCHAR(100),
    p_action VARCHAR(100),
    p_resource VARCHAR(255),
    p_actor VARCHAR(255),
    p_details JSONB,
    p_hash VARCHAR(64),
    p_previous_hash VARCHAR(64),
    p_signature TEXT DEFAULT NULL,
    p_pqc_signature TEXT DEFAULT NULL,
    p_signature_algorithm VARCHAR(50) DEFAULT 'ed25519',
    p_is_quantum_safe BOOLEAN DEFAULT FALSE,
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
        hash, previous_hash, signature, pqc_signature, signature_algorithm, is_quantum_safe,
        ipfs_hash, block_number, nonce, encrypted
    ) VALUES (
        new_id, event_id_str, p_source, p_action, p_resource, p_actor, p_details,
        p_hash, p_previous_hash, p_signature, p_pqc_signature, p_signature_algorithm, p_is_quantum_safe,
        p_ipfs_hash, p_block_number, p_nonce, p_encrypted
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

-- Update system agent to quantum-safe
UPDATE atp_identity.agents 
SET 
    algorithm = 'hybrid',
    is_quantum_safe = true,
    hybrid_mode = true,
    supported_algorithms = ARRAY['ed25519', 'crystals-dilithium'],
    metadata = COALESCE(metadata, '{}'::JSONB) || '{"quantumSafe": true}'::JSONB
WHERE did = 'did:atp:staging:system';

-- Grant permissions on new table
GRANT ALL PRIVILEGES ON atp_identity.key_pairs TO atp_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA atp_identity TO atp_user;

-- Log migration completion
SELECT atp_audit.add_event(
    'atp:migration', 
    'quantum_safe_migration_completed', 
    'database:schema', 
    'did:atp:staging:system',
    '{"migration": "quantum-safe", "version": "1.0.0", "timestamp": "' || NOW()::text || '"}'::JSONB,
    encode(sha256('quantum_safe_migration_' || NOW()::text), 'hex'),
    '0000000000000000000000000000000000000000000000000000000000000000',
    'system_signature',
    'system_pqc_signature',
    'hybrid',
    true
);