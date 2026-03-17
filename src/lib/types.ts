export type Emotion = 'happy' | 'sad' | 'angry' | 'fearful' | 'disgusted' | 'surprised' | 'calm' | 'fluent' | 'whisper';
export type AudioFormat = 'mp3' | 'wav' | 'flac';

export interface VoiceSettings {
  voiceId: string;
  speed: number;      // [0.5, 2.0]
  vol: number;        // (0, 10] — MINIMUM 0.1, never 0
  pitch: number;      // [-12, 12] integer
  emotion?: Emotion;  // optional — undefined = MiniMax auto-select
}

export interface AudioSettings {
  format: AudioFormat;
}

export interface GenerateRequest {
  text: string;
  voiceId?: string;
  speed?: number;
  vol?: number;
  pitch?: number;
  emotion?: Emotion;
  format?: AudioFormat;
}

export interface GenerateResponse {
  audioUrl: string;
  traceId: string;
  durationMs?: number;
  usageCharacters?: number;
}

export interface GenerationResult {
  audioUrl: string;
  traceId: string;
  generatedAt: number;  // Date.now()
  durationMs?: number;
  usageCharacters?: number;
}

export interface HistoryEntry extends GenerationResult {
  id: string;           // crypto.randomUUID()
  text: string;         // full text
  textPreview: string;  // first 80 chars
  voiceSettings: VoiceSettings;
  audioSettings: AudioSettings;
}

export interface ApiError {
  error: string;
}

// --- Voice Library Types ---
export type VoiceType = 'system' | 'voice_cloning' | 'voice_generation' | 'all';

export interface VoiceInfo {
  voice_id: string;
  voice_name?: string;
  description?: string[];
  created_time?: string;
}

export interface VoiceListResponse {
  system_voice: VoiceInfo[];
  voice_cloning: VoiceInfo[];
  voice_generation: VoiceInfo[];
}

// --- Voice Design Types ---
export interface VoiceDesignRequest {
  prompt: string;        // voice description text
  previewText: string;   // max 500 chars, generates preview audio
  voiceId?: string;      // optional custom voice_id
}

export interface VoiceDesignResponse {
  voiceId: string;
  trialAudioHex: string; // hex-encoded preview audio
}

// --- Voice Clone Types ---
export interface FileUploadResponse {
  fileId: number;
  filename: string;
  bytes: number;
}

export interface VoiceCloneRequest {
  fileId: number;
  voiceId: string;       // 8-256 chars, starts with letter, [a-zA-Z0-9_-]
  previewText?: string;  // optional, max 1000 chars
  needNoiseReduction?: boolean;
  needVolumeNormalization?: boolean;
}

export interface VoiceCloneResponse {
  demoAudioUrl?: string;
}

// --- Voice Effects Types ---
export type SoundEffect = 'spacious_echo' | 'auditorium_echo' | 'lofi_telephone' | 'robotic';

export interface VoiceModify {
  pitch: number;      // [-100, 100] — Deepen/Brighten
  intensity: number;  // [-100, 100] — Stronger/Softer
  timbre: number;     // [-100, 100] — Nasal/Crisp
  soundEffect?: SoundEffect;
}
