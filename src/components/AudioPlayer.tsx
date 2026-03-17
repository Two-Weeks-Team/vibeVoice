'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Download } from 'lucide-react';
import type { GenerationResult, AudioFormat } from '@/lib/types';

interface AudioPlayerProps {
  audioResult: GenerationResult | null | undefined;
  format: AudioFormat;
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ audioResult, format }: AudioPlayerProps) {
  if (!audioResult?.audioUrl) {
    return null;
  }

  const { audioUrl, durationMs, usageCharacters } = audioResult;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Audio Output</CardTitle>
          <div className="flex items-center gap-2">
            {durationMs !== undefined && (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatDuration(durationMs)}
              </span>
            )}
            <Badge variant="secondary" className="text-xs uppercase">
              {format}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <audio
          data-testid="audio-player"
          src={audioUrl}
          controls
          className="w-full"
        />

        <div className="flex items-center justify-between">
          {usageCharacters !== undefined && (
            <p className="text-xs text-muted-foreground">
              {usageCharacters.toLocaleString()} characters used
            </p>
          )}
          <a
            href={audioUrl}
            download
            data-testid="download-btn"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2')}
          >
            <Download className="h-4 w-4" />
            Download {format.toUpperCase()}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
