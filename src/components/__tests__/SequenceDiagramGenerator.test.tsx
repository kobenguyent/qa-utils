import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SequenceDiagramGenerator } from '../../components/utils/SequenceDiagramGenerator';

// Mock mermaid
vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: '<svg>mock diagram</svg>' }),
  },
}));

describe('SequenceDiagramGenerator Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the component with title', () => {
    render(<SequenceDiagramGenerator />);
    expect(screen.getByText(/Sequence Diagram Generator/)).toBeInTheDocument();
  });

  it('renders framework selection badges', () => {
    render(<SequenceDiagramGenerator />);
    expect(screen.getByLabelText('Select Playwright framework')).toBeInTheDocument();
    expect(screen.getByLabelText('Select CodeceptJS framework')).toBeInTheDocument();
  });

  it('renders generate, sample, and clear buttons', () => {
    render(<SequenceDiagramGenerator />);
    expect(screen.getByLabelText('Generate diagram')).toBeInTheDocument();
    expect(screen.getByLabelText('Load sample code')).toBeInTheDocument();
    expect(screen.getByLabelText('Clear all')).toBeInTheDocument();
  });

  it('renders textarea for code input', () => {
    render(<SequenceDiagramGenerator />);
    expect(screen.getByLabelText('Test code input')).toBeInTheDocument();
  });

  it('shows placeholder text when no diagram generated', () => {
    render(<SequenceDiagramGenerator />);
    expect(screen.getByText(/Your sequence diagram will appear here/)).toBeInTheDocument();
  });

  it('shows error when generating with empty code', async () => {
    render(<SequenceDiagramGenerator />);
    fireEvent.click(screen.getByLabelText('Generate diagram'));
    await waitFor(() => {
      expect(screen.getByText(/Please enter test code/)).toBeInTheDocument();
    });
  });

  it('loads sample Playwright code when clicking Load Sample', () => {
    render(<SequenceDiagramGenerator />);
    fireEvent.click(screen.getByLabelText('Load sample code'));
    const textarea = screen.getByLabelText('Test code input') as HTMLTextAreaElement;
    expect(textarea.value).toContain('page.goto');
  });

  it('loads sample CodeceptJS code when CodeceptJS is selected', () => {
    render(<SequenceDiagramGenerator />);
    fireEvent.click(screen.getByLabelText('Select CodeceptJS framework'));
    fireEvent.click(screen.getByLabelText('Load sample code'));
    const textarea = screen.getByLabelText('Test code input') as HTMLTextAreaElement;
    expect(textarea.value).toContain('I.amOnPage');
  });

  it('clears all state when clicking Clear', async () => {
    render(<SequenceDiagramGenerator />);
    // Load sample first
    fireEvent.click(screen.getByLabelText('Load sample code'));
    const textarea = screen.getByLabelText('Test code input') as HTMLTextAreaElement;
    expect(textarea.value).not.toBe('');

    // Clear
    fireEvent.click(screen.getByLabelText('Clear all'));
    expect(textarea.value).toBe('');
  });

  it('generates diagram from Playwright code', async () => {
    render(<SequenceDiagramGenerator />);
    const textarea = screen.getByLabelText('Test code input');
    fireEvent.change(textarea, {
      target: { value: `await page.goto('https://example.com');\nawait page.click('#btn');` }
    });
    fireEvent.click(screen.getByLabelText('Generate diagram'));

    await waitFor(() => {
      expect(screen.getByText('Mermaid Syntax')).toBeInTheDocument();
    });
  });

  it('generates diagram from CodeceptJS code', async () => {
    render(<SequenceDiagramGenerator />);
    fireEvent.click(screen.getByLabelText('Select CodeceptJS framework'));
    const textarea = screen.getByLabelText('Test code input');
    fireEvent.change(textarea, {
      target: { value: `I.amOnPage('/login');\nI.click('Submit');` }
    });
    fireEvent.click(screen.getByLabelText('Generate diagram'));

    await waitFor(() => {
      expect(screen.getByText('Mermaid Syntax')).toBeInTheDocument();
    });
  });

  it('shows error for unrecognizable code', async () => {
    render(<SequenceDiagramGenerator />);
    const textarea = screen.getByLabelText('Test code input');
    fireEvent.change(textarea, {
      target: { value: 'const x = 42;' }
    });
    fireEvent.click(screen.getByLabelText('Generate diagram'));

    await waitFor(() => {
      expect(screen.getByText(/No test steps could be parsed/)).toBeInTheDocument();
    });
  });

  it('switches framework with badge clicks', () => {
    render(<SequenceDiagramGenerator />);
    const codeceptBadge = screen.getByLabelText('Select CodeceptJS framework');
    fireEvent.click(codeceptBadge);
    const textarea = screen.getByLabelText('Test code input') as HTMLTextAreaElement;
    expect(textarea.placeholder).toContain('CodeceptJS');

    const playwrightBadge = screen.getByLabelText('Select Playwright framework');
    fireEvent.click(playwrightBadge);
    expect(textarea.placeholder).toContain('Playwright');
  });

  it('allows typing in the textarea', () => {
    render(<SequenceDiagramGenerator />);
    const textarea = screen.getByLabelText('Test code input') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'test code here' } });
    expect(textarea.value).toBe('test code here');
  });
});
