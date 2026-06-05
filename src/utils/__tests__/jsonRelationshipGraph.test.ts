import { describe, it, expect } from 'vitest';
import { buildJsonRelationshipGraph } from '../jsonRelationshipGraph';

describe('buildJsonRelationshipGraph', () => {
  it('builds hierarchy nodes and edges for nested objects, bundling primitives inside parent nodes', () => {
    const input = {
      user: {
        profile: {
          name: 'John',
          age: 30,
        },
      },
      active: true,
    };

    const result = buildJsonRelationshipGraph(input);

    expect(result.truncated).toBe(false);
    expect(result.nodes.find((n) => n.id === '$')).toBeTruthy();
    expect(result.nodes.find((n) => n.id === '$.user')).toBeTruthy();
    expect(result.nodes.find((n) => n.id === '$.user.profile')).toBeTruthy();

    // Primitives must not have separate nodes
    expect(result.nodes.find((n) => n.id === '$.user.profile.name')).toBeFalsy();
    expect(result.nodes.find((n) => n.id === '$.active')).toBeFalsy();

    expect(result.edges.find((e) => e.from === '$' && e.to === '$.user')).toBeTruthy();
    expect(result.edges.find((e) => e.from === '$.user' && e.to === '$.user.profile')).toBeTruthy();

    const root = result.nodes.find((n) => n.id === '$');
    expect(root?.label).toBe('root\nactive: true');
    expect(root?.childCount).toBe(1); // Only $.user is a child node

    const profile = result.nodes.find((n) => n.id === '$.user.profile');
    expect(profile?.label).toBe('profile\nage: 30\nname: John');
  });

  it('models arrays and individual elements with index suffixes', () => {
    const input = {
      items: [
        { id: 1, name: 'A' },
        { id: 2 },
      ],
    };

    const result = buildJsonRelationshipGraph(input);

    expect(result.nodes.find((n) => n.id === '$.items' && n.label === 'items')).toBeTruthy();
    expect(result.nodes.find((n) => n.id === '$.items[0]' && n.label === '0\nid: 1\nname: A')).toBeTruthy();
    expect(result.nodes.find((n) => n.id === '$.items[1]' && n.label === '1\nid: 2')).toBeTruthy();
    
    expect(result.edges.find((e) => e.from === '$.items' && e.to === '$.items[0]')).toBeTruthy();
    expect(result.edges.find((e) => e.from === '$.items' && e.to === '$.items[1]')).toBeTruthy();
  });

  it('handles primitive arrays with separate leaf nodes', () => {
    const input = {
      tags: ['a', 'b'],
    };

    const result = buildJsonRelationshipGraph(input);

    expect(result.nodes.find((n) => n.id === '$.tags' && n.label === 'tags')).toBeTruthy();
    expect(result.nodes.find((n) => n.id === '$.tags[0]' && n.label === 'a')).toBeTruthy();
    expect(result.nodes.find((n) => n.id === '$.tags[1]' && n.label === 'b')).toBeTruthy();
  });

  it('generates stable ids and paths for the same input', () => {
    const input = {
      a: {
        b: [1, 2],
      },
      c: 'x',
    };

    const first = buildJsonRelationshipGraph(input);
    const second = buildJsonRelationshipGraph(input);

    expect(first.nodes.map((n) => n.id)).toEqual(second.nodes.map((n) => n.id));
    expect(first.edges.map((e) => e.id)).toEqual(second.edges.map((e) => e.id));
  });

  it('truncates when node or edge limits are exceeded', () => {
    const input = {
      one: [ { a: 1 }, { b: 2 } ],
      two: [ { c: 3 }, { d: 4 } ],
    };

    const result = buildJsonRelationshipGraph(input, { maxNodes: 4 });

    expect(result.truncated).toBe(true);
    expect(result.truncationReason).toBeTruthy();
    expect(result.nodes.length).toBeLessThanOrEqual(4);
  });
});
