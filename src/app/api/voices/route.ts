import { NextResponse } from 'next/server';

export const maxDuration = 15;

const MINIMAX_URL = 'https://api.minimax.io/v1/get_voice';

export async function GET(): Promise<NextResponse> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const res = await fetch(MINIMAX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ voice_type: 'all' }),
    });
    const data = await res.json();

    const baseResp = data.base_resp;
    if (!baseResp || baseResp.status_code !== 0) {
      return NextResponse.json(
        { error: baseResp?.status_msg ?? 'Failed to fetch voices' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      systemVoices: data.system_voice ?? [],
      clonedVoices: data.voice_cloning ?? [],
      designedVoices: data.voice_generation ?? [],
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to voice service' }, { status: 502 });
  }
}
