/**
 * IBM Agent Communication Protocol (ACP) Type Definitions
 */

export interface ACPMessage {
  id: string;
  performative: ACPPerformative;
  sender: string;
  receiver: string | string[];
  content: any;
  language?: string;
  encoding?: string;
  ontology?: string;
  protocol?: string;
  conversationId?: string;
  replyWith?: string;
  inReplyTo?: string;
  replyBy?: Date;
  timestamp: Date;
}

export enum ACPPerformative {
  ACCEPT_PROPOSAL = 'accept-proposal',
  AGREE = 'agree',
  CANCEL = 'cancel',
  CFP = 'cfp', // Call for proposal
  CONFIRM = 'confirm',
  DISCONFIRM = 'disconfirm',
  FAILURE = 'failure',
  INFORM = 'inform',
  INFORM_IF = 'inform-if',
  INFORM_REF = 'inform-ref',
  NOT_UNDERSTOOD = 'not-understood',
  PROPOSE = 'propose',
  QUERY_IF = 'query-if',
  QUERY_REF = 'query-ref',
  REFUSE = 'refuse',
  REJECT_PROPOSAL = 'reject-proposal',
  REQUEST = 'request',
  REQUEST_WHEN = 'request-when',
  REQUEST_WHENEVER = 'request-whenever',
  SUBSCRIBE = 'subscribe'
}

export interface ACPAgent {
  aid: string; // Agent Identifier
  name: string;
  addresses: string[];
  resolvers?: string[];
  userDefinedProperties?: Record<string, any>;
}

export interface ACPEnvelope {
  to: ACPAgent[];
  from: ACPAgent;
  comments?: string;
  aclRepresentation?: string;
  payloadLength?: number;
  payloadEncoding?: string;
  date?: Date;
  encrypted?: boolean;
  intendedReceiver?: ACPAgent[];
  received?: {
    by: string;
    from: string;
    date: Date;
    id?: string;
    via?: string;
  }[];
}

export interface SecuredACPMessage extends ACPMessage {
  atpHeaders: {
    clientDID: string;
    signature: string;
    trustLevel: string;
    timestamp: number;
    nonce: string;
  };
  envelope: ACPEnvelope;
}

export interface ACPSecurityConfig {
  enforceAuthentication: boolean;
  requireQuantumSafeSignatures: boolean;
  enableAuditLogging: boolean;
  maxMessageSize: number;
  trustedAgents: string[];
  rateLimitPerAgent: number;
  conversationTimeout: number;
  database: any; // DatabaseManager instance
}