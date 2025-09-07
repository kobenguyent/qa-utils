import { describe, it, expect } from 'vitest';

describe('Navigation Helpers', () => {
  it('should generate correct navigation URLs', () => {
    const createNavLink = (path: string) => `#/${path}`;
    
    expect(createNavLink('home')).toBe('#/home');
    expect(createNavLink('jwtDebugger')).toBe('#/jwtDebugger');
    expect(createNavLink('base64')).toBe('#/base64');
    expect(createNavLink('')).toBe('#/');
  });

  it('should validate menu item structure', () => {
    const createMenuItem = (title: string, path: string, icon?: string) => ({
      title: icon ? `${icon} ${title}` : title,
      href: `#/${path}`,
      hasIcon: !!icon
    });

    expect(createMenuItem('Home', 'home', '🏠')).toEqual({
      title: '🏠 Home',
      href: '#/home',
      hasIcon: true
    });

    expect(createMenuItem('Settings', 'settings')).toEqual({
      title: 'Settings',
      href: '#/settings',
      hasIcon: false
    });
  });

  it('should handle dropdown menu categorization', () => {
    const categorizeMenuItems = (items: Array<{category: string, items: string[]}>) => {
      return items.reduce((acc, category) => {
        acc[category.category] = category.items.length;
        return acc;
      }, {} as Record<string, number>);
    };

    const menuStructure = [
      { category: 'Hints', items: ['CodeceptJS'] },
      { category: 'Terms', items: ['IVR', 'BLF', 'SIP'] },
      { category: 'Utils', items: ['JWT', 'Base64', 'Timestamp', 'JSON', 'UUID'] }
    ];

    expect(categorizeMenuItems(menuStructure)).toEqual({
      Hints: 1,
      Terms: 3,
      Utils: 5
    });
  });

  it('should handle active navigation state', () => {
    const getNavItemState = (currentPath: string, itemPath: string) => ({
      isActive: currentPath === itemPath,
      className: currentPath === itemPath ? 'nav-link active' : 'nav-link'
    });

    expect(getNavItemState('/home', '/home')).toEqual({
      isActive: true,
      className: 'nav-link active'
    });

    expect(getNavItemState('/home', '/about')).toEqual({
      isActive: false,
      className: 'nav-link'
    });
  });

  it('should format navigation accessibility attributes', () => {
    const getAccessibilityProps = (label: string, expanded = false) => ({
      'aria-label': label,
      'aria-expanded': expanded,
      'aria-controls': expanded ? `${label.toLowerCase()}-menu` : undefined
    });

    expect(getAccessibilityProps('Utils menu', true)).toEqual({
      'aria-label': 'Utils menu',
      'aria-expanded': true,
      'aria-controls': 'utils menu-menu'
    });

    expect(getAccessibilityProps('Terms menu')).toEqual({
      'aria-label': 'Terms menu',
      'aria-expanded': false,
      'aria-controls': undefined
    });
  });
});