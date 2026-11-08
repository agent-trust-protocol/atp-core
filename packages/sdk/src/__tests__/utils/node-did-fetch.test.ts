import { isPublicDidAddress, createNodeDidFetch } from '../../utils/node-did-fetch';

describe('Node DID conservative address policy', () => {
  it.each(['0.0.0.0', '0.1.2.3', '10.0.0.1', '100.64.0.0', '100.127.255.255',
    '127.0.0.1', '169.254.169.254', '172.16.0.0', '172.31.255.255', '192.168.1.1',
    '192.0.0.9', '192.0.2.1', '192.31.196.1', '192.52.193.1', '192.88.99.1',
    '192.175.48.1', '198.18.0.1', '198.19.255.255', '198.51.100.1', '203.0.113.1',
    '224.0.0.1', '239.255.255.255', '240.0.0.1', '255.255.255.255', '168.63.129.16',
    '::', '::1', '::ffff:127.0.0.1', '::ffff:8.8.8.8', '64:ff9b::808:808',
    'fc00::1', 'fdff::1', 'fe80::1', 'ff02::1', '2001::1', '2001:2::1', '2001:20::1',
    '2001:db8::1', '2002:0808:0808::1', '2620:4f:8000::1', '3fff::1', '5f00::1',
    '127.1', '2130706433', 'fe80::1%eth0', 'not-an-ip'])('rejects %s by default', address => {
    expect(isPublicDidAddress(address)).toBe(false);
  });
  it.each(['8.8.8.8', '1.1.1.1', '100.63.255.255', '100.128.0.0', '172.15.255.255',
    '172.32.0.0', '198.17.255.255', '198.20.0.0', '223.255.255.255',
    '2001:4860:4860::8888', '2606:4700:4700::1111'])('permits public-shaped %s', address => {
    expect(isPublicDidAddress(address)).toBe(true);
  });

  it.each([[], [{ address: '127.0.0.1', family: 4 }],
    [{ address: '8.8.8.8', family: 4 }, { address: '10.0.0.1', family: 4 }],
    [{ address: '8.8.8.8', family: 6 }], [{ address: 'not-an-ip', family: 4 }], [null]])
    ('fails closed for empty, mixed, malformed, or nonpublic DNS answers %j', async (...answers) => {
      // Jest each expands rows; wrap them back into the DNS answer array.
      const fetch = createNodeDidFetch({ resolveAddresses: async () => answers as any });
      await expect(fetch('https://resolver.test/did.json', { redirect: 'manual' }))
        .rejects.toMatchObject({ code: 'destinationNotAllowed' });
    });

  it.each(['http://resolver.test', 'https://resolver.test/path', 'https://resolver.test#x',
    'https://user:password@resolver.test', 'https://*.example'])('rejects bad exception origin %s', origin => {
    expect(() => createNodeDidFetch({ privateAddressAllowlist: [{ origin, addresses: ['127.0.0.1'] }] })).toThrow();
  });

  it('requires explicit addresses and rejects nonliteral exceptions', () => {
    expect(() => createNodeDidFetch({ privateAddressAllowlist: [{ origin: 'https://resolver.test', addresses: [] }] })).toThrow();
    expect(() => createNodeDidFetch({ privateAddressAllowlist: [{ origin: 'https://resolver.test', addresses: ['localhost'] }] })).toThrow();
  });
});
