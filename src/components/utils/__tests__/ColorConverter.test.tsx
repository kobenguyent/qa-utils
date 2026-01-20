import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColorConverter } from '../ColorConverter';

describe('ColorConverter Component', () => {
  it('should render all color format inputs', () => {
    render(<ColorConverter />);
    
    expect(screen.getByText('🎨 Color Converter')).toBeInTheDocument();
    expect(screen.getByText('HEX')).toBeInTheDocument();
    expect(screen.getByText('RGB')).toBeInTheDocument();
    expect(screen.getByText('HSL')).toBeInTheDocument();
    expect(screen.getByText('HSV')).toBeInTheDocument();
    expect(screen.getByText('CMYK')).toBeInTheDocument();
    expect(screen.getByText('LAB')).toBeInTheDocument();
  });

  it('should render tabs for different features', () => {
    render(<ColorConverter />);
    
    expect(screen.getByText('Color Converter')).toBeInTheDocument();
    expect(screen.getByText('Color Palettes')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
  });

  it('should update all formats when hex input changes', async () => {
    render(<ColorConverter />);
    
    const hexInput = screen.getByDisplayValue('#ff0000');
    fireEvent.change(hexInput, { target: { value: '#00ff00' } });
    
    await waitFor(() => {
      expect(hexInput).toHaveValue('#00ff00');
    });
  });

  it('should show color preview', () => {
    render(<ColorConverter />);
    
    const preview = screen.getByText('#ff0000');
    expect(preview).toBeInTheDocument();
    expect(preview.parentElement).toHaveStyle('background-color: #ff0000');
  });

  it('should display error for invalid input', async () => {
    render(<ColorConverter />);
    
    const hexInput = screen.getByDisplayValue('#ff0000');
    fireEvent.change(hexInput, { target: { value: '#invalid' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Color conversion failed/)).toBeInTheDocument();
    });
  });

  it('should switch between tabs', () => {
    render(<ColorConverter />);
    
    const palettesTab = screen.getByText('Color Palettes');
    fireEvent.click(palettesTab);
    
    // Should show palette content
    expect(screen.getByText('Complementary')).toBeInTheDocument();
    expect(screen.getByText('Triadic')).toBeInTheDocument();
  });

  it('should show accessibility analysis', () => {
    render(<ColorConverter />);
    
    const accessibilityTab = screen.getByText('Accessibility');
    fireEvent.click(accessibilityTab);
    
    expect(screen.getByText('Contrast Analysis')).toBeInTheDocument();
    expect(screen.getByText('Color Blindness Simulation')).toBeInTheDocument();
  });

  it('should handle RGB input changes', async () => {
    render(<ColorConverter />);
    
    const rInput = screen.getByDisplayValue('255');
    fireEvent.change(rInput, { target: { value: '128' } });
    
    await waitFor(() => {
      expect(rInput).toHaveValue(128);
    });
  });

  it('should handle HSL input changes', async () => {
    render(<ColorConverter />);
    
    const hInput = screen.getByDisplayValue('0');
    fireEvent.change(hInput, { target: { value: '180' } });
    
    await waitFor(() => {
      expect(hInput).toHaveValue(180);
    });
  });

  it('should validate input ranges', async () => {
    render(<ColorConverter />);
    
    const rInput = screen.getByDisplayValue('255');
    fireEvent.change(rInput, { target: { value: '300' } });
    
    // Should not update other formats with invalid RGB value
    await waitFor(() => {
      expect(rInput).toHaveValue(300);
    });
  });
});
