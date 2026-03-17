'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Clock } from 'lucide-react';
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

  return parts.join(' · ');
}

interface GenerationHistoryProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
  isExpired: (entry: HistoryEntry) => boolean;
}

export function GenerationHistory({
  history,
  onSelect,
  onClear,
  isExpired,
}: GenerationHistoryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">
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
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <Clock className="mb-2 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No generations yet</p>
            <p className="text-xs text-muted-foreground/70">
              Your audio history will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-3">
              {history.map((entry) => {
                const expired = isExpired(entry);
                return (
                  <button
                    key={entry.id}
                    data-testid={`history-item-${entry.id}`}
                    onClick={() => !expired && onSelect(entry)}
                    disabled={expired}
                    className={cn(
                      'w-full rounded-lg border p-3 text-left transition-colors',
                      expired
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 flex-1 text-sm">
                        {entry.textPreview}
                      </p>
                      <div className="flex flex-shrink-0 flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className="text-xs uppercase"
                        >
                          {entry.audioSettings.format}
                        </Badge>
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
                    <p className="mt-1 text-xs text-muted-foreground/80 truncate">
                      {formatSettingsSummary(entry)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(entry.generatedAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
