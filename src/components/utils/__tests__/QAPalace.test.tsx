import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QAPalace } from '../QAPalace';

// Mock palaceStorage
vi.mock('../../../utils/palaceStorage', () => ({
  isAnchored: vi.fn(() => false),
  addAnchor: vi.fn(() => []),
  removeAnchor: vi.fn(() => []),
  ROOM_OPTIONS: [{ icon: '⚗️', name: 'Generator Lab' }],
}));

// Mock VoicePalaceWalk to avoid SpeechRecognition issues in test env
vi.mock('../VoicePalaceWalk', () => ({
  VoicePalaceWalk: () => <div data-testid="voice-palace-walk" />,
}));

describe('QAPalace', () => {
  it('renders the palace title', () => {
    render(<QAPalace />);
    expect(screen.getByText(/The QA Palace/)).toBeDefined();
  });

  it('renders My Palace link', () => {
    render(<QAPalace />);
    // Button with href renders as anchor — check for text content
    expect(screen.getByText(/My Palace/)).toBeDefined();
  });

  it('renders voice palace walk widget', () => {
    render(<QAPalace />);
    expect(screen.getByTestId('voice-palace-walk')).toBeDefined();
  });
});
