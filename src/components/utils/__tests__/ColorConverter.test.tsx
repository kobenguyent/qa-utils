import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../ColorConverter';

describe('ColorConverter Component', () => {
  it('renders without crashing', () => {
    render(<ColorConverter />);
    expect(screen.getByText('🎨 Color Converter')).toBeInTheDocument();
  });

  it('renders all tabs', () => {
    render(<ColorConverter />);
    expect(screen.getByText('Color Converter')).toBeInTheDocument();
    expect(screen.getByText('Color Palettes')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  it('renders color format inputs', () => {
    render(<ColorConverter />);
    expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument();
    expect(screen.getByDisplayValue('255')).toBeInTheDocument(); // RGB R value
  });
});
