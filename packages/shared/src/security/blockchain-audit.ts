import { createHash, randomBytes } from 'crypto';
import { sha256 } from '@noble/hashes/sha256';

export interface BlockchainBlock {
  index: number;
  timestamp: string;
  data: string;
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  transactions: BlockchainTransaction[];
}

export interface BlockchainTransaction {
  id: string;
  timestamp: string;
  from: string;
  to: string;
  data: any;
  signature: string;
  hash: string;
}

export interface AuditAnchor {
  blockIndex: number;
  transactionId: string;
  merkleProof: string[];
  auditEventId: string;
  anchoredAt: string;
}

export interface IntegrityProof {
  valid: boolean;
  blockchainHeight: number;
  lastAnchoredBlock: number;
  unanchoredEvents: number;
  merkleRoot: string;
  proofPath: string[];
}

/**
 * Blockchain-based audit trail verification service
 * Provides immutable anchoring of audit events to a blockchain
 */
export class ATPBlockchainAuditService {
  private chain: BlockchainBlock[] = [];
  private pendingTransactions: BlockchainTransaction[] = [];
  private difficulty: number = 4; // Proof-of-work difficulty
  private miningReward: number = 100;
  private lastAnchoredEventId: string | null = null;

  constructor() {
    // Create genesis block
    this.createGenesisBlock();
  }

  /**
   * Create the genesis block for the audit blockchain
   */
  private createGenesisBlock(): void {
    const genesisBlock: BlockchainBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      data: 'ATP Audit Blockchain Genesis Block',
      previousHash: '0',
      hash: '',
      nonce: 0,
      merkleRoot: '',
      transactions: []
    };

    genesisBlock.merkleRoot = this.calculateMerkleRoot(genesisBlock.transactions);
    genesisBlock.hash = this.calculateHash(genesisBlock);
    
