/**
 * ATP Support Agent - Standalone Version
 * Simplified version without ATP SDK dependencies for quick deployment
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface SupportQuery {
  id: string;
  query: string;
  customerId?: string;
  tier?: 'free' | 'starter' | 'professional' | 'enterprise';
  channel?: string;
}

interface SupportResponse {
  queryId: string;
  response: string;
  confidence: number;
  codeExample?: string;
  documentationLinks?: string[];
  requiresEscalation: boolean;
}

class SimpleSupportAgent {
  private knowledgeBase: Map<string, any> = new Map();

  constructor() {
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Pre-load common Q&As
    this.knowledgeBase.set('integration', {
      node: `
// ATP Node.js Integration
const { ATPClient } = require('atp-sdk');

const client = new ATPClient({
  apiKey: process.env.ATP_API_KEY,
  endpoint: 'https://api.yourdomain.com'
});

// Register an agent
const agent = await client.registerAgent({
  name: 'My Agent',
  capabilities: ['data-processing']
});

console.log('Agent registered:', agent.did);`,
      react: `
// ATP React Integration
import { ATPProvider, useATP } from '@atp/react';

function App() {
  return (
    <ATPProvider apiKey={process.env.REACT_APP_ATP_KEY}>
      <YourApp />
    </ATPProvider>
  );
}`,
      python: `
# ATP Python Integration
from atp_sdk import ATPClient
import os

client = ATPClient(
    api_key=os.environ['ATP_API_KEY'],
    endpoint='https://api.yourdomain.com'
)

# Register an agent
agent = client.register_agent(
    name='My Agent',
    capabilities=['data-processing']
)

print(f'Agent registered: {agent.did}')`
    });

    this.knowledgeBase.set('pricing', {
      response: `ATP offers four pricing tiers:

**Free (Open Source)**: $0
- Up to 10 agents, 5K requests
- Core ATP protocol, self-hosted
- Community support

**Startup**: $250/month ($3K/year)
- Up to 25 agents, 25K requests
- SaaS hosted, email support

**Professional**: $1,500/month ($18K/year)
- Up to 100 agents, 250K requests
- Priority support, compliance frameworks

**Enterprise**: $50K/year minimum
- 1000+ agents, 2.5M requests
- SSO/SAML, 24/7 support, custom integrations
- 30-day free trial available

Visit https://atp.dev/pricing for details.`
    });

    this.knowledgeBase.set('trust', {
      response: `ATP's trust scoring algorithm evaluates agents based on:

1. **Identity Verification** (30%)
   - DID validation
   - Credential verification
   - Certificate chain validation

2. **Behavioral Analysis** (40%)
   - Historical interactions
   - Success/failure rates
   - Response patterns

3. **Reputation** (20%)
   - Peer endorsements
   - Network effects
   - Community feedback

4. **Compliance** (10%)
   - Policy adherence
   - Security practices
   - Audit compliance

Trust scores range from 0.0 to 1.0, with:
- 0.9+ = Highly trusted
- 0.7-0.9 = Trusted
- 0.5-0.7 = Moderate trust
- <0.5 = Low trust

Learn more: https://docs.atp.dev/trust-scoring`
    });
  }

  async processQuery(query: SupportQuery): Promise<SupportResponse> {
    const lowerQuery = query.query.toLowerCase();
    
    // Check for integration queries
    if (lowerQuery.includes('integrate') || lowerQuery.includes('integration')) {
      let language = 'node';
      if (lowerQuery.includes('python')) language = 'python';
      if (lowerQuery.includes('react')) language = 'react';
      
      return {
        queryId: query.id,
        response: `Here's how to integrate ATP with ${language}:`,
        confidence: 0.9,
        codeExample: this.knowledgeBase.get('integration')[language],
        documentationLinks: [`https://docs.atp.dev/quickstart/${language}`],
        requiresEscalation: false
      };
    }

    // Check for pricing queries
    if (lowerQuery.includes('pricing') || lowerQuery.includes('cost') || lowerQuery.includes('price')) {
      return {
        queryId: query.id,
        response: this.knowledgeBase.get('pricing').response,
        confidence: 1.0,
        documentationLinks: ['https://atp.dev/pricing'],
        requiresEscalation: false
      };
    }

    // Check for trust scoring queries
    if (lowerQuery.includes('trust') || lowerQuery.includes('scoring')) {
      return {
        queryId: query.id,
        response: this.knowledgeBase.get('trust').response,
        confidence: 0.95,
        documentationLinks: ['https://docs.atp.dev/trust-scoring'],
        requiresEscalation: false
      };
    }

    // Check for urgent/security issues
    if (lowerQuery.includes('security') || lowerQuery.includes('breach') || lowerQuery.includes('vulnerable')) {
      return {
        queryId: query.id,
        response: 'Security issue detected. Escalating to security team immediately. Please email security@atp.dev with details.',
        confidence: 1.0,
        requiresEscalation: true
      };
    }

    // Default response for unknown queries
    return {
      queryId: query.id,
      response: `I can help you with ATP integration, pricing, trust scoring, and technical questions. 

For your specific question, here are some resources:
- Documentation: https://docs.atp.dev
- GitHub: https://github.com/agent-trust-protocol
- Contact Sales: https://atp.dev/contact

Would you like me to escalate this to a human support engineer?`,
      confidence: 0.6,
      documentationLinks: ['https://docs.atp.dev'],
      requiresEscalation: false
    };
  }
}

// Express API Server
const app = express();
const agent = new SimpleSupportAgent();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'ATP Support Agent v1.0',
    uptime: process.uptime()
  });
});

// Support query endpoint
app.post('/api/support/query', async (req, res) => {
  try {
    const query: SupportQuery = {
      id: `query-${Date.now()}`,
      query: req.body.query || '',
      customerId: req.body.customerId,
      tier: req.body.tier || 'free',
      channel: req.body.channel || 'api'
    };

    const response = await agent.processQuery(query);
    res.json(response);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Slack webhook endpoint (optional)
app.post('/api/slack/events', async (req, res) => {
  // Handle Slack events
  if (req.body.challenge) {
    // Slack URL verification
    res.json({ challenge: req.body.challenge });
    return;
  }

  // Process Slack message
  if (req.body.event && req.body.event.text) {
    const query: SupportQuery = {
      id: `slack-${Date.now()}`,
      query: req.body.event.text,
      customerId: req.body.event.user,
      channel: 'slack'
    };

    const response = await agent.processQuery(query);
    
    // In production, post response back to Slack
    console.log('Slack response:', response);
  }

  res.json({ ok: true });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║         ATP Support Agent v1.0                ║
║         Ready for Enterprise Support!         ║
╠═══════════════════════════════════════════════╣
║  Status: 🟢 ONLINE                            ║
║  Port: ${PORT}                                   ║
║  Endpoint: http://localhost:${PORT}              ║
║                                               ║
║  Test with:                                   ║
║  curl -X POST http://localhost:${PORT}/api/support/query \\
║    -H "Content-Type: application/json" \\     ║
║    -d '{"query": "How do I integrate ATP?"}'  ║
╚═══════════════════════════════════════════════╝
  `);
});

export default app;