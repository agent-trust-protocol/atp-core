import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/agents/onboard
 *
 * Registers a new agent with ATP, assigns the chosen security profile,
 * and returns the agent ID + DID.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { runtime, name, environment, profileId } = body;

    if (!runtime || !name || !profileId) {
      return NextResponse.json(
        { error: 'Missing required fields: runtime, name, profileId' },
        { status: 400 }
      );
    }

    // Generate a deterministic agent ID and placeholder DID.
    // In production this would call ATPClient.identity.registerDID().
    const agentId = `agent-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
    const did = `did:atp:${agentId}`;

    // TODO: Wire up to ATPClient for real DID registration + profile persistence
    // const client = new ATPClient(config);
    // client.setProfile(profileId);
    // const identity = await client.identity.registerDID({ ... });

    return NextResponse.json({
      id: agentId,
      agentId,
      did,
      name,
      runtime,
      environment,
      profileId,
      createdAt: new Date().toISOString()
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
