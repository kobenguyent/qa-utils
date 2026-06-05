import { Button } from 'react-bootstrap';
import { useMemo } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';
import type { JsonGraphBuildResult, JsonGraphNode } from '../../utils/jsonRelationshipGraph';
import { buildJsonGraphLayout, getNodeHeight } from './JsonRelationshipGraphCanvas.utils';

interface JsonRelationshipGraphCanvasProps {
  graphResult: JsonGraphBuildResult;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  expanded?: boolean;
  onOpenLarge?: () => void;
  height?: string;
}

interface JsonGraphNodeDetailsProps {
  node: JsonGraphNode | null;
  compact?: boolean;
}

const getGraphNodePalette = (node: JsonGraphNode, selected: boolean) => {
  if (selected) {
    return {
      fill: 'var(--primary-light, rgba(37, 99, 235, 0.08))',
      stroke: 'var(--primary, #2563eb)',
      accent: 'var(--primary, #2563eb)',
    };
  }

  if (node.valueType === 'array') {
    return {
      fill: 'rgba(124, 58, 237, 0.06)',
      stroke: 'rgba(124, 58, 237, 0.45)',
      accent: '#7c3aed',
    };
  }

  if (node.valueType === 'object') {
    return {
      fill: 'rgba(37, 99, 235, 0.06)',
      stroke: 'rgba(37, 99, 235, 0.45)',
      accent: '#2563eb',
    };
  }

  return {
    fill: 'var(--input-bg, #ffffff)',
    stroke: 'var(--border-color, #cbd5e1)',
    accent: '#059669',
  };
};

