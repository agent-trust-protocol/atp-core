export interface Agent {
  did: string;
  publicKeys: {
    ed25519: string;
    dilithium: string;
  };
  supportedAlgorithms: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  fromDid: string;
  toDid: string;
  message: string;
  signature: string | HybridSignature;
  timestamp: number;
}

export interface HybridSignature {
  ed25519: string;
  dilithium: string;
}

export interface RegisterRequest {
  publicKeys?: {
    ed25519?: string;
    dilithium?: string;
  };
}

export interface RegisterResponse {
  did: string;
  publicKeys: {
    ed25519: string;
    dilithium: string;
  };
  quantumSafe: boolean;
}

export interface SendMessageRequest {
  toDid: string;
  message: string;
  signature: string | HybridSignature;
}

export interface SendMessageResponse {
  messageId: string;
  timestamp: number;
}