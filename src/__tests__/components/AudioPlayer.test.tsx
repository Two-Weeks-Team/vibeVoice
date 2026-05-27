import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AudioPlayer } from '@/components/AudioPlayer';
import type { GenerationResult } from '@/lib/types';

const mockResult: GenerationResult = {
  audioUrl: 'https://cdn.minimax.io/audio/test.mp3',
  traceId: 'trace-123',
  generatedAt: Date.now(),
  durationMs: 5000,
  usageCharacters: 42,
};

describe('AudioPlayer', () => {
  it('returns null when audioResult is null', () => {
    const { container } = render(<AudioPlayer audioResult={null} format="mp3" />);
    expect(container.firstChild).toBeNull();
  });

  it('returns null when audioResult is undefined', () => {
    const { container } = render(<AudioPlayer audioResult={undefined} format="mp3" />);
    expect(container.firstChild).toBeNull();
  });

  it('renders audio element with correct src', () => {
    const { container } = render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    const audio = container.querySelector('audio');
    expect(audio).toBeInTheDocument();
    expect(audio).toHaveAttribute('src', mockResult.audioUrl);
  });

  it('renders a play/pause control', () => {
    render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('download link has data-testid="download-btn"', () => {
    render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    expect(screen.getByTestId('download-btn')).toBeInTheDocument();
  });

  it('download link has href equal to audioUrl', () => {
    render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    const downloadBtn = screen.getByTestId('download-btn');
    expect(downloadBtn).toHaveAttribute('href', mockResult.audioUrl);
  });

  it('download link has download attribute', () => {
    render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    const downloadBtn = screen.getByTestId('download-btn');
    expect(downloadBtn).toHaveAttribute('download');
  });

  it('shows format badge with mp3', () => {
    render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    expect(screen.getByText(/mp3/i, { selector: '[data-slot="badge"]' })).toBeInTheDocument();
  });

  it('shows format badge with wav', () => {
    render(<AudioPlayer audioResult={mockResult} format="wav" />);
    expect(screen.getByText(/wav/i, { selector: '[data-slot="badge"]' })).toBeInTheDocument();
  });

  it('displays duration in MM:SS format when durationMs provided', () => {
    render(<AudioPlayer audioResult={mockResult} format="mp3" />);
    // 5000ms = 0:05
    expect(screen.getByText(/0:05/)).toBeInTheDocument();
  });
});
