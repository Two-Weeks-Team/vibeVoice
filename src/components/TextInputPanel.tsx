'use client';

import { useRef, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChevronDown, Loader2 } from 'lucide-react';
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
  const [interjectionsOpen, setInterjectionsOpen] = useState(false);
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
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-md shadow-black/5">
      <CardContent className="p-0">
        {/* Script Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-5 py-3.5">
          <h2 className="font-display text-base font-bold text-foreground">
            Script
          </h2>
          <span className="text-sm text-muted-foreground">
            Paste or type your content
          </span>
        </div>

        {/* Textarea */}
        <Textarea
          ref={textareaRef}
          id="script-input"
          data-testid="text-input"
          value={text}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start writing or paste your script here..."
          className="min-h-[280px] resize-y rounded-none border-0 bg-transparent px-5 py-4 text-[15px] leading-relaxed text-foreground shadow-none ring-0 placeholder:text-muted-foreground/50 focus-visible:ring-0"
          rows={10}
        />

        {/* Interjection Tags (collapsible) */}
        <div className="border-t border-border/60 px-5 py-3">
          <button
            type="button"
            data-testid="interjection-toggle"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setInterjectionsOpen((open) => !open)}
            aria-expanded={interjectionsOpen}
            className="flex w-full items-center justify-between py-0.5 text-left"
          >
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              Interjections
              <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
                {INTERJECTION_TAGS.length} sounds
              </span>
            </span>
            <span className="flex items-center gap-2">
              <span className="text-xs font-normal text-muted-foreground">Insert at cursor</span>
              <ChevronDown
                className={cn(
                  'h-4 w-4 text-muted-foreground transition-transform duration-200',
                  interjectionsOpen && 'rotate-180',
                )}
              />
            </span>
          </button>
          {interjectionsOpen && (
            <div data-testid="interjection-picker" className="mt-3 flex flex-wrap gap-1.5">
              {INTERJECTION_TAGS.map((item) => (
                <Button
                  key={item.tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 rounded-full border-border px-3 text-xs shadow-none hover:bg-accent"
                  data-testid={`interjection-btn-${item.tag}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertInterjection(item.tag)}
                  title={`Inserts (${item.tag})`}
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/60 px-5 py-3">
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
          <div className="flex items-center gap-3">
            {text.trim().length === 0 && !isLoading && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Enter text to generate
              </span>
            )}
            <Button
              data-testid="generate-btn"
              onClick={onGenerate}
              disabled={!canGenerate}
              size="default"
              title={text.trim().length === 0 ? 'Enter text to generate' : undefined}
              className="h-9 gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-none hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Audio'
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
