import { NextRequest, NextResponse } from 'next/server';

const MINIMAX_URL = 'https://api.minimax.io/v1/delete_voice';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.voiceId || typeof body.voiceId !== 'string') {
    return NextResponse.json({ error: 'voiceId is required' }, { status: 400 });
  }
  if (!body.voiceType || !['voice_cloning', 'voice_generation'].includes(body.voiceType as string)) {
    return NextResponse.json({ error: 'voiceType must be voice_cloning or voice_generation' }, { status: 400 });
  }

  try {
    const res = await fetch(MINIMAX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        voice_type: body.voiceType,
        voice_id: body.voiceId,
      }),
    });
    const data = await res.json();

    const baseResp = data.base_resp;
    if (!baseResp || baseResp.status_code !== 0) {
      return NextResponse.json(
        { error: baseResp?.status_msg ?? 'Failed to delete voice' },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: true, voiceId: data.voice_id });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to voice service' }, { status: 502 });
  }
}
