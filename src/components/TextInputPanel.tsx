'use client';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { MAX_TEXT_LENGTH, CHAR_WARNING_THRESHOLD } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TextInputPanelProps {
  text: string;
  onChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function TextInputPanel({ text, onChange, onGenerate, isLoading }: TextInputPanelProps) {
  const charCount = text.length;
  const isOverLimit = charCount > MAX_TEXT_LENGTH;
  const isWarning = charCount > CHAR_WARNING_THRESHOLD;
  const canGenerate = text.trim().length > 0 && !isOverLimit && !isLoading;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="script-input" className="text-sm font-medium">
          Script
        </Label>
        <Textarea
          id="script-input"
          data-testid="text-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your text here… Supports pause markers like <#1.5#> and interjection tags like (laughs), (sighs)"
          className="min-h-[200px] resize-y font-mono text-sm"
          rows={8}
        />
        <div className="flex justify-end">
          <span
            data-testid="char-count"
            className={cn(
              'text-xs tabular-nums',
              isWarning && !isOverLimit && 'text-orange-500',
              isOverLimit && 'text-destructive font-medium'
            )}
          >
            {charCount.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
          </span>
        </div>
      </div>

      <Button
        data-testid="generate-btn"
        onClick={onGenerate}
        disabled={!canGenerate}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating…
          </>
        ) : (
          'Generate Audio'
        )}
      </Button>
    </div>
  );
}
