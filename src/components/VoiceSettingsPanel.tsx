'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { EMOTIONS, AUDIO_FORMATS, EMOTION_LABELS } from '@/lib/constants';
import type { VoiceSettings, AudioSettings, Emotion, AudioFormat } from '@/lib/types';

function toNumber(v: number | readonly number[]): number {
  return typeof v === 'number' ? v : v[0];
}

const AUTO_EMOTION_KEY = '__auto__';

const EMOTION_ITEM_LABELS: Record<string, React.ReactNode> = {
  [AUTO_EMOTION_KEY]: 'Auto (recommended)',
  ...EMOTION_LABELS,
};

const FORMAT_ITEM_LABELS: Record<string, React.ReactNode> = Object.fromEntries(
  AUDIO_FORMATS.map((f) => [f, f.toUpperCase()]),
);

interface VoiceSettingsPanelProps {
  voiceSettings: VoiceSettings;
  audioSettings: AudioSettings;
  onVoiceChange: (settings: VoiceSettings) => void;
  onAudioChange: (settings: AudioSettings) => void;
}

export function VoiceSettingsPanel({
  voiceSettings,
  audioSettings,
  onVoiceChange,
  onAudioChange,
}: VoiceSettingsPanelProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium">Voice Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Speed</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Volume</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Pitch</Label>
            <span className="text-sm text-muted-foreground tabular-nums">
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

        <Separator />

        <div className="space-y-2">
          <Label className="text-sm">Emotion</Label>
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

        <div className="space-y-2">
          <Label className="text-sm">Format</Label>
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
      </CardContent>
    </Card>
  );
}
