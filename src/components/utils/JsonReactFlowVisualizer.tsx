import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  ReactFlowProvider,
  SelectionMode,
  type Edge,
  type NodeProps,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getEffectiveTheme } from '../../utils/themeManager';
import type {
  JsonGraphBuildResult,
  JsonGraphNode,
  JsonValueType,
} from '../../utils/jsonRelationshipGraph';
import { createFlowLayout, type JsonFlowNode } from './JsonReactFlowVisualizer.utils';

export interface JsonNodeSize {
  width: number;
  height: number;
}

interface JsonReactFlowVisualizerProps {
  graphResult: JsonGraphBuildResult;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onDeselectNode?: () => void;
  height?: string;
}

interface JsonFlowInspectorDetails {
  label: string;
  properties: Array<{ key: string; value: string }>;
}

interface JsonFlowInspectorCardProps {
  node: JsonGraphNode;
  isSelected: boolean;
  isDark: boolean;
  onClose: () => void;
}

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 96;

const TYPE_COLORS: Record<JsonValueType, { accent: string; fill: string; stroke: string }> = {
  object: { accent: '#2563eb', fill: 'var(--card-bg, #ffffff)', stroke: '#3b82f6' },
  array: { accent: '#7c3aed', fill: 'var(--card-bg, #ffffff)', stroke: '#8b5cf6' },
  string: { accent: '#059669', fill: 'var(--card-bg, #ffffff)', stroke: '#10b981' },
  number: { accent: '#059669', fill: 'var(--card-bg, #ffffff)', stroke: '#10b981' },
  boolean: { accent: '#059669', fill: 'var(--card-bg, #ffffff)', stroke: '#10b981' },
  null: { accent: '#6b7280', fill: 'var(--card-bg, #ffffff)', stroke: '#9ca3af' },
  summary: { accent: '#7c3aed', fill: 'var(--card-bg, #ffffff)', stroke: '#8b5cf6' },
};

const formatTypeLabel = (valueType: JsonValueType) =>
  valueType.charAt(0).toUpperCase() + valueType.slice(1);

const getCanvasPalette = (isDark: boolean) => ({
  shellBackgroundColor: isDark ? 'rgba(15, 23, 42, 0.98)' : '#f8fafc',
  shellBackgroundImage: isDark
    ? 'radial-gradient(circle at 24px 24px, rgba(96, 165, 250, 0.08) 1px, transparent 1px), linear-gradient(180deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.92))'
    : 'radial-gradient(circle at 24px 24px, rgba(37, 99, 235, 0.08) 1px, transparent 1px), linear-gradient(180deg, #f8fafc, #eef2ff)',
  shellBorder: isDark ? 'var(--border-color)' : 'rgba(148, 163, 184, 0.28)',
  gridColor: isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(37, 99, 235, 0.12)',
  cardBackground: isDark
    ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.84))'
    : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.98))',
  selectedCardBackground: isDark
    ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(15, 23, 42, 0.9))'
    : 'linear-gradient(180deg, rgba(239, 246, 255, 0.98), rgba(224, 231, 255, 0.98))',
  cardText: isDark ? '#e2e8f0' : '#334155',
  titleText: isDark ? '#f8fafc' : '#0f172a',
  badgeBackground: isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(37, 99, 235, 0.08)',
  badgeText: isDark ? '#cbd5e1' : '#475569',
  metaText: isDark ? '#94a3b8' : '#64748b',
  selectedMetaText: isDark ? '#bfdbfe' : '#1d4ed8',
  detailText: isDark ? '#d1fae5' : '#065f46',
  fallbackText: isDark ? '#cbd5e1' : '#475569',
  handleColor: isDark ? 'rgba(148, 163, 184, 0.95)' : 'rgba(100, 116, 139, 0.8)',
  shadow: isDark
    ? '0 10px 24px rgba(2, 6, 23, 0.28)'
    : '0 12px 24px rgba(148, 163, 184, 0.18)',
  selectedShadow: isDark
    ? '0 0 0 1px rgba(96, 165, 250, 0.5), 0 18px 36px rgba(37, 99, 235, 0.32)'
    : '0 0 0 1px rgba(59, 130, 246, 0.22), 0 18px 36px rgba(59, 130, 246, 0.16)',
});

