'use client';
import { useState, useEffect, useCallback } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T) {
  const [value, setValue] = useState<T>(defaultValue);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      console.warn(`[useLocalStorage] Failed to parse key "${key}", clearing.`);
      localStorage.removeItem(key);
    }
  }, [key]);

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
