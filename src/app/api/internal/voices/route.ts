// GET /api/internal/voices — internal (x-api-key) voice list. Lets demo-forge
// discover the active cloned voice id. Bypasses cookie auth via proxy PUBLIC_PATHS.
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 15;
const MINIMAX_URL = 'https://api.minimax.io/v1/get_voice';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || req.headers.get('x-api-key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'MINIMAX_API_KEY not set' }, { status: 500 });
  try {
    const res = await fetch(MINIMAX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ voice_type: 'all' }),
    });
    const data = await res.json();
    if (!data.base_resp || data.base_resp.status_code !== 0) {
      return NextResponse.json({ error: data.base_resp?.status_msg ?? 'failed' }, { status: 500 });
    }
    return NextResponse.json({
      clonedVoices: data.voice_cloning ?? [],
      systemCount: (data.system_voice ?? []).length,
      designedVoices: data.voice_generation ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'connect failed' }, { status: 502 });
  }
}
