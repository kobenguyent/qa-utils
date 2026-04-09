import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyPalace } from '../MyPalace';

// Mock palaceStorage
vi.mock('../../../utils/palaceStorage', () => ({
  loadAnchors: vi.fn(() => []),
  removeAnchor: vi.fn(() => []),
  addAnchor: vi.fn(() => []),
  ROOM_OPTIONS: [
    { icon: '⚗️', name: 'Generator Lab' },
    { icon: '🔄', name: 'Converter Sanctum' },
  ],
}));

describe('MyPalace', () => {
  it('renders the title', () => {
    render(<MyPalace />);
    expect(screen.getByText(/My Palace/)).toBeDefined();
  });

  it('shows empty state when no anchors', () => {
    render(<MyPalace />);
    expect(screen.getByText(/Your palace is empty/)).toBeDefined();
  });

  it('shows Pin a Tool button', () => {
    render(<MyPalace />);
    // The button renders with aria-label "Add tool to palace"
    expect(screen.getByRole('button', { name: /Add tool to palace/i })).toBeDefined();
  });

  it('opens add modal when Pin a Tool clicked', () => {
    render(<MyPalace />);
    // The button label is "Add tool to palace" from aria-label
    const btn = screen.getByRole('button', { name: /Add tool to palace/i });
    expect(btn).toBeDefined();
    fireEvent.click(btn);
    expect(screen.getByText(/Pin a Tool to Your Palace/)).toBeDefined();
  });
});
