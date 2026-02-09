/**
 * Comprehensive Example: Finance Trading Workflow with ATP Security
 * 
 * Demonstrates:
 * - Agent registration with ATP identities
 * - Tool security wrappers
 * - Task-level protection
 * - Graph validation
 * - Policy enforcement
 */

import { ATPClient } from 'atp-sdk';
import {
  registerAgentWithAtp,
  secureTools,
  ATPGraphValidator,
  ATPPolicyProfile,
  ATPConfigProfile,
  createTaskMetadata
} from '@atp/motleycrew-atp';

// Mock Motleycrew imports (would be real in actual usage)
// import { MotleyCrew } from 'motleycrew';
// import { ReActToolCallingMotleyAgent } from 'motleycrew/agents/langchain';
// import { SimpleTask } from 'motleycrew/tasks';

async function main() {
  console.log('🔐 ATP Motleycrew Finance Workflow Example\n');

  // 1. Initialize ATP Client
  const atpConfig = ATPConfigProfile.productionFinance('https://atp.company.com', {
    minTrust: 0.95,
    requireMFA: true,
    auditLevel: 'full'
  });

  const atp = new ATPClient(atpConfig);
  console.log('✅ ATP Client initialized\n');

  // 2. Register Agents with ATP
  console.log('📝 Registering agents...');
  
  const researcherMeta = await registerAgentWithAtp(atp, {
    name: 'market-researcher',
    role: 'researcher',
    trustLevel: 'elevated',
    capabilities: ['market-data', 'research']
  });
  console.log(`   ✓ Researcher: ${researcherMeta.did}`);

  const traderMeta = await registerAgentWithAtp(atp, {
    name: 'trader',
    role: 'trader',
    trustLevel: 'privileged',
    capabilities: ['trade-execution', 'financial'],
    policyProfile: 'finance_high_risk'
  });
  console.log(`   ✓ Trader: ${traderMeta.did}`);

  const reviewerMeta = await registerAgentWithAtp(atp, {
    name: 'compliance-reviewer',
    role: 'reviewer',
    trustLevel: 'privileged',
    capabilities: ['compliance', 'audit']
  });
  console.log(`   ✓ Reviewer: ${reviewerMeta.did}\n`);

  // 3. Define Tools
  const marketDataTool = {
    name: 'fetch_market_data',
    execute: async (symbol: string) => {
      return { symbol, price: 150.25, volume: 1000000 };
    }
  };

  const tradeExecutionTool = {
    name: 'execute_trade',
    execute: async (symbol: string, quantity: number, price: number) => {
      return { orderId: 'ORD-12345', status: 'executed' };
    }
  };

  const complianceCheckTool = {
    name: 'compliance_check',
    execute: async (tradeDetails: any) => {
      return { compliant: true, score: 0.98 };
    }
  };

  // 4. Wrap Tools with ATP Security
  console.log('🔒 Securing tools with ATP...');
  
  const secureMarketData = secureTools([marketDataTool], atp, {
    minTrustScore: 0.8,
    auditRequired: true,
    rateLimit: 60
  })[0];

  const secureTradeExecution = secureTools([tradeExecutionTool], atp, {
    minTrustScore: 0.95,
    auditRequired: true,
    rateLimit: 10,
    requiredPolicy: 'finance_high_risk'
  })[0];

  const secureComplianceCheck = secureTools([complianceCheckTool], atp, {
    minTrustScore: 0.9,
    auditRequired: true
  })[0];
  
  console.log('   ✓ 3 tools secured\n');

  // 5. Create ATP-Protected Tasks
  console.log('📋 Creating ATP-protected tasks...');

  const researchTask = {
    name: 'Market Research',
    agent: 'market-researcher',
    description: 'Analyze market conditions for AAPL',
    metadata: createTaskMetadata({
      requiredTrust: 0.8,
      policy: 'market_research',
      dataClassification: 'internal',
      sensitivityLevel: 'medium'
    })
  };

  const tradeTask = {
    name: 'Execute Trade',
    agent: 'trader',
    description: 'Execute $2M trade in AAPL',
    metadata: createTaskMetadata({
      requiredTrust: 0.95,
      policy: 'finance_high_risk',
      dataClassification: 'financial',
      sensitivityLevel: 'critical',
      requireMFA: true,
      maxExecutionTime: 60000
    })
  };

  const reviewTask = {
    name: 'Compliance Review',
    agent: 'compliance-reviewer',
    description: 'Review trade for regulatory compliance',
    metadata: createTaskMetadata({
      requiredTrust: 0.9,
      policy: 'compliance_review',
      dataClassification: 'financial',
      sensitivityLevel: 'high',
      enhancedAudit: true
    })
  };

  console.log('   ✓ 3 tasks created with ATP metadata\n');

  // 6. Validate Agent Graph
  console.log('🔍 Validating agent interaction graph...');

  const policyProfile = ATPPolicyProfile.productionFinance();
  const validator = new ATPGraphValidator(
    atp,
    policyProfile.interAgentRules,
    policyProfile.workflowConstraints
  );

  const graphValidation = await validator.validateGraph(
    [
      { name: 'market-researcher', role: 'researcher', did: researcherMeta.did, trustScore: 0.9 },
      { name: 'trader', role: 'trader', did: traderMeta.did, trustScore: 0.95 },
      { name: 'compliance-reviewer', role: 'reviewer', did: reviewerMeta.did, trustScore: 0.92 }
    ],
    [
      { from: 'market-researcher', to: 'trader', dataType: 'market-data' },
      { from: 'trader', to: 'compliance-reviewer', dataType: 'trade-request' }
    ]
  );

  if (graphValidation.isValid) {
    console.log('   ✅ Graph validation passed');
    console.log(`   ✓ Validated ${graphValidation.validatedAgents.length} agents`);
    console.log(`   ✓ Validated ${graphValidation.validatedEdges.length} edges`);
  } else {
    console.log('   ❌ Graph validation failed:');
    graphValidation.errors.forEach(err => console.log(`      - ${err.message}`));
    process.exit(1);
  }

  if (graphValidation.warnings.length > 0) {
    console.log('   ⚠️  Warnings:');
    graphValidation.warnings.forEach(warn => console.log(`      - ${warn}`));
  }

  console.log('\n🎉 ATP Security Setup Complete!\n');

  // 7. Demonstrate Tool Execution with ATP
  console.log('🔧 Executing secured tool calls...\n');

  try {
    // Market Data (Researcher)
    console.log('1️⃣ Fetching market data...');
    const marketData = await secureMarketData.execute(
      { atp: researcherMeta },
      'AAPL'
    );
    console.log(`   ✓ ${marketData.success ? 'Success' : 'Failed'}`);
    console.log(`   ✓ Execution time: ${marketData.executionTime}ms`);
    console.log(`   ✓ Trust impact: +${marketData.atpMetadata.trustImpact}\n`);

    // Trade Execution (Trader)
    console.log('2️⃣ Executing trade...');
    const tradeResult = await secureTradeExecution.execute(
      { atp: traderMeta },
      'AAPL',
      10000,
      150.25
    );
    console.log(`   ✓ ${tradeResult.success ? 'Success' : 'Failed'}`);
    console.log(`   ✓ Audit log: ${tradeResult.atpMetadata.auditLogId}`);
    console.log(`   ✓ Quantum-safe: ${tradeResult.atpMetadata.quantumSafeVerified}\n`);

    // Compliance Check (Reviewer)
    console.log('3️⃣ Running compliance check...');
    const complianceResult = await secureComplianceCheck.execute(
      { atp: reviewerMeta },
      { trade: tradeResult.result }
    );
    console.log(`   ✓ ${complianceResult.success ? 'Success' : 'Failed'}\n`);

  } catch (error) {
    console.error('❌ Tool execution error:', error);
  }

  console.log('✅ All operations completed successfully!\n');
  console.log('📊 Key ATP Features Demonstrated:');
  console.log('   • Quantum-safe agent identities (Ed25519 + Dilithium)');
  console.log('   • Tool-level security with trust-based access control');
  console.log('   • Task-level metadata and validation');
  console.log('   • Agent graph validation with policy enforcement');
  console.log('   • Comprehensive audit logging');
  console.log('   • Dynamic trust score updates\n');
}

// Run example
main().catch(console.error);
