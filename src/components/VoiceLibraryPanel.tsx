'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Trash2, Mic, Wand2, Copy } from 'lucide-react';
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

export function VoiceLibraryPanel({ selectedVoiceId, onVoiceSelect }: VoiceLibraryPanelProps) {
  const [systemVoices, setSystemVoices] = useState<VoiceInfo[]>([]);
  const [clonedVoices, setClonedVoices] = useState<VoiceInfo[]>([]);
  const [designedVoices, setDesignedVoices] = useState<VoiceInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [nicknames, setNicknames] = useState<Record<string, string>>({});

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
                  'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'hover:bg-accent'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-sm">
                      {formatVoiceLabel(voice, nicknames)}
                    </p>
                    {voice.description && voice.description.length > 0 && (
                      <p className="truncate text-xs text-muted-foreground">
                        {voice.description.join(' · ')}
                      </p>
                    )}
                    {(!voice.description || voice.description.length === 0) && (
                      <p className="truncate text-xs text-muted-foreground">
                        {voice.created_time
                          ? `Created ${voice.created_time}`
                          : voice.voice_id.length > 20
                            ? `${voice.voice_id.slice(0, 16)}...`
                            : voice.voice_id}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isSelected && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0">
                        Active
                      </Badge>
                    )}
                    {voiceType && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(voice.voice_id, voiceType);
                        }}
                        disabled={deletingId === voice.voice_id}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">Voice Library</CardTitle>
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
