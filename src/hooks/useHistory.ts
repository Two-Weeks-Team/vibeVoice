'use client';
import { useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { HistoryEntry } from '@/lib/types';
import { MAX_HISTORY_ITEMS, HISTORY_EXPIRY_MS } from '@/lib/constants';

const HISTORY_KEY = 'vibeVoice:history';

export function useHistory() {
  const {
    value: history,
    setValue: setHistory,
    removeValue: clearHistory,
    mounted,
  } = useLocalStorage<HistoryEntry[]>(HISTORY_KEY, []);

  const addItem = useCallback(
    (entry: HistoryEntry) => {
      setHistory(prev => [entry, ...prev].slice(0, MAX_HISTORY_ITEMS));
    },
    [setHistory]
  );

  const isExpired = useCallback((entry: HistoryEntry): boolean => {
    return Date.now() - entry.generatedAt > HISTORY_EXPIRY_MS;
  }, []);

  return { history, addItem, clearHistory, isExpired, mounted };
}
