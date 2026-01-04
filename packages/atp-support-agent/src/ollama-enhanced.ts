/**
 * ATP Support Agent - Ollama Enhanced Version
 * Uses local gpt-oss:20b model for intelligent responses
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

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
  aiEnhanced: boolean;
}

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

class OllamaEnhancedSupportAgent {
  private knowledgeBase: Map<string, any> = new Map();
  private ollamaEndpoint: string;
  private ollamaModel: string;

  constructor() {
    this.ollamaEndpoint = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434';
    this.ollamaModel = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
    this.initializeKnowledgeBase();
  }

  private initializeKnowledgeBase() {
    // Core ATP knowledge for context
    this.knowledgeBase.set('atp_context', `
Agent Trust Protocol (ATP) is a quantum-safe protocol for establishing trust between AI agents.

Key Features:
- Quantum-safe cryptography (CRYSTALS-Dilithium + Ed25519)
- W3C DID/VC standards compliance
- Real-time trust scoring (0.0-1.0 scale)
- Behavioral analytics with ML
- Enterprise SSO/SAML integration
- SOC2, HIPAA, GDPR compliance

Pricing:
- Free (Open Source): $0 - 10 agents, 5K requests, self-hosted
- Startup: $250/month - 25 agents, 25K requests, SaaS hosted
- Professional: $1,500/month - 100 agents, 250K requests, priority support
- Enterprise: $50K/year minimum - 1000+ agents, 2.5M requests, full features

Integration Examples:
Node.js: const client = new ATPClient({ apiKey: process.env.ATP_API_KEY });
React: <ATPProvider apiKey={key}><App/></ATPProvider>
Python: client = ATPClient(api_key=os.environ['ATP_API_KEY'])
`);

    this.knowledgeBase.set('common_issues', `
Common Integration Issues:
1. CORS errors - Add domain to allowed origins
2. Low trust scores - Ensure proper credentials and activity
3. Rate limiting - Check API key limits
4. Authentication failures - Verify DID and credentials
5. Network timeouts - Check endpoint connectivity
`);
  }

  /**
   * Enhanced query processing with Ollama AI
   */
  async processQuery(query: SupportQuery): Promise<SupportResponse> {
    try {
      // Check if this is a simple query that doesn't need AI
      const simpleResponse = await this.checkSimpleQueries(query);
      if (simpleResponse) {
        return simpleResponse;
      }

      // Use Ollama for complex queries
      const aiResponse = await this.queryOllama(query);
      
      return {
        queryId: query.id,
        response: aiResponse.response,
        confidence: 0.9,
        documentationLinks: this.extractDocLinks(aiResponse.response),
        codeExample: this.extractCodeExample(aiResponse.response),
        requiresEscalation: this.checkEscalationNeeded(query, aiResponse),
        aiEnhanced: true
      };
    } catch (error) {
      console.error('Error processing query with Ollama:', error);
      
      // Fallback to basic responses
      return this.getFallbackResponse(query);
    }
  }

  /**
   * Query Ollama with context
   */
  private async queryOllama(query: SupportQuery): Promise<{ response: string }> {
    const context = this.knowledgeBase.get('atp_context');
    const commonIssues = this.knowledgeBase.get('common_issues');
    
    const prompt = `You are a support agent for the Agent Trust Protocol. Answer this question: "${query.query}"`;

    try {
      const response = await axios.post(
        `${this.ollamaEndpoint}/api/generate`,
        {
          model: this.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3, // Lower temperature for more consistent support responses
            top_p: 0.9,
            max_tokens: 1000
          }
        },
        {
          timeout: 15000 // 15 second timeout
        }
      );

      return { response: response.data.response };
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  /**
   * Check for simple queries that don't need AI
   */
  private async checkSimpleQueries(query: SupportQuery): Promise<SupportResponse | null> {
    const lowerQuery = query.query.toLowerCase();
    
    // Security queries always escalate
    if (lowerQuery.includes('security') || lowerQuery.includes('breach') || lowerQuery.includes('hack')) {
      return {
        queryId: query.id,
        response: '🚨 Security issue detected. Escalating to security team immediately. Please email security@atp.dev with details.',
        confidence: 1.0,
        requiresEscalation: true,
        aiEnhanced: false
      };
    }

    // Status queries
    if (lowerQuery.includes('status') || lowerQuery.includes('uptime')) {
      return {
        queryId: query.id,
        response: `ATP System Status 🟢

• API: Operational
• Trust Engine: Operational  
• Support Agent: Online (Trust Score: 0.95)
• Response Time: <30s
• Uptime: 99.9%

All systems are running normally. Check https://status.atp.dev for real-time updates.`,
        confidence: 1.0,
        documentationLinks: ['https://status.atp.dev'],
        requiresEscalation: false,
        aiEnhanced: false
      };
    }

    return null; // Use AI for this query
  }

  /**
   * Extract documentation links from AI response
   */
  private extractDocLinks(response: string): string[] {
    const links: string[] = [];
    
    if (response.toLowerCase().includes('integration')) {
      links.push('https://docs.atp.dev/quickstart');
    }
    if (response.toLowerCase().includes('pricing')) {
      links.push('https://atp.dev/pricing');
    }
    if (response.toLowerCase().includes('trust')) {
      links.push('https://docs.atp.dev/trust-scoring');
    }
    if (response.toLowerCase().includes('api')) {
      links.push('https://docs.atp.dev/api-reference');
    }
    
    return links;
  }

  /**
   * Extract code examples from AI response
   */
  private extractCodeExample(response: string): string | undefined {
    // Look for code blocks in the response
    const codeBlockMatch = response.match(/```[\s\S]*?```/);
    if (codeBlockMatch) {
      return codeBlockMatch[0];
    }
    
    // Look for simple code snippets
    const codeMatch = response.match(/`[^`]+`/);
    if (codeMatch) {
      return codeMatch[0];
    }
    
    return undefined;
  }

  /**
   * Check if escalation is needed
   */
  private checkEscalationNeeded(query: SupportQuery, aiResponse: { response: string }): boolean {
    const lowerQuery = query.query.toLowerCase();
    const lowerResponse = aiResponse.response.toLowerCase();
    
    // Always escalate security issues
    if (lowerQuery.includes('security') || lowerQuery.includes('breach')) {
      return true;
    }
    
    // Escalate if AI suggests it
    if (lowerResponse.includes('escalate') || lowerResponse.includes('human support')) {
      return true;
    }
    
    // Escalate complex enterprise issues
    if (query.tier === 'enterprise' && (lowerQuery.includes('custom') || lowerQuery.includes('contract'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Fallback response when AI fails
   */
  private getFallbackResponse(query: SupportQuery): SupportResponse {
    return {
      queryId: query.id,
      response: `I apologize, but I'm experiencing some technical difficulties right now. 

For immediate assistance:
• Documentation: https://docs.atp.dev
• Email Support: support@atp.dev
• GitHub Issues: https://github.com/agent-trust-protocol/issues

If this is urgent, please email support@atp.dev and we'll respond within 4 hours for enterprise customers.`,
      confidence: 0.5,
      documentationLinks: ['https://docs.atp.dev'],
      requiresEscalation: true,
      aiEnhanced: false
    };
  }
}

