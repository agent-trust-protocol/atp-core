/**
 * Tests for SimpleAgent API
 */

import { Agent } from '../simple-agent';
import { ATPClient } from '../client/atp';
import { CryptoUtils } from '../utils/crypto';
import { TrustScoring, TrustLevel } from '../utils/trust';

// Mock the ATPClient
jest.mock('../client/atp');
jest.mock('../utils/crypto');
jest.mock('../utils/trust');

describe('Agent', () => {
  let mockIdentityClient: any;
  let mockAuditClient: any;
  let mockPermissionsClient: any;
  let mockCredentialsClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock clients
    mockIdentityClient = {
      registerDID: jest.fn().mockResolvedValue({
        data: { did: 'did:atp:test123' }
      })
    };

    mockAuditClient = {
      logEvent: jest.fn().mockResolvedValue({ success: true }),
      queryEvents: jest.fn().mockResolvedValue({
        data: { events: [] }
      })
    };

    mockPermissionsClient = {
      grantPermission: jest.fn().mockResolvedValue({ success: true })
    };

    mockCredentialsClient = {
      issueCredential: jest.fn().mockResolvedValue({
        data: { id: 'cred-123' }
      })
    };

    // Mock ATPClient constructor
    (ATPClient as jest.Mock).mockImplementation(() => ({
      identity: mockIdentityClient,
      audit: mockAuditClient,
      permissions: mockPermissionsClient,
      credentials: mockCredentialsClient,
      setAuthentication: jest.fn()
    }));

    // Mock CryptoUtils.generateKeyPair
    (CryptoUtils.generateKeyPair as jest.Mock).mockResolvedValue({
      publicKey: 'a'.repeat(3968), // Correct length for hybrid public key
      privateKey: 'b'.repeat(8128), // Correct length for hybrid private key
      quantumSafe: true,
      ed25519PublicKey: 'c'.repeat(64),
      ed25519PrivateKey: 'd'.repeat(64),
      mlDsaPublicKey: 'e'.repeat(3904),
      mlDsaPrivateKey: 'f'.repeat(8064)
    });

    // Mock CryptoUtils.generateX25519KeyPair for message encryption
    (CryptoUtils.generateX25519KeyPair as jest.Mock).mockReturnValue({
      publicKey: 'x'.repeat(64), // 32 bytes hex
      privateKey: 'y'.repeat(64)  // 32 bytes hex
    });

    // Mock CryptoUtils.generateId for message IDs
    (CryptoUtils.generateId as jest.Mock).mockReturnValue('test-message-id-123');

    // Mock CryptoUtils.encryptForRecipient
    (CryptoUtils.encryptForRecipient as jest.Mock).mockReturnValue('encrypted-message-data');

    // Mock CryptoUtils.decryptFromSender
    (CryptoUtils.decryptFromSender as jest.Mock).mockReturnValue('{"text":"decrypted message"}');

    // Mock TrustScoring.levelFromCount (static method)
    (TrustScoring.levelFromCount as jest.Mock).mockImplementation((count: number) => {
      if (count === 0) return 0;
      if (count < 5) return 0.25;
      if (count < 20) return 0.5;
      if (count < 50) return 0.75;
      return 1.0;
    });

    // Mock TrustScoring instance methods
    const mockCalculateTrustScore = jest.fn().mockReturnValue({
      score: 0.65,
      level: TrustLevel.TRUSTED,
      factors: {
        interactionScore: 0.7,
        recencyScore: 0.8,
        credentialScore: 0.6,
        successScore: 0.5
      },
      confidence: 0.75,
      metadata: {
        totalInteractions: 10,
        successfulInteractions: 8,
        credentialsVerified: 2,
        assessedAt: new Date().toISOString()
      }
    });

    (TrustScoring as unknown as jest.Mock).mockImplementation(() => ({
      calculateTrustScore: mockCalculateTrustScore
    }));
  });

  describe('Agent.create', () => {
    it('should create an agent with quantum-safe identity', async () => {
      const agent = await Agent.create('TestBot');

      expect(agent).toBeInstanceOf(Agent);
      expect(agent.getName()).toBe('TestBot');
      expect(agent.isInitialized()).toBe(true);
      expect(agent.getDID()).toBe('did:atp:test123');
      expect(agent.isQuantumSafe()).toBe(true);

      // Verify CryptoUtils was called with quantum-safe flag
      expect(CryptoUtils.generateKeyPair).toHaveBeenCalledWith(true);

      // Verify DID was registered
      expect(mockIdentityClient.registerDID).toHaveBeenCalledWith({
        publicKey: 'a'.repeat(3968),
        metadata: {
          name: 'TestBot',
          quantumSafe: true,
          algorithm: 'hybrid-ed25519-mldsa65'
        }
      });
    });

    it('should create an agent with existing DID', async () => {
      const existingDid = 'did:atp:existing123';
      const existingKey = 'x'.repeat(64);

      const agent = await Agent.create('ExistingBot', {
        did: existingDid,
        privateKey: existingKey
      });

      expect(agent.getDID()).toBe(existingDid);
      expect(agent.isInitialized()).toBe(true);

      // Should not generate new keypair when DID is provided
      expect(CryptoUtils.generateKeyPair).not.toHaveBeenCalled();
    });

    it('should throw error if DID registration fails', async () => {
      mockIdentityClient.registerDID.mockResolvedValue({ data: null });

      await expect(Agent.create('FailBot')).rejects.toThrow('Failed to register DID');
    });

    it('should use custom server URL from options', async () => {
      await Agent.create('CustomBot', { serverUrl: 'http://custom-server' });

      expect(ATPClient).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'http://custom-server'
        })
      );
    });
  });

  describe('getDID', () => {
    it('should throw error if agent not initialized', () => {
      // Create agent without calling create (which initializes)
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.did = null;

      expect(() => uninitializedAgent.getDID()).toThrow('Agent not initialized');
    });
  });

  describe('getName', () => {
    it('should return agent name', async () => {
      const agent = await Agent.create('NameTest');
      expect(agent.getName()).toBe('NameTest');
    });
  });

  describe('isInitialized', () => {
    it('should return true after creation', async () => {
      const agent = await Agent.create('InitTest');
      expect(agent.isInitialized()).toBe(true);
    });
  });

  describe('isQuantumSafe', () => {
    it('should return true for quantum-safe agents', async () => {
      const agent = await Agent.create('QuantumBot');
      expect(agent.isQuantumSafe()).toBe(true);
    });

    it('should detect quantum-safe from key length', async () => {
      // Create agent with long private key (indicates hybrid)
      const agent = await Agent.create('LongKeyBot', {
        did: 'did:atp:longkey',
        privateKey: 'x'.repeat(8128) // Hybrid key length
      });

      expect(agent.isQuantumSafe()).toBe(true);
    });

    it('should return false for short keys', async () => {
      const agent = await Agent.create('ShortKeyBot', {
        did: 'did:atp:shortkey',
        privateKey: 'x'.repeat(64) // Ed25519 only
      });

      expect(agent.isQuantumSafe()).toBe(false);
    });
  });

  describe('send', () => {
    it('should send a message and log to audit', async () => {
      const agent = await Agent.create('SenderBot');

      const result = await agent.send('did:atp:recipient', 'Hello!');

      expect(result).toHaveProperty('encrypted');
      expect(result).toHaveProperty('messageId');
      expect(result.encrypted).toBe(false); // No encryption key provided
      expect(result.messageId).toBe('test-message-id-123');
      expect(mockAuditClient.logEvent).toHaveBeenCalledWith({
        source: 'agent-sdk',
        action: 'message.sent',
        resource: 'did:atp:recipient',
        actor: 'did:atp:test123',
        details: expect.objectContaining({
          messageId: 'test-message-id-123',
          from: 'did:atp:test123',
          to: 'did:atp:recipient',
          encrypted: false
        })
      });
    });

    it('should handle object messages', async () => {
      const agent = await Agent.create('ObjectSender');

      const result = await agent.send('did:atp:recipient', { action: 'greet', data: 'Hello' });

      expect(result.encrypted).toBe(false);
      expect(mockAuditClient.logEvent).toHaveBeenCalled();
    });

    it('should encrypt message when recipient encryption key provided', async () => {
      const agent = await Agent.create('EncryptedSender');
      const recipientEncKey = 'z'.repeat(64); // 32 bytes hex

      const result = await agent.send('did:atp:recipient', 'Secret message', {
        recipientEncryptionKey: recipientEncKey
      });

      expect(result.encrypted).toBe(true);
      expect(CryptoUtils.encryptForRecipient).toHaveBeenCalledWith(
        '{"text":"Secret message"}',
        recipientEncKey
      );
      expect(mockAuditClient.logEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          details: expect.objectContaining({
            encrypted: true,
            encryptedSize: expect.any(Number)
          })
        })
      );
    });

    it('should not encrypt when encrypt option is false', async () => {
      const agent = await Agent.create('NoEncryptSender');
      const recipientEncKey = 'z'.repeat(64);

      const result = await agent.send('did:atp:recipient', 'Plain message', {
        recipientEncryptionKey: recipientEncKey,
        encrypt: false
      });

      expect(result.encrypted).toBe(false);
      expect(CryptoUtils.encryptForRecipient).not.toHaveBeenCalled();
    });

    it('should throw if agent not initialized', async () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;

      await expect(
        uninitializedAgent.send('did:atp:recipient', 'Hello')
      ).rejects.toThrow('Agent not initialized');
    });
  });

  describe('getEncryptionPublicKey', () => {
    it('should return the encryption public key', async () => {
      const agent = await Agent.create('KeyProvider');

      const encKey = agent.getEncryptionPublicKey();

      expect(encKey).toBe('x'.repeat(64)); // From mock
    });

    it('should throw if agent not initialized', () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;
      uninitializedAgent.encryptionPublicKey = null;

      expect(() => uninitializedAgent.getEncryptionPublicKey()).toThrow('Agent not initialized');
    });
  });

  describe('decryptMessage', () => {
    it('should decrypt an encrypted message', async () => {
      const agent = await Agent.create('Decryptor');

      const decrypted = agent.decryptMessage('encrypted-data');

      expect(CryptoUtils.decryptFromSender).toHaveBeenCalledWith(
        'encrypted-data',
        'y'.repeat(64) // Mock encryption private key
      );
      expect(decrypted).toBe('{"text":"decrypted message"}');
    });

    it('should throw if agent not initialized', () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;
      uninitializedAgent.encryptionPrivateKey = null;

      expect(() => uninitializedAgent.decryptMessage('encrypted')).toThrow('Agent not initialized');
    });
  });

  describe('getTrustScore', () => {
    it('should return 0 for unknown agents (no interactions)', async () => {
      const agent = await Agent.create('TrustChecker');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: [] }
      });

      const score = await agent.getTrustScore('did:atp:unknown');
      expect(score).toBe(0);
    });

    it('should return 0.25 for basic trust (1-4 interactions)', async () => {
      const agent = await Agent.create('TrustChecker');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: [{}, {}, {}] } // 3 interactions
      });

      const score = await agent.getTrustScore('did:atp:basic');
      expect(score).toBe(0.25);
    });

    it('should return 0.5 for verified trust (5-19 interactions)', async () => {
      const agent = await Agent.create('TrustChecker');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: new Array(10).fill({}) }
      });

      const score = await agent.getTrustScore('did:atp:verified');
      expect(score).toBe(0.5);
    });

    it('should return 0.75 for trusted (20-49 interactions)', async () => {
      const agent = await Agent.create('TrustChecker');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: new Array(30).fill({}) }
      });

      const score = await agent.getTrustScore('did:atp:trusted');
      expect(score).toBe(0.75);
    });

    it('should return 1.0 for privileged trust (50+ interactions)', async () => {
      const agent = await Agent.create('TrustChecker');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: new Array(50).fill({}) }
      });

      const score = await agent.getTrustScore('did:atp:privileged');
      expect(score).toBe(1.0);
    });

    it('should return 0 on query error', async () => {
      const agent = await Agent.create('TrustChecker');

      mockAuditClient.queryEvents.mockRejectedValue(new Error('Network error'));

      const score = await agent.getTrustScore('did:atp:error');
      expect(score).toBe(0);
    });

    it('should throw if agent not initialized', async () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;

      await expect(
        uninitializedAgent.getTrustScore('did:atp:any')
      ).rejects.toThrow('Agent not initialized');
    });
  });

  describe('grantCapability', () => {
    it('should grant capability to another agent', async () => {
      const agent = await Agent.create('Granter');

      await agent.grantCapability('did:atp:grantee', 'read:data');

      expect(mockPermissionsClient.grantPermission).toHaveBeenCalledWith({
        subject: 'did:atp:grantee',
        resource: 'did:atp:test123:*',
        action: 'read:data',
        conditions: {},
        expiresAt: expect.any(String)
      });
    });

    it('should throw if agent not initialized', async () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;

      await expect(
        uninitializedAgent.grantCapability('did:atp:grantee', 'read')
      ).rejects.toThrow('Agent not initialized');
    });
  });

  describe('issueCredential', () => {
    it('should issue credential to subject', async () => {
      const agent = await Agent.create('Issuer');

      const credId = await agent.issueCredential(
        'did:atp:subject',
        'verified-partner',
        { level: 'gold' }
      );

      expect(credId).toBe('cred-123');
      expect(mockCredentialsClient.issueCredential).toHaveBeenCalledWith({
        subjectDID: 'did:atp:subject',
        credentialType: 'verified-partner',
        claims: { level: 'gold' },
        expirationDate: expect.any(String)
      });
    });

    it('should return fallback ID if credential ID missing', async () => {
      const agent = await Agent.create('Issuer');

      mockCredentialsClient.issueCredential.mockResolvedValue({ data: {} });

      const credId = await agent.issueCredential('did:atp:subject', 'test', {});
      expect(credId).toBe('credential-id');
    });

    it('should throw if agent not initialized', async () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;

      await expect(
        uninitializedAgent.issueCredential('did:atp:subject', 'type', {})
      ).rejects.toThrow('Agent not initialized');
    });
  });

  describe('Event System', () => {
    it('should register event handlers with on()', async () => {
      const agent = await Agent.create('EventBot');
      const handler = jest.fn();

      agent.on('message', handler);

      expect(agent.hasListeners('message')).toBe(true);
      expect(agent.listenerCount('message')).toBe(1);
    });

    it('should emit events to handlers', async () => {
      const agent = await Agent.create('EventBot');
      const handler = jest.fn();

      agent.on('message', handler);
      agent.emit('message', { type: 'message', from: 'did:atp:sender', content: 'Hello' });

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'message',
          from: 'did:atp:sender',
          content: 'Hello'
        })
      );
    });

    it('should support once() for single-use handlers', async () => {
      const agent = await Agent.create('EventBot');
      const handler = jest.fn();

      agent.once('connection.open', handler);
      agent.emit('connection.open', { type: 'connection.open' });
      agent.emit('connection.open', { type: 'connection.open' });

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should remove handlers with off()', async () => {
      const agent = await Agent.create('EventBot');
      const handler = jest.fn();

      agent.on('message', handler);
      agent.off('message', handler);

      expect(agent.hasListeners('message')).toBe(false);
    });

    it('should remove all listeners with removeAllListeners()', async () => {
      const agent = await Agent.create('EventBot');

      agent.on('message', jest.fn());
      agent.on('error', jest.fn());
      agent.removeAllListeners();

      expect(agent.getRegisteredEvents()).toHaveLength(0);
    });

    it('should track registered event types', async () => {
      const agent = await Agent.create('EventBot');

      agent.on('message', jest.fn());
      agent.on('trust.changed', jest.fn());

      const events = agent.getRegisteredEvents();
      expect(events).toContain('message');
      expect(events).toContain('trust.changed');
    });
  });

  describe('establishTrust', () => {
    it('should return established=true if trust meets threshold', async () => {
      const agent = await Agent.create('TrustEstablisher');

      // Mock high trust score
      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: new Array(30).fill({}) }
      });

      const result = await agent.establishTrust('did:atp:trusted', 0.5);

      expect(result.established).toBe(true);
      expect(result.level).toBe(0.75);
    });

    it('should return established=false if trust below threshold', async () => {
      const agent = await Agent.create('TrustEstablisher');

      // Mock low trust score
      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: [{}, {}] }
      });

      const result = await agent.establishTrust('did:atp:low-trust', 0.5);

      expect(result.established).toBe(false);
      expect(result.level).toBe(0.25);

      // Should log trust establishment attempt
      expect(mockAuditClient.logEvent).toHaveBeenCalledWith({
        source: 'agent-sdk',
        action: 'trust.establish.attempted',
        resource: 'did:atp:low-trust',
        actor: 'did:atp:test123',
        details: expect.objectContaining({
          currentLevel: 0.25,
          requiredLevel: 0.5
        })
      });
    });

    it('should use default minTrustLevel of 0.5', async () => {
      const agent = await Agent.create('TrustEstablisher');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: new Array(10).fill({}) }
      });

      const result = await agent.establishTrust('did:atp:default');

      // 10 events = 0.5 trust, which equals default threshold
      expect(result.established).toBe(true);
    });

    it('should throw if agent not initialized', async () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;

      await expect(
        uninitializedAgent.establishTrust('did:atp:any')
      ).rejects.toThrow('Agent not initialized');
    });
  });

  describe('assessTrust', () => {
    it('should return detailed trust assessment', async () => {
      const agent = await Agent.create('TrustAssessor');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: [{ timestamp: new Date().toISOString(), action: 'message' }] }
      });

      mockCredentialsClient.getCredentialsForDID = jest.fn().mockResolvedValue({
        data: { credentials: [] }
      });

      const result = await agent.assessTrust('did:atp:assessed');

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('level');
      expect(result).toHaveProperty('factors');
      expect(result).toHaveProperty('confidence');
      expect(result).toHaveProperty('metadata');
    });

    it('should include factor breakdown', async () => {
      const agent = await Agent.create('TrustAssessor');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: [] }
      });

      const result = await agent.assessTrust('did:atp:assessed');

      expect(result.factors).toHaveProperty('interactionScore');
      expect(result.factors).toHaveProperty('recencyScore');
      expect(result.factors).toHaveProperty('credentialScore');
      expect(result.factors).toHaveProperty('successScore');
    });

    it('should include metadata', async () => {
      const agent = await Agent.create('TrustAssessor');

      mockAuditClient.queryEvents.mockResolvedValue({
        data: { events: [] }
      });

      const result = await agent.assessTrust('did:atp:assessed');

      expect(result.metadata).toHaveProperty('totalInteractions');
      expect(result.metadata).toHaveProperty('successfulInteractions');
      expect(result.metadata).toHaveProperty('credentialsVerified');
      expect(result.metadata).toHaveProperty('assessedAt');
    });

    it('should return default score on error', async () => {
      const agent = await Agent.create('TrustAssessor');

      mockAuditClient.queryEvents.mockRejectedValue(new Error('Service unavailable'));

      const result = await agent.assessTrust('did:atp:error');

      expect(result.score).toBe(0);
      expect(result.level).toBe(TrustLevel.UNKNOWN);
      expect(result.confidence).toBe(0);
    });

    it('should throw if agent not initialized', async () => {
      const uninitializedAgent = Object.create(Agent.prototype);
      uninitializedAgent.initialized = false;

      await expect(
        uninitializedAgent.assessTrust('did:atp:any')
      ).rejects.toThrow('Agent not initialized');
    });
  });
});
