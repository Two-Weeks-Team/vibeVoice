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
import { useVoiceNames, invalidateVoicesCache } from '@/hooks/useVoiceNames';
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
import { ChevronRight, LogOut, Waves } from 'lucide-react';

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
  const { resolve: resolveVoiceName } = useVoiceNames();

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
    invalidateVoicesCache();
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl shadow-sm shadow-black/5">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Waves className="h-4 w-4" />
            </div>
            <h1 className="font-display text-lg font-bold tracking-tight">VibeVoice</h1>
          </div>

          <div className="flex items-center gap-1.5">
            <VoiceDesignDialog onVoiceCreated={handleVoiceCreatedOrCloned} />
            <VoiceCloneDialog onVoiceCloned={handleVoiceCreatedOrCloned} />
            <div className="mx-1 h-5 w-px bg-border" />
            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                window.location.href = '/login';
              }}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Voice Selection Bar */}
        <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-md shadow-black/5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent">
              <Waves className="h-5 w-5 text-foreground/70" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Active Voice
              </p>
              <p className="mt-0.5 truncate font-display text-lg font-semibold text-foreground">
                {resolveVoiceName(voiceSettings.voiceId)}
              </p>
            </div>
            {voiceSettings.emotion && (
              <Badge variant="secondary" className="ml-1 text-xs capitalize">
                {voiceSettings.emotion}
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Dialog>
              <DialogTrigger
                render={<Button variant="outline" className="h-9 gap-1.5 px-4 text-sm font-medium shadow-none" />}
              >
                Browse voices
                <ChevronRight className="h-3.5 w-3.5" />
              </DialogTrigger>
              <DialogContent className="w-full max-w-[calc(100vw-2rem)] overflow-hidden border-border bg-background p-0 sm:max-h-[85vh] sm:max-w-[960px]">
                <DialogHeader className="border-b border-border px-6 py-5">
                  <DialogTitle className="font-display text-xl font-bold tracking-tight">Voice Library</DialogTitle>
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
            <Badge variant="outline" className="h-7 px-2.5 text-xs font-medium text-muted-foreground">
              {audioSettings.format.toUpperCase()}
            </Badge>
            {voiceSettings.speed !== 1.0 && (
              <Badge variant="outline" className="h-7 px-2.5 text-xs font-medium text-muted-foreground">
                {voiceSettings.speed.toFixed(1)}× speed
              </Badge>
            )}
            {voiceSettings.languageBoost && voiceSettings.languageBoost !== 'auto' && (
              <Badge variant="outline" className="h-7 px-2.5 text-xs font-medium text-muted-foreground">
                {voiceSettings.languageBoost.replace(',', ' / ')}
              </Badge>
            )}
            {hasEffects && (
              <Badge variant="secondary" className="h-7 gap-1.5 px-2.5 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-chart-1" />
                Effects
              </Badge>
            )}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <TextInputPanel
              text={text}
              onChange={setText}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />

            {currentAudio && (
              <AudioPlayer
                key={currentAudio.audioUrl}
                audioResult={currentAudio}
                format={audioSettings.format}
              />
            )}
          </div>

          <div className="space-y-6 lg:sticky lg:top-20 lg:self-start">
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
                resolveVoiceName={resolveVoiceName}
              />
            ) : (
              <div className="h-40 animate-pulse rounded-xl border border-border bg-card" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
