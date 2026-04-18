import { describe, it, expect } from 'vitest';
import {
  NAV_GROUP_ORDER,
  NAV_GROUP_META,
  NavGroup,
} from '../../config/navigationConfig';

describe('navigationConfig — NavGroupMeta icon field', () => {
  it('every NavGroup in NAV_GROUP_ORDER has a corresponding entry in NAV_GROUP_META', () => {
    for (const group of NAV_GROUP_ORDER) {
      expect(NAV_GROUP_META[group]).toBeDefined();
    }
  });

  it('every NAV_GROUP_META entry has a non-empty icon string', () => {
    for (const group of NAV_GROUP_ORDER) {
      const meta = NAV_GROUP_META[group];
      expect(typeof meta.icon).toBe('string');
      expect(meta.icon.trim().length).toBeGreaterThan(0);
    }
  });

  it('NAV_GROUP_META icons match expected values', () => {
    const expectedIcons: Record<NavGroup, string> = {
      Converters: '🔄',
      Generators: '🎲',
      API:        '🌐',
      Tools:      '🔧',
      Learn:      '📚',
      Palace:     '🏛️',
    };
    for (const group of NAV_GROUP_ORDER) {
      expect(NAV_GROUP_META[group].icon).toBe(expectedIcons[group]);
    }
  });

  it('NAV_GROUP_META icon is distinct from the full title (icon is extracted separately)', () => {
    for (const group of NAV_GROUP_ORDER) {
      const meta = NAV_GROUP_META[group];
      // The `icon` field should be just the emoji, the `title` includes emoji + label
      expect(meta.title).toContain(meta.icon);
      // icon should be shorter than title (it's only the emoji part)
      expect(meta.icon.length).toBeLessThan(meta.title.length);
    }
  });
});
