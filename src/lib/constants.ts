import type { VoiceSettings, AudioSettings, Emotion, AudioFormat, VoiceModify, SoundEffect } from './types';

export const VOICE_ID = 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67';

export const EMOTIONS = [
  'happy', 'sad', 'angry', 'fearful', 'disgusted',
  'surprised', 'calm', 'fluent', 'whisper'
] as const satisfies readonly Emotion[];

export const AUDIO_FORMATS = ['mp3', 'wav', 'flac'] as const satisfies readonly AudioFormat[];

export const MAX_TEXT_LENGTH = 10_000;
export const CHAR_WARNING_THRESHOLD = 9_000;
export const HISTORY_EXPIRY_MS = 23 * 60 * 60 * 1000; // 23 hours
export const MAX_HISTORY_ITEMS = 50;

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceId: VOICE_ID,
  speed: 1.0,
  vol: 1.0,
  pitch: 0,
  emotion: undefined, // Let MiniMax auto-select the most natural emotion
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  format: 'mp3',
};

export const EMOTION_LABELS: Record<Emotion, string> = {
  happy: 'Happy',
  sad: 'Sad',
  angry: 'Angry',
  fearful: 'Fearful',
  disgusted: 'Disgusted',
  surprised: 'Surprised',
  calm: 'Calm',
  fluent: 'Fluent',
  whisper: 'Whisper',
};

// --- Voice Effects Constants ---
export const SOUND_EFFECTS = [
  'spacious_echo', 'auditorium_echo', 'lofi_telephone', 'robotic',
] as const satisfies readonly SoundEffect[];

export const SOUND_EFFECT_LABELS: Record<SoundEffect, string> = {
  spacious_echo: 'Spacious Echo',
  auditorium_echo: 'Auditorium Echo',
  lofi_telephone: 'Lo-Fi Telephone',
  robotic: 'Robotic',
};

export const DEFAULT_VOICE_MODIFY: VoiceModify = {
  pitch: 0,
  intensity: 0,
  timbre: 0,
  soundEffect: undefined,
};

export const VOICE_DESIGN_PREVIEW_MAX_LENGTH = 500;
export const VOICE_CLONE_PREVIEW_MAX_LENGTH = 1000;
export const VOICE_ID_MIN_LENGTH = 8;
export const VOICE_ID_MAX_LENGTH = 256;