    this.chain.push(genesisBlock);
  }

  /**
   * Anchor an audit event to the blockchain
   */
  async anchorAuditEvent(
    auditEventId: string,
    auditEventHash: string,
    metadata: any
  ): Promise<AuditAnchor> {
    // Create a transaction for the audit event
    const transaction: BlockchainTransaction = {
      id: this.generateTransactionId(),
      timestamp: new Date().toISOString(),
      from: 'audit-service',
      to: 'blockchain',
      data: {
        auditEventId,
        auditEventHash,
        metadata,
        type: 'audit-anchor'
      },
      signature: this.signTransaction(auditEventId, auditEventHash),
      hash: this.hashTransaction(auditEventId, auditEventHash, metadata)
    };

    // Add to pending transactions
    this.pendingTransactions.push(transaction);

    // Mine a new block if we have enough transactions or enough time has passed
    const shouldMine = this.pendingTransactions.length >= 10 || 
                      this.shouldMineBlock();

    if (shouldMine) {
      await this.mineBlock();
    }

    // Generate merkle proof for the transaction
    const merkleProof = this.generateMerkleProof(transaction.id);

    const anchor: AuditAnchor = {
      blockIndex: this.chain.length - 1,
      transactionId: transaction.id,
      merkleProof,
      auditEventId,
      anchoredAt: transaction.timestamp
    };

    this.lastAnchoredEventId = auditEventId;
    return anchor;
  }

  /**
   * Verify an audit event anchor against the blockchain
   */
  verifyAuditAnchor(anchor: AuditAnchor): boolean {
    try {
      // Get the block
      const block = this.chain[anchor.blockIndex];
      if (!block) return false;

      // Find the transaction
      const transaction = block.transactions.find(tx => tx.id === anchor.transactionId);
      if (!transaction) return false;

      // Verify merkle proof
      const isValidMerkleProof = this.verifyMerkleProof(
        transaction.hash,
        anchor.merkleProof,
        block.merkleRoot
      );

      // Verify block hash
      const calculatedBlockHash = this.calculateHash(block);
      const isValidBlockHash = block.hash === calculatedBlockHash;

      // Verify transaction data
      const isValidTransaction = transaction.data.auditEventId === anchor.auditEventId;

      return isValidMerkleProof && isValidBlockHash && isValidTransaction;
    } catch (error) {
      console.error('Error verifying audit anchor:', error);
      return false;
    }
  }

  /**
   * Generate integrity proof for audit trail
   */
  generateIntegrityProof(): IntegrityProof {
    const lastBlock = this.getLatestBlock();
    const unanchoredEvents = this.pendingTransactions.length;
    
    // Calculate merkle root of all audit events
    const allTransactions = this.chain
      .flatMap(block => block.transactions)
      .filter(tx => tx.data.type === 'audit-anchor');

    const merkleRoot = this.calculateMerkleRoot(allTransactions);
    
    // Generate proof path for latest anchored event
    const proofPath = this.lastAnchoredEventId ? 
      this.generateMerkleProof(this.lastAnchoredEventId) : [];

    return {
      valid: this.verifyBlockchainIntegrity(),
      blockchainHeight: this.chain.length,
      lastAnchoredBlock: lastBlock.index,
      unanchoredEvents,
      merkleRoot,
      proofPath
    };
  }

  /**
   * Verify the integrity of the entire blockchain
   */
  verifyBlockchainIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // Verify current block hash
      if (currentBlock.hash !== this.calculateHash(currentBlock)) {
        console.error(`Invalid hash for block ${i}`);
        return false;
      }

      // Verify previous hash link
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`Invalid previous hash for block ${i}`);
        return false;
      }

      // Verify merkle root
      const calculatedMerkleRoot = this.calculateMerkleRoot(currentBlock.transactions);
      if (currentBlock.merkleRoot !== calculatedMerkleRoot) {
        console.error(`Invalid merkle root for block ${i}`);
        return false;
      }

      // Verify proof of work
      if (!this.isValidProofOfWork(currentBlock)) {
        console.error(`Invalid proof of work for block ${i}`);
        return false;
      }
    }

    return true;
  }

  /**
   * Get blockchain statistics
   */
  getBlockchainStats(): {
    totalBlocks: number;
    totalTransactions: number;
    totalAuditEvents: number;
    lastBlockTime: string;
    averageBlockTime: number;
    chainHash: string;
  } {
    const totalTransactions = this.chain
      .reduce((sum, block) => sum + block.transactions.length, 0);
    
    const auditEvents = this.chain
      .flatMap(block => block.transactions)
      .filter(tx => tx.data.type === 'audit-anchor').length;

    const blockTimes = this.chain.slice(1).map((block, index) => {
      const prevTime = new Date(this.chain[index].timestamp).getTime();
      const currTime = new Date(block.timestamp).getTime();
      return currTime - prevTime;
    });

    const averageBlockTime = blockTimes.length > 0 ? 
      blockTimes.reduce((sum, time) => sum + time, 0) / blockTimes.length : 0;

    // Calculate chain hash (hash of all block hashes)
    const chainHash = createHash('sha256')
      .update(this.chain.map(block => block.hash).join(''))
      .digest('hex');

    return {
      totalBlocks: this.chain.length,
      totalTransactions,
      totalAuditEvents: auditEvents,
      lastBlockTime: this.getLatestBlock().timestamp,
      averageBlockTime,
      chainHash
    };
  }

  /**
   * Export blockchain data for backup/synchronization
   */
  exportBlockchain(): string {
    return JSON.stringify({
      chain: this.chain,
      pendingTransactions: this.pendingTransactions,
      lastAnchoredEventId: this.lastAnchoredEventId,
      exportedAt: new Date().toISOString()
    });
  }

  /**
   * Import blockchain data from backup
   */
  importBlockchain(blockchainData: string): boolean {
    try {
      const data = JSON.parse(blockchainData);
      
      // Verify the imported chain
      const tempService = new ATPBlockchainAuditService();
      tempService.chain = data.chain;
      
      if (!tempService.verifyBlockchainIntegrity()) {
        throw new Error('Invalid blockchain data');
      }

      this.chain = data.chain;
      this.pendingTransactions = data.pendingTransactions || [];
      this.lastAnchoredEventId = data.lastAnchoredEventId || null;

      return true;
    } catch (error) {
      console.error('Failed to import blockchain:', error);
      return false;
    }
  }

  // Private methods

  private async mineBlock(): Promise<void> {
    const previousBlock = this.getLatestBlock();
    const newBlock: BlockchainBlock = {
      index: previousBlock.index + 1,
      timestamp: new Date().toISOString(),
      data: `Block ${previousBlock.index + 1}`,
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
      merkleRoot: this.calculateMerkleRoot(this.pendingTransactions),
      transactions: [...this.pendingTransactions]
    };

    // Proof of work
    newBlock.hash = await this.proofOfWork(newBlock);
    
    this.chain.push(newBlock);
    this.pendingTransactions = [];

    console.log(`⛏️  Block mined: ${newBlock.index} with hash: ${newBlock.hash.substring(0, 8)}...`);
  }

  private async proofOfWork(block: BlockchainBlock): Promise<string> {
    const target = Array(this.difficulty + 1).join('0');
    
    while (true) {
      const hash = this.calculateHash(block);
      
      if (hash.substring(0, this.difficulty) === target) {
        return hash;
      }
      
      block.nonce++;
      
      // Yield control occasionally to prevent blocking
      if (block.nonce % 100000 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  }

  private isValidProofOfWork(block: BlockchainBlock): boolean {
    const target = Array(this.difficulty + 1).join('0');
    return block.hash.substring(0, this.difficulty) === target;
  }

  private calculateHash(block: BlockchainBlock): string {
    return createHash('sha256')
      .update(
        block.index +
        block.previousHash +
        block.timestamp +
        JSON.stringify(block.data) +
        block.nonce +
        block.merkleRoot
      )
      .digest('hex');
  }

  private calculateMerkleRoot(transactions: BlockchainTransaction[]): string {
    if (transactions.length === 0) {
      return createHash('sha256').update('').digest('hex');
    }

    let level = transactions.map(tx => tx.hash);
    
    while (level.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        
        const combined = createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        nextLevel.push(combined);
      }
      
      level = nextLevel;
    }
    
    return level[0];
  }

  private generateMerkleProof(transactionId: string): string[] {
    // Find all transactions in the blockchain
    const allTransactions = this.chain.flatMap(block => block.transactions);
    const transactionIndex = allTransactions.findIndex(tx => tx.id === transactionId);
    
    if (transactionIndex === -1) return [];

    // Generate merkle proof path
    const proof: string[] = [];
    let currentIndex = transactionIndex;
    let level = allTransactions.map(tx => tx.hash);
    
    while (level.length > 1) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;
      
      if (siblingIndex < level.length) {
        proof.push(level[siblingIndex]);
      }
      
      const nextLevel: string[] = [];
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = i + 1 < level.length ? level[i + 1] : left;
        nextLevel.push(createHash('sha256').update(left + right).digest('hex'));
      }
      
      level = nextLevel;
      currentIndex = Math.floor(currentIndex / 2);
    }
    
    return proof;
  }

  private verifyMerkleProof(
    transactionHash: string,
    proof: string[],
    merkleRoot: string
  ): boolean {
    let currentHash = transactionHash;
    
    for (const proofElement of proof) {
      currentHash = createHash('sha256')
        .update(currentHash + proofElement)
        .digest('hex');
    }
    
    return currentHash === merkleRoot;
  }

  private generateTransactionId(): string {
    return 'tx_' + randomBytes(16).toString('hex');
  }

  private signTransaction(auditEventId: string, auditEventHash: string): string {
    // Simplified signing - in practice would use proper digital signatures
    return createHash('sha256')
      .update(auditEventId + auditEventHash + 'audit-service-key')
      .digest('hex');
  }

  private hashTransaction(auditEventId: string, auditEventHash: string, metadata: any): string {
    return createHash('sha256')
      .update(auditEventId + auditEventHash + JSON.stringify(metadata))
      .digest('hex');
  }

  private getLatestBlock(): BlockchainBlock {
    return this.chain[this.chain.length - 1];
  }

  private shouldMineBlock(): boolean {
    const lastBlock = this.getLatestBlock();
    const timeSinceLastBlock = Date.now() - new Date(lastBlock.timestamp).getTime();
    
    // Mine a block every 5 minutes if there are pending transactions
    return timeSinceLastBlock > 5 * 60 * 1000 && this.pendingTransactions.length > 0;
  }
}