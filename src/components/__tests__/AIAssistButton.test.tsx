import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIAssistButton } from '../AIAssistButton';

describe('AIAssistButton', () => {
  const defaultProps = {
    label: 'Test AI',
    onClick: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with label', () => {
    render(<AIAssistButton {...defaultProps} />);
    expect(screen.getByRole('button')).toHaveTextContent('🤖 Test AI');
  });

  it('calls onClick when clicked', () => {
    render(<AIAssistButton {...defaultProps} />);
    fireEvent.click(screen.getByRole('button'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<AIAssistButton {...defaultProps} isLoading={true} />);
    expect(screen.getByRole('button')).toHaveTextContent('Processing...');
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<AIAssistButton {...defaultProps} disabled={true} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('displays error message', () => {
    render(<AIAssistButton {...defaultProps} error="Something went wrong" />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('displays result text', () => {
    render(<AIAssistButton {...defaultProps} result="AI response text" />);
    expect(screen.getByText('AI response text')).toBeInTheDocument();
  });

  it('calls onClear when error is dismissed', () => {
    const onClear = vi.fn();
    render(<AIAssistButton {...defaultProps} error="Error" onClear={onClear} />);
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('does not render error or result when not provided', () => {
    const { container } = render(<AIAssistButton {...defaultProps} />);
    expect(container.querySelectorAll('.alert')).toHaveLength(0);
  });

  it('applies custom className', () => {
    const { container } = render(<AIAssistButton {...defaultProps} className="mt-3" />);
    expect(container.firstChild).toHaveClass('mt-3');
  });

  it('applies custom variant and size', () => {
    render(<AIAssistButton {...defaultProps} variant="primary" size="lg" />);
    const btn = screen.getByRole('button');
    expect(btn).toHaveClass('btn-primary');
    expect(btn).toHaveClass('btn-lg');
  });
});
