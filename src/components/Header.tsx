import React, { useState, useEffect, useRef } from 'react';
import { Container, Nav, Navbar, NavDropdown, Form, Dropdown } from "react-bootstrap";
import { searchItems, SearchItem } from '../utils/searchData';
import { navigationConfig, NAV_GROUP_ORDER, NAV_GROUP_META, NavGroup } from '../config/navigationConfig';
import { useTheme } from '../contexts/ThemeContext';

// Pre-group nav items by NavGroup for efficient rendering.
const navItemsByGroup = NAV_GROUP_ORDER.reduce<Record<NavGroup, typeof navigationConfig>>((acc, group) => {
  acc[group] = navigationConfig.filter(item => item.navGroups.includes(group));
  return acc;
}, {} as Record<NavGroup, typeof navigationConfig>);

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchItems(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search result click
  const handleSearchResultClick = (path: string) => {
    window.location.hash = path;
    setSearchQuery('');
    setShowSearchResults(false);
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'auto': return '💫';
    }
  };

  return (
    <Navbar expand="lg" className="glass-navbar shadow-sm" style={{ backgroundColor: 'var(--navbar-bg)' }}>
      <Container>
        <Navbar.Brand href='#' data-testid="logo" className="navbar-brand-gradient">
          ⚙️ QA Utils
        </Navbar.Brand>
        <Navbar.Toggle
          aria-controls="basic-navbar-nav"
          aria-label="Toggle navigation"
        />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="#/" aria-label="Go to home page" className="glass-link">
              🏠 Home
            </Nav.Link>

            {NAV_GROUP_ORDER.map(group => {
              const meta = NAV_GROUP_META[group];
              const items = navItemsByGroup[group];
              return (
                <NavDropdown
                  key={group}
                  title={meta.title}
                  id={meta.id}
                  aria-label={meta.ariaLabel}
                >
                  {items.map(item => (
                    <React.Fragment key={item.path + group}>
                      {item.dividerBefore && <NavDropdown.Divider />}
                      <NavDropdown.Item href={item.path}>
                        {item.navIcon ?? item.icon} {item.navLabel ?? item.title}
                      </NavDropdown.Item>
                    </React.Fragment>
                  ))}
                </NavDropdown>
              );
            })}
          </Nav>

          {/* Search */}
          <div className="position-relative me-2" ref={searchRef} style={{ minWidth: '300px' }}>
            <Form.Control
              id="navbar-search"
              type="search"
              placeholder={`Search tools... (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}K)`}
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSearchResults(true)}
              aria-label="Search tools"
              style={{
                backgroundColor: 'var(--input-bg)',
                borderColor: 'var(--input-border)',
                color: 'var(--text)'
              }}
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results position-absolute mt-1" style={{ zIndex: 1050, top: '100%', left: 0, minWidth: '300px' }}>
                <Dropdown.Menu show style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--dropdown-bg)',
                  borderColor: 'var(--border-color)',
                  zIndex: 1051,
                  position: 'static',
                  width: '100%'
                }}>
                  {searchResults.map((result, index) => (
                    <Dropdown.Item
                      key={index}
                      onClick={() => handleSearchResultClick(result.path)}
                      style={{ cursor: 'pointer', whiteSpace: 'normal' }}
                    >
                      <div>
                        <strong>{result.icon} {result.title}</strong>
                        <div className="small text-muted">{result.description}</div>
                      </div>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </div>
            )}
          </div>

          {/* Theme Switcher */}
          <Dropdown align="end">
            <Dropdown.Toggle
              variant="link"
              id="theme-dropdown"
              className="text-decoration-none"
              style={{ color: 'var(--text)' }}
              aria-label="Theme selector"
            >
              {getThemeIcon()}
            </Dropdown.Toggle>
            <Dropdown.Menu style={{
              backgroundColor: 'var(--dropdown-bg)',
              borderColor: 'var(--border-color)'
            }}>
              <Dropdown.Item
                onClick={() => setTheme('light')}
                active={theme === 'light'}
              >
                ☀️ Light
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => setTheme('dark')}
                active={theme === 'dark'}
              >
                🌙 Dark
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => setTheme('auto')}
                active={theme === 'auto'}
              >
                💫 Auto
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  )
}
