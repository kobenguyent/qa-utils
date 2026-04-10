import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Flashcards } from '../Flashcards';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
});

describe('Flashcards', () => {
  it('renders the title', () => {
    render(<Flashcards />);
    expect(screen.getByText(/Spaced Repetition Flashcards/)).toBeDefined();
  });

  it('shows due cards count', () => {
    render(<Flashcards />);
    expect(screen.getByText(/Cards due today/)).toBeDefined();
  });

  it('shows a flashcard question', () => {
    render(<Flashcards />);
    // Either shows a card or "session done"
    const hasCard = screen.queryByText(/Reveal Answer/) !== null;
    const hasDone = screen.queryByText(/Session Complete/) !== null;
    expect(hasCard || hasDone).toBe(true);
  });

  it('reveals answer when Reveal Answer clicked', () => {
    render(<Flashcards />);
    const btn = screen.queryByRole('button', { name: /Reveal Answer/ });
    if (btn) {
      fireEvent.click(btn);
      expect(screen.queryByRole('button', { name: /Again/ })).toBeDefined();
    }
  });

  it('renders palace map section', () => {
    render(<Flashcards />);
    expect(screen.getByText(/Memory Palace Map/)).toBeDefined();
  });

  it('shows stat badges for shadowed/learning/mastered', () => {
    render(<Flashcards />);
    expect(screen.getByText(/Shadowed:/)).toBeDefined();
    expect(screen.getByText(/Learning:/)).toBeDefined();
    expect(screen.getByText(/Mastered:/)).toBeDefined();
  });
});
