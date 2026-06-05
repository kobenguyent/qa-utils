export type JsonValueType =
  | 'object'
  | 'array'
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'summary';

export interface JsonGraphNode {
  id: string;
  label: string;
  jsonPath: string;
  depth: number;
  valueType: JsonValueType;
  parentId?: string;
  childCount: number;
  sampleValue?: string;
  primitiveData?: Record<string, string>;
}

export interface JsonGraphEdge {
  id: string;
  from: string;
  to: string;
  relation: 'contains';
}

export interface JsonGraphStats {
  totalNodes: number;
  totalEdges: number;
  maxDepth: number;
}

export interface JsonGraphBuildResult {
  nodes: JsonGraphNode[];
  edges: JsonGraphEdge[];
  truncated: boolean;
  truncationReason?: string;
  stats: JsonGraphStats;
}

export interface GraphBuildOptions {
  maxNodes?: number;
  maxEdges?: number;
  maxDepth?: number;
}

export const MAX_GRAPH_NODES = 300;
export const MAX_GRAPH_EDGES = 600;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isPrimitive(value: unknown): boolean {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function nodeValueType(value: unknown): JsonValueType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'object') return 'object';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'summary';
}

const formatPrimitiveData = (data: Record<string, unknown>): string => {
  const sortedKeys = Object.keys(data).sort((a, b) => a.localeCompare(b));
  return sortedKeys.map((k) => `${k}: ${data[k]}`).join('\n');
};

export function buildJsonRelationshipGraph(
  value: unknown,
  options: GraphBuildOptions = {},
): JsonGraphBuildResult {
  const maxNodes = options.maxNodes ?? MAX_GRAPH_NODES;
  const maxEdges = options.maxEdges ?? MAX_GRAPH_EDGES;
  const maxDepth = options.maxDepth ?? Number.POSITIVE_INFINITY;

  const nodes = new Map<string, JsonGraphNode>();
  const edges = new Map<string, JsonGraphEdge>();
  const childCounts = new Map<string, Set<string>>();
  let maxDepthSeen = 0;
  let truncated = false;
  let truncationReason: string | undefined;

  const setTruncated = (reason: string) => {
    if (!truncated) {
      truncated = true;
      truncationReason = reason;
    }
  };

  const canAddNode = (id: string): boolean => {
    if (nodes.has(id)) return true;
    if (nodes.size >= maxNodes) {
      setTruncated(`Node cap reached (${maxNodes}).`);
      return false;
    }
    return true;
  };

  const canAddEdge = (id: string): boolean => {
    if (edges.has(id)) return true;
    if (edges.size >= maxEdges) {
      setTruncated(`Edge cap reached (${maxEdges}).`);
      return false;
    }
    return true;
  };

  const addNode = (
    id: string,
    label: string,
    depth: number,
    nodeValue: unknown,
    parentId?: string,
    primitiveData?: Record<string, string>,
  ): boolean => {
    if (!canAddNode(id)) return false;
    const existing = nodes.get(id);
    if (!existing) {
      nodes.set(id, {
        id,
        label,
        jsonPath: id,
        depth,
        valueType: nodeValueType(nodeValue),
        parentId,
        childCount: 0,
        sampleValue: isPrimitive(nodeValue) ? String(nodeValue) : undefined,
        primitiveData,
      });
      maxDepthSeen = Math.max(maxDepthSeen, depth);
    }
    return true;
  };

  const addEdge = (from: string, to: string): boolean => {
    const edgeId = `${from}->${to}`;
    if (!canAddEdge(edgeId)) return false;
    if (!edges.has(edgeId)) {
      edges.set(edgeId, { id: edgeId, from, to, relation: 'contains' });
    }
    const set = childCounts.get(from) ?? new Set<string>();
    set.add(to);
    childCounts.set(from, set);
    return true;
  };

  const visit = (
    currentValue: unknown,
    path: string,
    labelPrefix: string,
    depth: number,
    parentId?: string,
  ) => {
    if (depth > maxDepth) {
      setTruncated(`Max depth reached (${maxDepth}).`);
      return;
    }

    if (Array.isArray(currentValue)) {
      if (!addNode(path, labelPrefix, depth, currentValue, parentId)) return;
      if (parentId && !addEdge(parentId, path)) return;

      for (let i = 0; i < currentValue.length; i++) {
        visit(currentValue[i], `${path}[${i}]`, String(i), depth + 1, path);
        if (truncated && nodes.size >= maxNodes) return;
      }
    } else if (isObject(currentValue)) {
      // Partition keys
      const primitiveData: Record<string, unknown> = {};
      const complexKeys: string[] = [];

      for (const key of Object.keys(currentValue)) {
        const val = currentValue[key];
        if (isObject(val) || Array.isArray(val)) {
          complexKeys.push(key);
        } else {
          primitiveData[key] = val;
        }
      }

      // Format multi-line label
      let label = labelPrefix;
      const primitivesStr = formatPrimitiveData(primitiveData);
      if (primitivesStr) {
        label = `${labelPrefix}\n${primitivesStr}`;
      }

      const primitiveDataStr: Record<string, string> = {};
      for (const [k, v] of Object.entries(primitiveData)) {
        primitiveDataStr[k] = v === null ? 'null' : String(v);
      }

      if (!addNode(path, label, depth, currentValue, parentId, Object.keys(primitiveDataStr).length > 0 ? primitiveDataStr : undefined)) return;
      if (parentId && !addEdge(parentId, path)) return;

      // Sort complex keys alphabetically for determinism
      complexKeys.sort((a, b) => a.localeCompare(b));
      for (const key of complexKeys) {
        const val = currentValue[key];
        const childPath = `${path === '$' ? '$' : path}.${key}`;
        visit(val, childPath, key, depth + 1, path);
        if (truncated && nodes.size >= maxNodes) return;
      }
    } else {
      // Primitive values
      const strVal = currentValue === null ? 'null' : String(currentValue);
      if (!addNode(path, strVal, depth, currentValue, parentId)) return;
      if (parentId && !addEdge(parentId, path)) return;
    }
  };

  visit(value, '$', 'root', 0);

  for (const node of nodes.values()) {
    node.childCount = childCounts.get(node.id)?.size ?? 0;
  }

  const sortedNodes = Array.from(nodes.values()).sort((a, b) =>
    a.id.localeCompare(b.id),
  );
  const sortedEdges = Array.from(edges.values()).sort((a, b) =>
    a.id.localeCompare(b.id),
  );

  return {
    nodes: sortedNodes,
    edges: sortedEdges,
    truncated,
    truncationReason,
    stats: {
      totalNodes: sortedNodes.length,
      totalEdges: sortedEdges.length,
      maxDepth: maxDepthSeen,
    },
  };
}
