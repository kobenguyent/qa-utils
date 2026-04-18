import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../ColorConverter';

describe('ColorConverter Component', () => {
  it('renders without crashing', () => {
    render(<ColorConverter />);
    // The tool-header structure has the icon in a sibling div and the title in h1
    expect(screen.getByRole('heading', { name: 'Color Converter' })).toBeInTheDocument();
    expect(screen.getByText('🎨')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<ColorConverter />);
    // Use tab role to avoid ambiguity with the h1 heading also named "Color Converter"
    expect(screen.getByRole('tab', { name: 'Color Converter' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Color Palettes' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Accessibility' })).toBeInTheDocument();
  });

  it('renders color format inputs', () => {
    render(<ColorConverter />);
    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('255')).toBeInTheDocument(); // RGB R value
  });
});
