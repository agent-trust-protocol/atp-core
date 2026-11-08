import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DidAtp } from '../../utils/did';
import { parseAtpV2PathDid } from '@atpdeveloper/did-atp';

const vectors = JSON.parse(readFileSync(resolve(__dirname, '../../../../../docs/specs/did-atp/test-vectors.json'), 'utf8'));
const fp = 'A'.repeat(43);

describe('SDK canonical parser adoption (SDK-01)', () => {
  it('preserves domain-only root identifiers, fragments, and null on invalid input', () => {
    expect(DidAtp.parse('did:atp:example.com')).toEqual({
      did: 'did:atp:example.com', type: 'root', domain: 'example.com', path: [], fragment: undefined
    });
    expect(DidAtp.parse('did:atp:example.com#key')).toEqual({
      did: 'did:atp:example.com', type: 'root', domain: 'example.com', path: [], fragment: 'key'
    });
    for (const invalid of [null, undefined, 42, {}, '', 'did:atp:BAD.DOMAIN', 'did:atp:example.com#',
      `did:atp:example.com:agent:e1_${fp}`, `did:atp:example.com:agent:pq1_${fp}:e1_${fp}`]) {
      expect(DidAtp.parse(invalid as string)).toBeNull();
    }
  });

  it('matches the canonical bare parser while preserving SDK fragments for every public path vector', () => {
    for (const vector of vectors.pathIdentifiers) {
      const canonical = parseAtpV2PathDid(vector.did);
      expect(DidAtp.parse(vector.did)).toEqual({ did: vector.did, type: 'path', ...canonical, fragment: undefined });
      expect(DidAtp.parse(vector.did + '#key')).toEqual({ did: vector.did, type: 'path', ...canonical, fragment: 'key' });
    }
  });

  it('preserves pairwise-shaped paths, underscores, and syntax-only dot segments', () => {
    for (const path of ['p_' + 'a'.repeat(32), 'agent_01', '.', '..']) {
      const did = `did:atp:example.com:${path}:e1_${fp}:pq1_${fp}`;
      expect(DidAtp.parse(did)?.path).toEqual([path]);
    }
  });

  it('preserves rejection of empty or fingerprint-shaped path segments and DID URL queries', () => {
    for (const path of ['', `e1_${fp}`, `pq1_${fp}`]) {
      expect(DidAtp.parse(`did:atp:example.com:${path}:e1_${fp}:pq1_${fp}`)).toBeNull();
    }
    expect(DidAtp.parse(`did:atp:example.com:agent:e1_${fp}:pq1_${fp}?version=1`)).toBeNull();
  });
});
