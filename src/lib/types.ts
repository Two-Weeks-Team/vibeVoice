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
