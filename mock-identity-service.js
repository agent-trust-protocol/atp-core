#!/usr/bin/env node

/**
 * Mock Identity Service for Complete Authentication Testing
 * Provides DID resolution and registration for testing the authentication flow
 */

import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory storage for testing
const didRegistry = new Map();

// Health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-identity-service',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    registeredDIDs: didRegistry.size
  });
});

// Register a new DID
app.post('/identity/register', (req, res) => {
  try {
    const { did, document, publicKey, trustLevel } = req.body;
    
    if (!did || !document) {
      return res.status(400).json({
        success: false,
        error: 'DID and document are required'
      });
    }

    // Store DID document
    didRegistry.set(did, {
      document,
      publicKey,
      trustLevel: trustLevel || 'basic',
      registeredAt: new Date().toISOString()
    });

    console.log(`✅ Registered DID: ${did}`);
    
    res.json({
      success: true,
      message: 'DID registered successfully',
      did
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Resolve a DID
app.get('/identity/:did', (req, res) => {
  try {
    const did = decodeURIComponent(req.params.did);
    const entry = didRegistry.get(did);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'DID not found'
      });
    }

    res.json({
      success: true,
      data: entry.document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get DID document
app.get('/identity/:did/document', (req, res) => {
  try {
    const did = decodeURIComponent(req.params.did);
    const entry = didRegistry.get(did);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'DID not found'
      });
    }

    res.json({
      success: true,
      document: entry.document
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// List all registered DIDs
app.get('/identity', (req, res) => {
  const dids = Array.from(didRegistry.keys()).map(did => ({
    did,
    trustLevel: didRegistry.get(did).trustLevel,
    registeredAt: didRegistry.get(did).registeredAt
  }));

  res.json({
    success: true,
    data: dids,
    count: dids.length
  });
});

// Update trust level
app.post('/identity/:did/trust-level', (req, res) => {
  try {
    const did = decodeURIComponent(req.params.did);
    const { trustLevel } = req.body;
    const entry = didRegistry.get(did);
    
    if (!entry) {
      return res.status(404).json({
        success: false,
        error: 'DID not found'
      });
    }

    entry.trustLevel = trustLevel;
    entry.document.metadata = entry.document.metadata || {};
    entry.document.metadata.trustLevel = trustLevel;
    
    didRegistry.set(did, entry);

    res.json({
      success: true,
      message: 'Trust level updated',
      trustLevel
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`🆔 Mock Identity Service Started`);
  console.log(`   Port: ${port}`);
  console.log(`   Health: http://localhost:${port}/health`);
  console.log(`   Status: Ready for DID registration and resolution`);
  console.log('');
  
  // Pre-register some test DIDs for demonstration
  const testDIDs = [
    {
      did: 'did:atp:test:alice',
      document: {
        id: 'did:atp:test:alice',
        verificationMethod: [{
          id: 'did:atp:test:alice#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:atp:test:alice',
          publicKeyMultibase: 'z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK'
        }],
        authentication: ['did:atp:test:alice#key-1'],
        metadata: {
          trustLevel: 'verified',
          capabilities: ['authenticate', 'sign-transactions']
        }
      },
      trustLevel: 'verified'
    }
  ];

  testDIDs.forEach(({ did, document, trustLevel }) => {
    didRegistry.set(did, {
      document,
      trustLevel,
      registeredAt: new Date().toISOString()
    });
  });

  console.log(`📋 Pre-registered ${testDIDs.length} test DIDs for demonstration`);
});

export default app;