import { describe, it, expect, beforeAll } from 'vitest';
import {
  buildJsonRelationshipGraph,
  MAX_GRAPH_NODES,
  MAX_GRAPH_EDGES,
  type JsonGraphBuildResult,
} from '../jsonRelationshipGraph';

/**
 * Extended tests for buildJsonRelationshipGraph,
 * covering scenarios from the reference JSON visualizer repo (nathanphan/json-tool).
 */

const SUPERHERO_JSON = {
  squadName: 'Super hero squad',
  homeTown: 'Metro City',
  formed: 2016,
  secretBase: 'Super tower',
  active: true,
  members: [
    {
      name: 'Molecule Man',
      age: 29,
      secretIdentity: 'Dan Jukes',
      powers: ['Radiation resistance', 'Turning tiny', 'Radiation'],
    },
    {
      name: 'Ahihi',
      age: 30,
      secretIdentity: 'Dan Jukes',
      powers: ['Radiation resistance', 'Turning tiny', 'Radiation'],
    },
  ],
};

const ADDRESS_JSON = {
  name: 'John Doe',
  age: 30,
  address: {
    street: '123 Main St',
    city: 'New York',
    country: 'USA',
  },
  contacts: [
    { type: 'email', value: 'john@example.com' },
    { type: 'phone', value: '+1-555-123-4567' },
  ],
  isActive: true,
};

const nodeIds = (r: JsonGraphBuildResult) => r.nodes.map((n) => n.id);
const edgeIds = (r: JsonGraphBuildResult) => r.edges.map((e) => e.id);

