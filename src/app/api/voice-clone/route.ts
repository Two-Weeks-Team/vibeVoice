import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const MINIMAX_URL = 'https://api.minimax.io/v1/voice_clone';

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

  if (!body.fileId || typeof body.fileId !== 'number') {
    return NextResponse.json({ error: 'fileId is required (number)' }, { status: 400 });
  }

  if (!body.voiceId || typeof body.voiceId !== 'string') {
    return NextResponse.json({ error: 'voiceId is required' }, { status: 400 });
  }
  const voiceId = body.voiceId as string;
  if (voiceId.length < 8 || voiceId.length > 256) {
    return NextResponse.json({ error: 'Voice ID must be 8-256 characters' }, { status: 400 });
  }
  if (!/^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(voiceId)) {
    return NextResponse.json({ error: 'Voice ID must start with a letter, contain only letters/digits/hyphens/underscores, and not end with - or _' }, { status: 400 });
  }

  const minimaxReq: Record<string, unknown> = {
    file_id: body.fileId,
    voice_id: voiceId,
    need_noise_reduction: body.needNoiseReduction === true,
    need_volume_normalization: body.needVolumeNormalization === true,
    language_boost: 'auto',
  };

  if (body.previewText && typeof body.previewText === 'string') {
    if ((body.previewText as string).length > 1000) {
      return NextResponse.json({ error: 'Preview text exceeds 1000 character limit' }, { status: 400 });
    }
    minimaxReq.text = body.previewText;
    minimaxReq.model = 'speech-2.8-hd';
  }

  try {
    const res = await fetch(MINIMAX_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(minimaxReq),
    });
    const data = await res.json();

    const baseResp = data.base_resp;
    if (!baseResp || baseResp.status_code !== 0) {
      const code = baseResp?.status_code;
      if (code === 2038) {
        return NextResponse.json({ error: 'Voice cloning permission denied. Please verify your account.' }, { status: 403 });
      }
      if (code === 1002) {
        return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
      }
      return NextResponse.json(
        { error: baseResp?.status_msg ?? 'Voice cloning failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      demoAudioUrl: data.demo_audio || null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to cloning service' }, { status: 502 });
  }
}
