'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMOTIONS, AUDIO_FORMATS, EMOTION_LABELS, SOUND_EFFECTS, SOUND_EFFECT_LABELS, LANGUAGE_BOOST_OPTIONS } from '@/lib/constants';
import type { VoiceSettings, AudioSettings, Emotion, AudioFormat, VoiceModify, SoundEffect, LanguageBoost } from '@/lib/types';

function toNumber(v: number | readonly number[]): number {
  return typeof v === 'number' ? v : v[0];
}

function withSign(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

const AUTO_EMOTION_KEY = '__auto__';

const EMOTION_ITEM_LABELS: Record<string, React.ReactNode> = {
  [AUTO_EMOTION_KEY]: 'Auto (recommended)',
  ...EMOTION_LABELS,
};

const FORMAT_ITEM_LABELS: Record<string, React.ReactNode> = Object.fromEntries(
  AUDIO_FORMATS.map((f) => [f, f.toUpperCase()]),
);

const LANGUAGE_BOOST_ITEM_LABELS: Record<string, React.ReactNode> = Object.fromEntries(
  LANGUAGE_BOOST_OPTIONS.map((language) => [
    language,
    language === 'auto' ? 'Auto detect' : language.replace(',', ' / '),
  ]),
);

const SOUND_EFFECT_ITEM_LABELS: Record<string, React.ReactNode> = {
  __none__: 'None',
  ...SOUND_EFFECT_LABELS,
};

interface VoiceSettingsPanelProps {
  voiceSettings: VoiceSettings;
  audioSettings: AudioSettings;
  voiceModify: VoiceModify;
  onVoiceChange: (settings: VoiceSettings) => void;
  onAudioChange: (settings: AudioSettings) => void;
  onVoiceModifyChange: (modify: VoiceModify) => void;
}

export function VoiceSettingsPanel({
  voiceSettings,
  audioSettings,
  voiceModify,
  onVoiceChange,
  onAudioChange,
  onVoiceModifyChange,
}: VoiceSettingsPanelProps) {
  const [effectsOpen, setEffectsOpen] = useState(false);
  const hasActiveEffects = voiceModify.pitch !== 0 || voiceModify.intensity !== 0 || voiceModify.timbre !== 0 || !!voiceModify.soundEffect;

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-md shadow-black/5">
      {/* Header */}
      <div className="border-b border-border/60 px-5 py-3.5">
        <h2 className="font-display text-base font-bold text-foreground">Voice Controls</h2>
      </div>

      <CardContent className="space-y-5 p-5">
        {/* Sliders Section */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Speed</Label>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/70 tabular-nums">
                {voiceSettings.speed.toFixed(1)}x
              </span>
            </div>
            <Slider
              data-testid="speed-slider"
              min={0.5}
              max={2}
              step={0.1}
              value={[voiceSettings.speed]}
              onValueChange={(v) =>
                onVoiceChange({ ...voiceSettings, speed: toNumber(v) })
              }
              className="w-full"
              aria-label="Speech speed"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Volume</Label>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/70 tabular-nums">
                {voiceSettings.vol.toFixed(1)}
              </span>
            </div>
            <Slider
              data-testid="vol-slider"
              min={0.1}
              max={10}
              step={0.1}
              value={[voiceSettings.vol]}
              onValueChange={(v) =>
                onVoiceChange({ ...voiceSettings, vol: toNumber(v) })
              }
              className="w-full"
              aria-label="Speech volume"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-foreground">Pitch</Label>
              <span className="rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-foreground/70 tabular-nums">
                {voiceSettings.pitch > 0
                  ? `+${voiceSettings.pitch}`
                  : voiceSettings.pitch}
              </span>
            </div>
            <Slider
              data-testid="pitch-slider"
              min={-12}
              max={12}
              step={1}
              value={[voiceSettings.pitch]}
              onValueChange={(v) =>
                onVoiceChange({ ...voiceSettings, pitch: toNumber(v) })
              }
              className="w-full"
              aria-label="Speech pitch"
            />
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Dropdowns */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-foreground">Emotion</Label>
            <Select
              value={voiceSettings.emotion ?? AUTO_EMOTION_KEY}
              items={EMOTION_ITEM_LABELS}
              onValueChange={(value) =>
                onVoiceChange({
                  ...voiceSettings,
                  emotion:
                    value === AUTO_EMOTION_KEY || value === null
                      ? undefined
                      : (value as Emotion),
                })
              }
            >
              <SelectTrigger data-testid="emotion-select" className="w-full">
                <SelectValue placeholder="Auto (recommended)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AUTO_EMOTION_KEY}>
                  Auto (recommended)
                </SelectItem>
                {EMOTIONS.map((emotion) => (
                  <SelectItem key={emotion} value={emotion}>
                    {EMOTION_LABELS[emotion]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Format</Label>
              <Select
                value={audioSettings.format}
                items={FORMAT_ITEM_LABELS}
                onValueChange={(value) => {
                  if (value) onAudioChange({ format: value as AudioFormat });
                }}
              >
                <SelectTrigger data-testid="format-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUDIO_FORMATS.map((format) => (
                    <SelectItem key={format} value={format}>
                      {format.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Language</Label>
              <Select
                value={voiceSettings.languageBoost ?? 'auto'}
                items={LANGUAGE_BOOST_ITEM_LABELS}
                onValueChange={(value) => {
                  if (!value) return;
                  onVoiceChange({
                    ...voiceSettings,
                    languageBoost: value as LanguageBoost,
                  });
                }}
              >
                <SelectTrigger data-testid="language-boost-select" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_BOOST_OPTIONS.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language === 'auto' ? 'Auto detect' : language.replace(',', ' / ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator className="bg-border/40" />

        {/* Voice Effects - Collapsible */}
        <div>
          <button
            type="button"
            onClick={() => setEffectsOpen(!effectsOpen)}
            className="flex w-full items-center justify-between rounded-lg px-0 py-1 transition-colors"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              Voice Effects
              {hasActiveEffects && (
                <span className="inline-block h-2 w-2 rounded-full bg-chart-1" />
              )}
            </span>
            <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform duration-200', effectsOpen && 'rotate-180')} />
          </button>

          <div className={cn('space-y-4 overflow-hidden transition-all duration-200', effectsOpen ? 'mt-4 max-h-[500px] opacity-100' : 'max-h-0 opacity-0')}>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Deepen / Brighten</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {withSign(voiceModify.pitch)}
                </span>
              </div>
              <Slider
                data-testid="effect-pitch-slider"
                min={-100}
                max={100}
                step={1}
                value={[voiceModify.pitch]}
                onValueChange={(v) =>
                  onVoiceModifyChange({ ...voiceModify, pitch: toNumber(v) })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Stronger / Softer</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {withSign(voiceModify.intensity)}
                </span>
              </div>
              <Slider
                data-testid="effect-intensity-slider"
                min={-100}
                max={100}
                step={1}
                value={[voiceModify.intensity]}
                onValueChange={(v) =>
                  onVoiceModifyChange({ ...voiceModify, intensity: toNumber(v) })
                }
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">Nasal / Crisp</Label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {withSign(voiceModify.timbre)}
                </span>
              </div>
              <Slider
                data-testid="effect-timbre-slider"
                min={-100}
                max={100}
                step={1}
                value={[voiceModify.timbre]}
                onValueChange={(v) =>
                  onVoiceModifyChange({ ...voiceModify, timbre: toNumber(v) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">Sound Effect</Label>
              <Select
                value={voiceModify.soundEffect ?? '__none__'}
                items={SOUND_EFFECT_ITEM_LABELS}
                onValueChange={(value) =>
                  onVoiceModifyChange({
                    ...voiceModify,
                    soundEffect: value === '__none__' ? undefined : (value as SoundEffect),
                  })
                }
              >
                <SelectTrigger data-testid="effect-select" className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {SOUND_EFFECTS.map((effect) => (
                    <SelectItem key={effect} value={effect}>
                      {SOUND_EFFECT_LABELS[effect]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
