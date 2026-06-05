import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { JsonReactFlowVisualizer } from '../JsonReactFlowVisualizer';
import { createFlowLayout } from '../JsonReactFlowVisualizer.utils';
import type { JsonGraphBuildResult } from '../../../utils/jsonRelationshipGraph';

const reactFlowSpy = vi.fn();
const mockSetCenter = vi.fn();
const mockRequestFullscreen = vi.fn();
const mockExitFullscreen = vi.fn();
const forcedReactFlowSelectedIds = new Set<string>();
const themeState = {
  theme: 'dark' as 'light' | 'dark' | 'auto',
};

vi.mock('@xyflow/react', () => ({
  Background: () => <div data-testid="flow-background" />,
  BackgroundVariant: { Dots: 'dots' },
  Controls: () => <div data-testid="flow-controls" />,
  Handle: () => <div data-testid="flow-handle" />,
  MarkerType: { ArrowClosed: 'arrowclosed' },
  Position: { Top: 'top', Bottom: 'bottom' },
  SelectionMode: { Partial: 'partial' },
  ReactFlowProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ReactFlow: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => {
    reactFlowSpy(props);
    const nodes = (props.nodes as Array<{ id: string; type?: string; data: unknown; selected?: boolean }>) ?? [];
    const nodeTypes = (props.nodeTypes as Record<string, React.ComponentType<{ data: unknown; selected?: boolean }>>) ?? {};

    return (
      <div data-testid="react-flow">
        {nodes.map((node) => {
          const nodeType = node.type ?? 'default';
          const NodeComponent = nodeTypes[nodeType];

          return NodeComponent ? (
            <NodeComponent
              key={node.id}
              data={node.data}
              selected={node.selected || forcedReactFlowSelectedIds.has(node.id)}
            />
          ) : null;
        })}
        {children}
      </div>
    );
  },
}));

vi.mock('../../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: themeState.theme,
    setTheme: vi.fn(),
  }),
}));

const graphResult: JsonGraphBuildResult = {
  nodes: [
    {
      id: '$',
      label: 'root\nhomeTown: Metro City\nformed: 2016\nactive: true',
      jsonPath: '$',
      depth: 0,
      valueType: 'object',
      childCount: 1,
    },
  ],
  edges: [],
  stats: {
    totalNodes: 1,
    totalEdges: 0,
    maxDepth: 0,
  },
  truncated: false,
};

const nestedGraphResult: JsonGraphBuildResult = {
  nodes: [
    {
      id: '$',
      label: 'root',
      jsonPath: '$',
      depth: 0,
      valueType: 'object',
      childCount: 1,
    },
    {
      id: '$.members',
      label: 'members',
      jsonPath: '$.members',
      depth: 1,
      valueType: 'array',
      parentId: '$',
      childCount: 0,
    },
  ],
  edges: [
    {
      id: '$->$.members',
      from: '$',
      to: '$.members',
      relation: 'contains',
    },
  ],
  stats: {
    totalNodes: 2,
    totalEdges: 1,
    maxDepth: 1,
  },
  truncated: false,
};

const siblingGraphResult: JsonGraphBuildResult = {
  nodes: [
    {
      id: '$.members',
      label: 'members',
      jsonPath: '$.members',
      depth: 1,
      valueType: 'array',
      childCount: 2,
    },
    {
      id: '$.members[0]',
      label: '0\nage: 29\nname: Molecule Man',
      jsonPath: '$.members[0]',
      depth: 2,
      valueType: 'object',
      parentId: '$.members',
      childCount: 1,
    },
    {
      id: '$.members[1]',
      label: '1\nage: 39\nname: Madame Uppercut',
      jsonPath: '$.members[1]',
      depth: 2,
      valueType: 'object',
      parentId: '$.members',
      childCount: 1,
    },
  ],
  edges: [
    {
      id: '$.members->$.members[0]',
      from: '$.members',
      to: '$.members[0]',
      relation: 'contains',
    },
    {
      id: '$.members->$.members[1]',
      from: '$.members',
      to: '$.members[1]',
      relation: 'contains',
    },
  ],
  stats: {
    totalNodes: 3,
    totalEdges: 2,
    maxDepth: 2,
  },
  truncated: false,
};

const indexedGraphResult: JsonGraphBuildResult = {
  nodes: [
    {
      id: '$.members[0]',
      label: '0\nage: 29\nname: Molecule Man',
      jsonPath: '$.members[0]',
      depth: 2,
      valueType: 'object',
      parentId: '$.members',
      childCount: 1,
    },
  ],
  edges: [],
  stats: {
    totalNodes: 1,
    totalEdges: 0,
    maxDepth: 2,
  },
  truncated: false,
};

