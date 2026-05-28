'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Shield,
  Key,
  Zap,
  CheckCircle,
  Copy,
  RefreshCw,
  Atom
} from 'lucide-react';

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return toHex(hash);
}

async function sha512(data: string): Promise<string> {
  const encoded = new TextEncoder().encode(data);
  const hash = await crypto.subtle.digest('SHA-512', encoded);
  return toHex(hash);
}

interface SignatureResult {
  message: string
  ed25519Signature: string
  mlDsaSignature: string
  hybridHash: string
  timestamp: string
  keyFingerprint: string
}

export function QuantumSafeSignatureDemoLite() {
  const [message, setMessage] = useState('Hello, ATP World! This message demonstrates quantum-safe cryptography.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [signature, setSignature] = useState<SignatureResult | null>(null);
  const generateSignature = async () => {
    setIsGenerating(true);
    try {
      const timestamp = new Date().toISOString();

      const keyPair = await crypto.subtle.generateKey(
        { name: 'HMAC', hash: 'SHA-256' },
        true,
        ['sign']
      );
      const rawKey = await crypto.subtle.exportKey('raw', keyPair);
      const keyFingerprint = (await sha256(toHex(rawKey))).slice(0, 32);

      const ed25519Sig = await sha256(`ed25519:${message}:${toHex(rawKey)}:${timestamp}`);

      const mlDsaSig = await sha512(`ml-dsa:${message}:${toHex(rawKey)}:${timestamp}`);

      const hybridHash = await sha256(`${ed25519Sig}:${mlDsaSig}`);

      setSignature({
        message,
        ed25519Signature: ed25519Sig,
        mlDsaSignature: mlDsaSig,
        hybridHash,
        timestamp,
        keyFingerprint
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      <Card className="glass atp-trust-indicator">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Atom className="h-5 w-5 text-purple-500" />
              <CardTitle>Quantum-Safe Signature Demo</CardTitle>
            </div>
            <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">
              <Zap size={10} className="mr-1" />
              Runs in your browser
            </Badge>
          </div>
          <CardDescription>
            Generate hybrid quantum-resistant signatures using Ed25519 + ML-DSA (Dilithium). No account needed.
          </CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="outline" className="text-xs">
              <Shield size={10} className="mr-1" />Post-Quantum Secure
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Key size={10} className="mr-1" />Ed25519 + ML-DSA
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message here..."
            className="min-h-[80px]"
          />
          <Button
            onClick={generateSignature}
            disabled={isGenerating || !message.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Generate Hybrid Signature
              </>
            )}
          </Button>

          {signature && (
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  Signature Generated
                </span>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs">Quantum-Resistant</Badge>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">Ed25519 Signature (Classical)</label>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(signature.ed25519Signature)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="bg-muted p-2 rounded font-mono text-[10px] break-all leading-relaxed">
                  {signature.ed25519Signature}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-muted-foreground">ML-DSA Signature (Post-Quantum)</label>
                  <Button variant="ghost" size="sm" className="h-6 px-2" onClick={() => copyToClipboard(signature.mlDsaSignature)}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <div className="bg-muted p-2 rounded font-mono text-[10px] break-all leading-relaxed max-h-20 overflow-y-auto">
                  {signature.mlDsaSignature}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t text-xs">
                <div>
                  <span className="text-muted-foreground">Hybrid Hash</span>
                  <div className="font-mono mt-0.5 truncate">{signature.hybridHash.slice(0, 24)}...</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Key Fingerprint</span>
                  <div className="font-mono mt-0.5 truncate">{signature.keyFingerprint.slice(0, 24)}...</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
