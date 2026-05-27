'use client';

import { useCallback, useEffect, useState } from 'react';
import type { VoiceInfo } from '@/lib/types';
import { resolveVoiceLabel } from '@/lib/voiceLabel';

export const NICKNAMES_KEY = 'vibeVoice:voiceNicknames';
/** Fired when a nickname is added/changed/removed so open views re-resolve labels. */
export const NICKNAMES_EVENT = 'vibeVoice:nicknames-changed';
/** Fired when the voice list mutates (clone/design/delete) so resolvers refetch. */
export const VOICES_EVENT = 'vibeVoice:voices-changed';

// Module-level cache so the voice list is fetched once and shared across views.
let voicesCache: Record<string, VoiceInfo> | null = null;
let inflight: Promise<Record<string, VoiceInfo>> | null = null;

async function loadVoices(): Promise<Record<string, VoiceInfo>> {
  if (voicesCache) return voicesCache;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const res = await fetch('/api/voices');
      if (!res.ok) return {};
      const data = await res.json();
      const all: VoiceInfo[] = [
        ...(data.systemVoices ?? []),
        ...(data.clonedVoices ?? []),
        ...(data.designedVoices ?? []),
      ];
      const map: Record<string, VoiceInfo> = {};
      for (const v of all) map[v.voice_id] = v;
      // Only pin a non-empty result so a spurious/empty first response can retry.
      if (Object.keys(map).length > 0) voicesCache = map;
      return map;
    } catch {
      return {};
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Drop the shared voice cache so resolvers refetch after a clone/design/delete. */
export function invalidateVoicesCache() {
  voicesCache = null;
  inflight = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(VOICES_EVENT));
  }
}

function readNicknames(): Record<string, string> {
  try {
    const raw = localStorage.getItem(NICKNAMES_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // Guard against null / string / number / array (e.g. the literal "null").
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, string>)
      : {};
  } catch {
    return {};
  }
}

/**
 * Resolve any voiceId to a friendly display name. Fetches the voice list once
 * (cached module-wide) and merges live nickname edits from localStorage.
 */
export function useVoiceNames() {
  const [voices, setVoices] = useState<Record<string, VoiceInfo>>(voicesCache ?? {});
  // Always start empty so server and client first render match; the nicknames are
  // read after mount (a lazy localStorage read here would cause a hydration mismatch
  // when the default voice has a nickname).
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    const loadFromCache = () => {
      loadVoices().then((map) => {
        if (active) setVoices(map);
      });
    };
    loadFromCache();

    const onChange = () => setNicknames(readNicknames());
    // Initial nickname read deferred out of the effect body to avoid a synchronous
    // setState (react-hooks/set-state-in-effect).
    queueMicrotask(() => {
      if (active) onChange();
    });
    window.addEventListener(NICKNAMES_EVENT, onChange);
    window.addEventListener('storage', onChange);
    window.addEventListener(VOICES_EVENT, loadFromCache);
    return () => {
      active = false;
      window.removeEventListener(NICKNAMES_EVENT, onChange);
      window.removeEventListener('storage', onChange);
      window.removeEventListener(VOICES_EVENT, loadFromCache);
    };
  }, []);

  const resolve = useCallback(
    (voiceId: string) => resolveVoiceLabel(voiceId, voices, nicknames),
    [voices, nicknames],
  );

  return { resolve };
}
