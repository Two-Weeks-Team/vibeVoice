// POST /api/internal/tts — internal demo-forge endpoint.
// Returns WAV BYTES (not a 24h URL). Pins the cloned voice + Fluent/WAV/English by
// default; per-request overrides allowed. Auth: x-api-key == INTERNAL_API_KEY.
// `text` may contain MiniMax pause tags <#0.4#> + (interjection) tags, so a whole
// continuous narration block can be generated in ONE coherent take (no stitching).
import { NextRequest, NextResponse } from 'next/server';
import { generateTTS } from '@/lib/tts-core';

export const maxDuration = 60;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const expected = process.env.INTERNAL_API_KEY;
  if (!expected || req.headers.get('x-api-key') !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid JSON' }, { status: 400 }); }
  const text = body.text;
  if (typeof text !== 'string' || !text.trim()) return NextResponse.json({ error: 'text required' }, { status: 400 });
  if (text.length > 10_000) return NextResponse.json({ error: 'text exceeds 10,000 chars' }, { status: 400 });

  const r = await generateTTS({
    text,
    voiceId: (body.voiceId as string) ?? process.env.MEMEX_VOICE_ID,
    emotion: (body.emotion as string) ?? 'fluent',
    format: 'wav',
    languageBoost: (body.languageBoost as string) ?? 'English',
    speed: body.speed !== undefined ? Number(body.speed) : 1.0,
    vol: body.vol !== undefined ? Number(body.vol) : 1.0,
    pitch: body.pitch !== undefined ? Number(body.pitch) : 0,
    outputFormat: 'hex',
  });
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  const buf = Buffer.from(r.audioHex as string, 'hex');
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': String(buf.length),
      'X-Duration-Ms': String(r.durationMs ?? ''),
      'X-Usage-Chars': String(r.usageCharacters ?? ''),
      'X-Trace-Id': r.traceId ?? '',
    },
  });
}
