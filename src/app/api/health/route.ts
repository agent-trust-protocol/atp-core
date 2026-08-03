import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'atp-core',
    timestamp: new Date().toISOString(),
  });
}