const arrayGraphResult: JsonGraphBuildResult = {
  nodes: [
    {
      id: '$.members[0].powers',
      label: 'powers',
      jsonPath: '$.members[0].powers',
      depth: 3,
      valueType: 'array',
      parentId: '$.members[0]',
      childCount: 3,
    },
  ],
  edges: [],
  stats: {
    totalNodes: 1,
    totalEdges: 0,
    maxDepth: 3,
  },
  truncated: false,
};

describe('JsonReactFlowVisualizer', () => {
  beforeEach(() => {
    reactFlowSpy.mockClear();
    mockSetCenter.mockClear();
    mockRequestFullscreen.mockReset();
    mockExitFullscreen.mockReset();
    forcedReactFlowSelectedIds.clear();
    themeState.theme = 'dark';
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: null,
    });
    Object.defineProperty(document, 'exitFullscreen', {
      configurable: true,
      value: mockExitFullscreen,
    });
    Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
      configurable: true,
      value: mockRequestFullscreen,
    });
  });

  it('passes dark color mode to React Flow when the app theme is dark', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
    expect(reactFlowSpy).toHaveBeenCalled();
    expect(reactFlowSpy.mock.calls[0]?.[0]).toMatchObject({
      colorMode: 'dark',
    });
  });

  it('uses a light canvas surface when the app theme is light', () => {
    themeState.theme = 'light';

    const { container } = render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    const canvasShell = container.querySelector('[style*="background-size"]') as HTMLElement | null;
    expect(canvasShell).not.toBeNull();
    expect(canvasShell?.getAttribute('style') ?? '').not.toContain('rgba(15, 23, 42');
    expect(screen.getByTestId('json-flow-node').getAttribute('style') ?? '').not.toContain('rgba(15, 23, 42');
  });

  it('uses explicit background image styling on the canvas shell to avoid shorthand rerender warnings', () => {
    const { container } = render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    const canvasShell = container.querySelector('[style*="background-size"]') as HTMLElement | null;
    expect(canvasShell).not.toBeNull();
    const shellStyle = canvasShell?.getAttribute('style') ?? '';
    expect(shellStyle).toContain('background-image:');
    expect(shellStyle).toContain('background-size: 28px 28px, 100% 100%');
    expect(shellStyle).not.toContain('background:');
  });

  it('renders compact node summaries instead of the full property dump', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    expect(screen.getByText('root')).toBeInTheDocument();
    expect(screen.getByText(/object/i)).toBeInTheDocument();
    expect(screen.queryByText('homeTown')).not.toBeInTheDocument();
    expect(screen.queryByText('formed')).not.toBeInTheDocument();
  });

  it('uses a readable item label for numeric array node titles', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={indexedGraphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
  });

  it('renders json paths with a larger readable fallback style for array summary cards', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={arrayGraphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    const pathLabel = screen.getByText('$.members[0].powers');
    expect(pathLabel).toBeInTheDocument();
    expect(pathLabel).toHaveStyle({
      fontSize: '0.82rem',
      color: '#cbd5e1',
    });
  });

  it('allows dragging the canvas background to pan in React Flow', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    expect(reactFlowSpy.mock.calls[0]?.[0]).toMatchObject({
      panOnDrag: true,
      panOnScroll: true,
      selectionOnDrag: false,
    });
  });

  it('keeps the initial fit view from zooming out too far on larger graphs', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={nestedGraphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    expect(reactFlowSpy.mock.calls[0]?.[0]).toMatchObject({
      fitView: true,
      fitViewOptions: {
        padding: 0.18,
        minZoom: 0.42,
      },
      minZoom: 0.42,
    });
  });

  it('renders the graph toolbar controls', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    expect(screen.getByRole('button', { name: 'Enter full screen' })).toBeInTheDocument();
    expect(screen.getByTestId('flow-controls')).toBeInTheDocument();
  });

  it('requests fullscreen on the graph shell when the control is clicked', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Enter full screen' }));

    expect(mockRequestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('switches to fullscreen height and exit state after the browser enters fullscreen', () => {
    const { container } = render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    const shell = container.querySelector('[data-testid="json-flow-shell"]') as HTMLElement;
    Object.defineProperty(document, 'fullscreenElement', {
      configurable: true,
      value: shell,
    });

    act(() => {
      document.dispatchEvent(new Event('fullscreenchange'));
    });

    expect(screen.getByRole('button', { name: 'Exit full screen' })).toBeInTheDocument();
    expect(shell).toHaveStyle({
      height: '100vh',
      minHeight: '100vh',
    });
  });

  it('uses stable summary card sizing for unselected nodes', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    const nodeCard = screen.getByTestId('json-flow-node-card');
    expect(nodeCard).toHaveStyle({
      minWidth: '220px',
      minHeight: '88px',
      resize: 'none',
      overflow: 'hidden',
    });
  });

  it('keeps selected emphasis without enabling manual resize', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId="$"
        onSelectNode={() => undefined}
      />,
    );

    const nodeCard = screen.getByTestId('json-flow-node-card');
    expect(nodeCard).toHaveStyle({
      resize: 'none',
    });
    expect(nodeCard).toHaveStyle({
      border: '2px solid var(--primary, #2563eb)',
    });
  });

  it('does not show the graph inspector on hover alone', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    fireEvent.mouseEnter(screen.getByTestId('json-flow-node'));

    expect(screen.queryByTestId('json-flow-inspector')).not.toBeInTheDocument();
  });

  it('shows the graph inspector attached to the selected node', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId="$"
        onSelectNode={() => undefined}
      />,
    );

    const inspector = screen.getByTestId('json-flow-inspector');
    expect(inspector).toBeInTheDocument();
    expect(within(inspector).getByText('Node Inspector')).toBeInTheDocument();
    expect(within(inspector).getByText('root')).toBeInTheDocument();
    expect(within(inspector).getByText('Metro City')).toBeInTheDocument();
  });

  it('shows the selected node properties in a dedicated side panel', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId="$"
        onSelectNode={() => undefined}
      />,
    );

    const inspector = screen.getByTestId('json-flow-inspector');
    const propertyRow = within(inspector).getByText('homeTown').closest('div');

    expect(within(inspector).getByText('JSON Path')).toBeInTheDocument();
    expect(within(inspector).getByText('Children')).toBeInTheDocument();
    expect(propertyRow).toHaveStyle({
      gridTemplateColumns: 'minmax(72px, 100px) minmax(0, 1fr)',
    });
  });

  it('keeps the selected node inspector when another node is hovered', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={nestedGraphResult}
        selectedNodeId="$"
        onSelectNode={() => undefined}
      />,
    );

    const nodes = screen.getAllByTestId('json-flow-node');
    expect(nodes).toHaveLength(2);

    fireEvent.mouseEnter(nodes[1]!);

    const inspectors = screen.getAllByTestId('json-flow-inspector');
    expect(inspectors).toHaveLength(1);
    expect(within(inspectors[0]!).getByText('Node Inspector')).toBeInTheDocument();
    expect(within(inspectors[0]!).getByText('root')).toBeInTheDocument();
    expect(within(inspectors[0]!).queryByText('members')).not.toBeInTheDocument();
  });

  it('shows the selected indexed item in the inspector side panel', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={siblingGraphResult}
        selectedNodeId="$.members[0]"
        onSelectNode={() => undefined}
      />,
    );

    const inspector = screen.getByTestId('json-flow-inspector');

    expect(within(inspector).getByText('Item 1')).toBeInTheDocument();
    expect(within(inspector).getByText('Molecule Man')).toBeInTheDocument();
  });

  it('ignores React Flow multi-selection when deciding which inspector is open', () => {
    forcedReactFlowSelectedIds.add('$.members[1]');

    render(
      <JsonReactFlowVisualizer
        graphResult={siblingGraphResult}
        selectedNodeId="$.members[0]"
        onSelectNode={() => undefined}
      />,
    );

    const inspectors = screen.getAllByTestId('json-flow-inspector');

    expect(inspectors).toHaveLength(1);
    expect(within(inspectors[0]!).getByText('Item 1')).toBeInTheDocument();
    expect(within(inspectors[0]!).queryByText('Item 2')).not.toBeInTheDocument();
  });

  it('recenters a node when it is double-clicked', () => {
    render(
      <JsonReactFlowVisualizer
        graphResult={graphResult}
        selectedNodeId={null}
        onSelectNode={() => undefined}
      />,
    );

    const props = reactFlowSpy.mock.calls[0]?.[0] as {
      onInit?: (instance: { setCenter: typeof mockSetCenter }) => void;
      onNodeDoubleClick?: (
        event: unknown,
        node: { position: { x: number; y: number }; width?: number; height?: number },
      ) => void;
    };

    act(() => {
      props.onInit?.({ setCenter: mockSetCenter });
    });

    const updatedProps = reactFlowSpy.mock.calls.at(-1)?.[0] as typeof props;
    updatedProps.onNodeDoubleClick?.(null, {
      position: { x: 120, y: 180 },
      width: 240,
      height: 96,
    });

    expect(mockSetCenter).toHaveBeenCalledWith(240, 228, {
      zoom: 1.15,
      duration: 300,
    });
  });

  it('reflows lower rows when a parent node becomes taller', () => {
    const defaultLayout = createFlowLayout(nestedGraphResult);
    const resizedLayout = createFlowLayout(nestedGraphResult, {
      $: {
        width: 520,
        height: 320,
      },
    });

    const defaultChild = defaultLayout.nodes.find((node) => node.id === '$.members');
    const resizedChild = resizedLayout.nodes.find((node) => node.id === '$.members');

    expect(defaultChild).toBeDefined();
    expect(resizedChild).toBeDefined();
    expect(resizedChild!.position.y).toBeGreaterThan(defaultChild!.position.y);
  });
});