const getNodeSummary = (graphNode: JsonGraphNode) => {
  const lines = graphNode.label.split('\n').filter(Boolean);
  const rawTitle = lines[0] ?? graphNode.jsonPath;
  const isIndexedItem = /^\d+$/.test(rawTitle);
  const title = isIndexedItem ? `Item ${Number(rawTitle) + 1}` : rawTitle;
  const detailLines = lines
    .slice(1)
    .filter((line) => line.includes(': '))
    .slice(0, 2)
    .map((line) => {
      const colonIndex = line.indexOf(': ');
      return {
        key: line.slice(0, colonIndex),
        value: line.slice(colonIndex + 2),
      };
    });

  return {
    title,
    isIndexedItem,
    typeLabel: formatTypeLabel(graphNode.valueType),
    metaLabel: `${graphNode.childCount} ${graphNode.childCount === 1 ? 'child' : 'children'}`,
    detailLines,
  };
};

const getNodeInspectorDetails = (graphNode: JsonGraphNode): JsonFlowInspectorDetails => {
  const lines = graphNode.label.split('\n').filter(Boolean);
  const rawTitle = lines[0] ?? graphNode.jsonPath;
  const isIndexedItem = /^\d+$/.test(rawTitle);

  // Use primitiveData if available (avoids multiline value truncation)
  if (graphNode.primitiveData) {
    const sortedKeys = Object.keys(graphNode.primitiveData).sort((a, b) => a.localeCompare(b));
    return {
      label: isIndexedItem ? `Item ${Number(rawTitle) + 1}` : rawTitle,
      properties: sortedKeys.map((key) => ({
        key,
        value: graphNode.primitiveData![key],
      })),
    };
  }

  return {
    label: isIndexedItem ? `Item ${Number(rawTitle) + 1}` : rawTitle,
    properties: lines
      .slice(1)
      .map((line) => {
        const colonIndex = line.indexOf(': ');
        if (colonIndex === -1) {
          return null;
        }

        return {
          key: line.slice(0, colonIndex),
          value: line.slice(colonIndex + 2),
        };
      })
      .filter((detail): detail is { key: string; value: string } => detail !== null),
  };
};

