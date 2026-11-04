import { Agent } from '../simple-agent';
import { ZKProofType } from '../types';

describe('Agent.mutualAuth', () => {
  const identity = [{ type: ZKProofType.IDENTITY, params: {} }];

  test('never reports verification that has not happened', async () => {
    const alice = await Agent.create('Alice');
    const bob = await Agent.create('Bob');
    const result = await alice.mutualAuth(bob.getDID(), identity, identity);
    expect(result.iVerified).toMatchObject({ verified: false, trustEstablished: false });
    expect(result.theyVerified).toMatchObject({ verified: false, trustEstablished: false });
    expect(result.challenge.proverDid).toBe(bob.getDID());
    expect(result.response.proofs.length).toBe(1);
  });

  test('returned challenge and response complete a real exchange', async () => {
    const alice = await Agent.create('Alice');
    const bob = await Agent.create('Bob');
    const { challenge } = await alice.mutualAuth(bob.getDID(), identity, identity);
    const bobResponse = await bob.respondToChallenge(challenge);
    expect((await alice.verifyAuthResponse(bobResponse)).verified).toBe(true);
  });
});
