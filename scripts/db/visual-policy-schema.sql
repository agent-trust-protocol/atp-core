-- Visual Trust Policy Editor Database Schema
-- ==========================================
-- 
-- This schema supports the comprehensive Visual Trust Policy Editor
-- with full support for complex conditions, actions, logical expressions,
-- multi-tenancy, version control, and audit trails.

-- Create visual policy tables in the atp_permissions schema
-- ========================================================

-- Main visual policies table
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id VARCHAR(255) UNIQUE NOT NULL, -- User-friendly policy ID
    name VARCHAR(100) NOT NULL,
    description TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    
    -- Organization and access control
    organization_id VARCHAR(255) NOT NULL,
    created_by VARCHAR(255) NOT NULL, -- DID of creator
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Policy configuration
    enabled BOOLEAN DEFAULT true,
    default_action VARCHAR(50) DEFAULT 'deny', -- allow, deny, throttle, etc.
    evaluation_mode VARCHAR(50) DEFAULT 'priority_order', -- first_match, all_rules, priority_order
    
    -- Policy content (JSON schema)
    policy_document JSONB NOT NULL, -- Complete policy as JSON
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    category VARCHAR(100), -- security, compliance, operational, etc.
    
    -- Status and lifecycle
    status VARCHAR(20) DEFAULT 'draft', -- draft, active, inactive, archived
    deployed_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE
);

-- Policy rules table (normalized for better querying)
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policy_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id VARCHAR(255) NOT NULL, -- UUID from the policy schema
    policy_id VARCHAR(255) NOT NULL REFERENCES atp_permissions.visual_policies(policy_id) ON DELETE CASCADE,
    
    -- Rule metadata
    name VARCHAR(100) NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 100,
    
    -- Rule content
    condition_json JSONB NOT NULL, -- Condition or logical expression
    action_json JSONB NOT NULL, -- Action configuration
    
    -- Metadata
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) NOT NULL,
    version VARCHAR(20) DEFAULT '1.0.0'
);

-- Policy test cases table
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policy_test_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_case_id VARCHAR(255) NOT NULL, -- UUID from the policy schema
    policy_id VARCHAR(255) NOT NULL REFERENCES atp_permissions.visual_policies(policy_id) ON DELETE CASCADE,
    
    -- Test case metadata
    name VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Test input and expected output
    input_json JSONB NOT NULL, -- Test input (agent, credentials, tool, context)
    expected_action VARCHAR(50) NOT NULL, -- Expected policy decision
    
    -- Test results (populated when tests are run)
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_result VARCHAR(50), -- passed, failed, error
    last_actual_action VARCHAR(50),
    last_error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Policy audit log table
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policy_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id VARCHAR(255) NOT NULL REFERENCES atp_permissions.visual_policies(policy_id) ON DELETE CASCADE,
    
    -- Audit event details
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    action VARCHAR(50) NOT NULL, -- created, updated, enabled, disabled, deployed, tested
    actor VARCHAR(255) NOT NULL, -- DID of the actor
    
    -- Change details
    changes_json JSONB, -- What changed (before/after values)
    reason TEXT, -- Reason for the change
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    session_id VARCHAR(255)
);

-- Policy deployment history table
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policy_deployments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id VARCHAR(255) NOT NULL REFERENCES atp_permissions.visual_policies(policy_id) ON DELETE CASCADE,
    
    -- Deployment details
    deployment_id VARCHAR(255) UNIQUE NOT NULL,
    version VARCHAR(20) NOT NULL,
    deployed_by VARCHAR(255) NOT NULL,
    deployed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Deployment target
    environment VARCHAR(50) NOT NULL DEFAULT 'production', -- development, staging, production
    gateway_instances TEXT[] DEFAULT ARRAY[]::TEXT[], -- Which gateway instances
    
    -- Deployment status
    status VARCHAR(50) DEFAULT 'pending', -- pending, active, failed, rolled_back
    rollback_reason TEXT,
    rolled_back_at TIMESTAMP WITH TIME ZONE,
    rolled_back_by VARCHAR(255),
    
    -- Snapshot of policy at deployment time
    policy_snapshot JSONB NOT NULL
);

