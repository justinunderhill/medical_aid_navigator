import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    provider: process.env.AI_PROVIDER ?? 'anthropic',
    time: new Date().toISOString(),
  });
}
