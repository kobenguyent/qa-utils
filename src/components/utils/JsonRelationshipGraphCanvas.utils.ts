import type { JsonGraphBuildResult, JsonGraphNode } from '../../utils/jsonRelationshipGraph';

export interface GraphLayout {
  width: number;
  height: number;
  nodeWidth: number;
  nodeHeight: number;
  positions: Map<string, { x: number; y: number }>;
}

export const getNodeHeight = (label: string): number => {
  const lineCount = label.split('\n').filter((line) => line.trim()).length;
  const isNumeric = !!label.split('\n')[0]?.match(/^\d+$/);
  const visibleLines = isNumeric ? Math.max(1, lineCount - 1) : Math.max(1, lineCount);
  return Math.max(52, 34 + visibleLines * 16);
};

export const buildJsonGraphLayout = (graphResult: JsonGraphBuildResult): GraphLayout => {
  const byDepth = new Map<number, JsonGraphNode[]>();
  const sorted = [...graphResult.nodes].sort((a, b) => a.id.localeCompare(b.id));
  for (const node of sorted) {
    const bucket = byDepth.get(node.depth) ?? [];
    bucket.push(node);
    byDepth.set(node.depth, bucket);
  }

  const nodeWidth = 166;
  const nodeHeight = 52;
  const xSpacing = nodeWidth + 32;
  const ySpacing = 160;
  const paddingX = nodeWidth / 2 + 30;
  const paddingY = 60;
  const deepest = Math.max(...Array.from(byDepth.keys()), 0);
  const maxPerDepth = Math.max(...Array.from(byDepth.values()).map((nodes) => nodes.length), 1);

  const width = Math.max(460, (maxPerDepth - 1) * xSpacing + paddingX * 2);
  const height = Math.max(400, deepest * ySpacing + paddingY * 2 + 80);

  const positions = new Map<string, { x: number; y: number }>();
  for (const [depth, nodes] of byDepth.entries()) {
    const rowWidth = (nodes.length - 1) * xSpacing;
    const startX = width / 2 - rowWidth / 2;
    nodes.forEach((node, index) => {
      positions.set(node.id, {
        x: startX + index * xSpacing,
        y: paddingY + depth * ySpacing,
      });
    });
  }

  return {
    width,
    height,
    nodeWidth,
    nodeHeight,
    positions,
  };
};