-- Policy evaluation metrics table (for performance monitoring)
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policy_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_id VARCHAR(255) NOT NULL REFERENCES atp_permissions.visual_policies(policy_id) ON DELETE CASCADE,
    
    -- Metrics data
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    evaluations_count INTEGER DEFAULT 0,
    allow_count INTEGER DEFAULT 0,
    deny_count INTEGER DEFAULT 0,
    throttle_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_evaluation_time_ms DECIMAL(10,3) DEFAULT 0,
    max_evaluation_time_ms DECIMAL(10,3) DEFAULT 0,
    min_evaluation_time_ms DECIMAL(10,3) DEFAULT 0,
    
    -- Last updated
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(policy_id, date)
);

-- Organization settings for policy management
CREATE TABLE IF NOT EXISTS atp_permissions.visual_policy_org_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id VARCHAR(255) UNIQUE NOT NULL,
    
    -- Policy management settings
    max_policies_per_org INTEGER DEFAULT 100,
    max_rules_per_policy INTEGER DEFAULT 50,
    require_approval_for_deployment BOOLEAN DEFAULT true,
    default_policy_category VARCHAR(100) DEFAULT 'operational',
    
    -- Notification settings
    notify_on_policy_changes BOOLEAN DEFAULT true,
    notification_channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
    notification_recipients TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Audit settings
    audit_retention_days INTEGER DEFAULT 365,
    enable_detailed_logging BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for optimal performance
-- ====================================

-- Visual policies indexes
CREATE INDEX IF NOT EXISTS idx_visual_policies_policy_id ON atp_permissions.visual_policies(policy_id);
CREATE INDEX IF NOT EXISTS idx_visual_policies_organization ON atp_permissions.visual_policies(organization_id);
CREATE INDEX IF NOT EXISTS idx_visual_policies_status ON atp_permissions.visual_policies(status);
CREATE INDEX IF NOT EXISTS idx_visual_policies_enabled ON atp_permissions.visual_policies(enabled);
CREATE INDEX IF NOT EXISTS idx_visual_policies_category ON atp_permissions.visual_policies(category);
CREATE INDEX IF NOT EXISTS idx_visual_policies_created_by ON atp_permissions.visual_policies(created_by);
CREATE INDEX IF NOT EXISTS idx_visual_policies_created_at ON atp_permissions.visual_policies(created_at);
CREATE INDEX IF NOT EXISTS idx_visual_policies_tags ON atp_permissions.visual_policies USING GIN(tags);

-- Policy rules indexes
CREATE INDEX IF NOT EXISTS idx_visual_policy_rules_policy_id ON atp_permissions.visual_policy_rules(policy_id);
CREATE INDEX IF NOT EXISTS idx_visual_policy_rules_enabled ON atp_permissions.visual_policy_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_visual_policy_rules_priority ON atp_permissions.visual_policy_rules(priority);
CREATE INDEX IF NOT EXISTS idx_visual_policy_rules_tags ON atp_permissions.visual_policy_rules USING GIN(tags);

-- Test cases indexes
CREATE INDEX IF NOT EXISTS idx_visual_policy_test_cases_policy_id ON atp_permissions.visual_policy_test_cases(policy_id);
CREATE INDEX IF NOT EXISTS idx_visual_policy_test_cases_last_run ON atp_permissions.visual_policy_test_cases(last_run_at);
CREATE INDEX IF NOT EXISTS idx_visual_policy_test_cases_result ON atp_permissions.visual_policy_test_cases(last_result);

-- Audit log indexes
CREATE INDEX IF NOT EXISTS idx_visual_policy_audit_policy_id ON atp_permissions.visual_policy_audit_log(policy_id);
CREATE INDEX IF NOT EXISTS idx_visual_policy_audit_timestamp ON atp_permissions.visual_policy_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_visual_policy_audit_action ON atp_permissions.visual_policy_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_visual_policy_audit_actor ON atp_permissions.visual_policy_audit_log(actor);

-- Deployment history indexes
CREATE INDEX IF NOT EXISTS idx_visual_policy_deployments_policy_id ON atp_permissions.visual_policy_deployments(policy_id);
CREATE INDEX IF NOT EXISTS idx_visual_policy_deployments_environment ON atp_permissions.visual_policy_deployments(environment);
CREATE INDEX IF NOT EXISTS idx_visual_policy_deployments_status ON atp_permissions.visual_policy_deployments(status);
CREATE INDEX IF NOT EXISTS idx_visual_policy_deployments_deployed_at ON atp_permissions.visual_policy_deployments(deployed_at);

