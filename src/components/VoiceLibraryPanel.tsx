'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Trash2, Mic, Wand2, Copy, Pencil, Play, Square, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatVoiceLabel } from '@/lib/voiceLabel';
import { NICKNAMES_KEY, NICKNAMES_EVENT, invalidateVoicesCache } from '@/hooks/useVoiceNames';
import type { VoiceInfo } from '@/lib/types';

interface VoiceLibraryPanelProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
  embedded?: boolean;
}

const PREVIEW_TEXT = 'Hello! This is a preview of my voice. I hope you enjoy listening to it.';

export function VoiceLibraryPanel({ selectedVoiceId, onVoiceSelect, embedded = false }: VoiceLibraryPanelProps) {
  const [systemVoices, setSystemVoices] = useState<VoiceInfo[]>([]);
  const [clonedVoices, setClonedVoices] = useState<VoiceInfo[]>([]);
  const [designedVoices, setDesignedVoices] = useState<VoiceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [previewCache, setPreviewCache] = useState<Record<string, string>>({});
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const filterVoices = useCallback(
    (voices: VoiceInfo[]) => {
      const keyword = query.trim().toLowerCase();
      if (!keyword) return voices;

      return voices.filter((voice) => {
        const haystack = [
          voice.voice_id,
          voice.voice_name,
          ...(voice.description ?? []),
          nicknames[voice.voice_id],
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      });
    },
    [nicknames, query],
  );

  const saveNickname = useCallback((voiceId: string, name: string) => {
    const trimmed = name.trim();
    try {
      const raw = localStorage.getItem(NICKNAMES_KEY);
      const nicks = raw ? JSON.parse(raw) : {};
      if (trimmed) {
        nicks[voiceId] = trimmed;
      } else {
        delete nicks[voiceId];
      }
      localStorage.setItem(NICKNAMES_KEY, JSON.stringify(nicks));
      setNicknames(nicks);
      window.dispatchEvent(new Event(NICKNAMES_EVENT));
    } catch {}
    setEditingId(null);
  }, []);

  const loadNicknames = useCallback(() => {
    try {
      const raw = localStorage.getItem(NICKNAMES_KEY);
      if (raw) setNicknames(JSON.parse(raw));
    } catch {}
  }, []);

  const fetchVoices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/voices');
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to fetch voices');
        return;
      }
      setSystemVoices(data.systemVoices ?? []);
      setClonedVoices(data.clonedVoices ?? []);
      setDesignedVoices(data.designedVoices ?? []);
      loadNicknames();
    } catch {
      toast.error('Network error fetching voices');
    } finally {
      setIsLoading(false);
    }
  }, [loadNicknames]);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const handleDelete = async (voiceId: string, voiceType: 'voice_cloning' | 'voice_generation') => {
    setDeletingId(voiceId);
    try {
      const res = await fetch('/api/voices/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceId, voiceType }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to delete voice');
        return;
      }
      toast.success('Voice deleted');
      try {
        const nicknamesRaw = localStorage.getItem(NICKNAMES_KEY);
        if (nicknamesRaw) {
          const nicks = JSON.parse(nicknamesRaw);
          delete nicks[voiceId];
          localStorage.setItem(NICKNAMES_KEY, JSON.stringify(nicks));
          setNicknames(nicks);
          window.dispatchEvent(new Event(NICKNAMES_EVENT));
        }
      } catch {}
      invalidateVoicesCache();
      fetchVoices();
    } catch {
      toast.error('Network error deleting voice');
    } finally {
      setDeletingId(null);
    }
  };

  const playAudio = useCallback((voiceId: string, url: string) => {
    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingId(voiceId);
    audio.play().catch(() => {
      toast.error('Failed to play audio');
      setPlayingId(null);
    });
    audio.onended = () => {
      setPlayingId(null);
    };
    audio.onerror = () => {
      setPlayingId(null);
    };
  }, []);

  const handlePreview = useCallback(async (voiceId: string) => {
    if (playingId === voiceId) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingId(null);
    }

    if (previewCache[voiceId]) {
      playAudio(voiceId, previewCache[voiceId]);
      return;
    }

    setPreviewingId(voiceId);
    try {
      const res = await fetch('/api/t2a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: PREVIEW_TEXT,
          voiceId,
          speed: 1.0,
          vol: 1.0,
          pitch: 0,
          format: 'mp3',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Preview failed');
        return;
      }
      setPreviewCache(prev => ({ ...prev, [voiceId]: data.audioUrl }));
      playAudio(voiceId, data.audioUrl);
    } catch {
      toast.error('Network error generating preview');
    } finally {
      setPreviewingId(null);
    }
  }, [playingId, previewCache, playAudio]);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const renderVoiceList = (
    voices: VoiceInfo[],
    voiceType?: 'voice_cloning' | 'voice_generation'
  ) => {
    if (voices.length === 0) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          No voices in this category
        </div>
      );
    }
    return (
      <ScrollArea className={cn(embedded ? 'h-[56vh] min-h-[360px]' : 'h-[250px]')}>
        <div className="space-y-2 pr-2 pb-4">
          {voices.map((voice) => {
            const isSelected = voice.voice_id === selectedVoiceId;
            return (
              <div
                key={voice.voice_id}
                role="button"
                tabIndex={0}
                onClick={() => onVoiceSelect(voice.voice_id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onVoiceSelect(voice.voice_id);
                  }
                }}
                className={cn(
                  'w-full overflow-hidden rounded-[20px] border px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                  isSelected
                    ? 'border-foreground/12 bg-muted text-foreground ring-1 ring-foreground/8'
                    : 'hover:bg-accent'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    {editingId === voice.voice_id ? (
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          e.stopPropagation();
                          if (e.key === 'Enter') {
                            saveNickname(voice.voice_id, editValue);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                          }
                        }}
                        onBlur={() => saveNickname(voice.voice_id, editValue)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-7 text-sm px-2"
                        placeholder="Enter a display name..."
                      />
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <p className="truncate font-medium text-sm text-foreground">
                            {formatVoiceLabel(voice, nicknames)}
                          </p>
                          {voiceType && (
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(voice.voice_id);
                                setEditValue(nicknames[voice.voice_id] ?? voice.voice_name ?? '');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingId(voice.voice_id);
                                  setEditValue(nicknames[voice.voice_id] ?? voice.voice_name ?? '');
                                }
                              }}
                              className="flex-shrink-0 text-muted-foreground/50 hover:text-foreground transition-opacity cursor-pointer"
                              aria-label="Rename voice"
                            >
                              <Pencil className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        {voice.description && voice.description.length > 0 ? (
                          <p className="truncate text-xs text-muted-foreground leading-snug">
                            {voice.description.join(' · ')}
                          </p>
                        ) : (
                          <p className="truncate text-xs text-muted-foreground leading-snug">
                            {voice.created_time
                              ? `Created ${voice.created_time}`
                              : voice.voice_id.length > 20
                                ? `${voice.voice_id.slice(0, 16)}...`
                                : voice.voice_id}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(voice.voice_id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePreview(voice.voice_id);
                        }
                      }}
                      className={cn(
                        'inline-flex items-center justify-center h-6 w-6 rounded-md transition-colors cursor-pointer',
                        playingId === voice.voice_id
                          ? 'text-foreground bg-muted'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                      )}
                      aria-label={playingId === voice.voice_id ? 'Stop preview' : 'Preview voice'}
                    >
                      {previewingId === voice.voice_id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : playingId === voice.voice_id ? (
                        <Square className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </span>
                    {isSelected && (
                      <Badge variant="default" className="text-xs px-1.5 py-0">
                        Active
                      </Badge>
                    )}
                    {voiceType && (
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(voice.voice_id, voiceType);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDelete(voice.voice_id, voiceType);
                          }
                        }}
                        className={cn(
                          'flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer',
                          deletingId === voice.voice_id && 'pointer-events-none opacity-50'
                        )}
                        aria-label="Delete voice"
                      >
                        <Trash2 className="h-3 w-3" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    );
  };

  const content = (
    <>
      {!embedded && (
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold tracking-tight">Voice Library</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={fetchVoices}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className={cn(embedded && 'px-0 pb-0 pt-0')}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground">Browse, preview, and switch voices</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={fetchVoices}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>
        <div className="mb-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search voices by name, id, or description"
            className="h-10 rounded-xl"
          />
        </div>
        <Tabs defaultValue="system">
          <TabsList className="grid w-full grid-cols-3 gap-1 rounded-xl bg-muted/70 p-1">
            <TabsTrigger value="system" className="min-w-0 truncate text-xs">
              <Mic className="mr-1 h-3 w-3" />
              System ({systemVoices.length})
            </TabsTrigger>
            <TabsTrigger value="cloned" className="min-w-0 truncate text-xs">
              <Copy className="mr-1 h-3 w-3" />
              Cloned ({clonedVoices.length})
            </TabsTrigger>
            <TabsTrigger value="designed" className="min-w-0 truncate text-xs">
              <Wand2 className="mr-1 h-3 w-3" />
              Designed ({designedVoices.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="system" className="mt-3">
            {renderVoiceList(filterVoices(systemVoices))}
          </TabsContent>
          <TabsContent value="cloned" className="mt-3">
            {renderVoiceList(filterVoices(clonedVoices), 'voice_cloning')}
          </TabsContent>
          <TabsContent value="designed" className="mt-3">
            {renderVoiceList(filterVoices(designedVoices), 'voice_generation')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </>
  );

  if (embedded) {
    return <div className="space-y-0">{content}</div>;
  }

  return <Card>{content}</Card>;
}
