'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Clock, Play, Square } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import type { HistoryEntry } from '@/lib/types';

function formatSettingsSummary(entry: HistoryEntry): string {
  const parts: string[] = [];

  const vid = entry.voiceSettings.voiceId;
  if (vid.startsWith('moss_audio_')) {
    parts.push(`Voice ...${vid.slice(-8)}`);
  } else if (vid.length > 20) {
    parts.push(`${vid.slice(0, 10)}...`);
  } else {
    parts.push(vid.replace(/_/g, ' '));
  }

  if (entry.voiceSettings.speed !== 1.0) {
    parts.push(`${entry.voiceSettings.speed.toFixed(1)}x`);
  }

  if (entry.voiceSettings.pitch !== 0) {
    parts.push(`Pitch ${entry.voiceSettings.pitch > 0 ? '+' : ''}${entry.voiceSettings.pitch}`);
  }

  if (entry.voiceSettings.vol !== 1.0) {
    parts.push(`Vol ${entry.voiceSettings.vol.toFixed(1)}`);
  }

  if (entry.voiceSettings.emotion) {
    parts.push(entry.voiceSettings.emotion.charAt(0).toUpperCase() + entry.voiceSettings.emotion.slice(1));
  }

  if (entry.voiceSettings.languageBoost && entry.voiceSettings.languageBoost !== 'auto') {
    parts.push(entry.voiceSettings.languageBoost.replace(',', ' / '));
  }

  return parts.join(' · ');
}

interface GenerationHistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onDelete?: (id: string) => void;
  onClear: () => void;
  isExpired: (entry: HistoryEntry) => boolean;
  hasCorruptBackup?: boolean;
  onRecoverBackup?: () => void;
}

export function GenerationHistory({
  history,
  onSelect,
  onDelete,
  onClear,
  isExpired,
  hasCorruptBackup = false,
  onRecoverBackup,
}: GenerationHistoryProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  const handlePlay = (entry: HistoryEntry) => {
    if (playingId === entry.id) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio(entry.audioUrl);
    audioRef.current = audio;
    setPlayingId(entry.id);
    audio.play().catch(() => setPlayingId(null));
    audio.onended = () => setPlayingId(null);
    audio.onerror = () => setPlayingId(null);
  };

  const handleDelete = (id: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      if (audioRef.current) audioRef.current.currentTime = 0;
      setPlayingId(null);
    }
    onDelete?.(id);
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-[15px] font-semibold tracking-tight">
            History
            {history.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({history.length})
              </span>
            )}
          </CardTitle>
          {history.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              data-testid="clear-history-btn"
              className="h-7 text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div
            data-testid="history-empty"
            className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/15 py-10 text-center"
          >
            <Clock className="mb-2 h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No generations yet</p>
            <p className="text-xs text-muted-foreground/70">
              Recent outputs will appear here
            </p>
            {hasCorruptBackup && onRecoverBackup && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRecoverBackup}
                data-testid="recover-history-btn"
                className="mt-3 h-8 text-xs"
              >
                Recover local backup
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[320px]">
            <div className="space-y-2 pr-3">
              {history.map((entry) => {
                const expired = isExpired(entry);
                const isPlaying = playingId === entry.id;
                return (
                  <div
                    key={entry.id}
                    data-testid={`history-item-${entry.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => !expired && onSelect(entry)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!expired) onSelect(entry);
                      }
                    }}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      expired
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0 flex-1">
                        {!expired && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlay(entry);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePlay(entry);
                              }
                            }}
                            className={cn(
                              'mt-0.5 flex-shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full transition-colors cursor-pointer',
                              isPlaying
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary'
                            )}
                            aria-label={isPlaying ? 'Stop' : 'Play'}
                          >
                            {isPlaying ? (
                              <Square className="h-2.5 w-2.5" />
                            ) : (
                              <Play className="h-2.5 w-2.5 ml-0.5" />
                            )}
                          </span>
                        )}
                        <p className="line-clamp-2 text-[13px] leading-snug">
                          {entry.textPreview}
                        </p>
                      </div>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs uppercase"
                        >
                          {entry.audioSettings.format}
                        </Badge>
                        {onDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(entry.id);
                            }}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                            aria-label="Delete history item"
                            data-testid={`delete-history-item-${entry.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                        {expired && (
                          <Badge
                            variant="destructive"
                            className="text-xs"
                            data-testid="expired-badge"
                          >
                            Expired
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground/80 truncate">
                      {formatSettingsSummary(entry)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {formatRelativeTime(entry.generatedAt)}
                    </p>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