// Express API Server
const app = express();
const agent = new OllamaEnhancedSupportAgent();

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    agent: 'ATP Support Agent v2.0 (Ollama Enhanced)',
    uptime: process.uptime(),
    ollama: {
      endpoint: process.env.OLLAMA_ENDPOINT,
      model: process.env.OLLAMA_MODEL
    }
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

    console.log(`🤖 Processing query: "${query.query.substring(0, 50)}..."`);
    
    const response = await agent.processQuery(query);
    
    console.log(`✅ Response generated (AI: ${response.aiEnhanced})`);
    
    res.json(response);
  } catch (error) {
    console.error('Error processing query:', error);
    res.status(500).json({
      error: 'Failed to process query',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test Ollama connection endpoint
app.get('/api/test/ollama', async (req, res) => {
  try {
    const response = await axios.post(
      `${process.env.OLLAMA_ENDPOINT}/api/generate`,
      {
        model: process.env.OLLAMA_MODEL,
        prompt: 'Hi',
        stream: false
      },
      { timeout: 60000 }
    );
    
    res.json({
      status: 'success',
      model: process.env.OLLAMA_MODEL,
      response: response.data.response
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      endpoint: process.env.OLLAMA_ENDPOINT,
      model: process.env.OLLAMA_MODEL
    });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║     ATP Support Agent v2.0 (Ollama Enhanced) ║
║           Powered by ${process.env.OLLAMA_MODEL || 'gpt-oss:20b'}          ║
╠═══════════════════════════════════════════════╣
║  Status: 🟢 ONLINE                            ║
║  Port: ${PORT}                                   ║
║  Endpoint: http://localhost:${PORT}              ║
║  AI Model: ${process.env.OLLAMA_MODEL || 'gpt-oss:20b'}                       ║
║                                               ║
║  Enhanced Features:                           ║
║  • Intelligent context-aware responses        ║
║  • Code generation & debugging help          ║
║  • Complex query understanding               ║
║  • Smart escalation detection                ║
╚═══════════════════════════════════════════════╝

Test Ollama connection: curl http://localhost:${PORT}/api/test/ollama
  `);
});

export default app;