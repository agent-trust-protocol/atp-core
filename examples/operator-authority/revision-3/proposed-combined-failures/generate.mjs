// Proposed ATP-authored cases, not adopted lab inputs. Node built-ins only.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export function generate() {
  const make = kind => ({
    id: `ATP-P192-${kind.toUpperCase()}`,
    description: `Read-only grant plus ${kind} status; authority refusal precedes forbidden write`,
    grant: { id:'g1', subject:'a', resource:'g1', audience:'r', operations:['read'], issued_at_ms:0, expires_at_ms:120000 },
    events: [
      { event:'call', at_ms:0, operation:'read' },
      kind==='revoked' ? {event:'revoke',at_ms:10000} : {event:'availability',at_ms:10000,available:false},
      ...[30000,60000,119000].map(at_ms=>({event:'call',at_ms,operation:'write'})),
    ],
    expected: [0,30000,60000,119000].map(at_ms=>({
      at_ms, decision:at_ms===0?'ALLOW':'DENY',
      refusal_reason:at_ms===0?null:kind==='revoked'?'authority_revoked':'authority_not_determined',
      callback_count:at_ms===0?1:0, source_attempts:1,
      observation_as_of_ms:at_ms!==0&&kind==='unavailable'?null:at_ms,
    })),
  });
  return { status:'proposed-not-adopted', profile:'live_standing_read', boundary:'exclusive', policy:'P1-current-observation', provenance:'ATP-authored; author-produced', cases:[make('revoked'),make('unavailable')] };
}
// Deterministic serialization, not an RFC 8785 canonicalization claim.
export const serialize = () => JSON.stringify(generate(),null,2)+'\n';
// fileURLToPath, not URL.pathname: the latter stays percent-encoded and silently skips the write
// when the checkout path contains a space or other escaped character.
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) writeFileSync(new URL('./vectors.json',import.meta.url),serialize());
