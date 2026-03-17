import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 30;

const MINIMAX_URL = 'https://api.minimax.io/v1/voice_design';

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

  if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
    return NextResponse.json({ error: 'Voice description prompt is required' }, { status: 400 });
  }

  if (!body.previewText || typeof body.previewText !== 'string' || body.previewText.trim().length === 0) {
    return NextResponse.json({ error: 'Preview text is required' }, { status: 400 });
  }
  if ((body.previewText as string).length > 500) {
    return NextResponse.json({ error: 'Preview text exceeds 500 character limit' }, { status: 400 });
  }

  if (body.voiceId !== undefined) {
    const voiceId = body.voiceId as string;
    if (voiceId.length < 8 || voiceId.length > 256) {
      return NextResponse.json({ error: 'Voice ID must be 8-256 characters' }, { status: 400 });
    }
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(voiceId)) {
      return NextResponse.json({ error: 'Voice ID must start with a letter, contain only letters/digits/hyphens/underscores, and not end with - or _' }, { status: 400 });
    }
  }

  const minimaxReq = {
    prompt: (body.prompt as string).trim(),
    preview_text: (body.previewText as string).trim(),
    ...(body.voiceId ? { voice_id: body.voiceId as string } : {}),
  };

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
      const statusCode = baseResp?.status_code;
      if (statusCode === 1002) {
        return NextResponse.json({ error: 'Rate limit exceeded. Please wait.' }, { status: 429 });
      }
      if (statusCode === 1004) {
        return NextResponse.json({ error: 'API authentication failed.' }, { status: 401 });
      }
      if (statusCode === 1008) {
        return NextResponse.json({ error: 'Insufficient API balance.' }, { status: 402 });
      }
      return NextResponse.json(
        { error: baseResp?.status_msg ?? 'Voice design failed' },
        { status: 500 }
      );
    }

    if (!data.voice_id) {
      return NextResponse.json({ error: 'No voice ID returned' }, { status: 500 });
    }

    return NextResponse.json({
      voiceId: data.voice_id,
      trialAudioHex: data.trial_audio ?? null,
    });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to voice design service' }, { status: 502 });
  }
}
