'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wand2, Loader2 } from 'lucide-react';
import { VOICE_DESIGN_PREVIEW_MAX_LENGTH } from '@/lib/constants';

function hexToAudioUrl(hex: string): string {
  const bytes = new Uint8Array(
    hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  );
  const blob = new Blob([bytes], { type: 'audio/mp3' });
  return URL.createObjectURL(blob);
}

interface VoiceDesignDialogProps {
  onVoiceCreated?: (voiceId: string) => void;
}

export function VoiceDesignDialog({ onVoiceCreated }: VoiceDesignDialogProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [customVoiceId, setCustomVoiceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ voiceId: string; audioUrl: string | null } | null>(null);

  const canSubmit =
    prompt.trim().length > 0 &&
    previewText.trim().length > 0 &&
    previewText.length <= VOICE_DESIGN_PREVIEW_MAX_LENGTH &&
    !isLoading;

  const handleDesign = async () => {
    setIsLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/voice-design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          previewText: previewText.trim(),
          ...(customVoiceId.trim() ? { voiceId: customVoiceId.trim() } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Voice design failed');
        return;
      }

      const audioUrl = data.trialAudioHex ? hexToAudioUrl(data.trialAudioHex) : null;
      setResult({ voiceId: data.voiceId, audioUrl });
      toast.success(`Voice "${data.voiceId}" created!`);
      onVoiceCreated?.(data.voiceId);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset form after animation
    setTimeout(() => {
      setPrompt('');
      setPreviewText('');
      setCustomVoiceId('');
      setResult(null);
    }, 200);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger
        render={<Button variant="outline" size="sm" className="gap-1.5" />}
      >
        <Wand2 className="h-3.5 w-3.5" />
        Design Voice
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Design a New Voice</DialogTitle>
          <DialogDescription>
            Describe the voice you want and generate a preview. The created voice will appear in your Voice Library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Voice Description */}
          <div className="space-y-2">
            <Label>Voice Description</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Warm and deep male narrator voice with slight British accent, calm and authoritative tone..."
              className="min-h-[80px] resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Preview Text */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Preview Text</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {previewText.length} / {VOICE_DESIGN_PREVIEW_MAX_LENGTH}
              </span>
            </div>
            <Textarea
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="The text that will be spoken in the designed voice..."
              className="min-h-[60px] resize-none text-sm"
              disabled={isLoading}
            />
          </div>

          {/* Custom Voice ID */}
          <div className="space-y-2">
            <Label className="text-sm">
              Custom Voice ID <span className="text-muted-foreground">(optional)</span>
            </Label>
            <Input
              value={customVoiceId}
              onChange={(e) => setCustomVoiceId(e.target.value)}
              placeholder="auto-generated if empty"
              className="text-sm"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              8-256 chars, starts with letter, only letters/digits/hyphens/underscores
            </p>
          </div>

          {/* Result: Audio Preview */}
          {result && (
            <div className="rounded-lg border bg-muted/50 p-3 space-y-2">
              <p className="text-sm font-medium">
                Voice created: <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{result.voiceId}</code>
              </p>
              {result.audioUrl && (
                <audio controls src={result.audioUrl} className="w-full" />
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              {result ? 'Done' : 'Cancel'}
            </Button>
            {!result && (
              <Button onClick={handleDesign} disabled={!canSubmit}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Designing...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Design Voice
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
