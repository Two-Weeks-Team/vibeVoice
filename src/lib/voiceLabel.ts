import type { VoiceInfo } from './types';
import { VOICE_ID as DEFAULT_VOICE_ID } from './constants';

/**
 * Turn a voice (with optional user nickname) into a human-friendly display name.
 * Shared by the voice library, the active-voice bar, and generation history so a
 * voice reads the same everywhere instead of leaking a raw id like "moss_audio_…".
 */
export function formatVoiceLabel(
  voice: VoiceInfo,
  nicknames: Record<string, string> = {},
): string {
  const nicks = nicknames ?? {};
  const nickname = nicks[voice.voice_id];
  if (nickname) return nickname;

  if (voice.voice_name) return voice.voice_name;

  const id = voice.voice_id;

  if (id === DEFAULT_VOICE_ID) return 'Default voice';

  if (/^[A-Z]/.test(id) && id.includes('_') && !id.includes('-')) {
    return id.replace(/_/g, ' ');
  }

  if (id.startsWith('moss_audio_')) {
    return `Voice ...${id.slice(-8)}`;
  }

  if (id.length > 30) {
    return `${id.slice(0, 12)}...${id.slice(-8)}`;
  }

  return id.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve a friendly label from just an id, given a known-voices map. */
export function resolveVoiceLabel(
  voiceId: string,
  voices: Record<string, VoiceInfo>,
  nicknames: Record<string, string> = {},
): string {
  return formatVoiceLabel(voices[voiceId] ?? { voice_id: voiceId }, nicknames);
}
