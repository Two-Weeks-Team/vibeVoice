import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TextInputPanel } from '@/components/TextInputPanel';

describe('TextInputPanel', () => {
  const defaultProps = {
    text: '',
    onChange: vi.fn(),
    onGenerate: vi.fn(),
    isLoading: false,
  };

  it('renders textarea with data-testid="text-input"', () => {
    render(<TextInputPanel {...defaultProps} />);
    expect(screen.getByTestId('text-input')).toBeInTheDocument();
  });

  it('renders char count with data-testid="char-count"', () => {
    render(<TextInputPanel {...defaultProps} />);
    expect(screen.getByTestId('char-count')).toBeInTheDocument();
  });

  it('shows "0 / 10,000" char count initially', () => {
    render(<TextInputPanel {...defaultProps} />);
    expect(screen.getByTestId('char-count')).toHaveTextContent('0 / 10,000');
  });

  it('renders generate button with data-testid="generate-btn"', () => {
    render(<TextInputPanel {...defaultProps} />);
    expect(screen.getByTestId('generate-btn')).toBeInTheDocument();
  });

  it('generate button is disabled when text is empty', () => {
    render(<TextInputPanel {...defaultProps} text="" />);
    expect(screen.getByTestId('generate-btn')).toBeDisabled();
  });

  it('generate button is disabled when text exceeds 10000 chars', () => {
    render(<TextInputPanel {...defaultProps} text={'a'.repeat(10001)} />);
    expect(screen.getByTestId('generate-btn')).toBeDisabled();
  });

  it('generate button is disabled when isLoading is true', () => {
    render(<TextInputPanel {...defaultProps} text="hello" isLoading={true} />);
    expect(screen.getByTestId('generate-btn')).toBeDisabled();
  });

  it('generate button is enabled when text is valid and not loading', () => {
    render(<TextInputPanel {...defaultProps} text="hello world" />);
    expect(screen.getByTestId('generate-btn')).not.toBeDisabled();
  });

  it('calls onGenerate when button clicked with valid text', () => {
    const onGenerate = vi.fn();
    render(<TextInputPanel {...defaultProps} text="hello" onGenerate={onGenerate} />);
    fireEvent.click(screen.getByTestId('generate-btn'));
    expect(onGenerate).toHaveBeenCalledOnce();
  });

  it('textarea has placeholder text', () => {
    render(<TextInputPanel {...defaultProps} />);
    const textarea = screen.getByTestId('text-input');
    expect(textarea).toHaveAttribute('placeholder');
    expect(textarea.getAttribute('placeholder')).not.toBe('');
  });

  it('shows char count based on text length', () => {
    render(<TextInputPanel {...defaultProps} text="hello" />);
    expect(screen.getByTestId('char-count')).toHaveTextContent('5 / 10,000');
  });

  it('char count has warning color when over 9000 chars', () => {
    render(<TextInputPanel {...defaultProps} text={'a'.repeat(9001)} />);
    const charCount = screen.getByTestId('char-count');
    expect(charCount.className).toMatch(/destructive|red|orange|warning/i);
  });

  it('shows loading spinner icon when isLoading is true', () => {
    render(<TextInputPanel {...defaultProps} text="hello" isLoading={true} />);
    const btn = screen.getByTestId('generate-btn');
    expect(btn.querySelector('svg')).toBeInTheDocument();
  });

  it('renders interjection picker buttons', () => {
    render(<TextInputPanel {...defaultProps} />);
    expect(screen.getByTestId('interjection-picker')).toBeInTheDocument();
    expect(screen.getByTestId('interjection-btn-sighs')).toBeInTheDocument();
    expect(screen.getByTestId('interjection-btn-gasps')).toBeInTheDocument();
  });

  it('inserts an interjection tag at the cursor position', () => {
    function ControlledPanel() {
      const [text, setText] = useState('Hello world');

      return (
        <TextInputPanel
          text={text}
          onChange={setText}
          onGenerate={vi.fn()}
          isLoading={false}
        />
      );
    }

    render(<ControlledPanel />);

    const textarea = screen.getByTestId('text-input') as HTMLTextAreaElement;
    textarea.focus();
    textarea.setSelectionRange(5, 5);

    fireEvent.click(screen.getByTestId('interjection-btn-sighs'));

    expect(textarea.value).toBe('Hello (sighs) world');
  });

  it('replaces selected text with the chosen interjection tag', () => {
    function ControlledPanel() {
      const [text, setText] = useState('Hello placeholder world');

      return (
        <TextInputPanel
          text={text}
          onChange={setText}
          onGenerate={vi.fn()}
          isLoading={false}
        />
      );
    }

    render(<ControlledPanel />);

    const textarea = screen.getByTestId('text-input') as HTMLTextAreaElement;
    const start = textarea.value.indexOf('placeholder');
    const end = start + 'placeholder'.length;
    textarea.focus();
    textarea.setSelectionRange(start, end);

    fireEvent.click(screen.getByTestId('interjection-btn-gasps'));

    expect(textarea.value).toBe('Hello (gasps) world');
  });
});
