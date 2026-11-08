// Offline example: an untrusted DID cannot reach loopback through the Node entry point.
// Import the public subpath so this also verifies the built package export.
import { resolveDidWithNodeEgress } from 'atp-sdk/node';

const fingerprint = 'A'.repeat(43);
const did = `did:atp:127.0.0.1:agent:e1_${fingerprint}:pq1_${fingerprint}`;
try {
  await resolveDidWithNodeEgress(did);
  throw new Error('Expected private-address rejection');
} catch (error) {
  if (error.code !== 'destinationNotAllowed') throw error;
  console.log('PASS: loopback resolution blocked by the default Node address policy');
}
