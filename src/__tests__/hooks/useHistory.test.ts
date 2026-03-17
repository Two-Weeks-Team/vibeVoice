import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useHistory } from '@/hooks/useHistory';
import type { HistoryEntry } from '@/lib/types';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: 'test-id-1',
  text: 'Hello world',
  textPreview: 'Hello world',
  audioUrl: 'https://cdn.example.com/audio.mp3',
  traceId: 'trace-123',
  generatedAt: Date.now(),
  voiceSettings: {
    voiceId: 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67',
    speed: 1.0,
    vol: 1.0,
    pitch: 0,
  },
  audioSettings: { format: 'mp3' },
  ...overrides,
});

describe('useHistory', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with empty array', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.history).toEqual([]);
  });

  it('addItem prepends to history', async () => {
    const { result } = renderHook(() => useHistory());
    const entry = makeEntry({ id: 'first' });
    await act(async () => {
      result.current.addItem(entry);
    });
    expect(result.current.history[0].id).toBe('first');
    expect(result.current.history).toHaveLength(1);
  });

  it('addItem prepends (newest first)', async () => {
    const { result } = renderHook(() => useHistory());
    await act(async () => {
      result.current.addItem(makeEntry({ id: 'first' }));
      result.current.addItem(makeEntry({ id: 'second' }));
    });
    expect(result.current.history[0].id).toBe('second');
    expect(result.current.history[1].id).toBe('first');
  });

  it('clearHistory empties the array', async () => {
    const { result } = renderHook(() => useHistory());
    await act(async () => {
      result.current.addItem(makeEntry());
    });
    expect(result.current.history).toHaveLength(1);
    await act(async () => {
      result.current.clearHistory();
    });
    expect(result.current.history).toHaveLength(0);
  });

  it('isExpired returns false for recent items', () => {
    const { result } = renderHook(() => useHistory());
    const recent = makeEntry({ generatedAt: Date.now() });
    expect(result.current.isExpired(recent)).toBe(false);
  });

  it('isExpired returns true for items older than 23 hours', () => {
    const { result } = renderHook(() => useHistory());
    const old = makeEntry({
      generatedAt: Date.now() - (23 * 60 * 60 * 1000 + 1000), // 23h + 1s ago
    });
    expect(result.current.isExpired(old)).toBe(true);
  });
});
