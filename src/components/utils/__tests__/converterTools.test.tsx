/**
 * Smoke tests for refactored converter/tool components.
 * These verify the new tool-header layout (icon + h1 title + description)
 * introduced in the UX/UI refactor and that core interactive elements render.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('../../CopyWithToast', () => ({ default: () => null }));
vi.mock('../../AIAssistButton', () => ({ AIAssistButton: () => null }));
vi.mock('../../AIConfigureHint', () => ({ AIConfigureHint: () => null }));

// ── HtmlRenderer ─────────────────────────────────────────────────────────────
import { HtmlRenderer } from '../HtmlRenderer';

describe('HtmlRenderer Component', () => {
  it('renders the heading and icon', () => {
    render(<HtmlRenderer />);
    expect(screen.getByRole('heading', { name: 'HTML Renderer' })).toBeInTheDocument();
    expect(screen.getByText('🌐')).toBeInTheDocument();
  });

  it('renders the HTML editor textarea', () => {
    render(<HtmlRenderer />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('renders Render and Clear buttons', () => {
    render(<HtmlRenderer />);
    expect(screen.getByRole('button', { name: /Render/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });
});

// ── JSONFormatter ─────────────────────────────────────────────────────────────
import { JSONFormatter } from '../JSONFormatter';

describe('JSONFormatter Component', () => {
  it('renders the heading and icon', () => {
    render(<JSONFormatter />);
    expect(screen.getByRole('heading', { name: 'JSON Formatter' })).toBeInTheDocument();
    expect(screen.getByText('﹛﹜')).toBeInTheDocument();
  });

  it('renders a textarea for JSON input', () => {
    render(<JSONFormatter />);
    expect(screen.getByPlaceholderText(/Paste your JSON here/i)).toBeInTheDocument();
  });
});

// ── JWTDebugger ───────────────────────────────────────────────────────────────
import { JWTDebugger } from '../JWTDebugger';

describe('JWTDebugger Component', () => {
  it('renders the heading and icon', () => {
    render(<JWTDebugger />);
    expect(screen.getByRole('heading', { name: 'JWT Debugger' })).toBeInTheDocument();
    expect(screen.getByText('🔑')).toBeInTheDocument();
  });
});

// ── SqlGenerator ──────────────────────────────────────────────────────────────
import { SqlGenerator } from '../SqlGenerator';

describe('SqlGenerator Component', () => {
  it('renders the heading and icon', () => {
    render(<SqlGenerator />);
    expect(screen.getByRole('heading', { name: 'SQL Command Generator' })).toBeInTheDocument();
    expect(screen.getByText('🗄️')).toBeInTheDocument();
  });

  it('renders Generate SQL and Clear buttons', () => {
    render(<SqlGenerator />);
    expect(screen.getByRole('button', { name: /Generate SQL/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Clear/i })).toBeInTheDocument();
  });
});

// ── UnixTimestamp ─────────────────────────────────────────────────────────────
import { UnixTimestamp } from '../UnixTimestamp';

describe('UnixTimestamp Component', () => {
  it('renders the heading and icon', () => {
    render(<UnixTimestamp />);
    expect(screen.getByRole('heading', { name: 'Unix Timestamp Converter' })).toBeInTheDocument();
    expect(screen.getByText('⏰')).toBeInTheDocument();
  });

  it('renders the timestamp input', () => {
    render(<UnixTimestamp />);
    expect(screen.getByPlaceholderText(/e\.g\. 1700000000/i)).toBeInTheDocument();
  });
});