export const JsonGraphNodeDetails = ({ node, compact = false }: JsonGraphNodeDetailsProps) => {
  if (!node) {
    return (
      <div
        style={{
          border: '1px dashed var(--border-color, #cbd5e1)',
          borderRadius: '8px',
          background: 'var(--card-bg, #ffffff)',
          padding: compact ? '0.65rem' : '0.85rem',
          fontSize: compact ? '0.78rem' : '0.86rem',
          color: 'var(--muted, #64748b)',
        }}
      >
        Select a node to inspect its JSON path, type, child count, and sample value.
      </div>
    );
  }

  const lines = node.label.split('\n');
  const hasNumericHeader = !!lines[0]?.match(/^\d+$/);
  const detailLabel = hasNumericHeader ? (lines[1]?.split(': ')[1] || node.label.split('\n')[0]) : lines[0];

  return (
    <div
      style={{
        border: '1px solid var(--border-color, #cbd5e1)',
        borderRadius: '8px',
        background: 'var(--card-bg, #ffffff)',
        padding: compact ? '0.65rem' : '0.85rem',
        fontSize: compact ? '0.78rem' : '0.86rem',
        overflowWrap: 'anywhere',
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text, #1f2937)' }}>Node Details</div>
      {[
        ['Label', detailLabel],
        ['JSON Path', node.jsonPath],
        ['Type', node.valueType],
        ['Children', String(node.childCount)],
      ].map(([label, value]) => (
        <div key={label} style={{ display: 'grid', gridTemplateColumns: '78px 1fr', gap: '0.5rem', padding: '0.2rem 0' }}>
          <span style={{ color: 'var(--muted, #64748b)', fontWeight: 700 }}>{label}</span>
          <span style={{ color: 'var(--text, #1f2937)' }}>{value}</span>
        </div>
      ))}
      
      {lines.length > 1 && (
        <div style={{ marginTop: '0.4rem', borderTop: '1px solid var(--border-color, #cbd5e1)', paddingTop: '0.4rem' }}>
          <span style={{ color: 'var(--muted, #64748b)', fontWeight: 700, display: 'block', marginBottom: '0.2rem' }}>Properties</span>
          <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.74rem', background: 'var(--bg-secondary, #fafafa)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border-color, #cbd5e1)' }}>
            {lines.slice(hasNumericHeader ? 1 : 1).map((line, idx) => {
              const colonIdx = line.indexOf(': ');
              if (colonIdx !== -1) {
                const prop = line.slice(0, colonIdx);
                const val = line.slice(colonIdx + 2);
                return (
                  <div key={idx} style={{ display: 'flex', gap: '0.2rem' }}>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>{prop}</span>
                    <span style={{ color: '#64748b' }}>:</span>
                    <span style={{ color: '#10b981' }}>{val}</span>
                  </div>
                );
              }
              return <div key={idx}>{line}</div>;
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const renderSvgNodeLabel = (label: string, paletteAccent: string) => {
  const lines = label.split('\n');
  const [firstLine, ...restLines] = lines;
  const isNumericHeader = firstLine && !!firstLine.match(/^\d+$/);

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.15rem', textAlign: 'left' }}>
      {firstLine && firstLine.trim() && !isNumericHeader && (
        <strong style={{
          color: paletteAccent,
          fontWeight: 800,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%',
          letterSpacing: '-0.01em',
          fontSize: '0.78rem',
          borderBottom: restLines.length > 0 ? '1px solid var(--border-color, #cbd5e1)' : 'none',
          paddingBottom: restLines.length > 0 ? '2px' : '0',
          marginBottom: restLines.length > 0 ? '2px' : '0'
        }}>
          {firstLine}
        </strong>
      )}
      {restLines.map((line, i) => {
        const colonIndex = line.indexOf(': ');
        if (colonIndex !== -1) {
          const property = line.slice(0, colonIndex);
          const value = line.slice(colonIndex + 2);
          return (
            <div key={i} style={{ fontSize: '0.7rem', display: 'flex', gap: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden' }}>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>{property}</span>
              <span style={{ color: '#64748b' }}>:</span>
              <span style={{ color: '#10b981', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{ fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {line}
          </div>
        );
      })}
    </div>
  );
};

export const JsonRelationshipGraphCanvas = ({
  graphResult,
  selectedNodeId,
  onSelectNode,
  expanded = false,
  onOpenLarge,
  height,
}: JsonRelationshipGraphCanvasProps) => {
  const graphLayout = useMemo(() => buildJsonGraphLayout(graphResult), [graphResult]);
  const stageHeight = height ?? (expanded ? 'min(68vh, 720px)' : `${graphLayout.height}px`);

  return (
    <TransformWrapper
      minScale={expanded ? 0.22 : 0.4}
      initialScale={expanded ? 1.0 : 0.76}
      maxScale={expanded ? 4.0 : 2.5}
      centerOnInit
      centerZoomedOut
      wheel={{ step: 0.08 }}
      pinch={{ step: 6 }}
      panning={{ velocityDisabled: false }}
      doubleClick={{ mode: 'zoomIn', step: 0.65 }}
    >
      {({ zoomIn, zoomOut, resetTransform, centerView }) => (
        <div className="d-flex flex-column gap-2 h-100" style={{ minWidth: 0 }}>
          <div
            className="d-flex flex-wrap align-items-center gap-2"
            style={{
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: '12px',
              background: 'var(--card-bg, #ffffff)',
              padding: '0.45rem',
            }}
          >
            <div className="d-flex gap-1" role="group" aria-label="Graph canvas controls">
              <Button size="sm" variant="outline-secondary" onClick={() => zoomIn()} title="Zoom in" aria-label="Zoom in">
                +
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => zoomOut()} title="Zoom out" aria-label="Zoom out">
                -
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => centerView()} title="Fit graph to view">
                Fit
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={() => resetTransform()} title="Reset graph position">
                Reset
              </Button>
            </div>
            <div style={{ color: 'var(--muted, #64748b)', fontSize: expanded ? '0.82rem' : '0.74rem', fontWeight: 600 }}>
              Pan with drag. Zoom with wheel or pinch.
            </div>
            {!expanded && onOpenLarge && (
              <Button
                size="sm"
                variant="outline-primary"
                className="ms-auto"
                onClick={onOpenLarge}
                aria-label="Open larger key relationship graph"
                title="Open larger graph"
              >
                ⛶
              </Button>
            )}
          </div>

          <div
            data-testid={expanded ? 'json-relationship-graph-modal' : 'json-relationship-graph'}
            style={{
              border: '1px solid var(--border-color, #cbd5e1)',
              borderRadius: expanded ? '14px' : '10px',
              overflow: 'hidden',
              background: 'radial-gradient(circle at 18px 18px, rgba(100, 116, 139, 0.1) 1px, transparent 1px), linear-gradient(180deg, rgba(148,163,184,0.06), transparent 42%), var(--bg-secondary, #fafafa)',
              backgroundSize: '24px 24px, 100% 100%, 100% 100%',
              minHeight: expanded ? '420px' : '300px',
              height: stageHeight,
              boxShadow: expanded ? 'inset 0 0 0 1px rgba(255,255,255,0.03)' : undefined,
            }}
          >
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%', cursor: 'grab' }}
              contentStyle={{
                width: expanded ? `${graphLayout.width}px` : '100%',
                minWidth: expanded ? `${graphLayout.width}px` : undefined,
              }}
            >
              <svg
                width={expanded ? graphLayout.width : '100%'}
                height={graphLayout.height}
                viewBox={`0 0 ${graphLayout.width} ${graphLayout.height}`}
                preserveAspectRatio="xMidYMin meet"
                role="img"
                aria-label="JSON relationship graph"
                style={{ display: 'block' }}
              >
                {graphResult.edges.map((edge) => {
                  const from = graphLayout.positions.get(edge.from);
                  const to = graphLayout.positions.get(edge.to);
                  if (!from || !to) return null;
                  
                  const fromNode = graphResult.nodes.find((n) => n.id === edge.from);
                  const toNode = graphResult.nodes.find((n) => n.id === edge.to);
                  const fromHeight = fromNode ? getNodeHeight(fromNode.label) : 52;
                  const toHeight = toNode ? getNodeHeight(toNode.label) : 52;

                  return (
                    <line
                      key={edge.id}
                      x1={from.x}
                      y1={from.y + fromHeight / 2}
                      x2={to.x}
                      y2={to.y - toHeight / 2}
                      stroke="var(--border-color, #cbd5e1)"
                      strokeWidth={1.8}
                    />
                  );
                })}

                {graphResult.nodes.map((node) => {
                  const pos = graphLayout.positions.get(node.id);
                  if (!pos) return null;
                  const isSelected = selectedNodeId === node.id;
                  const palette = getGraphNodePalette(node, isSelected);
                  const nHeight = getNodeHeight(node.label);

                  return (
                    <g key={node.id} transform={`translate(${pos.x - graphLayout.nodeWidth / 2}, ${pos.y - nHeight / 2})`}>
                      <rect
                        width={graphLayout.nodeWidth}
                        height={nHeight}
                        rx={10}
                        fill={palette.fill}
                        stroke={palette.stroke}
                        strokeWidth={isSelected ? 2 : 1.2}
                        filter="drop-shadow(0 4px 6px rgba(15, 23, 42, 0.06))"
                      />
                      <rect
                        x={8}
                        y={8}
                        width={4}
                        height={nHeight - 16}
                        rx={2}
                        fill={palette.accent}
                      />
                      <foreignObject x={18} y={6} width={graphLayout.nodeWidth - 26} height={nHeight - 12}>
                        <button
                          type="button"
                          aria-label={`Select graph node ${node.label}`}
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectNode(node.id);
                          }}
                          style={{
                            all: 'unset',
                            cursor: 'pointer',
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'flex-start',
                            color: 'var(--text, #1f2937)',
                            fontFamily: 'Monaco, Consolas, var(--font-mono), monospace',
                            lineHeight: 1.2,
                          }}
                        >
                          {renderSvgNodeLabel(node.label, palette.accent)}
                        </button>
                      </foreignObject>
                    </g>
                  );
                })}
              </svg>
            </TransformComponent>
          </div>
        </div>
      )}
    </TransformWrapper>
  );
};
