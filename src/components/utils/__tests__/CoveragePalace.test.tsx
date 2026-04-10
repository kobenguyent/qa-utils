import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoveragePalace } from '../CoveragePalace';

describe('CoveragePalace', () => {
  it('renders the title', () => {
    render(<CoveragePalace />);
    expect(screen.getByText(/Coverage Palace/)).toBeDefined();
  });

  it('renders all 8 test layers', () => {
    render(<CoveragePalace />);
    expect(screen.getByText('Unit Tests')).toBeDefined();
    expect(screen.getByText('Integration Tests')).toBeDefined();
    expect(screen.getByText('End-to-End Tests')).toBeDefined();
    expect(screen.getByText('Accessibility Tests')).toBeDefined();
    expect(screen.getByText('Security Tests')).toBeDefined();
    expect(screen.getByText('Performance Tests')).toBeDefined();
    expect(screen.getByText('API Tests')).toBeDefined();
    expect(screen.getByText('Smoke Tests')).toBeDefined();
  });

  it('shows overall coverage progress bar', () => {
    render(<CoveragePalace />);
    expect(screen.getByText(/Overall Palace Coverage/)).toBeDefined();
  });

  it('sliders update coverage display', () => {
    render(<CoveragePalace />);
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBeGreaterThan(0);
    fireEvent.change(sliders[0], { target: { value: '80' } });
    expect(screen.getAllByText('80%').length).toBeGreaterThan(0);
  });
});
