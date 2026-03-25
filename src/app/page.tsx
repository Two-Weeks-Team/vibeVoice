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

  return voiceId.replace(/[_-]/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Home() {
  const [text, setText] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [voiceModify, setVoiceModify] = useState<VoiceModify>(DEFAULT_VOICE_MODIFY);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<GenerationResult | null>(null);
  const [voiceLibraryKey, setVoiceLibraryKey] = useState(0);
  const {
    history,
    addItem,
    removeItem,
    clearHistory,
    isExpired,
    mounted,
    hasCorruptBackup,
    recoverFromCorruptBackup,
  } = useHistory();

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
          languageBoost: voiceSettings.languageBoost,
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

  const handleRecoverHistory = () => {
    const recovered = recoverFromCorruptBackup();
    if (recovered) {
      toast.success('Recovered history from local backup.');
      return;
    }
    toast.error('No recoverable local backup found.');
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-foreground">
              <Waves className="h-4.5 w-4.5" />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight">VibeVoice</h1>
              <p className="text-[12px] text-muted-foreground">Voice generation workspace</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <VoiceDesignDialog onVoiceCreated={handleVoiceCreatedOrCloned} />
            <VoiceCloneDialog onVoiceCloned={handleVoiceCreatedOrCloned} />
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-6 sm:px-6">
        <div className="mb-5 flex flex-col gap-3 rounded-2xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Selected voice</p>
              <div className="flex items-center gap-2">
                <p className="truncate text-[15px] font-semibold text-foreground">
                  {formatActiveVoiceLabel(voiceSettings.voiceId)}
                </p>
                {voiceSettings.emotion && (
                  <Badge variant="secondary" className="text-[10px] uppercase">
                    {voiceSettings.emotion}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger
                render={<Button variant="outline" className="px-4 text-[13px] font-medium shadow-none" />}
              >
                Browse voices
                <ChevronRight className="ml-1 h-4 w-4" />
              </DialogTrigger>
              <DialogContent className="w-full max-w-[calc(100vw-2rem)] overflow-hidden border-border bg-background p-0 sm:max-h-[85vh] sm:max-w-[960px]">
                <DialogHeader className="border-b border-border px-6 py-5">
                  <DialogTitle className="text-lg font-semibold tracking-tight">Voice Library</DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Preview, rename, and switch between system, cloned, and designed voices.
                  </DialogDescription>
                </DialogHeader>
                <div className="p-6">
                  <VoiceLibraryPanel
                    key={voiceLibraryKey}
                    selectedVoiceId={voiceSettings.voiceId}
                    onVoiceSelect={handleVoiceSelect}
                    embedded
                  />
                </div>
              </DialogContent>
            </Dialog>
            <Badge variant="outline" className="px-3 py-1 text-[11px] font-medium text-muted-foreground">
              {audioSettings.format.toUpperCase()} · {voiceSettings.speed.toFixed(1)}x
            </Badge>
            {voiceSettings.languageBoost && voiceSettings.languageBoost !== 'auto' && (
              <Badge variant="outline" className="px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {voiceSettings.languageBoost.replace(',', ' / ')}
              </Badge>
            )}
            {hasEffects && (
              <Badge variant="secondary" className="px-3 py-1 text-[11px] font-medium">
                Effects on
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
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
          </div>

          <div className="space-y-5 lg:sticky lg:top-20 lg:self-start">
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
                onDelete={removeItem}
                onClear={clearHistory}
                isExpired={isExpired}
                hasCorruptBackup={hasCorruptBackup}
                onRecoverBackup={handleRecoverHistory}
              />
            ) : (
              <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
