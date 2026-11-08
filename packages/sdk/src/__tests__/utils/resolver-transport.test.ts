import { DidAtpResolver } from '../../utils/resolver';

const URL = 'https://example.com/did.json';
const asFetch = (fn: (...args: any[]) => any) => fn as typeof fetch;

describe('DID resolver transport bounds (NET-01 through NET-04)', () => {
  it('rejects a downgrade before requesting its target and cancels the redirect body', async () => {
    const cancel = jest.fn();
    const response = new Response(new ReadableStream({ cancel }), {
      status: 302, headers: { location: 'http://target.example/did.json' }
    });
    const fetch = jest.fn(async () => response);
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch: asFetch(fetch) }))
      .rejects.toMatchObject({ code: 'insecureUrl' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch.mock.calls[0]).toEqual([URL, expect.objectContaining({ redirect: 'manual' })]);
    expect(cancel).toHaveBeenCalled();
  });

  it('follows relative HTTPS redirects and stops at the configured limit', async () => {
    const fetch = jest.fn(async (..._args: unknown[]) => new Response(null, { status: 302, headers: { location: '/next' } }));
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch: asFetch(fetch), maxRedirects: 2 }))
      .rejects.toMatchObject({ code: 'redirectLimit' });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[1][0]).toBe('https://example.com/next');
  });

  it('accepts a bounded redirect chain and a streamed document', async () => {
    const fetch = jest.fn()
      .mockResolvedValueOnce(new Response(null, { status: 307, headers: { location: '/final' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 'did:atp:example.com' })));
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch: asFetch(fetch), maxRedirects: 1 }))
      .resolves.toEqual({ id: 'did:atp:example.com' });
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([undefined, '10'])('cancels an oversized stream incrementally (Content-Length %s)', async length => {
    let bytes = 0;
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        const chunk = new Uint8Array(16 * 1024).fill(32);
        bytes += chunk.length;
        controller.enqueue(chunk);
      }, cancel
    }, { highWaterMark: 0 });
    const fetch = asFetch(async () => new Response(body, { headers: length ? { 'content-length': length } : {} }));
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch }))
      .rejects.toMatchObject({ code: 'invalidDidDocument' });
    expect(bytes).toBe(256 * 1024 + 16 * 1024);
    expect(cancel).toHaveBeenCalled();
    expect(body.locked).toBe(false);
  });

  it('rejects an advertised oversized body without pulling it', async () => {
    const pull = jest.fn();
    const cancel = jest.fn();
    const body = new ReadableStream({ pull, cancel }, { highWaterMark: 0 });
    await expect(DidAtpResolver.fetchDidJson(URL, {
      fetch: asFetch(async () => new Response(body, { headers: { 'content-length': '262145' } }))
    })).rejects.toMatchObject({ code: 'invalidDidDocument' });
    expect(pull).not.toHaveBeenCalled();
    expect(cancel).toHaveBeenCalled();
  });

  it('bounds a stalled header fetch even if an override ignores abort', async () => {
    const fetch = asFetch(() => new Promise<Response>(() => {}));
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch, timeoutMs: 20 }))
      .rejects.toMatchObject({ code: 'timeout' });
  });

  it('bounds a stalled body and cancels its stream', async () => {
    const cancel = jest.fn();
    const body = new ReadableStream<Uint8Array>({ cancel });
    await expect(DidAtpResolver.fetchDidJson(URL, {
      fetch: asFetch(async () => new Response(body)), timeoutMs: 20
    })).rejects.toMatchObject({ code: 'timeout' });
    expect(cancel).toHaveBeenCalled();
    await new Promise(resolve => setImmediate(resolve));
    expect(body.locked).toBe(false);
  });

  it('propagates caller cancellation and does not dispatch pre-aborted requests', async () => {
    const controller = new AbortController(); controller.abort();
    const fetch = jest.fn();
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch: asFetch(fetch), signal: controller.signal }))
      .rejects.toMatchObject({ code: 'aborted' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('clears its deadline after success', async () => {
    let signal: AbortSignal;
    await DidAtpResolver.fetchDidJson(URL, { timeoutMs: 20, fetch: asFetch(async (_url, init) => {
      signal = init.signal;
      return new Response('{"id":"did:atp:example.com"}');
    }) });
    await new Promise(resolve => setTimeout(resolve, 35));
    expect(signal!.aborted).toBe(false);
  });
});

describe('DID resolver deadline and decoding edge cases', () => {
  it('cancels a late response after the caller already received a timeout', async () => {
    let deliver!: (response: Response) => void;
    const fetch = asFetch(() => new Promise<Response>(resolve => { deliver = resolve; }));
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch, timeoutMs: 20 }))
      .rejects.toMatchObject({ code: 'timeout' });
    const cancel = jest.fn();
    deliver(new Response(new ReadableStream({ cancel })));
    await new Promise(resolve => setImmediate(resolve));
    expect(cancel).toHaveBeenCalled();
  });

  it('handles caller abort during an active body read', async () => {
    const controller = new AbortController();
    const cancel = jest.fn();
    const pending = DidAtpResolver.fetchDidJson(URL, {
      signal: controller.signal, fetch: asFetch(async () => new Response(new ReadableStream({ cancel })))
    });
    const assertion = expect(pending).rejects.toMatchObject({ code: 'aborted' });
    await new Promise(resolve => setImmediate(resolve)); controller.abort();
    await assertion;
    expect(cancel).toHaveBeenCalled();
  });

  it('decodes UTF-8 characters split across stream chunks', async () => {
    const bytes = new TextEncoder().encode('{"id":"did:atp:example.com","label":"☃"}');
    let position = 0;
    const body = new ReadableStream<Uint8Array>({ pull(controller) {
      if (position === bytes.length) controller.close();
      else controller.enqueue(bytes.slice(position, ++position));
    } });
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch: asFetch(async () => new Response(body)) }))
      .resolves.toMatchObject({ label: '☃' });
  });

  it.each([0, -1, NaN, Infinity, 2_147_483_648])('rejects invalid timeout %s before network I/O', async timeoutMs => {
    const fetch = jest.fn();
    await expect(DidAtpResolver.fetchDidJson(URL, { fetch: asFetch(fetch), timeoutMs })).rejects.toThrow(RangeError);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects URL credentials before network I/O', async () => {
    const fetch = jest.fn();
    await expect(DidAtpResolver.fetchDidJson('https://user:password@example.com/did.json', { fetch: asFetch(fetch) }))
      .rejects.toMatchObject({ code: 'insecureUrl' });
    expect(fetch).not.toHaveBeenCalled();
  });
});
