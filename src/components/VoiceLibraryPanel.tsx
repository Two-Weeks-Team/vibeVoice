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
import type { VoiceInfo } from '@/lib/types';

function formatVoiceLabel(voice: VoiceInfo, nicknames: Record<string, string>): string {
  const nickname = nicknames[voice.voice_id];
  if (nickname) return nickname;

  if (voice.voice_name) return voice.voice_name;

  const id = voice.voice_id;

  if (/^[A-Z]/.test(id) && id.includes('_') && !id.includes('-')) {
    return id.replace(/_/g, ' ');
  }

  if (id.startsWith('moss_audio_')) {
    const suffix = id.slice(-8);
    return `Voice ...${suffix}`;
  }

  if (id.length > 30) {
    return `${id.slice(0, 12)}...${id.slice(-8)}`;
  }

  return id.replace(/[_-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

interface VoiceLibraryPanelProps {
  selectedVoiceId: string;
  onVoiceSelect: (voiceId: string) => void;
}

const PREVIEW_TEXT = 'Hello! This is a preview of my voice. I hope you enjoy listening to it.';

export function VoiceLibraryPanel({ selectedVoiceId, onVoiceSelect }: VoiceLibraryPanelProps) {
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
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const saveNickname = useCallback((voiceId: string, name: string) => {
    const trimmed = name.trim();
    try {
      const raw = localStorage.getItem('vibeVoice:voiceNicknames');
      const nicks = raw ? JSON.parse(raw) : {};
      if (trimmed) {
        nicks[voiceId] = trimmed;
      } else {
        delete nicks[voiceId];
      }
      localStorage.setItem('vibeVoice:voiceNicknames', JSON.stringify(nicks));
      setNicknames(nicks);
    } catch {}
    setEditingId(null);
  }, []);

  const loadNicknames = useCallback(() => {
    try {
      const raw = localStorage.getItem('vibeVoice:voiceNicknames');
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
        const nicknamesRaw = localStorage.getItem('vibeVoice:voiceNicknames');
        if (nicknamesRaw) {
          const nicks = JSON.parse(nicknamesRaw);
          delete nicks[voiceId];
          localStorage.setItem('vibeVoice:voiceNicknames', JSON.stringify(nicks));
          setNicknames(nicks);
        }
      } catch {}
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
      <ScrollArea className="h-[250px]">
        <div className="space-y-1.5 pr-3">
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
                  'w-full rounded-md border px-2.5 py-1.5 text-left text-sm transition-colors cursor-pointer',
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200'
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
                          <p className="truncate font-medium text-[13px]">
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
                              className="flex-shrink-0 text-muted-foreground/50 hover:text-muted-foreground transition-opacity cursor-pointer"
                              aria-label="Rename voice"
                            >
                              <Pencil className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                        {voice.description && voice.description.length > 0 ? (
                          <p className="truncate text-[11px] text-muted-foreground leading-snug">
                            {voice.description.join(' · ')}
                          </p>
                        ) : (
                          <p className="truncate text-[11px] text-muted-foreground leading-snug">
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
                          ? 'text-primary bg-primary/10'
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
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
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

  return (
    <Card>
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
      <CardContent>
        <Tabs defaultValue="system">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="system" className="text-xs">
              <Mic className="mr-1 h-3 w-3" />
              System ({systemVoices.length})
            </TabsTrigger>
            <TabsTrigger value="cloned" className="text-xs">
              <Copy className="mr-1 h-3 w-3" />
              Cloned ({clonedVoices.length})
            </TabsTrigger>
            <TabsTrigger value="designed" className="text-xs">
              <Wand2 className="mr-1 h-3 w-3" />
              Designed ({designedVoices.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="system" className="mt-3">
            {renderVoiceList(systemVoices)}
          </TabsContent>
          <TabsContent value="cloned" className="mt-3">
            {renderVoiceList(clonedVoices, 'voice_cloning')}
          </TabsContent>
          <TabsContent value="designed" className="mt-3">
            {renderVoiceList(designedVoices, 'voice_generation')}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
