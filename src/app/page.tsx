'use client';

import { useState } from 'react';
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
import { DEFAULT_VOICE_SETTINGS, DEFAULT_AUDIO_SETTINGS, DEFAULT_VOICE_MODIFY } from '@/lib/constants';
import type { VoiceSettings, AudioSettings, VoiceModify, GenerationResult, HistoryEntry } from '@/lib/types';
import { LogOut } from 'lucide-react';

export default function Home() {
  const [text, setText] = useState('');
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [voiceModify, setVoiceModify] = useState<VoiceModify>(DEFAULT_VOICE_MODIFY);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<GenerationResult | null>(null);
  const [voiceLibraryKey, setVoiceLibraryKey] = useState(0);
  const { history, addItem, clearHistory, isExpired, mounted } = useHistory();

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
          ...(voiceModify.pitch !== 0 || voiceModify.intensity !== 0 || voiceModify.timbre !== 0 || voiceModify.soundEffect
            ? { voiceModify }
            : {}),
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
    setVoiceSettings(prev => ({ ...prev, voiceId }));
  };

  const handleVoiceCreatedOrCloned = () => {
    setVoiceLibraryKey(prev => prev + 1);
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
    <div className="min-h-screen bg-background">
      <header className="bg-[#1c1917] text-white sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-base font-semibold tracking-tight">VibeVoice</h1>
              <span className="hidden sm:inline text-xs text-white/50">Text-to-Audio</span>
            </div>
            <div className="flex items-center gap-1.5 [&_button[data-slot=button]]:border-white/20 [&_button[data-slot=button]]:text-white/80 [&_button[data-slot=button]]:hover:bg-white/10 [&_button[data-slot=button]]:hover:text-white">
              <VoiceDesignDialog onVoiceCreated={handleVoiceCreatedOrCloned} />
              <VoiceCloneDialog onVoiceCloned={handleVoiceCreatedOrCloned} />
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="ml-1 p-2 rounded-md text-white/40 hover:text-white/80 transition-colors"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
          <div className="space-y-5">
            <TextInputPanel
              text={text}
              onChange={setText}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
            <AudioPlayer
              audioResult={currentAudio}
              format={audioSettings.format}
            />
            <VoiceSettingsPanel
              voiceSettings={voiceSettings}
              audioSettings={audioSettings}
              voiceModify={voiceModify}
              onVoiceChange={setVoiceSettings}
              onAudioChange={setAudioSettings}
              onVoiceModifyChange={setVoiceModify}
            />
          </div>

          <div className="space-y-5">
            <VoiceLibraryPanel
              key={voiceLibraryKey}
              selectedVoiceId={voiceSettings.voiceId}
              onVoiceSelect={handleVoiceSelect}
            />
            {mounted ? (
              <GenerationHistory
                history={history}
                onSelect={handleHistorySelect}
                onClear={clearHistory}
                isExpired={isExpired}
              />
            ) : (
              <div className="h-32 animate-pulse rounded-xl bg-card" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
