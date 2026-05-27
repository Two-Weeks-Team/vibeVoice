'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { Download, Pause, Play } from 'lucide-react';
import type { GenerationResult, AudioFormat } from '@/lib/types';

interface AudioPlayerProps {
  audioResult: GenerationResult | null | undefined;
  format: AudioFormat;
}

function formatClock(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const total = Math.floor(seconds);
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer({ audioResult, format }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSeekingRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Parent remounts this component via `key={audioUrl}` when a new clip loads,
  // so transport state starts fresh without a reset effect.
  if (!audioResult?.audioUrl) {
    return null;
  }

  const { durationMs, usageCharacters } = audioResult;
  const fallbackDuration = durationMs !== undefined ? durationMs / 1000 : 0;
  const total = audioDuration || fallbackDuration;
  const progress = total > 0 ? Math.min(100, (currentTime / total) * 100) : 0;

  const togglePlay = () => {
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) {
      el.pause();
    } else {
      el.play().catch(() => setIsPlaying(false));
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const el = audioRef.current;
    const next = Number(event.target.value);
    setCurrentTime(next);
    if (el) el.currentTime = next;
  };

  const handleDurationChange = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    const d = event.currentTarget.duration;
    setAudioDuration(Number.isFinite(d) && d > 0 ? d : 0);
  };

  return (
    <Card
      data-testid="audio-player"
      className="overflow-hidden rounded-2xl border-border bg-card shadow-md shadow-black/5"
    >
      <div className="border-b border-border/60 px-5 py-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-foreground">Output</h2>
          <Badge variant="secondary" className="text-xs uppercase">
            {format}
          </Badge>
        </div>
      </div>
      <CardContent className="space-y-4 p-5">
        <audio
          ref={audioRef}
          src={audioResult.audioUrl}
          preload="metadata"
          className="hidden"
          onLoadedMetadata={handleDurationChange}
          onDurationChange={handleDurationChange}
          onTimeUpdate={(e) => {
            if (!isSeekingRef.current) setCurrentTime(e.currentTarget.currentTime);
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
        />

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="ml-0.5 h-5 w-5" />
            )}
          </button>

          <div className="flex flex-1 items-center gap-3">
            <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
              {formatClock(currentTime)}
            </span>
            <input
              type="range"
              min={0}
              max={total || 0}
              step={0.1}
              value={Math.min(currentTime, total || 0)}
              onChange={handleSeek}
              onPointerDown={() => {
                isSeekingRef.current = true;
              }}
              onPointerUp={() => {
                isSeekingRef.current = false;
              }}
              onBlur={() => {
                isSeekingRef.current = false;
              }}
              disabled={total <= 0}
              aria-label="Seek"
              className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full outline-none disabled:cursor-not-allowed disabled:opacity-50 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
              style={{
                background: `linear-gradient(to right, var(--primary) ${progress}%, var(--muted) ${progress}%)`,
              }}
            />
            <span className="w-10 text-xs tabular-nums text-muted-foreground">
              {formatClock(total)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          {usageCharacters !== undefined ? (
            <p className="text-xs text-muted-foreground">
              {usageCharacters.toLocaleString()} characters used
            </p>
          ) : (
            <span />
          )}
          <a
            href={audioResult.audioUrl}
            download
            data-testid="download-btn"
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'gap-2 shadow-none')}
          >
            <Download className="h-3.5 w-3.5" />
            Download {format.toUpperCase()}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
