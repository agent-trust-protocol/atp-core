import { DidAtp } from '../../utils/did';
import { DidAtpResolver } from '../../utils/resolver';

const FP = 'A'.repeat(43);
const did = (domain: string, path: string[]) => `did:atp:${domain}:${path.join(':')}:e1_${FP}:pq1_${FP}`;
const initial = 'https://example.com/did.json';
const redirect = (location: string) => new Response(null, { status: 302, headers: { location } });
const ok = () => new Response('{"id":"did:atp:example.com"}');
const asFetch = (fn: (...args: any[]) => any) => fn as typeof fetch;

describe('NET-05: DID to HTTPS resource mapping', () => {
  it.each([['.'], ['..'], ['billing', '..'], ['a', '.', 'b']])('rejects normalizing path %j before I/O', async (...path) => {
    const identifier = did('example.com', path);
    expect(DidAtp.isValid(identifier)).toBe(true); // Grammar has not changed.
    const fetch = jest.fn();
    expect(() => DidAtpResolver.didToUrl(identifier)).toThrow(/normalization/);
    await expect(DidAtpResolver.resolve(identifier, { fetch: asFetch(fetch) }))
      .rejects.toMatchObject({ code: 'invalidDid' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each(['.hidden', 'v1.0', '...', 'a..b'])('preserves the ordinary segment %s', segment => {
    expect(DidAtpResolver.didToUrl(did('example.com', ['agents', segment])))
      .toBe(`https://example.com/agents/${segment}/did.json`);
  });

  it.each(['127.1', '2130706433', '0177.0.0.1', 'example.com%3A65536'])('rejects host/port rewriting for %s', async domain => {
    const identifier = did(domain, ['agent']);
    expect(DidAtp.isValid(identifier)).toBe(true);
    expect(() => DidAtpResolver.didToUrl(identifier)).toThrow();
    const fetch = jest.fn();
    await expect(DidAtpResolver.resolve(identifier, { fetch: asFetch(fetch) }))
      .rejects.toMatchObject({ code: 'invalidDid' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('preserves explicit localhost, ordinary IPv4, and ports for controlled deployments', () => {
    expect(DidAtpResolver.didToUrl(did('localhost%3A8443', ['agent'])))
      .toBe('https://localhost:8443/agent/did.json');
    expect(DidAtpResolver.didToUrl(did('127.0.0.1', ['agent'])))
      .toBe('https://127.0.0.1/agent/did.json');
  });
});

describe('NET-05: per-hop redirect origin policy', () => {
  it.each(['https://other.example/did.json', '//other.example/did.json', 'https://example.com:8443/did.json'])
    ('blocks an unlisted destination before dispatch: %s', async location => {
      const cancel = jest.fn();
      const fetch = jest.fn(async () => new Response(new ReadableStream({ cancel }), {
        status: 302, headers: { location }
      }));
      await expect(DidAtpResolver.fetchDidJson(initial, { fetch: asFetch(fetch) }))
        .rejects.toMatchObject({ code: 'destinationNotAllowed' });
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(cancel).toHaveBeenCalled();
    });

  it('follows a same-origin relative redirect', async () => {
    const fetch = jest.fn().mockResolvedValueOnce(redirect('/published/did.json')).mockResolvedValueOnce(ok());
    await expect(DidAtpResolver.fetchDidJson(initial, { fetch: asFetch(fetch) })).resolves.toHaveProperty('id');
    expect(fetch.mock.calls[1][0]).toBe('https://example.com/published/did.json');
  });

  it('allows only explicitly configured HTTPS origins across every hop', async () => {
    const fetch = jest.fn()
      .mockResolvedValueOnce(redirect('https://cdn.example/did.json'))
      .mockResolvedValueOnce(redirect('https://unlisted.example/did.json'));
    await expect(DidAtpResolver.fetchDidJson(initial, {
      fetch: asFetch(fetch), allowedRedirectOrigins: ['https://cdn.example']
    })).rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][0]).toBe('https://cdn.example/did.json');
  });

  it('accepts an allowlisted redirect and strips fragments before transport', async () => {
    const fetch = jest.fn().mockResolvedValueOnce(redirect('https://cdn.example/did.json#key')).mockResolvedValueOnce(ok());
    await expect(DidAtpResolver.fetchDidJson(initial, {
      fetch: asFetch(fetch), allowedRedirectOrigins: ['https://cdn.example/']
    })).resolves.toHaveProperty('id');
    expect(fetch.mock.calls[1][0]).toBe('https://cdn.example/did.json');
  });

  it('does not treat an allowlisted host as authorizing a different DID document', async () => {
    const fetch = jest.fn().mockResolvedValueOnce(redirect('https://cdn.example/did.json')).mockResolvedValueOnce(ok());
    await expect(DidAtpResolver.resolve(did('example.com', ['billing']), {
      fetch: asFetch(fetch), allowedRedirectOrigins: ['https://cdn.example']
    })).rejects.toMatchObject({ code: 'didMismatch' });
  });

  it('snapshots the caller allowlist before the first request', async () => {
    const allowed: string[] = [];
    const fetch = jest.fn(async () => { allowed.push('https://other.example'); return redirect('https://other.example/did.json'); });
    await expect(DidAtpResolver.fetchDidJson(initial, {
      fetch: asFetch(fetch), allowedRedirectOrigins: allowed
    })).rejects.toMatchObject({ code: 'destinationNotAllowed' });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each(['http://cdn.example', 'https://cdn.example/path', 'https://cdn.example?x=1',
    'https://cdn.example#key', 'https://user:password@cdn.example', 'not-a-url',
    'https://cdn.example/path/..', 'https://cdn.example?', 'https://cdn.example#'])
    ('rejects invalid allowlist origin %s before dispatch', async origin => {
      const fetch = jest.fn();
      await expect(DidAtpResolver.fetchDidJson(initial, {
        fetch: asFetch(fetch), allowedRedirectOrigins: [origin]
      })).rejects.toThrow(RangeError);
      expect(fetch).not.toHaveBeenCalled();
    });
});
