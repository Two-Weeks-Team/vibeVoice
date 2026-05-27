import { NextRequest, NextResponse } from 'next/server';
import { LANGUAGE_BOOST_OPTIONS } from '@/lib/constants';

export const maxDuration = 30;

const MINIMAX_URL = 'https://api.minimax.io/v1/t2a_v2';
const VOICE_ID = 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67';

const VALID_EMOTIONS = [
  'happy', 'sad', 'angry', 'fearful', 'disgusted',
  'surprised', 'calm', 'fluent', 'whisper',
] as const;

const VALID_FORMATS = ['mp3', 'wav', 'flac'] as const;

const ERROR_MAP: Record<number, { status: number; message: string }> = {
  1000: { status: 500, message: 'An unknown error occurred. Please try again.' },
  1001: { status: 504, message: 'Request timed out. Please try again.' },
  1002: { status: 429, message: 'Rate limit exceeded. Please wait before retrying.' },
  1004: { status: 401, message: 'API authentication failed.' },
  1008: { status: 402, message: 'Insufficient API balance.' },
  1039: { status: 429, message: 'Text processing limit exceeded. Reduce text length.' },
  1042: { status: 400, message: 'Input contains too many special characters.' },
  2013: { status: 400, message: 'Invalid request parameters.' },
};

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

  if (!body.text || typeof body.text !== 'string' || body.text.trim().length === 0) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }
  if (body.text.length > 10_000) {
    return NextResponse.json({ error: 'Text exceeds 10,000 character limit' }, { status: 400 });
  }

  if (body.vol !== undefined) {
    const vol = Number(body.vol);
    if (isNaN(vol) || vol < 0.1 || vol > 10) {
      return NextResponse.json({ error: 'vol must be between 0.1 and 10' }, { status: 400 });
    }
  }

  if (body.speed !== undefined) {
    const speed = Number(body.speed);
    if (isNaN(speed) || speed < 0.5 || speed > 2) {
      return NextResponse.json({ error: 'speed must be between 0.5 and 2' }, { status: 400 });
    }
  }

  if (body.pitch !== undefined) {
    const pitch = Number(body.pitch);
    if (isNaN(pitch) || pitch < -12 || pitch > 12) {
      return NextResponse.json({ error: 'pitch must be between -12 and 12' }, { status: 400 });
    }
  }

  if (body.emotion !== undefined) {
    if (!VALID_EMOTIONS.includes(body.emotion as typeof VALID_EMOTIONS[number])) {
      return NextResponse.json({
        error: `Invalid emotion. Valid values: ${VALID_EMOTIONS.join(', ')}`,
      }, { status: 400 });
    }
  }

  if (body.format !== undefined) {
    if (!VALID_FORMATS.includes(body.format as typeof VALID_FORMATS[number])) {
      return NextResponse.json({
        error: `Invalid format. Valid values: ${VALID_FORMATS.join(', ')}`,
      }, { status: 400 });
    }
  }

  if (body.languageBoost !== undefined) {
    if (!LANGUAGE_BOOST_OPTIONS.includes(body.languageBoost as typeof LANGUAGE_BOOST_OPTIONS[number])) {
      return NextResponse.json({
        error: `Invalid languageBoost. Valid values: ${LANGUAGE_BOOST_OPTIONS.join(', ')}`,
      }, { status: 400 });
    }
  }

  // Validate optional voiceModify
  const VALID_SOUND_EFFECTS = ['spacious_echo', 'auditorium_echo', 'lofi_telephone', 'robotic'] as const;

  if (body.voiceModify !== undefined && body.voiceModify !== null) {
    const vm = body.voiceModify as Record<string, unknown>;
    if (vm.pitch !== undefined) {
      const p = Number(vm.pitch);
      if (isNaN(p) || p < -100 || p > 100) {
        return NextResponse.json({ error: 'voiceModify.pitch must be between -100 and 100' }, { status: 400 });
      }
    }
    if (vm.intensity !== undefined) {
      const i = Number(vm.intensity);
      if (isNaN(i) || i < -100 || i > 100) {
        return NextResponse.json({ error: 'voiceModify.intensity must be between -100 and 100' }, { status: 400 });
      }
    }
    if (vm.timbre !== undefined) {
      const t = Number(vm.timbre);
      if (isNaN(t) || t < -100 || t > 100) {
        return NextResponse.json({ error: 'voiceModify.timbre must be between -100 and 100' }, { status: 400 });
      }
    }
    if (vm.soundEffect !== undefined && vm.soundEffect !== null) {
      if (!VALID_SOUND_EFFECTS.includes(vm.soundEffect as typeof VALID_SOUND_EFFECTS[number])) {
        return NextResponse.json({ error: `Invalid sound effect. Valid: ${VALID_SOUND_EFFECTS.join(', ')}` }, { status: 400 });
      }
    }
  }

  const minimaxReq = {
    model: 'speech-2.8-hd',
    text: body.text as string,
    stream: false,
    output_format: 'url',
    language_boost: (body.languageBoost as string) ?? 'auto',
    voice_setting: {
      voice_id: (body.voiceId as string) ?? VOICE_ID,
      speed: body.speed !== undefined ? Number(body.speed) : 1.0,
      vol: body.vol !== undefined ? Number(body.vol) : 1.0,
      pitch: body.pitch !== undefined ? Number(body.pitch) : 0,
      ...(body.emotion ? { emotion: body.emotion as string } : {}),
    },
    audio_setting: {
      format: (body.format as string) ?? 'mp3',
      sample_rate: 44100,
      bitrate: 256000,
      channel: 1,
    },
    // Add voice_modify if any non-default values are set
    ...(body.voiceModify ? {
      voice_modify: {
        pitch: Number((body.voiceModify as Record<string, unknown>).pitch ?? 0),
        intensity: Number((body.voiceModify as Record<string, unknown>).intensity ?? 0),
        timbre: Number((body.voiceModify as Record<string, unknown>).timbre ?? 0),
        ...((body.voiceModify as Record<string, unknown>).soundEffect ? {
          sound_effects: (body.voiceModify as Record<string, unknown>).soundEffect as string,
        } : {}),
      },
    } : {}),
  };

  let url = MINIMAX_URL;
  const groupId = process.env.MINIMAX_GROUP_ID;
  if (groupId) url += `?GroupId=${groupId}`;

  let data: Record<string, unknown>;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(minimaxReq),
    });
    data = await res.json() as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Failed to connect to audio service' }, { status: 502 });
  }

  const baseResp = data.base_resp as { status_code: number; status_msg: string } | undefined;
  if (!baseResp || baseResp.status_code !== 0) {
    const code = baseResp?.status_code ?? -1;
    const mapped = ERROR_MAP[code];
    return NextResponse.json(
      { error: mapped?.message ?? baseResp?.status_msg ?? 'Unknown error from audio service' },
      { status: mapped?.status ?? 500 }
    );
  }

  const audioData = data.data as { audio?: string; status?: number } | null;
  if (!audioData?.audio) {
    return NextResponse.json({ error: 'No audio data returned from MiniMax' }, { status: 500 });
  }

  const extraInfo = data.extra_info as { audio_length?: number; usage_characters?: number } | undefined;

  return NextResponse.json({
    audioUrl: audioData.audio,
    traceId: data.trace_id as string,
    durationMs: extraInfo?.audio_length,
    usageCharacters: extraInfo?.usage_characters,
  });
}