describe('buildJsonRelationshipGraph — extended coverage', () => {
  // ━━ Reference-repo example: Superhero squad ━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('superhero squad JSON (nathanphan/json-tool example)', () => {
    let result: JsonGraphBuildResult;

    beforeAll(() => {
      result = buildJsonRelationshipGraph(SUPERHERO_JSON);
    });

    it('creates a root node', () => {
      const root = result.nodes.find((n) => n.id === '$');
      expect(root).toBeTruthy();
      expect(root!.depth).toBe(0);
      expect(root!.valueType).toBe('object');
    });

    it('bundles top-level primitives inside the root node label instead of separate nodes', () => {
      const root = result.nodes.find((n) => n.id === '$');
      expect(root!.label).toContain('active: true');
      expect(root!.label).toContain('formed: 2016');
      expect(root!.label).toContain('squadName: Super hero squad');

      expect(nodeIds(result)).not.toContain('$.squadName');
      expect(nodeIds(result)).not.toContain('$.homeTown');
    });

    it('creates an array node for members', () => {
      const membersNode = result.nodes.find((n) => n.id === '$.members');
      expect(membersNode).toBeTruthy();
      expect(membersNode!.valueType).toBe('array');
      expect(membersNode!.label).toBe('members');
    });

    it('creates separate nodes for array items and nested fields', () => {
      expect(nodeIds(result)).toContain('$.members[0]');
      expect(nodeIds(result)).toContain('$.members[1]');
      expect(nodeIds(result)).toContain('$.members[0].powers');
      expect(nodeIds(result)).toContain('$.members[0].powers[0]');
    });

    it('connects root → members', () => {
      expect(
        result.edges.find((e) => e.from === '$' && e.to === '$.members'),
      ).toBeTruthy();
    });

    it('connects members → item nodes', () => {
      expect(
        result.edges.find((e) => e.from === '$.members' && e.to === '$.members[0]'),
      ).toBeTruthy();
      expect(
        result.edges.find((e) => e.from === '$.members' && e.to === '$.members[1]'),
      ).toBeTruthy();
    });

    it('is not truncated', () => {
      expect(result.truncated).toBe(false);
    });

    it('reports correct stats', () => {
      expect(result.stats.totalNodes).toBeGreaterThan(0);
      expect(result.stats.totalEdges).toBeGreaterThan(0);
      expect(result.stats.maxDepth).toBeGreaterThanOrEqual(2);
    });
  });

  // ━━ Reference-repo example: Address + contacts ━━━━━━━━━━━━━━━━━━━━━━━
  describe('address/contacts JSON (nathanphan/json-tool sample)', () => {
    let result: JsonGraphBuildResult;

    beforeAll(() => {
      result = buildJsonRelationshipGraph(ADDRESS_JSON);
    });

    it('creates nested object node for address containing bundled primitives', () => {
      const addr = result.nodes.find((n) => n.id === '$.address');
      expect(addr).toBeTruthy();
      expect(addr!.valueType).toBe('object');
      expect(addr!.label).toContain('city: New York');
      expect(addr!.label).toContain('street: 123 Main St');

      expect(nodeIds(result)).not.toContain('$.address.city');
    });

    it('creates contacts array and its individual items', () => {
      expect(nodeIds(result)).toContain('$.contacts');
      expect(nodeIds(result)).toContain('$.contacts[0]');
      expect(nodeIds(result)).toContain('$.contacts[1]');
    });

    it('connects root → address and contacts', () => {
      expect(
        result.edges.find((e) => e.from === '$' && e.to === '$.address'),
      ).toBeTruthy();
      expect(
        result.edges.find((e) => e.from === '$' && e.to === '$.contacts'),
      ).toBeTruthy();
    });
  });

  // ━━ Edge cases ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('edge cases', () => {
    it('handles an empty object', () => {
      const result = buildJsonRelationshipGraph({});
      expect(result.nodes).toHaveLength(1); // root only
      expect(result.edges).toHaveLength(0);
      expect(result.nodes[0].id).toBe('$');
      expect(result.nodes[0].valueType).toBe('object');
      expect(result.nodes[0].childCount).toBe(0);
    });

    it('handles an empty array', () => {
      const result = buildJsonRelationshipGraph([]);
      expect(result.nodes).toHaveLength(1); // root only
      expect(result.edges).toHaveLength(0);
      expect(result.nodes[0].valueType).toBe('array');
    });

    it('handles null at root', () => {
      const result = buildJsonRelationshipGraph(null);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].valueType).toBe('null');
    });

    it('handles a string at root', () => {
      const result = buildJsonRelationshipGraph('hello');
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].valueType).toBe('string');
      expect(result.nodes[0].sampleValue).toBe('hello');
    });

    it('handles a number at root', () => {
      const result = buildJsonRelationshipGraph(42);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].valueType).toBe('number');
      expect(result.nodes[0].sampleValue).toBe('42');
    });

    it('handles a boolean at root', () => {
      const result = buildJsonRelationshipGraph(true);
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].valueType).toBe('boolean');
      expect(result.nodes[0].sampleValue).toBe('true');
    });

    it('handles deeply nested objects', () => {
      let obj: Record<string, unknown> = { leaf: 'deep' };
      for (let i = 0; i < 10; i++) {
        obj = { [`level${i}`]: obj };
      }
      const result = buildJsonRelationshipGraph(obj);
      expect(result.stats.maxDepth).toBe(10); // 10 levels (leaf is bundled inside level0)
      expect(result.truncated).toBe(false);
    });

    it('handles array of mixed primitives', () => {
      const result = buildJsonRelationshipGraph([1, 'two', true, null]);
      const ids = nodeIds(result);
      expect(ids).toContain('$[0]');
      expect(ids).toContain('$[1]');
      expect(ids).toContain('$[2]');
      expect(ids).toContain('$[3]');
    });

    it('handles arrays of arrays (nested arrays)', () => {
      const result = buildJsonRelationshipGraph([[1, 2], [3, 4]]);
      expect(nodeIds(result)).toContain('$[0]');
      expect(nodeIds(result)).toContain('$[0][0]');
    });
  });

  // ━━ Graph options / limits ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('graph options and limits', () => {
    it('uses default MAX_GRAPH_NODES and MAX_GRAPH_EDGES constants', () => {
      expect(MAX_GRAPH_NODES).toBe(300);
      expect(MAX_GRAPH_EDGES).toBe(600);
    });

    it('respects custom maxNodes option', () => {
      // Build a multi-layered nested structure to trigger node count truncation
      const nested: any = {};
      let curr = nested;
      for (let i = 0; i < 20; i++) {
        curr.child = {};
        curr = curr.child;
      }
      const result = buildJsonRelationshipGraph(nested, { maxNodes: 8 });
      expect(result.truncated).toBe(true);
      expect(result.nodes.length).toBeLessThanOrEqual(8);
    });

    it('respects custom maxEdges option', () => {
      const nested: any = {};
      let curr = nested;
      for (let i = 0; i < 20; i++) {
        curr.child = {};
        curr = curr.child;
      }
      const result = buildJsonRelationshipGraph(nested, { maxEdges: 4 });
      expect(result.truncated).toBe(true);
      expect(result.edges.length).toBeLessThanOrEqual(4);
    });

    it('respects custom maxDepth option', () => {
      const deep = { a: { b: { c: { d: { e: 'leaf' } } } } };
      const result = buildJsonRelationshipGraph(deep, { maxDepth: 2 });
      expect(result.truncated).toBe(true);
      expect(result.stats.maxDepth).toBeLessThanOrEqual(2);
    });

    it('truncation reason mentions node cap when nodes exceed', () => {
      const nested: any = {};
      let curr = nested;
      for (let i = 0; i < 20; i++) {
        curr.child = {};
        curr = curr.child;
      }
      const result = buildJsonRelationshipGraph(nested, { maxNodes: 5 });
      expect(result.truncationReason).toMatch(/node cap/i);
    });

    it('truncation reason mentions edge cap when edges exceed', () => {
      const nested: any = {};
      let curr = nested;
      for (let i = 0; i < 20; i++) {
        curr.child = {};
        curr = curr.child;
      }
      const result = buildJsonRelationshipGraph(nested, { maxNodes: 50, maxEdges: 3 });
      expect(result.truncationReason).toMatch(/edge cap/i);
    });

    it('truncation reason mentions max depth when depth exceeded', () => {
      const deep = { a: { b: { c: 'x' } } };
      const result = buildJsonRelationshipGraph(deep, { maxDepth: 1 });
      expect(result.truncationReason).toMatch(/max depth/i);
    });
  });

  // ━━ Node properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('node properties', () => {
    it('sets correct sampleValue for primitive leaves', () => {
      // Leaf primitive nodes get values set, while aggregated parent objects do not.
      const input = ['Alice', 99, false];
      const result = buildJsonRelationshipGraph(input);

      const name = result.nodes.find((n) => n.id === '$[0]');
      expect(name?.sampleValue).toBe('Alice');

      const count = result.nodes.find((n) => n.id === '$[1]');
      expect(count?.sampleValue).toBe('99');

      const active = result.nodes.find((n) => n.id === '$[2]');
      expect(active?.sampleValue).toBe('false');
    });

    it('sets parentId correctly', () => {
      const input = { a: { b: {} } };
      const result = buildJsonRelationshipGraph(input);

      const nodeA = result.nodes.find((n) => n.id === '$.a');
      expect(nodeA?.parentId).toBe('$');

      const nodeB = result.nodes.find((n) => n.id === '$.a.b');
      expect(nodeB?.parentId).toBe('$.a');
    });

    it('sets depth correctly for nested structures', () => {
      const input = { l1: { l2: { l3: {} } } };
      const result = buildJsonRelationshipGraph(input);

      expect(result.nodes.find((n) => n.id === '$')?.depth).toBe(0);
      expect(result.nodes.find((n) => n.id === '$.l1')?.depth).toBe(1);
      expect(result.nodes.find((n) => n.id === '$.l1.l2')?.depth).toBe(2);
      expect(result.nodes.find((n) => n.id === '$.l1.l2.l3')?.depth).toBe(3);
    });

    it('sets childCount accurately', () => {
      const input = { a: {}, b: {}, c: { d: {}, e: {} } };
      const result = buildJsonRelationshipGraph(input);

      const root = result.nodes.find((n) => n.id === '$');
      expect(root?.childCount).toBe(3); // a, b, c

      const c = result.nodes.find((n) => n.id === '$.c');
      expect(c?.childCount).toBe(2); // d, e
    });
  });

  // ━━ Edge properties ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('edge properties', () => {
    it('all edges have relation "contains"', () => {
      const result = buildJsonRelationshipGraph({ a: { b: {} }, c: [1, 2] });
      for (const edge of result.edges) {
        expect(edge.relation).toBe('contains');
      }
    });

    it('edge ids follow from->to format', () => {
      const result = buildJsonRelationshipGraph({ a: {} });
      const edge = result.edges.find((e) => e.from === '$' && e.to === '$.a');
      expect(edge?.id).toBe('$->$.a');
    });
  });

  // ━━ Determinism / stability ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('determinism', () => {
    it('produces identical results for the superhero JSON across calls', () => {
      const r1 = buildJsonRelationshipGraph(SUPERHERO_JSON);
      const r2 = buildJsonRelationshipGraph(SUPERHERO_JSON);
      expect(nodeIds(r1)).toEqual(nodeIds(r2));
      expect(edgeIds(r1)).toEqual(edgeIds(r2));
      expect(r1.stats).toEqual(r2.stats);
    });

    it('sorts nodes and edges by id for stable output', () => {
      const input = { z: {}, a: {}, m: {} };
      const result = buildJsonRelationshipGraph(input);

      const ids = nodeIds(result);
      const sortedIds = [...ids].sort((a, b) => a.localeCompare(b));
      expect(ids).toEqual(sortedIds);

      const eIds = edgeIds(result);
      const sortedEIds = [...eIds].sort((a, b) => a.localeCompare(b));
      expect(eIds).toEqual(sortedEIds);
    });
  });

  // ━━ Stats accuracy ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  describe('stats accuracy', () => {
    it('totalNodes matches nodes array length', () => {
      const result = buildJsonRelationshipGraph(SUPERHERO_JSON);
      expect(result.stats.totalNodes).toBe(result.nodes.length);
    });

    it('totalEdges matches edges array length', () => {
      const result = buildJsonRelationshipGraph(SUPERHERO_JSON);
      expect(result.stats.totalEdges).toBe(result.edges.length);
    });

    it('maxDepth equals the maximum depth among all nodes', () => {
      const result = buildJsonRelationshipGraph(SUPERHERO_JSON);
      const actualMax = Math.max(...result.nodes.map((n) => n.depth));
      expect(result.stats.maxDepth).toBe(actualMax);
    });
  });
});
