'use client';
import { useState, useEffect, useCallback, useRef } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const mountedRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (mountedRef.current) return;
    mountedRef.current = true;
    let parsed: T | undefined;
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(key);
      if (stored !== null) {
        parsed = JSON.parse(stored) as T;
      }
    } catch {
      console.warn(`[useLocalStorage] Failed to parse key "${key}". Preserving backup and resetting active value.`);
      try {
        if (stored !== null) {
          localStorage.setItem(`${key}:corrupt`, stored);
        }
      } catch {
        console.warn(`[useLocalStorage] Failed to preserve backup for key "${key}"`);
      }
      localStorage.removeItem(key);
    }
    const finalValue = parsed !== undefined ? parsed : defaultValue;
    setValue(finalValue);
    setMounted(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAndPersist = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue(prev => {
        const resolved =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        try {
          localStorage.setItem(key, JSON.stringify(resolved));
        } catch {
          console.warn(`[useLocalStorage] Failed to persist key "${key}"`);
        }
        return resolved;
      });
    },
    [key]
  );

  const removeValue = useCallback(() => {
    setValue(defaultValue);
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn(`[useLocalStorage] Failed to remove key "${key}"`);
    }
  }, [key, defaultValue]);

  return { value, setValue: setAndPersist, removeValue, mounted } as const;
}
