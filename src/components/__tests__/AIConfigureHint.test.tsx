import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AIConfigureHint } from '../AIConfigureHint';

describe('AIConfigureHint', () => {
  it('renders the configure hint text', () => {
    render(<AIConfigureHint />);
    expect(screen.getByText(/AI features available/)).toBeInTheDocument();
  });

  it('contains link to Kobean Assistant', () => {
    render(<AIConfigureHint />);
    const link = screen.getByText(/Configure AI provider in Kobean Assistant/);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#/kobean');
  });

  it('applies custom className', () => {
    const { container } = render(<AIConfigureHint className="mt-3" />);
    expect(container.firstChild).toHaveClass('mt-3');
  });
});