const JsonFlowInspectorCard = ({ node, isDark, onClose }: JsonFlowInspectorCardProps) => {
  const canvasPalette = getCanvasPalette(isDark);
  const palette = TYPE_COLORS[node.valueType] || TYPE_COLORS.object;
  const details = getNodeInspectorDetails(node);

  return (
    <div
      data-testid="json-flow-inspector"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px 12px',
          borderBottom: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.22)'}`,
          flexShrink: 0,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.65rem',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: canvasPalette.selectedMetaText,
              marginBottom: 4,
            }}
          >
            Node Inspector
          </div>
          <div
            style={{
              color: canvasPalette.titleText,
              fontSize: '0.95rem',
              fontWeight: 800,
              lineHeight: 1.2,
              overflowWrap: 'anywhere',
            }}
          >
            {details.label}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div
            style={{
              padding: '0.22rem 0.5rem',
              borderRadius: 999,
              background: `${palette.accent}18`,
              color: palette.accent,
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              border: `1px solid ${palette.accent}30`,
            }}
          >
            {formatTypeLabel(node.valueType)}
          </div>
          <button
            type="button"
            aria-label="Close inspector"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 8,
              border: `1px solid ${isDark ? 'rgba(148,163,184,0.2)' : 'rgba(148,163,184,0.3)'}`,
              background: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.1)',
              color: canvasPalette.metaText,
              cursor: 'pointer',
              fontSize: '0.8rem',
              lineHeight: 1,
              padding: 0,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Meta */}
      <div
        style={{
          padding: '12px 16px',
          display: 'grid',
          gap: 8,
          borderBottom: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.22)'}`,
          flexShrink: 0,
        }}
      >
        {[
          ['JSON Path', node.jsonPath],
          ['Children', `${node.childCount}`],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'grid',
              gridTemplateColumns: '80px minmax(0, 1fr)',
              gap: 8,
              fontSize: '0.75rem',
              alignItems: 'start',
            }}
          >
            <span style={{ color: canvasPalette.metaText, fontWeight: 600 }}>{label}</span>
            <span
              style={{
                color: canvasPalette.cardText,
                minWidth: 0,
                overflowWrap: 'anywhere',
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '0.73rem',
              }}
            >
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Properties - scrollable */}
      <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '12px 16px' }}>
        {details.properties.length > 0 ? (
          <>
            <div
              style={{
                marginBottom: 10,
                fontSize: '0.65rem',
                fontWeight: 800,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: canvasPalette.metaText,
              }}
            >
              Properties
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {details.properties.map((detail) => (
                <div
                  key={`${node.id}-${detail.key}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(72px, 100px) minmax(0, 1fr)',
                    gap: 8,
                    alignItems: 'start',
                    fontSize: '0.73rem',
                    fontFamily: 'Monaco, Consolas, monospace',
                  }}
                >
                  <span
                    style={{
                      color: isDark ? '#f87171' : '#dc2626',
                      fontWeight: 700,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    {detail.key}
                  </span>
                  <span
                    style={{
                      color: palette.accent,
                      fontWeight: 500,
                      minWidth: 0,
                      overflowWrap: 'anywhere',
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.55,
                    }}
                  >
                    {detail.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div
            style={{
              color: canvasPalette.fallbackText,
              fontSize: '0.78rem',
              lineHeight: 1.6,
              textAlign: 'center',
              paddingTop: 24,
            }}
          >
            No inline properties on this node.
            <br />
            <span style={{ opacity: 0.7 }}>Follow connected children to inspect nested data.</span>
          </div>
        )}
      </div>
    </div>
  );
};

const JsonFlowNodeComponent = memo(({ data }: NodeProps<JsonFlowNode>) => {
  const { theme } = useTheme();
  const isDark = getEffectiveTheme(theme) === 'dark';
  const canvasPalette = useMemo(() => getCanvasPalette(isDark), [isDark]);
  const graphNode = data.graphNode;
  const palette = TYPE_COLORS[graphNode.valueType] || TYPE_COLORS.object;
  const resolvedSize = data.size;
  const summary = useMemo(() => getNodeSummary(graphNode), [graphNode]);
  const titleId = `json-flow-node-title-${graphNode.id}`;
  const isSelected = data.isSelected === true;

  return (
    <div
      data-testid="json-flow-node"
      aria-labelledby={titleId}
      tabIndex={0}
      style={{
        width: resolvedSize?.width ?? DEFAULT_NODE_WIDTH,
        height: resolvedSize?.height ?? DEFAULT_NODE_HEIGHT,
        position: 'relative',
        overflow: 'visible',
        zIndex: 1,
        cursor: 'pointer',
      }}
    >
      <div
        data-testid="json-flow-node-card"
        style={{
          minWidth: 220,
          maxWidth: 280,
          minHeight: 88,
          width: '100%',
          height: '100%',
          position: 'relative',
          boxSizing: 'border-box',
          padding: '14px 16px',
          border: `2px solid ${isSelected ? 'var(--primary, #2563eb)' : palette.stroke}`,
          borderRadius: 16,
          background: isSelected ? canvasPalette.selectedCardBackground : canvasPalette.cardBackground,
          boxShadow: isSelected ? canvasPalette.selectedShadow : canvasPalette.shadow,
          color: canvasPalette.cardText,
          fontFamily: 'Monaco, Consolas, var(--font-mono), monospace',
          fontSize: '0.8rem',
          transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
          textAlign: 'left',
          lineHeight: 1.45,
          resize: 'none',
          overflow: 'hidden',
        }}
      >
        <Handle
          id="target"
          type="target"
          position={Position.Top}
          style={{ width: 8, height: 8, backgroundColor: canvasPalette.handleColor, border: 0 }}
          isConnectable={false}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <div style={{ minWidth: 0, flex: '1 1 auto' }}>
              <div
                id={titleId}
                style={{
                  color: canvasPalette.titleText,
                  fontWeight: 800,
                  fontSize: summary.isIndexedItem ? '1.08rem' : '0.98rem',
                  letterSpacing: summary.isIndexedItem ? '-0.03em' : '-0.02em',
                  lineHeight: 1.15,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {summary.title}
              </div>
              <div
                style={{
                  marginTop: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: canvasPalette.badgeBackground,
                  color: canvasPalette.badgeText,
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: palette.accent,
                    boxShadow: `0 0 0 4px ${palette.accent}22`,
                  }}
                />
                {summary.typeLabel}
              </div>
            </div>

            <div
              style={{
                flexShrink: 0,
                color: isSelected ? canvasPalette.selectedMetaText : canvasPalette.metaText,
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              {summary.metaLabel}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {summary.detailLines.length > 0 ? summary.detailLines.map((detail) => (
              <div
                key={`${graphNode.id}-${detail.key}`}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'baseline',
                  fontSize: '0.72rem',
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 6,
                    height: 6,
                    flexShrink: 0,
                    borderRadius: '50%',
                    background: palette.accent,
                    opacity: 0.9,
                  }}
                />
                <span
                  style={{
                    color: canvasPalette.detailText,
                    fontWeight: 600,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitBoxOrient: 'vertical',
                    WebkitLineClamp: 1,
                  }}
                >
                  {detail.value}
                </span>
              </div>
            )) : (
              <div
                style={{
                  color: canvasPalette.fallbackText,
                  fontSize: '0.82rem',
                  fontWeight: 500,
                  lineHeight: 1.35,
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitBoxOrient: 'vertical',
                  WebkitLineClamp: 2,
                }}
              >
                {graphNode.sampleValue ?? graphNode.jsonPath}
              </div>
            )}
          </div>
        </div>

        <Handle
          id="source"
          type="source"
          position={Position.Bottom}
          style={{ width: 8, height: 8, backgroundColor: canvasPalette.handleColor, border: 0 }}
          isConnectable={false}
        />
      </div>

      {/* inspector is rendered at shell level, not inside the node */}
    </div>
  );
});

JsonFlowNodeComponent.displayName = 'JsonFlowNodeComponent';

const nodeTypes = {
  jsonNode: JsonFlowNodeComponent,
};

type BrowserFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

type BrowserFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

const getFullscreenElement = (doc: BrowserFullscreenDocument) =>
  doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;

const requestElementFullscreen = async (element: BrowserFullscreenElement | null) => {
  if (!element) return;

  if (typeof element.requestFullscreen === 'function') {
    await element.requestFullscreen();
    return;
  }

  if (typeof element.webkitRequestFullscreen === 'function') {
    await element.webkitRequestFullscreen();
  }
};

const exitBrowserFullscreen = async (doc: BrowserFullscreenDocument) => {
  if (typeof doc.exitFullscreen === 'function') {
    await doc.exitFullscreen();
    return;
  }

  if (typeof doc.webkitExitFullscreen === 'function') {
    await doc.webkitExitFullscreen();
  }
};

export const JsonReactFlowVisualizer = ({
  graphResult,
  selectedNodeId,
  onSelectNode,
  onDeselectNode,
  height = 'min(56vh, 560px)',
}: JsonReactFlowVisualizerProps) => {
  const { theme } = useTheme();
  const colorMode = getEffectiveTheme(theme);
  const isDark = colorMode === 'dark';
  const canvasPalette = useMemo(() => getCanvasPalette(isDark), [isDark]);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance<JsonFlowNode> | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const [inspectorWidth, setInspectorWidth] = useState(300);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartWidthRef = useRef(300);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragStartXRef.current = e.clientX;
    dragStartWidthRef.current = inspectorWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const delta = dragStartXRef.current - ev.clientX;
      const next = Math.min(560, Math.max(200, dragStartWidthRef.current + delta));
      setInspectorWidth(next);
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, [inspectorWidth]);

  const { nodes, edges } = useMemo(() => createFlowLayout(graphResult), [graphResult]);
  const highlightedEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => {
        const isSelectedEdge = selectedNodeId != null && (
          edge.source === selectedNodeId || edge.target === selectedNodeId
        );

        return {
          ...edge,
          animated: isSelectedEdge,
          markerEnd: {
            ...(typeof edge.markerEnd === 'object' && edge.markerEnd ? edge.markerEnd : { type: MarkerType.ArrowClosed }),
            color: isSelectedEdge ? '#60a5fa' : 'rgba(148, 163, 184, 0.75)',
          },
          style: {
            ...(typeof edge.style === 'object' && edge.style ? edge.style : {}),
            stroke: isSelectedEdge ? '#60a5fa' : 'rgba(148, 163, 184, 0.45)',
            strokeWidth: isSelectedEdge ? 2.8 : 2.2,
            opacity: isSelectedEdge ? 1 : 0.72,
          },
        };
      }),
    [edges, selectedNodeId],
  );
  const selectedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        selected: selectedNodeId === node.id,
        data: {
          ...node.data,
          isSelected: selectedNodeId === node.id,
        },
      })),
    [nodes, selectedNodeId],
  );

  const selectedGraphNode = useMemo(
    () => selectedNodeId ? graphResult.nodes.find((n) => n.id === selectedNodeId) ?? null : null,
    [graphResult.nodes, selectedNodeId],
  );
  const handleNodeDoubleClick = useCallback(
    (_event: unknown, node: JsonFlowNode) => {
      reactFlowInstance?.setCenter(
        node.position.x + ((node.width ?? DEFAULT_NODE_WIDTH) / 2),
        node.position.y + ((node.height ?? DEFAULT_NODE_HEIGHT) / 2),
        { zoom: 1.15, duration: 300 },
      );
    },
    [reactFlowInstance],
  );
  const handleFullscreenToggle = useCallback(() => {
    const doc = document as BrowserFullscreenDocument;
    const fullscreenElement = getFullscreenElement(doc);

    if (fullscreenElement === shellRef.current) {
      void exitBrowserFullscreen(doc);
      return;
    }

    void requestElementFullscreen(shellRef.current);
  }, []);

  useEffect(() => {
    const doc = document as BrowserFullscreenDocument;
    const syncFullscreenState = () => {
      setIsFullscreen(getFullscreenElement(doc) === shellRef.current);
    };

    syncFullscreenState();
    doc.addEventListener('fullscreenchange', syncFullscreenState);
    doc.addEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);

    return () => {
      doc.removeEventListener('fullscreenchange', syncFullscreenState);
      doc.removeEventListener('webkitfullscreenchange', syncFullscreenState as EventListener);
    };
  }, []);

  return (
    <div
      ref={shellRef}
      data-testid="json-flow-shell"
      style={{
        display: 'flex',
        height: isFullscreen ? '100vh' : height,
        minHeight: isFullscreen ? '100vh' : 380,
        border: `1px solid ${canvasPalette.shellBorder}`,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Canvas area */}
      <div
        style={{
          flex: '1 1 auto',
          minWidth: 0,
          position: 'relative',
          backgroundColor: canvasPalette.shellBackgroundColor,
          backgroundImage: canvasPalette.shellBackgroundImage,
          backgroundSize: '28px 28px, 100% 100%',
        }}
      >
        <button
          type="button"
          aria-label={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          title={isFullscreen ? 'Exit full screen' : 'Enter full screen'}
          onClick={handleFullscreenToggle}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            zIndex: 5,
            border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.28)' : 'rgba(148, 163, 184, 0.34)'}`,
            borderRadius: 8,
            background: isDark ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.92)',
            color: canvasPalette.titleText,
            fontSize: '0.72rem',
            fontWeight: 700,
            lineHeight: 1,
            padding: '0.45rem 0.6rem',
            boxShadow: isDark ? '0 4px 12px rgba(2, 6, 23, 0.22)' : '0 4px 12px rgba(148, 163, 184, 0.16)',
            backdropFilter: 'blur(10px)',
            cursor: 'pointer',
          }}
        >
          {isFullscreen ? 'Exit' : 'Full'}
        </button>
        <ReactFlowProvider>
          <ReactFlow
            onInit={setReactFlowInstance}
            nodes={selectedNodes}
            edges={highlightedEdges}
            nodeTypes={nodeTypes}
            colorMode={colorMode}
            fitView
            fitViewOptions={{ padding: 0.18, minZoom: 0.42 }}
            minZoom={0.42}
            maxZoom={3.0}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnDrag
            panOnScroll
            zoomOnScroll={false}
            zoomOnPinch
            selectionOnDrag={false}
            selectionMode={SelectionMode.Partial}
            panActivationKeyCode="Space"
            zoomActivationKeyCode={['Meta', 'Control']}
            onNodeClick={(_, node) => onSelectNode(node.id)}
            onNodeDoubleClick={handleNodeDoubleClick}
            onPaneClick={() => onDeselectNode?.()}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              color={canvasPalette.gridColor}
              gap={28}
              size={1.2}
            />
            <Controls />
          </ReactFlow>
        </ReactFlowProvider>
      </div>

      {/* Inspector side panel — slides in as real layout space, never overlaps */}
      {selectedGraphNode && (
        <>
          {/* Resize handle */}
          <div
            role="separator"
            aria-label="Drag to resize inspector"
            onMouseDown={handleResizeMouseDown}
            style={{
              width: 5,
              flexShrink: 0,
              cursor: 'col-resize',
              background: 'transparent',
              position: 'relative',
              zIndex: 10,
            }}
          >
            {/* Visual grip */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 3,
                height: 32,
                borderRadius: 99,
                background: isDark ? 'rgba(148,163,184,0.3)' : 'rgba(148,163,184,0.5)',
                pointerEvents: 'none',
              }}
            />
          </div>
          <div
            style={{
              width: inspectorWidth,
              flexShrink: 0,
              borderLeft: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.14)' : 'rgba(148, 163, 184, 0.22)'}`,
              background: isDark ? 'rgba(15, 23, 42, 0.98)' : '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <JsonFlowInspectorCard
              node={selectedGraphNode}
              isSelected
              isDark={isDark}
              onClose={() => onDeselectNode?.()}
            />
          </div>
        </>
      )}
    </div>
  );
};
