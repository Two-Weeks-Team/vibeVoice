'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TextInputPanel } from '@/components/TextInputPanel';
import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';
import { AudioPlayer } from '@/components/AudioPlayer';
import { GenerationHistory } from '@/components/GenerationHistory';
import { VoiceLibraryPanel } from '@/components/VoiceLibraryPanel';
import { VoiceDesignDialog } from '@/components/VoiceDesignDialog';
import { VoiceCloneDialog } from '@/components/VoiceCloneDialog';
import { useHistory } from '@/hooks/useHistory';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  DEFAULT_AUDIO_SETTINGS,
  DEFAULT_VOICE_MODIFY,
  DEFAULT_VOICE_SETTINGS,
} from '@/lib/constants';
import type {
  AudioSettings,
  GenerationResult,
  HistoryEntry,
  VoiceModify,
  VoiceSettings,
} from '@/lib/types';
import { ChevronRight, LogOut, Sparkles, Waves } from 'lucide-react';

function formatActiveVoiceLabel(voiceId: string) {
  if (voiceId.startsWith('moss_audio_')) {
    return `Voice ${voiceId.slice(-8)}`;
  }

  return voiceId
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Home() {
  const [text, setText] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(
    DEFAULT_VOICE_SETTINGS,
  );
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(
    DEFAULT_AUDIO_SETTINGS,
  );
  const [voiceModify, setVoiceModify] = useState<VoiceModify>(
    DEFAULT_VOICE_MODIFY,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] =
    useState<GenerationResult | null>(null);
  const [voiceLibraryKey, setVoiceLibraryKey] = useState(0);
  const { history, addItem, clearHistory, isExpired, mounted } = useHistory();

  const hasEffects = useMemo(
    () =>
      voiceModify.pitch !== 0 ||
      voiceModify.intensity !== 0 ||
      voiceModify.timbre !== 0 ||
      !!voiceModify.soundEffect,
    [voiceModify],
  );

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/t2a', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          voiceId: voiceSettings.voiceId,
          speed: voiceSettings.speed,
          vol: voiceSettings.vol,
          pitch: voiceSettings.pitch,
          emotion: voiceSettings.emotion,
          format: audioSettings.format,
          ...(hasEffects ? { voiceModify } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to generate audio');
        return;
      }

      const result: GenerationResult = {
        audioUrl: data.audioUrl,
        traceId: data.traceId,
        generatedAt: Date.now(),
        durationMs: data.durationMs,
        usageCharacters: data.usageCharacters,
      };

      setCurrentAudio(result);

      const entry: HistoryEntry = {
        ...result,
        id: crypto.randomUUID(),
        text,
        textPreview: text.slice(0, 80),
        voiceSettings: { ...voiceSettings },
        audioSettings: { ...audioSettings },
      };

      addItem(entry);
      toast.success('Audio generated successfully!');
    } catch {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceSelect = (voiceId: string) => {
    setVoiceSettings((prev) => ({ ...prev, voiceId }));
  };

  const handleVoiceCreatedOrCloned = () => {
    setVoiceLibraryKey((prev) => prev + 1);
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    setCurrentAudio({
      audioUrl: entry.audioUrl,
      traceId: entry.traceId,
      generatedAt: entry.generatedAt,
      durationMs: entry.durationMs,
      usageCharacters: entry.usageCharacters,
    });
    setText(entry.text);
    setVoiceSettings(entry.voiceSettings);
    setAudioSettings(entry.audioSettings);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Waves className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight">VibeVoice</h1>
              <p className="text-[11px] text-muted-foreground">
                Voice studio for scripts, cloning, and playback
              </p>
            </div>
          </div>

          <button
            onClick={async () => {
              await fetch('/api/auth/logout', { method: 'POST' });
              window.location.href = '/login';
            }}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-8 sm:px-6">
        <section className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Badge
                variant="secondary"
                className="rounded-full px-2.5 py-1 text-[11px] font-medium text-primary"
              >
                Studio
              </Badge>
              <div className="space-y-1.5">
                <h2 className="max-w-3xl text-[28px] font-semibold leading-[1.08] tracking-tight text-foreground sm:text-[36px]">
                  Turn a script into a voice that actually feels chosen.
                </h2>
                <p className="max-w-2xl text-[14px] leading-6 text-muted-foreground">
                  Start from the voice, shape the delivery, then generate and compare the result in one focused flow.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <VoiceDesignDialog onVoiceCreated={handleVoiceCreatedOrCloned} />
              <VoiceCloneDialog onVoiceCloned={handleVoiceCreatedOrCloned} />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-4 shadow-[0_1px_0_rgba(18,24,38,0.02),0_12px_30px_rgba(18,24,38,0.04)] sm:p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Active Voice
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="truncate text-[16px] font-semibold text-foreground">
                      {formatActiveVoiceLabel(voiceSettings.voiceId)}
                    </p>
                    {voiceSettings.emotion && (
                      <Badge
                        variant="secondary"
                        className="rounded-full px-2 py-0.5 text-[10px] uppercase"
                      >
                        {voiceSettings.emotion}
                      </Badge>
                    )}
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    {audioSettings.format.toUpperCase()} output · {voiceSettings.speed.toFixed(1)}x speed
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Dialog>
                  <DialogTrigger
                    render={
                      <Button
                        variant="outline"
                        className="rounded-full px-4 text-[13px] font-medium"
                      />
                    }
                  >
                    Browse voices
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl border-border bg-background p-0 sm:max-h-[85vh]">
                    <DialogHeader className="border-b border-border px-6 py-5">
                      <DialogTitle className="text-lg font-semibold tracking-tight">
                        Voice Library
                      </DialogTitle>
                      <DialogDescription className="text-sm text-muted-foreground">
                        Preview, rename, and switch between system, cloned, and designed voices.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                      <VoiceLibraryPanel
                        key={voiceLibraryKey}
                        selectedVoiceId={voiceSettings.voiceId}
                        onVoiceSelect={handleVoiceSelect}
                      />
                    </div>
                  </DialogContent>
                </Dialog>

                <Badge
                  variant="outline"
                  className="rounded-full px-3 py-1 text-[11px] font-medium text-muted-foreground"
                >
                  {hasEffects ? 'Effects On' : 'Clean Voice'}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <TextInputPanel
            text={text}
            onChange={setText}
            onGenerate={handleGenerate}
            isLoading={isLoading}
          />

          {currentAudio && (
            <AudioPlayer
              audioResult={currentAudio}
              format={audioSettings.format}
            />
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <VoiceSettingsPanel
              voiceSettings={voiceSettings}
              audioSettings={audioSettings}
              voiceModify={voiceModify}
              onVoiceChange={setVoiceSettings}
              onAudioChange={setAudioSettings}
              onVoiceModifyChange={setVoiceModify}
            />

            {mounted ? (
              <GenerationHistory
                history={history}
                onSelect={handleHistorySelect}
                onClear={clearHistory}
                isExpired={isExpired}
              />
            ) : (
              <div className="h-48 animate-pulse rounded-3xl border border-border bg-card" />
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
