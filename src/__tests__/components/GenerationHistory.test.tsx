import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerationHistory } from '@/components/GenerationHistory';
import type { HistoryEntry } from '@/lib/types';

const makeEntry = (overrides: Partial<HistoryEntry> = {}): HistoryEntry => ({
  id: `id-${Math.random()}`,
  text: 'Hello world, this is a test text that should display in history',
  textPreview: 'Hello world, this is a test text that should display in history',
  audioUrl: 'https://cdn.minimax.io/audio/test.mp3',
  traceId: 'trace-123',
  generatedAt: Date.now(),
  voiceSettings: {
    voiceId: 'moss_audio_0e81b820-21bb-11f1-8c29-36c83b29da67',
    speed: 1.0,
    vol: 1.0,
    pitch: 0,
  },
  audioSettings: { format: 'mp3' },
  ...overrides,
});

const expiredEntry = makeEntry({
  id: 'expired-id',
  generatedAt: Date.now() - (24 * 60 * 60 * 1000), // 24h ago = expired
});

const recentEntry = makeEntry({
  id: 'recent-id',
  generatedAt: Date.now(), // just now = not expired
});

describe('GenerationHistory', () => {
  it('shows empty state with data-testid="history-empty" when history is []', () => {
    render(
      <GenerationHistory
        history={[]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );
    expect(screen.getByTestId('history-empty')).toBeInTheDocument();
  });

  it('renders history item with data-testid="history-item-{id}"', () => {
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );
    expect(screen.getByTestId(`history-item-${recentEntry.id}`)).toBeInTheDocument();
  });

  it('shows text preview for history items', () => {
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );
    expect(screen.getByText(/Hello world/)).toBeInTheDocument();
  });

  it('shows language boost in the settings summary when selected', () => {
    const koreanEntry = makeEntry({
      voiceSettings: {
        ...recentEntry.voiceSettings,
        languageBoost: 'Korean',
      },
    });

    render(
      <GenerationHistory
        history={[koreanEntry]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );

    expect(screen.getByText(/Korean/)).toBeInTheDocument();
  });

  it('shows expired badge with data-testid="expired-badge" for expired items', () => {
    render(
      <GenerationHistory
        history={[expiredEntry]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => true}
      />
    );
    expect(screen.getByTestId('expired-badge')).toBeInTheDocument();
  });

  it('does not show expired badge for recent items', () => {
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );
    expect(screen.queryByTestId('expired-badge')).not.toBeInTheDocument();
  });

  it('calls onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={vi.fn()}
        onClear={onClear}
        isExpired={() => false}
      />
    );
    fireEvent.click(screen.getByTestId('clear-history-btn'));
    expect(onClear).toHaveBeenCalled();
  });

  it('calls onSelect when non-expired item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={onSelect}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );
    fireEvent.click(screen.getByTestId(`history-item-${recentEntry.id}`));
    expect(onSelect).toHaveBeenCalledWith(recentEntry);
  });

  it('calls onDelete for a single history item without selecting it', () => {
    const onSelect = vi.fn();
    const onDelete = vi.fn();
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={onSelect}
        onDelete={onDelete}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );

    fireEvent.click(screen.getByTestId(`delete-history-item-${recentEntry.id}`));
    expect(onDelete).toHaveBeenCalledWith(recentEntry.id);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('does not call onSelect when expired item is clicked', () => {
    const onSelect = vi.fn();
    render(
      <GenerationHistory
        history={[expiredEntry]}
        onSelect={onSelect}
        onClear={vi.fn()}
        isExpired={() => true}
      />
    );
    fireEvent.click(screen.getByTestId(`history-item-${expiredEntry.id}`));
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('renders clear history button with data-testid="clear-history-btn"', () => {
    render(
      <GenerationHistory
        history={[recentEntry]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
      />
    );
    expect(screen.getByTestId('clear-history-btn')).toBeInTheDocument();
  });

  it('shows recover backup button when empty and backup exists', () => {
    const onRecoverBackup = vi.fn();
    render(
      <GenerationHistory
        history={[]}
        onSelect={vi.fn()}
        onClear={vi.fn()}
        isExpired={() => false}
        hasCorruptBackup
        onRecoverBackup={onRecoverBackup}
      />
    );

    fireEvent.click(screen.getByTestId('recover-history-btn'));
    expect(onRecoverBackup).toHaveBeenCalledOnce();
  });
});
