import { ATPClient } from '../client/atp.js';
import { BUILTIN_PROFILES as sdkProfiles } from '../profiles/index.js';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

describe('canonical profiles integration', () => {
  const client = Object.create(ATPClient.prototype) as ATPClient;
  test('SDK exports the same canonical built-ins', () => {
    expect(sdkProfiles).toBe(BUILTIN_PROFILES);
  });
  test('SDK retains string decisions and delegates to canonical evaluation', () => {
    for (const profileId of Object.keys(BUILTIN_PROFILES)) {
      client.setProfile(profileId);
      for (const actionType of ['shell', 'network', 'messaging']) {
        const context = { actionType, state: 'executing' };
        expect(client.evaluateActionWithProfile(context)).toBe(evaluateActionWithProfile(BUILTIN_PROFILES[profileId], context).decision);
      }
    }
  });
  test('unrecognized action types deny through the SDK', () => {
    for (const profileId of ['safe-default', 'enterprise-locked', 'openclaw-sandbox']) {
      client.setProfile(profileId);
      for (const actionType of ['Shell', 'exec', 'credential'])
        expect(client.evaluateActionWithProfile({ actionType, state: 'executing' })).toBe('deny');
    }
  });
  test('no configured profile denies', () => {
    const bare = Object.create(ATPClient.prototype) as ATPClient;
    expect(bare.evaluateActionWithProfile({ actionType: 'filesystem' })).toBe('deny');
  });
  test('unknown explicit profiles deny', () => {
    expect(client.evaluateActionWithProfile({ profileId: 'missing', actionType: 'shell' })).toBe('deny');
  });
});
