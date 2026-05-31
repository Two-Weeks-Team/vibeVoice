// tts-core.ts — internal reusable MiniMax t2a call (used by /api/internal/*).
// Standalone (does NOT touch the existing /api/t2a UI route). Supports output_format
// 'hex' so callers get audio BYTES directly and dodge the 24h URL expiry.

const MINIMAX_URL = 'https://api.minimax.io/v1/t2a_v2';

const ERROR_MAP: Record<number, { status: number; message: string }> = {
  1000: { status: 500, message: 'Unknown MiniMax error.' },
  1001: { status: 504, message: 'MiniMax request timed out.' },
  1002: { status: 429, message: 'Rate limit exceeded.' },
  1004: { status: 401, message: 'MiniMax authentication failed.' },
  1008: { status: 402, message: 'Insufficient MiniMax balance.' },
  1039: { status: 429, message: 'Text processing limit exceeded.' },
  1042: { status: 400, message: 'Too many special characters in text.' },
  2013: { status: 400, message: 'Invalid request parameters.' },
};

export interface TtsCoreParams {
  text: string;
  voiceId?: string;
  speed?: number;            // [0.5, 2]
  vol?: number;              // (0, 10]
  pitch?: number;            // [-12, 12]
  emotion?: string;          // e.g. 'fluent'
  format?: 'mp3' | 'wav' | 'flac';
  languageBoost?: string;    // e.g. 'English'
  outputFormat?: 'url' | 'hex';
}
export type TtsCoreResult =
  | { ok: true; audioHex?: string; audioUrl?: string; durationMs?: number; usageCharacters?: number; traceId?: string }
  | { ok: false; status: number; error: string };

export async function generateTTS(p: TtsCoreParams): Promise<TtsCoreResult> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) return { ok: false, status: 500, error: 'MINIMAX_API_KEY not set' };
  if (!p.voiceId) return { ok: false, status: 400, error: 'voiceId required (set MEMEX_VOICE_ID or pass voiceId)' };

  const minimaxReq = {
    model: 'speech-2.8-hd',
    text: p.text,
    stream: false,
    output_format: p.outputFormat ?? 'hex',
    language_boost: p.languageBoost ?? 'auto',
    voice_setting: {
      voice_id: p.voiceId,
      speed: p.speed ?? 1.0,
      vol: p.vol ?? 1.0,
      pitch: p.pitch ?? 0,
      ...(p.emotion ? { emotion: p.emotion } : {}),
    },
    audio_setting: { format: p.format ?? 'wav', sample_rate: 44100, bitrate: 256000, channel: 1 },
  };

  let url = MINIMAX_URL;
  const groupId = process.env.MINIMAX_GROUP_ID;
  if (groupId) url += `?GroupId=${groupId}`;

  let data: Record<string, unknown>;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(minimaxReq),
    });
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    return { ok: false, status: 502, error: 'Failed to connect to MiniMax' };
  }

  const baseResp = data.base_resp as { status_code: number; status_msg: string } | undefined;
  if (!baseResp || baseResp.status_code !== 0) {
    const m = ERROR_MAP[baseResp?.status_code ?? -1];
    return { ok: false, status: m?.status ?? 500, error: m?.message ?? baseResp?.status_msg ?? 'MiniMax error' };
  }
  const ad = data.data as { audio?: string } | null;
  if (!ad?.audio) return { ok: false, status: 500, error: 'No audio returned from MiniMax' };
  const ei = data.extra_info as { audio_length?: number; usage_characters?: number } | undefined;

  return {
    ok: true,
    ...(minimaxReq.output_format === 'url' ? { audioUrl: ad.audio } : { audioHex: ad.audio }),
    durationMs: ei?.audio_length,
    usageCharacters: ei?.usage_characters,
    traceId: data.trace_id as string | undefined,
  };
}
