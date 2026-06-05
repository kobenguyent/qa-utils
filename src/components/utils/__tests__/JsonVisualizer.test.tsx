import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { JsonVisualizer } from '../../utils/JsonVisualizer';

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'dark',
    setTheme: vi.fn(),
  }),
}));

// ─── Mocks ──────────────────────────────────────────────────────────────
// Mock the heavy ReactFlow visualizer; we test it separately
vi.mock('../../utils/JsonReactFlowVisualizer', () => ({
  JsonReactFlowVisualizer: ({
    graphResult,
    selectedNodeId,
    onSelectNode,
    height,
  }: {
    graphResult: { nodes: { id: string; label: string }[]; edges: { id: string }[] };
    selectedNodeId: string | null;
    onSelectNode: (id: string) => void;
    height?: string;
  }) => (
    <div data-testid="react-flow-visualizer">
      <span data-testid="node-count">{graphResult.nodes.length}</span>
      <span data-testid="edge-count">{graphResult.edges.length}</span>
      <span data-testid="selected-node">{selectedNodeId ?? 'none'}</span>
      <span data-testid="graph-height">{height ?? 'default'}</span>
      {graphResult.nodes.map((n) => (
        <button
          key={n.id}
          data-testid={`flow-node-${n.id}`}
          onClick={() => onSelectNode(n.id)}
        >
          {n.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock the node details component
vi.mock('../../utils/JsonRelationshipGraphCanvas', () => ({
  JsonGraphNodeDetails: ({
    node,
    compact,
  }: {
    node: { label: string; jsonPath: string; valueType: string; childCount: number; sampleValue?: string } | null;
    compact: boolean;
  }) => {
    if (!node) return null;
    return (
      <div data-testid="node-details" data-compact={compact}>
        <span data-testid="detail-label">{node.label}</span>
        <span data-testid="detail-path">{node.jsonPath}</span>
        <span data-testid="detail-type">{node.valueType}</span>
        <span data-testid="detail-children">{node.childCount}</span>
        {node.sampleValue !== undefined && (
          <span data-testid="detail-sample">{node.sampleValue}</span>
        )}
      </div>
    );
  },
}));

describe('JsonVisualizer component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ━━ Rendering ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('initial rendering', () => {
    it('renders the page header', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('JSON Visualizer')).toBeInTheDocument();
    });

    it('renders the JSON Input panel', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('JSON Input')).toBeInTheDocument();
    });

    it('renders the Relationship Graph panel', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('Relationship Graph')).toBeInTheDocument();
    });

    it('loads sample JSON by default', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      expect(textarea).toBeInTheDocument();
      expect((textarea as HTMLTextAreaElement).value).toContain('squadName');
    });

    it('lets the JSON input editor expand to the full sidebar body', () => {
      render(<JsonVisualizer />);

      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      const editorRegion = screen.getByTestId('json-visualizer-input-editor');

      expect(editorRegion).toHaveStyle({
        flex: '1 1 auto',
        minHeight: '0',
      });
      expect(textarea).toHaveStyle({
        height: '100%',
      });
    });

    it('keeps the standard graph width while making the graph taller', () => {
      render(<JsonVisualizer />);

      const inputColumn = screen.getByText('JSON Input').closest('.col-12');
      const graphColumn = screen.getByText('Relationship Graph').closest('.col-12');

      expect(inputColumn).toHaveClass('col-xl-3');
      expect(inputColumn).not.toHaveClass('col-xxl-2');
      expect(graphColumn).toHaveClass('col-xl-9');
      expect(graphColumn).not.toHaveClass('col-xxl-10');
      expect(screen.getByTestId('graph-height')).toHaveTextContent('min(60vh, 640px)');
    });

    it('renders graph from default sample JSON', () => {
      render(<JsonVisualizer />);
      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
    });

    it('shows valid badge for default sample JSON', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('✓ Valid')).toBeInTheDocument();
    });

    it('displays node and edge counts', () => {
      render(<JsonVisualizer />);
      // The badge showing "X nodes · Y edges"
      const badges = screen.getAllByText(/nodes · \d+ edges/);
      expect(badges.length).toBeGreaterThan(0);
    });

    it('does not render the old tips toolbar block', () => {
      render(<JsonVisualizer />);
      expect(
        screen.queryByText(/Drag the canvas background to pan, use Cmd\/Ctrl plus scroll to zoom/),
      ).not.toBeInTheDocument();
    });

    it('does not render the old sidebar inspector', () => {
      render(<JsonVisualizer />);

      expect(screen.queryByText('Inspector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('node-details')).not.toBeInTheDocument();
    });
  });

  // ━━ Action buttons ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('action buttons', () => {
    it('renders Parse JSON button', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('Parse JSON')).toBeInTheDocument();
    });

    it('renders Prettify button', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('Prettify')).toBeInTheDocument();
    });

    it('renders Import JSON button', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('Import JSON')).toBeInTheDocument();
    });

    it('renders Sample button', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('Sample')).toBeInTheDocument();
    });

    it('renders Clear button', () => {
      render(<JsonVisualizer />);
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  // ━━ Parse JSON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Parse JSON functionality', () => {
    it('parses valid JSON and renders graph', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '{"a":1,"b":2}' } });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
      expect(screen.queryByText(/Parse error/)).not.toBeInTheDocument();
    });

    it('shows parse error for invalid JSON', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '{ invalid json' } });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(screen.getByText(/Parse error:/)).toBeInTheDocument();
      expect(screen.queryByTestId('react-flow-visualizer')).not.toBeInTheDocument();
    });

    it('shows invalid badge for bad JSON', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '{ invalid }' } });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(screen.getByText('✗ Invalid')).toBeInTheDocument();
    });

    it('Parse JSON button is disabled when textarea is empty', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '' } });

      expect(screen.getByText('Parse JSON').closest('button')).toBeDisabled();
    });

    it('handles nested JSON correctly', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      const nestedJson = JSON.stringify({
        user: { name: 'John', address: { city: 'NYC' } },
      });
      fireEvent.change(textarea, { target: { value: nestedJson } });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
    });

    it('handles array JSON at root', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, {
        target: { value: '[{"id":1},{"id":2}]' },
      });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
    });
  });

  // ━━ Prettify ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Prettify functionality', () => {
    it('prettifies compact JSON', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '{"a":1,"b":2}' } });
      fireEvent.click(screen.getByText('Prettify'));

      const value = (textarea as HTMLTextAreaElement).value;
      expect(value).toContain('  "a": 1');
      expect(value).toContain('  "b": 2');
    });

    it('shows error when trying to prettify invalid JSON', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: 'not-json' } });
      fireEvent.click(screen.getByText('Prettify'));

      expect(screen.getByText(/Parse error:/)).toBeInTheDocument();
    });

    it('Prettify button is disabled when textarea is empty', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '' } });

      expect(screen.getByText('Prettify').closest('button')).toBeDisabled();
    });
  });

  // ━━ Import JSON ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Import JSON functionality', () => {
    it('imports a json file and auto-renders the graph', () => {
      render(<JsonVisualizer />);

      const fileInput = screen.getByLabelText('Import JSON file') as HTMLInputElement;
      const file = new File(['{"imported":true}'], 'data.json', { type: 'application/json' });
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: '{"imported":true}',
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as ProgressEvent<FileReader>);
        }
      });

      expect(mockFileReader.readAsText).toHaveBeenCalledWith(file);
      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
      expect((screen.getByPlaceholderText('Paste JSON to visualize...') as HTMLTextAreaElement).value).toBe('{"imported":true}');
      expect(screen.queryByText(/Parse error:/)).not.toBeInTheDocument();
    });

    it('shows a parse error when an imported file contains invalid JSON', () => {
      render(<JsonVisualizer />);

      const fileInput = screen.getByLabelText('Import JSON file') as HTMLInputElement;
      const file = new File(['{invalid'], 'broken.json', { type: 'application/json' });
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null as ((event: ProgressEvent<FileReader>) => void) | null,
        result: '{invalid',
      };

      vi.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as unknown as FileReader);

      fireEvent.change(fileInput, { target: { files: [file] } });

      act(() => {
        if (mockFileReader.onload) {
          mockFileReader.onload({ target: mockFileReader } as ProgressEvent<FileReader>);
        }
      });

      expect(screen.getByText(/Parse error:/)).toBeInTheDocument();
      expect(screen.queryByTestId('react-flow-visualizer')).not.toBeInTheDocument();
    });
  });

  // ━━ Clear ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Clear functionality', () => {
    it('clears textarea, graph, and errors', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');

      fireEvent.click(screen.getByText('Clear'));

      expect((textarea as HTMLTextAreaElement).value).toBe('');
      expect(screen.queryByTestId('react-flow-visualizer')).not.toBeInTheDocument();
      expect(screen.queryByText(/Parse error/)).not.toBeInTheDocument();
    });

    it('shows empty state message after clear', () => {
      render(<JsonVisualizer />);
      fireEvent.click(screen.getByText('Clear'));

      expect(
        screen.getByText('Paste JSON to see the relationship graph'),
      ).toBeInTheDocument();
    });
  });

  // ━━ Load Sample ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('Load Sample functionality', () => {
    it('reloads default sample JSON after clearing', () => {
      render(<JsonVisualizer />);
      fireEvent.click(screen.getByText('Clear'));
      fireEvent.click(screen.getByText('Sample'));

      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      expect((textarea as HTMLTextAreaElement).value).toContain('squadName');
      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
    });
  });

  // ━━ Node selection ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('node selection', () => {
    it('tracks the selected node when a graph node is clicked', () => {
      render(<JsonVisualizer />);

      fireEvent.click(screen.getByTestId('flow-node-$'));

      expect(screen.getByTestId('selected-node')).toHaveTextContent('$');
    });

    it('clears selected node on re-parse', () => {
      render(<JsonVisualizer />);
      fireEvent.click(screen.getByTestId('flow-node-$'));
      expect(screen.getByTestId('selected-node')).toHaveTextContent('$');

      fireEvent.click(screen.getByText('Parse JSON'));
      expect(screen.getByTestId('selected-node')).toHaveTextContent('none');
    });

    it('clears selected node on clear', () => {
      render(<JsonVisualizer />);
      fireEvent.click(screen.getByTestId('flow-node-$'));
      expect(screen.getByTestId('selected-node')).toHaveTextContent('$');

      fireEvent.click(screen.getByText('Clear'));
      expect(screen.queryByTestId('react-flow-visualizer')).not.toBeInTheDocument();
    });
  });

  // ━━ Error recovery ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('error recovery', () => {
    it('clears error when user starts typing after a parse error', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');

      // Trigger error
      fireEvent.change(textarea, { target: { value: 'bad json' } });
      fireEvent.click(screen.getByText('Parse JSON'));
      expect(screen.getByText(/Parse error:/)).toBeInTheDocument();

      // Start typing — error should clear
      fireEvent.change(textarea, { target: { value: 'ba' } });
      expect(screen.queryByText(/Parse error:/)).not.toBeInTheDocument();
    });

    it('recovers from error to valid state', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');

      // Enter invalid
      fireEvent.change(textarea, { target: { value: '{{invalid' } });
      fireEvent.click(screen.getByText('Parse JSON'));
      expect(screen.getByText(/Parse error:/)).toBeInTheDocument();

      // Enter valid
      fireEvent.change(textarea, { target: { value: '{"valid": true}' } });
      fireEvent.click(screen.getByText('Parse JSON'));
      expect(screen.queryByText(/Parse error:/)).not.toBeInTheDocument();
      expect(screen.getByTestId('react-flow-visualizer')).toBeInTheDocument();
    });
  });

  // ━━ Truncation warning ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('truncation warning', () => {
    it('shows truncation warning for very large JSON', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');

      // Create a structure that exceeds MAX_GRAPH_NODES (300)
      const huge = {
        items: Array.from({ length: 310 }, (_, i) => ({ id: i }))
      };

      fireEvent.change(textarea, { target: { value: JSON.stringify(huge) } });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(screen.getByText(/Graph truncated/i)).toBeInTheDocument();
    });
  });

  // ━━ Empty-state messages ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('empty-state messages', () => {
    it('shows "Paste JSON" message when input is empty and no graph', () => {
      render(<JsonVisualizer />);
      fireEvent.click(screen.getByText('Clear'));

      expect(
        screen.getByText('Paste JSON to see the relationship graph'),
      ).toBeInTheDocument();
    });

    it('shows "Fix JSON" message when input has invalid JSON', () => {
      render(<JsonVisualizer />);
      const textarea = screen.getByPlaceholderText('Paste JSON to visualize...');
      fireEvent.change(textarea, { target: { value: '{ broken' } });
      fireEvent.click(screen.getByText('Parse JSON'));

      expect(
        screen.getByText('Fix JSON to visualize the graph'),
      ).toBeInTheDocument();
    });
  });
});
