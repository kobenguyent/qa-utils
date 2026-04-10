/**
 * Palace Storage — localStorage helpers for Personal Workflow Palace anchors.
 */

export interface PalaceAnchor {
  id: string;
  toolPath: string;
  toolTitle: string;
  toolIcon: string;
  roomIcon: string;
  roomName: string;
  position: number; // 0-based order in the palace
  pinnedAt: number; // timestamp
}

const PALACE_KEY = 'qa-palace-anchors';

export function loadAnchors(): PalaceAnchor[] {
  try {
    const stored = localStorage.getItem(PALACE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as PalaceAnchor[];
  } catch {
    return [];
  }
}

export function saveAnchors(anchors: PalaceAnchor[]): void {
  localStorage.setItem(PALACE_KEY, JSON.stringify(anchors));
}

export function addAnchor(anchor: Omit<PalaceAnchor, 'id' | 'pinnedAt' | 'position'>): PalaceAnchor[] {
  const anchors = loadAnchors();
  const exists = anchors.find(a => a.toolPath === anchor.toolPath);
  if (exists) return anchors;
  const newAnchor: PalaceAnchor = {
    ...anchor,
    id: `anchor-${Date.now()}`,
    position: anchors.length,
    pinnedAt: Date.now(),
  };
  const updated = [...anchors, newAnchor];
  saveAnchors(updated);
  return updated;
}

export function removeAnchor(toolPath: string): PalaceAnchor[] {
  const anchors = loadAnchors().filter(a => a.toolPath !== toolPath);
  saveAnchors(anchors);
  return anchors;
}

export function isAnchored(toolPath: string): boolean {
  return loadAnchors().some(a => a.toolPath === toolPath);
}

export const ROOM_OPTIONS = [
  { icon: '🔄', name: 'Converter Sanctum' },
  { icon: '⚗️', name: 'Generator Lab' },
  { icon: '🌐', name: 'Protocol Corridor' },
  { icon: '🔧', name: 'The Forge' },
  { icon: '🤖', name: 'AI Workshop' },
  { icon: '🔍', name: 'Observatory' },
  { icon: '🛠️', name: 'Utility Vault' },
  { icon: '🎓', name: 'Learning Tower' },
  { icon: '✅', name: 'Checklist Chambers' },
  { icon: '💡', name: 'Wisdom Hall' },
];