-- Metrics indexes
CREATE INDEX IF NOT EXISTS idx_visual_policy_metrics_policy_id ON atp_permissions.visual_policy_metrics(policy_id);
CREATE INDEX IF NOT EXISTS idx_visual_policy_metrics_date ON atp_permissions.visual_policy_metrics(date);

-- Organization settings indexes
CREATE INDEX IF NOT EXISTS idx_visual_policy_org_settings_org_id ON atp_permissions.visual_policy_org_settings(organization_id);

-- Create views for common queries
-- ===============================

-- Active policies view
CREATE OR REPLACE VIEW atp_permissions.active_visual_policies AS
SELECT 
    vp.*,
    COUNT(vpr.id) as rule_count,
    COUNT(vptc.id) as test_case_count
FROM atp_permissions.visual_policies vp
LEFT JOIN atp_permissions.visual_policy_rules vpr ON vp.policy_id = vpr.policy_id AND vpr.enabled = true
LEFT JOIN atp_permissions.visual_policy_test_cases vptc ON vp.policy_id = vptc.policy_id
WHERE vp.status = 'active' AND vp.enabled = true
GROUP BY vp.id;

-- Policy summary view with metrics
CREATE OR REPLACE VIEW atp_permissions.visual_policy_summary AS
SELECT 
    vp.policy_id,
    vp.name,
    vp.organization_id,
    vp.status,
    vp.enabled,
    vp.category,
    vp.created_at,
    vp.updated_at,
    COUNT(vpr.id) as rule_count,
    COUNT(vptc.id) as test_case_count,
    COALESCE(SUM(vpm.evaluations_count), 0) as total_evaluations,
    COALESCE(AVG(vpm.avg_evaluation_time_ms), 0) as avg_evaluation_time_ms
FROM atp_permissions.visual_policies vp
LEFT JOIN atp_permissions.visual_policy_rules vpr ON vp.policy_id = vpr.policy_id
LEFT JOIN atp_permissions.visual_policy_test_cases vptc ON vp.policy_id = vptc.policy_id
LEFT JOIN atp_permissions.visual_policy_metrics vpm ON vp.policy_id = vpm.policy_id
GROUP BY vp.id;

-- Recent policy changes view
CREATE OR REPLACE VIEW atp_permissions.recent_visual_policy_changes AS
SELECT 
    vpal.*,
    vp.name as policy_name,
    vp.organization_id
FROM atp_permissions.visual_policy_audit_log vpal
JOIN atp_permissions.visual_policies vp ON vpal.policy_id = vp.policy_id
WHERE vpal.timestamp > NOW() - INTERVAL '7 days'
ORDER BY vpal.timestamp DESC;

-- Grant permissions on new tables and views
-- =========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policies TO atp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policy_rules TO atp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policy_test_cases TO atp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policy_audit_log TO atp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policy_deployments TO atp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policy_metrics TO atp_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON atp_permissions.visual_policy_org_settings TO atp_user;

GRANT SELECT ON atp_permissions.active_visual_policies TO atp_user;
GRANT SELECT ON atp_permissions.visual_policy_summary TO atp_user;
GRANT SELECT ON atp_permissions.recent_visual_policy_changes TO atp_user;

-- Insert sample organization settings
-- ==================================

INSERT INTO atp_permissions.visual_policy_org_settings (
    organization_id,
    max_policies_per_org,
    max_rules_per_policy,
    require_approval_for_deployment,
    default_policy_category,
    notify_on_policy_changes,
    notification_channels,
    audit_retention_days,
    enable_detailed_logging
) VALUES (
    'org_default',
    100,
    50,
    true,
    'operational',
    true,
    ARRAY['email'],
    365,
    true
) ON CONFLICT (organization_id) DO NOTHING;

-- Create stored procedures for common operations
-- =============================================

