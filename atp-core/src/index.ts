import express from 'express';
import { randomBytes } from 'crypto';
import { Ed25519Crypto } from './crypto.js';
import { QuantumSafeCrypto } from './quantum-crypto.js';
import { SQLiteStorage } from './storage.js';
import { MCPSecurityWrapper } from './mcp-wrapper.js';
import { RegisterRequest, RegisterResponse, SendMessageRequest, SendMessageResponse, HybridSignature } from './types.js';

const app = express();
const port = 3000;

app.use(express.json());

const storage = new SQLiteStorage();
const mcpWrapper = new MCPSecurityWrapper(storage);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Agent registration endpoint
app.post('/agent/register', (req, res) => {
  try {
    const { publicKeys: providedPublicKeys } = req.body as RegisterRequest;
    
    // Generate new quantum-safe key pairs if not provided
    const hybridKeyPair = providedPublicKeys ? 
      {
        ed25519: { publicKey: providedPublicKeys.ed25519 || '' },
        dilithium: { publicKey: providedPublicKeys.dilithium || '' }
      } : 
      QuantumSafeCrypto.generateHybridKeyPair();
    
    const did = QuantumSafeCrypto.generateQuantumSafeDID(
      hybridKeyPair.ed25519.publicKey, 
      hybridKeyPair.dilithium.publicKey
    );
    
    const agent = {
      did,
      publicKeys: {
        ed25519: hybridKeyPair.ed25519.publicKey,
        dilithium: hybridKeyPair.dilithium.publicKey
      },
      supportedAlgorithms: QuantumSafeCrypto.getSupportedAlgorithms(),
      createdAt: Date.now()
    };
    
    storage.saveAgent(agent);
    
    const response: RegisterResponse = {
      did: agent.did,
      publicKeys: agent.publicKeys,
      quantumSafe: true
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Message sending endpoint
app.post('/message/send', (req, res) => {
  try {
    const { toDid, message, signature } = req.body as SendMessageRequest;
    
    // Extract fromDid from Authorization header or use a default for this minimal implementation
    const authHeader = req.headers.authorization;
    const fromDid = authHeader?.replace('Bearer ', '') || 'unknown';
    
    // Verify the sender exists
    const sender = storage.getAgent(fromDid);
    if (!sender) {
      return res.status(404).json({ error: 'Sender not found' });
    }
    
    // Verify message signature (support both legacy and hybrid signatures)
    let isValid = false;
    
    if (typeof signature === 'string') {
      // Legacy Ed25519 signature verification
      isValid = Ed25519Crypto.verify(message, signature, sender.publicKeys.ed25519);
    } else {
      // Hybrid signature verification
      const hybridSig = signature as HybridSignature;
      isValid = QuantumSafeCrypto.hybridVerify(message, hybridSig, sender.publicKeys);
    }
    
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid signature' });
    }
    
    // Verify recipient exists
    const recipient = storage.getAgent(toDid);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    
    const messageId = Buffer.from(randomBytes(16)).toString('hex');
    const timestamp = Date.now();
    
    const messageRecord = {
      id: messageId,
      fromDid,
      toDid,
      message,
      signature,
      timestamp
    };
    
    storage.saveMessage(messageRecord);
    
    const response: SendMessageResponse = {
      messageId,
      timestamp
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Message sending error:', error);
    res.status(500).json({ error: 'Message sending failed' });
  }
});

// Get messages for an agent
app.get('/agent/:did/messages', (req, res) => {
  try {
    const { did } = req.params;
    const messages = storage.getMessages(did);
    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
});

// MCP Security Wrapper Endpoints
app.post('/mcp/tool/:toolname', (req, res) => {
  mcpWrapper.handleMCPRequest(req, res);
});

// Get MCP audit logs
app.get('/mcp/audit/:did?', (req, res) => {
  try {
    const { did } = req.params;
    const logs = mcpWrapper.getAuditLogs(did);
    res.json({ logs, count: logs.length });
  } catch (error) {
    console.error('MCP audit error:', error);
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`ATP Core server running on port ${port}`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  storage.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  storage.close();
  process.exit(0);
});