import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import React from 'react';
import { ThemeProvider, useTheme } from '../../contexts/ThemeContext';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal consumer that displays the current theme and a button to change it. */
const ThemeConsumer: React.FC<{ newTheme?: 'light' | 'dark' | 'auto' }> = ({
  newTheme = 'dark',
}) => {
  const { theme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button onClick={() => setTheme(newTheme)}>Change</button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    vi.restoreAllMocks();
  });

  it('provides the default "auto" theme when nothing is stored', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('auto');
  });

  it('reads the stored theme from localStorage on mount', () => {
    localStorage.setItem('qa-utils-theme', 'dark');
    render(
      <ThemeProvider>
        <ThemeConsumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
  });

  it('updates the theme state when setTheme is called', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer newTheme="light" />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('theme-value').textContent).toBe('auto');

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    });

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });

  it('persists the theme to localStorage when setTheme is called', () => {
    render(
      <ThemeProvider>
        <ThemeConsumer newTheme="dark" />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    });

    expect(localStorage.getItem('qa-utils-theme')).toBe('dark');
  });

  it('applies the theme to the document element', async () => {
    render(
      <ThemeProvider>
        <ThemeConsumer newTheme="light" />
      </ThemeProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    });

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});

describe('useTheme outside ThemeProvider', () => {
  it('throws an error when used outside ThemeProvider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const BrokenConsumer = () => {
      useTheme();
      return null;
    };

    expect(() => render(<BrokenConsumer />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    );

    consoleError.mockRestore();
  });
});
