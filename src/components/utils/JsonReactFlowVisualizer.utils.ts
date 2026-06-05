import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { JsonGraphBuildResult, JsonGraphNode } from '../../utils/jsonRelationshipGraph';
import type { JsonNodeSize } from './JsonReactFlowVisualizer';

interface JsonFlowNodeData extends Record<string, unknown> {
  graphNode: JsonGraphNode;
  size?: JsonNodeSize;
  onResize?: (nodeId: string, size: JsonNodeSize) => void;
  isSelected?: boolean;
  preferredInspectorSide?: 'left' | 'right';
}

export type JsonFlowNode = Node<JsonFlowNodeData, 'jsonNode'>;

const DEFAULT_NODE_WIDTH = 240;
const DEFAULT_NODE_HEIGHT = 96;
const COLUMN_GAP = 160;
const ROW_GAP = 170;

const getNodeSize = (
  nodeId: string,
  nodeSizes: Record<string, JsonNodeSize>,
): JsonNodeSize => nodeSizes[nodeId] ?? { width: DEFAULT_NODE_WIDTH, height: DEFAULT_NODE_HEIGHT };

export const createFlowLayout = (
  graphResult: JsonGraphBuildResult,
  nodeSizes: Record<string, JsonNodeSize> = {},
): { nodes: JsonFlowNode[]; edges: Edge[] } => {
  const byDepth = new Map<number, JsonGraphNode[]>();
  for (const node of graphResult.nodes) {
    const bucket = byDepth.get(node.depth) ?? [];
    bucket.push(node);
    byDepth.set(node.depth, bucket);
  }

  const nodes: JsonFlowNode[] = [];
  const sortedDepths = Array.from(byDepth.keys()).sort((a, b) => a - b);
  let currentY = 0;
  let previousRowHeight = 0;

  for (const depth of sortedDepths) {
    const depthNodes = byDepth.get(depth) ?? [];
    const sorted = [...depthNodes].sort((a, b) => a.id.localeCompare(b.id));
    const rowWidth = sorted.reduce((sum, node, index) => {
      const { width } = getNodeSize(node.id, nodeSizes);
      return sum + width + (index > 0 ? COLUMN_GAP : 0);
    }, 0);
    const startX = -rowWidth / 2;
    let cursorX = startX;
    const rowHeight = sorted.reduce((maxHeight, node) => {
      const { height } = getNodeSize(node.id, nodeSizes);
      return Math.max(maxHeight, height);
    }, DEFAULT_NODE_HEIGHT);

    if (depth > 0) {
      currentY += previousRowHeight + ROW_GAP;
    }

    sorted.forEach((node) => {
      const size = getNodeSize(node.id, nodeSizes);
      nodes.push({
        id: node.id,
        type: 'jsonNode',
        position: {
          x: cursorX,
          y: currentY,
        },
        data: { graphNode: node, size },
      });
      cursorX += size.width + COLUMN_GAP;
    });

    previousRowHeight = rowHeight;
  }

  const edges: Edge[] = graphResult.edges.map((edge) => ({
    id: edge.id,
    source: edge.from,
    target: edge.to,
    sourceHandle: 'source',
    targetHandle: 'target',
    type: 'smoothstep',
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: 'rgba(148, 163, 184, 0.75)',
    },
    style: {
      stroke: 'rgba(148, 163, 184, 0.45)',
      strokeWidth: 2.2,
      opacity: 0.72,
    },
  }));

  return { nodes, edges };
};
