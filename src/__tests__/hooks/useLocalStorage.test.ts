import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useLocalStorage } from '@/hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns default value before mount (no localStorage)', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current.value).toBe('default');
  });

  it('reads existing value from localStorage after mount', async () => {
    localStorage.setItem('test-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.value).toBe('stored-value');
  });

  it('persists new value to localStorage on setValue', async () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    await act(async () => {
      result.current.setValue('new-value');
    });
    expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
  });

  it('handles corrupted JSON gracefully and returns default', async () => {
    localStorage.setItem('test-key', 'NOT_VALID_JSON{{{');
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.value).toBe('default');
    expect(localStorage.getItem('test-key')).toBeNull();
    consoleSpy.mockRestore();
  });

  it('removeValue clears localStorage key and resets to default', async () => {
    localStorage.setItem('test-key', JSON.stringify('some-value'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    await act(async () => {
      result.current.removeValue();
    });
    expect(result.current.value).toBe('default');
    expect(localStorage.getItem('test-key')).toBeNull();
  });

  it('supports functional updates', async () => {
    const { result } = renderHook(() => useLocalStorage('count', 0));
    await act(async () => {
      result.current.setValue(prev => prev + 1);
    });
    expect(result.current.value).toBe(1);
    await act(async () => {
      result.current.setValue(prev => prev + 1);
    });
    expect(result.current.value).toBe(2);
  });

  it('mounted flag starts false and becomes true after mount', async () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    expect(result.current.mounted).toBe(true);
  });
});
