'use client';

import { useRef } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { MAX_TEXT_LENGTH, CHAR_WARNING_THRESHOLD, INTERJECTION_TAGS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface TextInputPanelProps {
  text: string;
  onChange: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export function TextInputPanel({ text, onChange, onGenerate, isLoading }: TextInputPanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const charCount = text.length;
  const isOverLimit = charCount > MAX_TEXT_LENGTH;
  const isWarning = charCount > CHAR_WARNING_THRESHOLD;
  const canGenerate = text.trim().length > 0 && !isOverLimit && !isLoading;

  const insertInterjection = (tag: string) => {
    const textarea = textareaRef.current;
    const token = `(${tag})`;

    if (!textarea) {
      const spacer = text.length > 0 && !/[\s(]$/.test(text) ? ' ' : '';
      onChange(`${text}${spacer}${token} `);
      return;
    }

    const start = textarea.selectionStart ?? text.length;
    const end = textarea.selectionEnd ?? text.length;
    const before = text.slice(0, start);
    const after = text.slice(end);
    const needsLeadingSpace = before.length > 0 && !/[\s(]$/.test(before);
    const needsTrailingSpace = after.length === 0 || !/^[\s,.;:!?)]/.test(after);
    const insertion = `${needsLeadingSpace ? ' ' : ''}${token}${needsTrailingSpace ? ' ' : ''}`;
    const nextValue = `${before}${insertion}${after}`;
    const nextCursor = before.length + insertion.length;

    onChange(nextValue);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
    });
  };

  return (
    <Card className="shadow-none">
      <CardContent className="space-y-4 pt-5">
        <div className="flex items-center justify-between">
          <Label htmlFor="script-input" className="text-[14px] font-semibold text-foreground">
            Script
          </Label>
          <span className="text-[11px] text-muted-foreground">
            Paste a draft or start from scratch
          </span>
        </div>
        <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[13px] font-medium text-foreground">Interjection Tags</p>
              <p className="text-[12px] text-muted-foreground">
                Click a tag to insert MiniMax actions like sighs, gasps, or laughs.
              </p>
            </div>
            <span className="text-[11px] text-muted-foreground">Inserted at your cursor</span>
          </div>
          <div data-testid="interjection-picker" className="flex flex-wrap gap-2">
            {INTERJECTION_TAGS.map((item) => (
              <Button
                key={item.tag}
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full px-3 shadow-none"
                data-testid={`interjection-btn-${item.tag}`}
                onClick={() => insertInterjection(item.tag)}
              >
                <span>{item.label}</span>
                <span className="font-mono text-[11px] text-muted-foreground">({item.tag})</span>
              </Button>
            ))}
          </div>
        </div>
        <Textarea
          ref={textareaRef}
          id="script-input"
          data-testid="text-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your script or start typing..."
          className="min-h-[260px] resize-y text-[15px] leading-7 shadow-none p-5"
          rows={10}
        />
        <div className="flex items-center justify-between gap-3 border-t border-border pt-1">
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
            size="lg"
            className="px-6 text-[13px] font-medium shadow-none"
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
