'use client';
import { useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { AudioFormat, Emotion, HistoryEntry, LanguageBoost } from '@/lib/types';
import {
  MAX_HISTORY_ITEMS,
  HISTORY_EXPIRY_MS,
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_VOICE_SETTINGS,
  AUDIO_FORMATS,
  EMOTIONS,
  LANGUAGE_BOOST_OPTIONS,
} from '@/lib/constants';

const HISTORY_KEY = 'vibeVoice:history';
const HISTORY_CORRUPT_BACKUP_KEY = `${HISTORY_KEY}:corrupt`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function toFiniteNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return value;
}

function toOptionalFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  return value;
}

function normalizeHistoryEntry(raw: unknown): HistoryEntry | null {
  if (!isRecord(raw)) return null;

  const audioUrl = typeof raw.audioUrl === 'string' ? raw.audioUrl : '';
  const text = typeof raw.text === 'string' ? raw.text : '';
  if (!audioUrl || !text) return null;

  const generatedAtRaw = raw.generatedAt;
  const generatedAt =
    typeof generatedAtRaw === 'number'
      ? generatedAtRaw
      : typeof generatedAtRaw === 'string'
        ? Number(new Date(generatedAtRaw).getTime())
        : NaN;
  if (!Number.isFinite(generatedAt)) return null;

  const voiceSettingsRaw = isRecord(raw.voiceSettings) ? raw.voiceSettings : {};
  const audioSettingsRaw = isRecord(raw.audioSettings) ? raw.audioSettings : {};
  const format: AudioFormat =
    typeof audioSettingsRaw.format === 'string' &&
    AUDIO_FORMATS.includes(audioSettingsRaw.format as (typeof AUDIO_FORMATS)[number])
      ? (audioSettingsRaw.format as AudioFormat)
      : DEFAULT_AUDIO_SETTINGS.format;

  const emotion: Emotion | undefined =
    typeof voiceSettingsRaw.emotion === 'string' &&
    EMOTIONS.includes(voiceSettingsRaw.emotion as (typeof EMOTIONS)[number])
      ? (voiceSettingsRaw.emotion as Emotion)
      : undefined;

  const languageBoost: LanguageBoost | undefined =
    typeof voiceSettingsRaw.languageBoost === 'string' &&
    LANGUAGE_BOOST_OPTIONS.includes(
      voiceSettingsRaw.languageBoost as (typeof LANGUAGE_BOOST_OPTIONS)[number]
    )
      ? (voiceSettingsRaw.languageBoost as LanguageBoost)
      : undefined;

  return {
    id:
      typeof raw.id === 'string' && raw.id.length > 0
        ? raw.id
        : `hist-${generatedAt}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    textPreview:
      typeof raw.textPreview === 'string' && raw.textPreview.length > 0
        ? raw.textPreview
        : text.slice(0, 80),
    audioUrl,
    traceId: typeof raw.traceId === 'string' ? raw.traceId : 'unknown-trace',
    generatedAt,
    ...(toOptionalFiniteNumber(raw.durationMs) !== undefined
      ? { durationMs: toOptionalFiniteNumber(raw.durationMs) }
      : {}),
    ...(toOptionalFiniteNumber(raw.usageCharacters) !== undefined
      ? { usageCharacters: toOptionalFiniteNumber(raw.usageCharacters) }
      : {}),
    voiceSettings: {
      voiceId:
        typeof voiceSettingsRaw.voiceId === 'string' && voiceSettingsRaw.voiceId.length > 0
          ? voiceSettingsRaw.voiceId
          : DEFAULT_VOICE_SETTINGS.voiceId,
      speed: toFiniteNumber(voiceSettingsRaw.speed, DEFAULT_VOICE_SETTINGS.speed),
      vol: toFiniteNumber(voiceSettingsRaw.vol, DEFAULT_VOICE_SETTINGS.vol),
      pitch: toFiniteNumber(voiceSettingsRaw.pitch, DEFAULT_VOICE_SETTINGS.pitch),
      ...(emotion ? { emotion } : {}),
      ...(languageBoost ? { languageBoost } : {}),
    },
    audioSettings: {
      format,
    },
  };
}

function normalizeHistory(raw: unknown): HistoryEntry[] {
  if (!Array.isArray(raw)) return [];
  const normalized = raw
    .map((entry) => normalizeHistoryEntry(entry))
    .filter((entry): entry is HistoryEntry => entry !== null);
  return normalized.slice(0, MAX_HISTORY_ITEMS);
}

export function useHistory() {
  const {
    value: rawHistory,
    setValue: setHistory,
    removeValue: clearHistory,
    mounted,
  } = useLocalStorage<unknown>(HISTORY_KEY, []);

  const history = useMemo(() => normalizeHistory(rawHistory), [rawHistory]);

  let hasCorruptBackup = false;
  if (mounted) {
    try {
      hasCorruptBackup = localStorage.getItem(HISTORY_CORRUPT_BACKUP_KEY) !== null;
    } catch {
      hasCorruptBackup = false;
    }
  }

  const addItem = useCallback(
    (entry: HistoryEntry) => {
      setHistory((prev: unknown) => [entry, ...normalizeHistory(prev)].slice(0, MAX_HISTORY_ITEMS));
    },
    [setHistory]
  );

  const removeItem = useCallback(
    (id: string) => {
      setHistory((prev: unknown) => normalizeHistory(prev).filter((entry) => entry.id !== id));
    },
    [setHistory]
  );

  const recoverFromCorruptBackup = useCallback((): boolean => {
    try {
      const backup = localStorage.getItem(HISTORY_CORRUPT_BACKUP_KEY);
      if (!backup) return false;
      const parsed = JSON.parse(backup) as unknown;
      const recovered = normalizeHistory(parsed);
      if (recovered.length === 0) return false;
      setHistory(recovered);
      localStorage.removeItem(HISTORY_CORRUPT_BACKUP_KEY);
      return true;
    } catch {
      return false;
    }
  }, [setHistory]);

  const isExpired = useCallback((entry: HistoryEntry): boolean => {
    return Date.now() - entry.generatedAt > HISTORY_EXPIRY_MS;
  }, []);

  return {
    history,
    addItem,
    removeItem,
    clearHistory,
    isExpired,
    mounted,
    hasCorruptBackup,
    recoverFromCorruptBackup,
  };
}
