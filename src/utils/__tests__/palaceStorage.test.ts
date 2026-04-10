import { describe, it, expect, beforeEach, vi } from 'vitest';
import { addAnchor, removeAnchor, isAnchored, loadAnchors, saveAnchors } from '../palaceStorage';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

beforeEach(() => {
  localStorageMock.clear();
});

describe('palaceStorage', () => {
  it('starts with no anchors', () => {
    expect(loadAnchors()).toHaveLength(0);
  });

  it('adds an anchor', () => {
    addAnchor({ toolPath: '#/uuid', toolTitle: 'UUID', toolIcon: '🆔', roomIcon: '⚗️', roomName: 'Generator Lab' });
    expect(loadAnchors()).toHaveLength(1);
  });

  it('does not add duplicate anchors', () => {
    addAnchor({ toolPath: '#/uuid', toolTitle: 'UUID', toolIcon: '🆔', roomIcon: '⚗️', roomName: 'Generator Lab' });
    addAnchor({ toolPath: '#/uuid', toolTitle: 'UUID', toolIcon: '🆔', roomIcon: '⚗️', roomName: 'Generator Lab' });
    expect(loadAnchors()).toHaveLength(1);
  });

  it('removes an anchor', () => {
    addAnchor({ toolPath: '#/uuid', toolTitle: 'UUID', toolIcon: '🆔', roomIcon: '⚗️', roomName: 'Generator Lab' });
    removeAnchor('#/uuid');
    expect(loadAnchors()).toHaveLength(0);
  });

  it('isAnchored returns true for pinned tool', () => {
    addAnchor({ toolPath: '#/uuid', toolTitle: 'UUID', toolIcon: '🆔', roomIcon: '⚗️', roomName: 'Generator Lab' });
    expect(isAnchored('#/uuid')).toBe(true);
  });

  it('isAnchored returns false for unpinned tool', () => {
    expect(isAnchored('#/uuid')).toBe(false);
  });

  it('saveAnchors / loadAnchors round trip', () => {
    const anchors = [{ id: '1', toolPath: '#/p', toolTitle: 'P', toolIcon: '🔵', roomIcon: '🔵', roomName: 'R', position: 0, pinnedAt: 0 }];
    saveAnchors(anchors);
    expect(loadAnchors()).toHaveLength(1);
    expect(loadAnchors()[0].toolTitle).toBe('P');
  });
});
