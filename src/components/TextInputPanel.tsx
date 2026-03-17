'use client';

import { Card, CardContent } from '@/components/ui/card';
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
    <Card>
      <CardContent className="pt-5 space-y-3">
        <Label htmlFor="script-input" className="text-[13px] font-medium text-foreground">
          Script
        </Label>
        <Textarea
          id="script-input"
          data-testid="text-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your text here... Supports pause markers like <#1.5#> and interjection tags like (laughs), (sighs)"
          className="min-h-[160px] resize-y text-[14px] leading-relaxed border-0 bg-background shadow-none focus-visible:ring-0 p-3"
          rows={6}
        />
        <div className="flex items-center justify-between">
          <span
            data-testid="char-count"
            className={cn(
              'text-xs tabular-nums text-muted-foreground',
              isWarning && !isOverLimit && 'text-orange-500',
              isOverLimit && 'text-destructive font-medium'
            )}
          >
            {charCount.toLocaleString()} / {MAX_TEXT_LENGTH.toLocaleString()}
          </span>
          <Button
            data-testid="generate-btn"
            onClick={onGenerate}
            disabled={!canGenerate}
            size="sm"
            className="px-6 text-[13px] font-medium bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Audio'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
