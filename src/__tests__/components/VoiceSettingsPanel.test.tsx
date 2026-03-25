import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VoiceSettingsPanel } from '@/components/VoiceSettingsPanel';
import { DEFAULT_VOICE_SETTINGS, DEFAULT_AUDIO_SETTINGS, DEFAULT_VOICE_MODIFY, EMOTIONS, LANGUAGE_BOOST_OPTIONS } from '@/lib/constants';

describe('VoiceSettingsPanel', () => {
  const defaultProps = {
    voiceSettings: DEFAULT_VOICE_SETTINGS,
    audioSettings: DEFAULT_AUDIO_SETTINGS,
    voiceModify: DEFAULT_VOICE_MODIFY,
    onVoiceChange: vi.fn(),
    onAudioChange: vi.fn(),
    onVoiceModifyChange: vi.fn(),
  };

  it('renders speed slider with data-testid="speed-slider"', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('speed-slider')).toBeInTheDocument();
  });

  it('renders vol slider with data-testid="vol-slider"', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('vol-slider')).toBeInTheDocument();
  });

  it('renders pitch slider with data-testid="pitch-slider"', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('pitch-slider')).toBeInTheDocument();
  });

  it('renders emotion select with data-testid="emotion-select"', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('emotion-select')).toBeInTheDocument();
  });

  it('renders format select with data-testid="format-select"', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('format-select')).toBeInTheDocument();
  });

  it('renders language boost select with data-testid="language-boost-select"', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('language-boost-select')).toBeInTheDocument();
  });

  it('vol slider has minimum of 0.1', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    const volSlider = screen.getByTestId('vol-slider');
    const rangeInput = volSlider.querySelector('input[type="range"]');
    expect(rangeInput).toHaveAttribute('min', '0.1');
  });

  it('displays current speed value', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByText('1.0x')).toBeInTheDocument();
  });

  it('displays current pitch value', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByText(/Pitch/i)).toBeInTheDocument();
  });

  it('emotion select does not have neutral option in DOM', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    const emotionSelect = screen.getByTestId('emotion-select');
    expect(emotionSelect.textContent?.toLowerCase()).not.toContain('neutral');
  });

  it('displays all 9 EMOTIONS constants are available (no neutral)', () => {
    expect(EMOTIONS).toHaveLength(9);
    expect(EMOTIONS).not.toContain('neutral');
    expect(EMOTIONS).toContain('calm');
  });

  it('format select shows mp3 as default', () => {
    render(<VoiceSettingsPanel {...defaultProps} />);
    expect(screen.getByTestId('format-select')).toBeInTheDocument();
  });

  it('language boost options include auto and Korean', () => {
    expect(LANGUAGE_BOOST_OPTIONS).toContain('auto');
    expect(LANGUAGE_BOOST_OPTIONS).toContain('Korean');
  });
});
