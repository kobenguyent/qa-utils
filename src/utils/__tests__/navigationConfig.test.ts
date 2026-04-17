import { describe, it, expect } from 'vitest';
import {
  navigationConfig,
  NAV_GROUP_ORDER,
  NAV_GROUP_META,
  NavGroup,
} from '../../config/navigationConfig';
import { searchData } from '../searchData';

describe('navigationConfig', () => {
  it('contains at least one item', () => {
    expect(navigationConfig.length).toBeGreaterThan(0);
  });

  it('every item has required SearchItem fields', () => {
    for (const item of navigationConfig) {
      expect(item.title, `${item.path} missing title`).toBeTruthy();
      expect(item.description, `${item.path} missing description`).toBeTruthy();
      expect(item.path, `item missing path`).toBeTruthy();
      expect(item.category, `${item.path} missing category`).toBeTruthy();
      expect(Array.isArray(item.keywords), `${item.path} keywords must be array`).toBe(true);
      expect(item.icon, `${item.path} missing icon`).toBeTruthy();
    }
  });

  it('every item has a navGroups array', () => {
    for (const item of navigationConfig) {
      expect(Array.isArray(item.navGroups), `${item.path} navGroups must be array`).toBe(true);
    }
  });

  it('all navGroups values are valid NavGroup keys', () => {
    const validGroups = new Set<NavGroup>(NAV_GROUP_ORDER);
    for (const item of navigationConfig) {
      for (const group of item.navGroups) {
        expect(validGroups.has(group), `${item.path} has unknown navGroup "${group}"`).toBe(true);
      }
    }
  });

  it('has no duplicate paths', () => {
    const seen = new Set<string>();
    for (const item of navigationConfig) {
      expect(seen.has(item.path), `Duplicate path: ${item.path}`).toBe(false);
      seen.add(item.path);
    }
  });

  it('home entry is not in any nav group', () => {
    const home = navigationConfig.find(item => item.path === '#/');
    expect(home).toBeDefined();
    expect(home?.navGroups).toHaveLength(0);
  });

  it('flashcards appears in both Learn and Palace groups', () => {
    const flashcards = navigationConfig.find(item => item.path === '#/flashcards');
    expect(flashcards).toBeDefined();
    expect(flashcards?.navGroups).toContain('Learn');
    expect(flashcards?.navGroups).toContain('Palace');
  });

  it('every dividerBefore item belongs to the Learn group', () => {
    const withDivider = navigationConfig.filter(item => item.dividerBefore);
    for (const item of withDivider) {
      expect(
        item.navGroups.includes('Learn'),
        `${item.path} has dividerBefore but is not in Learn group`,
      ).toBe(true);
    }
  });
});

describe('NAV_GROUP_ORDER and NAV_GROUP_META', () => {
  it('NAV_GROUP_ORDER contains all expected groups', () => {
    expect(NAV_GROUP_ORDER).toEqual(
      expect.arrayContaining(['Converters', 'Generators', 'API', 'Tools', 'Learn', 'Palace']),
    );
    expect(NAV_GROUP_ORDER).toHaveLength(6);
  });

  it('NAV_GROUP_META has an entry for every group in NAV_GROUP_ORDER', () => {
    for (const group of NAV_GROUP_ORDER) {
      expect(NAV_GROUP_META[group], `Missing meta for group "${group}"`).toBeDefined();
      expect(NAV_GROUP_META[group].title).toBeTruthy();
      expect(NAV_GROUP_META[group].id).toBeTruthy();
      expect(NAV_GROUP_META[group].ariaLabel).toBeTruthy();
    }
  });
});

describe('searchData derived from navigationConfig', () => {
  it('has no duplicate paths', () => {
    const seen = new Set<string>();
    for (const item of searchData) {
      expect(seen.has(item.path), `Duplicate search path: ${item.path}`).toBe(false);
      seen.add(item.path);
    }
  });

  it('contains all paths from navigationConfig (de-duplicated)', () => {
    const configPaths = new Set(navigationConfig.map(item => item.path));
    const searchPaths = new Set(searchData.map(item => item.path));
    // Every config path must appear in searchData
    for (const p of configPaths) {
      expect(searchPaths.has(p), `Path ${p} missing from searchData`).toBe(true);
    }
  });

  it('count matches de-duplicated config paths', () => {
    const uniquePaths = new Set(navigationConfig.map(item => item.path));
    expect(searchData).toHaveLength(uniquePaths.size);
  });

  it('every searchData item has all required fields', () => {
    for (const item of searchData) {
      expect(item.title).toBeTruthy();
      expect(item.description).toBeTruthy();
      expect(item.path).toBeTruthy();
      expect(item.category).toBeTruthy();
      expect(Array.isArray(item.keywords)).toBe(true);
      expect(item.icon).toBeTruthy();
    }
  });
});
