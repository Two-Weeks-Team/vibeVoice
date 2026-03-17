'use client';

import { useState, useRef } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Copy, Loader2, Upload, Check } from 'lucide-react';

interface VoiceCloneDialogProps {
  onVoiceCloned?: (voiceId: string) => void;
}

export function VoiceCloneDialog({ onVoiceCloned }: VoiceCloneDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [voiceId, setVoiceId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [noiseReduction, setNoiseReduction] = useState(false);
  const [volumeNorm, setVolumeNorm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [cloneSuccess, setCloneSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValidVoiceId =
    voiceId.length >= 8 &&
    voiceId.length <= 256 &&
    /^[a-zA-Z][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(voiceId);
  const canUpload = file !== null && !isUploading && !uploadedFileId;
  const canClone = uploadedFileId !== null && isValidVoiceId && !isCloning;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const validTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/x-m4a',
      'audio/wav',
      'audio/wave',
    ];
    if (
      !validTypes.includes(selected.type) &&
      !selected.name.match(/\.(mp3|m4a|wav)$/i)
    ) {
      toast.error('Only MP3, M4A, and WAV files are accepted');
      return;
    }

    if (selected.size > 20 * 1024 * 1024) {
      toast.error('File must be 20MB or smaller');
      return;
    }

    setFile(selected);
    setUploadedFileId(null);
    setCloneSuccess(false);
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'voice_clone');

      const res = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Upload failed');
        return;
      }
      setUploadedFileId(data.fileId);
      toast.success('Audio uploaded successfully');
    } catch {
      toast.error('Network error uploading file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClone = async () => {
    if (!uploadedFileId || !isValidVoiceId) return;
    setIsCloning(true);
    try {
      const res = await fetch('/api/voice-clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadedFileId,
          voiceId: voiceId.trim(),
          needNoiseReduction: noiseReduction,
          needVolumeNormalization: volumeNorm,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? 'Voice cloning failed');
        return;
      }
      setCloneSuccess(true);
      try {
        const nicknamesRaw = localStorage.getItem('vibeVoice:voiceNicknames');
        const nicknames = nicknamesRaw ? JSON.parse(nicknamesRaw) : {};
        nicknames[voiceId.trim()] = displayName.trim() || voiceId.trim();
        localStorage.setItem('vibeVoice:voiceNicknames', JSON.stringify(nicknames));
      } catch {}
      toast.success(`Voice "${voiceId}" cloned successfully!`);
      onVoiceCloned?.(voiceId);
    } catch {
      toast.error('Network error during cloning');
    } finally {
      setIsCloning(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setFile(null);
      setVoiceId('');
      setDisplayName('');
      setNoiseReduction(false);
      setVolumeNorm(false);
      setIsUploading(false);
      setIsCloning(false);
      setUploadedFileId(null);
      setCloneSuccess(false);
    }, 200);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : handleClose())}>
      <DialogTrigger
        render={<Button variant="ghost" size="sm" className="gap-1.5 text-white/80 border border-white/20 hover:bg-white/10 hover:text-white" />}
      >
        <Copy className="h-3.5 w-3.5" />
        Clone Voice
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Clone a Voice</DialogTitle>
          <DialogDescription>
            Upload an audio sample (10s–5min, MP3/M4A/WAV, ≤20MB) to clone a
            voice. Cloned voices auto-delete after 7 days if unused.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Step 1: File Upload */}
          <div className="space-y-2">
            <Label>Audio Sample</Label>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp3,.m4a,.wav,audio/mpeg,audio/mp4,audio/wav"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading || isCloning}
                className="gap-1.5"
              >
                <Upload className="h-3.5 w-3.5" />
                Choose File
              </Button>
              {file && (
                <span className="text-sm text-muted-foreground truncate">
                  {file.name} ({formatFileSize(file.size)})
                </span>
              )}
            </div>
            {file && !uploadedFileId && (
              <Button
                size="sm"
                onClick={handleUpload}
                disabled={!canUpload}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload Audio'
                )}
              </Button>
            )}
            {uploadedFileId && (
              <p className="flex items-center gap-1.5 text-sm text-green-600">
                <Check className="h-4 w-4" />
                Uploaded (File ID: {uploadedFileId})
              </p>
            )}
          </div>

          {/* Step 2: Voice ID + Options */}
          {uploadedFileId && (
            <>
              <div className="space-y-2">
                <Label>Voice ID</Label>
                <Input
                  value={voiceId}
                  onChange={(e) => setVoiceId(e.target.value)}
                  placeholder="e.g., my-brand-voice"
                  disabled={isCloning || cloneSuccess}
                />
                <p className="text-xs text-muted-foreground">
                  8-256 chars, starts with letter,
                  letters/digits/hyphens/underscores only
                </p>
                {voiceId.length > 0 && !isValidVoiceId && (
                  <p className="text-xs text-destructive">
                    Invalid voice ID format
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Display Name <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., My Brand Voice"
                  disabled={isCloning || cloneSuccess}
                />
                <p className="text-xs text-muted-foreground">
                  A friendly name shown in Voice Library. Defaults to Voice ID if empty.
                </p>
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <Label className="text-sm">Noise Reduction</Label>
                <Switch
                  checked={noiseReduction}
                  onCheckedChange={(checked) => setNoiseReduction(checked)}
                  disabled={isCloning || cloneSuccess}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label className="text-sm">Volume Normalization</Label>
                <Switch
                  checked={volumeNorm}
                  onCheckedChange={(checked) => setVolumeNorm(checked)}
                  disabled={isCloning || cloneSuccess}
                />
              </div>
            </>
          )}

          {/* Clone Success */}
          {cloneSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950 p-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Voice{' '}
                <code className="text-xs bg-green-100 dark:bg-green-900 px-1.5 py-0.5 rounded">
                  {voiceId}
                </code>{' '}
                cloned successfully!
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                It&apos;s now available in your Voice Library. Note: unused
                voices are deleted after 7 days.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={handleClose}>
              {cloneSuccess ? 'Done' : 'Cancel'}
            </Button>
            {uploadedFileId && !cloneSuccess && (
              <Button onClick={handleClone} disabled={!canClone}>
                {isCloning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cloning...
                  </>
                ) : (
                  'Clone Voice'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
