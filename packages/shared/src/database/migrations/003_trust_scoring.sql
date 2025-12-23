-- Trust Scoring Tables for ATP

-- Agent interactions tracking
CREATE TABLE IF NOT EXISTS agent_interactions (
  id SERIAL PRIMARY KEY,
  agent_did VARCHAR(255) NOT NULL,
  interaction_type VARCHAR(100) NOT NULL,
  success BOOLEAN NOT NULL,
  details JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_interactions_did (agent_did),
  INDEX idx_agent_interactions_created (created_at)
);

-- Agent reputation tracking
CREATE TABLE IF NOT EXISTS agent_reputation (
  id SERIAL PRIMARY KEY,
  agent_did VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('endorsement', 'violation')),
  issuer_did VARCHAR(255) NOT NULL,
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_agent_reputation_did (agent_did),
  INDEX idx_agent_reputation_type (type)
);

-- Trust scores storage
CREATE TABLE IF NOT EXISTS agent_trust_scores (
  agent_did VARCHAR(255) PRIMARY KEY,
  score DECIMAL(3,2) NOT NULL CHECK (score >= 0 AND score <= 1),
  level VARCHAR(20) NOT NULL,
  factors JSONB NOT NULL,
  calculated_at TIMESTAMP NOT NULL,
  recommendations TEXT[],
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trust relationships between agents
CREATE TABLE IF NOT EXISTS agent_trust_relationships (
  id SERIAL PRIMARY KEY,
  trustor_did VARCHAR(255) NOT NULL,
  trustee_did VARCHAR(255) NOT NULL,
  trust_level VARCHAR(20) NOT NULL,
  established_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  metadata JSONB,
  UNIQUE(trustor_did, trustee_did),
  INDEX idx_trust_relationships_trustor (trustor_did),
  INDEX idx_trust_relationships_trustee (trustee_did)
);

-- Create function to update trust score on interaction
CREATE OR REPLACE FUNCTION update_trust_score_on_interaction()
RETURNS TRIGGER AS $$
BEGIN
  -- This is a placeholder - actual implementation would call the trust scoring engine
  -- For now, just update the timestamp
  UPDATE agent_trust_scores 
  SET updated_at = CURRENT_TIMESTAMP 
  WHERE agent_did = NEW.agent_did;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic trust score updates
CREATE TRIGGER trigger_update_trust_score
AFTER INSERT ON agent_interactions
FOR EACH ROW
EXECUTE FUNCTION update_trust_score_on_interaction();