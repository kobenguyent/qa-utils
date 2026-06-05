import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  JsonGraphNodeDetails,
  JsonRelationshipGraphCanvas,
} from '../../utils/JsonRelationshipGraphCanvas';
import { buildJsonGraphLayout } from '../../utils/JsonRelationshipGraphCanvas.utils';
import { buildJsonRelationshipGraph } from '../../../utils/jsonRelationshipGraph';

// ─── Mock react-zoom-pan-pinch ─────────────────────────────────────────
vi.mock('react-zoom-pan-pinch', () => ({
  TransformWrapper: ({ children }: { children: React.ReactNode | ((...args: unknown[]) => React.ReactNode) }) => (
    <div data-testid="zoom-wrapper">
      {typeof children === 'function'
        ? children({
            zoomIn: vi.fn(),
            zoomOut: vi.fn(),
            resetTransform: vi.fn(),
            centerView: vi.fn(),
          })
        : children}
    </div>
  ),
  TransformComponent: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="zoom-component">{children}</div>
  ),
}));

// ─── JsonGraphNodeDetails ──────────────────────────────────────────────
describe('JsonGraphNodeDetails', () => {
  it('renders prompt text when node is null', () => {
    render(<JsonGraphNodeDetails node={null} />);
    expect(
      screen.getByText(/Select a node to inspect/i),
    ).toBeInTheDocument();
  });

  it('renders node details when a node is provided', () => {
    const node = {
      id: '$.user.name',
      label: 'name',
      jsonPath: '$.user.name',
      depth: 2,
      valueType: 'string' as const,
      parentId: '$.user',
      childCount: 0,
      sampleValue: 'Alice',
    };
    render(<JsonGraphNodeDetails node={node} />);

    expect(screen.getByText('Node Details')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('$.user.name')).toBeInTheDocument();
    expect(screen.getByText('string')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument(); // childCount
    expect(screen.queryByText('Sample')).not.toBeInTheDocument();
  });

  it('renders node details without sample when sampleValue is undefined', () => {
    const node = {
      id: '$.data',
      label: 'data',
      jsonPath: '$.data',
      depth: 1,
      valueType: 'object' as const,
      parentId: '$',
      childCount: 3,
    };
    render(<JsonGraphNodeDetails node={node} />);

    expect(screen.getByText('data')).toBeInTheDocument();
    expect(screen.getByText('object')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.queryByText('Sample')).not.toBeInTheDocument();
  });

  it('renders in compact mode', () => {
    const node = {
      id: '$',
      label: 'root',
      jsonPath: '$',
      depth: 0,
      valueType: 'object' as const,
      childCount: 2,
    };
    const { container } = render(<JsonGraphNodeDetails node={node} compact />);
    // Compact mode uses smaller padding/font; just check it renders
    expect(container.querySelector('div')).toBeInTheDocument();
    expect(screen.getByText('root')).toBeInTheDocument();
  });

  it('renders all expected detail rows', () => {
    const node = {
      id: '$.items[]',
      label: 'items[]',
      jsonPath: '$.items[]',
      depth: 1,
      valueType: 'array' as const,
      parentId: '$',
      childCount: 5,
      sampleValue: undefined,
    };
    render(<JsonGraphNodeDetails node={node} />);

    expect(screen.getByText('Label')).toBeInTheDocument();
    expect(screen.getByText('JSON Path')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('Children')).toBeInTheDocument();
  });
});

// ─── buildJsonGraphLayout ──────────────────────────────────────────────
describe('buildJsonGraphLayout', () => {
  const simpleGraph = buildJsonRelationshipGraph({ a: 1, b: { c: 2 } });

  it('creates positions for all nodes', () => {
    const layout = buildJsonGraphLayout(simpleGraph);
    for (const node of simpleGraph.nodes) {
      expect(layout.positions.has(node.id)).toBe(true);
    }
  });

  it('has positive width and height', () => {
    const layout = buildJsonGraphLayout(simpleGraph);
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it('places root node at depth 0 (lowest y)', () => {
    const layout = buildJsonGraphLayout(simpleGraph);
    const rootPos = layout.positions.get('$')!;
    for (const [id, pos] of layout.positions.entries()) {
      if (id !== '$') {
        expect(pos.y).toBeGreaterThanOrEqual(rootPos.y);
      }
    }
  });

  it('places deeper nodes at higher y values', () => {
    const layout = buildJsonGraphLayout(simpleGraph);
    const depth0 = layout.positions.get('$')!;
    const depth1 = layout.positions.get('$.b')!;
    expect(depth1.y).toBeGreaterThan(depth0.y);
  });

  it('has correct nodeWidth and nodeHeight', () => {
    const layout = buildJsonGraphLayout(simpleGraph);
    expect(layout.nodeWidth).toBe(166);
    expect(layout.nodeHeight).toBe(52);
  });

  it('handles single-node graph', () => {
    const singleNode = buildJsonRelationshipGraph(42);
    const layout = buildJsonGraphLayout(singleNode);
    expect(layout.positions.size).toBe(1);
    expect(layout.width).toBeGreaterThanOrEqual(420);
    expect(layout.height).toBeGreaterThanOrEqual(380);
  });
});

// ─── JsonRelationshipGraphCanvas (integration with mock zoom) ──────────
describe('JsonRelationshipGraphCanvas', () => {
  const graphResult = buildJsonRelationshipGraph({
    name: 'Test',
    items: [{ id: 1 }],
  });

  it('renders the graph with SVG', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
      />,
    );

    expect(screen.getByRole('img', { name: /JSON relationship graph/i })).toBeInTheDocument();
  });

  it('renders zoom controls (Fit, Reset, +, -)', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
      />,
    );

    expect(screen.getByTitle('Zoom in')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom out')).toBeInTheDocument();
    expect(screen.getByText('Fit')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('renders all graph nodes as clickable buttons', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
      />,
    );

    for (const node of graphResult.nodes) {
      expect(
        screen.getByLabelText(new RegExp(`Select graph node ${node.label.split('\n')[0]}`)),
      ).toBeInTheDocument();
    }
  });

  it('calls onSelectNode when a node is clicked', () => {
    const onSelect = vi.fn();
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={onSelect}
      />,
    );

    fireEvent.click(screen.getByLabelText(/Select graph node root/));
    expect(onSelect).toHaveBeenCalledWith('$');
  });

  it('renders with the expanded prop', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
        expanded
      />,
    );

    expect(screen.getByTestId('json-relationship-graph-modal')).toBeInTheDocument();
  });

  it('renders with non-expanded prop (default)', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
      />,
    );

    expect(screen.getByTestId('json-relationship-graph')).toBeInTheDocument();
  });

  it('renders the "Open larger graph" button when not expanded and onOpenLarge is provided', () => {
    const onOpen = vi.fn();
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
        onOpenLarge={onOpen}
      />,
    );

    const btn = screen.getByLabelText('Open larger key relationship graph');
    expect(btn).toBeInTheDocument();
    fireEvent.click(btn);
    expect(onOpen).toHaveBeenCalled();
  });

  it('does not render the "Open larger graph" button when expanded', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
        expanded
        onOpenLarge={vi.fn()}
      />,
    );

    expect(
      screen.queryByLabelText('Open larger key relationship graph'),
    ).not.toBeInTheDocument();
  });

  it('shows pan/zoom help text', () => {
    render(
      <JsonRelationshipGraphCanvas
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={vi.fn()}
      />,
    );

    expect(screen.getByText(/Pan with drag/i)).toBeInTheDocument();
  });
});
