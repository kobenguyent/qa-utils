import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WebsiteScanner } from '../WebsiteScanner';

describe('WebsiteScanner Component', () => {
  it('renders without crashing', () => {
    render(<WebsiteScanner />);
    expect(screen.getByText('🔍 Website Scanner')).toBeInTheDocument();
  });

  it('renders scan configuration form', () => {
    render(<WebsiteScanner />);
    expect(screen.getByText('Scan Configuration')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('Start Scan')).toBeInTheDocument();
  });

  it('renders quality check options', () => {
    render(<WebsiteScanner />);
    expect(screen.getByText('Broken Links')).toBeInTheDocument();
    expect(screen.getByText('Accessibility')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('SEO')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
  });
});
