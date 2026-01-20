import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FileProcessor from '../FileProcessor';

describe('FileProcessor Component', () => {
  it('renders file processor interface', () => {
    render(<FileProcessor />);
    
    expect(screen.getByText('📁 File Processor')).toBeInTheDocument();
    expect(screen.getByText('Professional file processing with batch operations, smart optimization, and browser storage.')).toBeInTheDocument();
    expect(screen.getByText('Select Files')).toBeInTheDocument();
  });

  it('shows batch upload interface', () => {
    render(<FileProcessor />);
    
    expect(screen.getByText('Batch Upload')).toBeInTheDocument();
    expect(screen.getByText('Select multiple files for batch processing')).toBeInTheDocument();
  });

  it('has process button initially disabled', () => {
    render(<FileProcessor />);
    
    const processButton = screen.getByRole('button', { name: 'Process 0 Files' });
    expect(processButton).toBeDisabled();
  });
});