-- Function to create a new policy with audit logging
CREATE OR REPLACE FUNCTION atp_permissions.create_visual_policy(
    p_policy_id VARCHAR(255),
    p_name VARCHAR(100),
    p_description TEXT,
    p_organization_id VARCHAR(255),
    p_created_by VARCHAR(255),
    p_policy_document JSONB,
    p_category VARCHAR(100) DEFAULT 'operational',
    p_tags TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS UUID AS $$
DECLARE
    new_id UUID;
BEGIN
    -- Insert the policy
    INSERT INTO atp_permissions.visual_policies (
        policy_id, name, description, organization_id, created_by,
        policy_document, category, tags, status
    ) VALUES (
        p_policy_id, p_name, p_description, p_organization_id, p_created_by,
        p_policy_document, p_category, p_tags, 'draft'
    ) RETURNING id INTO new_id;
    
    -- Log the creation
    INSERT INTO atp_permissions.visual_policy_audit_log (
        policy_id, action, actor, reason
    ) VALUES (
        p_policy_id, 'created', p_created_by, 'Policy created via API'
    );
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to deploy a policy
CREATE OR REPLACE FUNCTION atp_permissions.deploy_visual_policy(
    p_policy_id VARCHAR(255),
    p_deployed_by VARCHAR(255),
    p_environment VARCHAR(50) DEFAULT 'production',
    p_gateway_instances TEXT[] DEFAULT ARRAY[]::TEXT[]
) RETURNS VARCHAR(255) AS $$
DECLARE
    deployment_id VARCHAR(255);
    policy_version VARCHAR(20);
    policy_snapshot JSONB;
BEGIN
    -- Get policy details
    SELECT version, policy_document INTO policy_version, policy_snapshot
    FROM atp_permissions.visual_policies
    WHERE policy_id = p_policy_id AND status = 'active';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Policy not found or not active: %', p_policy_id;
    END IF;
    
    -- Generate deployment ID
    deployment_id := 'deploy_' || extract(epoch from now())::text || '_' || substring(gen_random_uuid()::text, 1, 8);
    
    -- Create deployment record
    INSERT INTO atp_permissions.visual_policy_deployments (
        policy_id, deployment_id, version, deployed_by, environment,
        gateway_instances, policy_snapshot, status
    ) VALUES (
        p_policy_id, deployment_id, policy_version, p_deployed_by, p_environment,
        p_gateway_instances, policy_snapshot, 'active'
    );
    
    -- Update policy deployment timestamp
    UPDATE atp_permissions.visual_policies
    SET deployed_at = NOW()
    WHERE policy_id = p_policy_id;
    
    -- Log the deployment
    INSERT INTO atp_permissions.visual_policy_audit_log (
        policy_id, action, actor, reason
    ) VALUES (
        p_policy_id, 'deployed', p_deployed_by, 
        'Policy deployed to ' || p_environment || ' environment'
    );
    
    RETURN deployment_id;
END;
$$ LANGUAGE plpgsql;

-- Function to record policy evaluation metrics
CREATE OR REPLACE FUNCTION atp_permissions.record_policy_evaluation(
    p_policy_id VARCHAR(255),
    p_action VARCHAR(50),
    p_evaluation_time_ms DECIMAL(10,3)
) RETURNS VOID AS $$
BEGIN
    INSERT INTO atp_permissions.visual_policy_metrics (
        policy_id, date, evaluations_count,
        allow_count, deny_count, throttle_count,
        avg_evaluation_time_ms, max_evaluation_time_ms, min_evaluation_time_ms
    ) VALUES (
        p_policy_id, CURRENT_DATE, 1,
        CASE WHEN p_action = 'allow' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'deny' THEN 1 ELSE 0 END,
        CASE WHEN p_action = 'throttle' THEN 1 ELSE 0 END,
        p_evaluation_time_ms, p_evaluation_time_ms, p_evaluation_time_ms
    )
    ON CONFLICT (policy_id, date) DO UPDATE SET
        evaluations_count = atp_permissions.visual_policy_metrics.evaluations_count + 1,
        allow_count = atp_permissions.visual_policy_metrics.allow_count + 
            CASE WHEN p_action = 'allow' THEN 1 ELSE 0 END,
        deny_count = atp_permissions.visual_policy_metrics.deny_count + 
            CASE WHEN p_action = 'deny' THEN 1 ELSE 0 END,
        throttle_count = atp_permissions.visual_policy_metrics.throttle_count + 
            CASE WHEN p_action = 'throttle' THEN 1 ELSE 0 END,
        avg_evaluation_time_ms = (
            (atp_permissions.visual_policy_metrics.avg_evaluation_time_ms * atp_permissions.visual_policy_metrics.evaluations_count) + 
            p_evaluation_time_ms
        ) / (atp_permissions.visual_policy_metrics.evaluations_count + 1),
        max_evaluation_time_ms = GREATEST(atp_permissions.visual_policy_metrics.max_evaluation_time_ms, p_evaluation_time_ms),
        min_evaluation_time_ms = LEAST(atp_permissions.visual_policy_metrics.min_evaluation_time_ms, p_evaluation_time_ms),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;