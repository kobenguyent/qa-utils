import React, { useState, useEffect, useRef } from 'react';
import { Container, Nav, Navbar, Form, Dropdown } from "react-bootstrap";
import { searchItems, SearchItem } from '../utils/searchData';
import { navigationConfig, NAV_GROUP_ORDER, NAV_GROUP_META, NavGroup } from '../config/navigationConfig';
import { useTheme } from '../contexts/ThemeContext';
import { getEffectiveTheme } from '../utils/themeManager';
import qaLogoLight from '../assets/logo-icon.png';
// Dark mode variants — swap the active import to preview each:
// import qaLogoDark from '../assets/logo-icon-dark-liquid.png';  // ✦ Liquid Glass (violet→indigo→teal)
// import qaLogoDark from '../assets/logo-icon-dark-cyan.png';    // A: Cyan + Amber ⚡
import qaLogoDark from '../assets/logo-icon-dark-nebula.png'; // B: Nebula Violet + Cyan 🔮
// import qaLogoDark from '../assets/logo-icon-dark-star.png';   // C: Starlight + Gold ✨
// import qaLogoDark from '../assets/logo-icon-dark.png';        // Original: Gold

// Pre-group nav items by NavGroup for efficient rendering.
const navItemsByGroup = NAV_GROUP_ORDER.reduce<Record<NavGroup, typeof navigationConfig>>((acc, group) => {
  acc[group] = navigationConfig.filter(item => item.navGroups.includes(group));
  return acc;
}, {} as Record<NavGroup, typeof navigationConfig>);

// Active path helper
const getActivePath = () => window.location.hash || '#/';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [activePath, setActivePath] = useState(getActivePath);
  const [openGroup, setOpenGroup] = useState<NavGroup | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navRef = useRef<HTMLDivElement>(null);

  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const onHash = () => setActivePath(getActivePath());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

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
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenGroup(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchResultClick = (path: string) => {
    window.location.hash = path;
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <Navbar expand="lg" className="glass-navbar" style={{ backgroundColor: 'var(--navbar-bg)', paddingTop: '0.85rem' }}>
      <Container fluid className="px-3 px-lg-4">
        <Navbar.Brand href='#' data-testid="logo" className="navbar-brand-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src={getEffectiveTheme(theme) === 'dark' ? qaLogoDark : qaLogoLight} alt="Kobean QA Utils" style={{ height: '40px', width: 'auto' }} />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" aria-label="Toggle navigation" />
        <Navbar.Collapse id="basic-navbar-nav">
          <div ref={navRef} className="d-flex align-items-lg-center">
          <Nav className="me-auto align-items-lg-center">
            <Nav.Link href="#/" aria-label="Go to home page" className="glass-link">
              🏠 Home
            </Nav.Link>

            {NAV_GROUP_ORDER.map(group => {
              const meta = NAV_GROUP_META[group];
              const items = navItemsByGroup[group];
              const isOpen = openGroup === group;

              return (
                <div
                  key={group}
                  className="position-relative"
                  ref={el => { dropdownRefs.current[group] = el; }}
                >
                  {/* Toggle button */}
                  <button
                    className={`glass-link nav-link d-flex align-items-center gap-1${isOpen ? ' active' : ''}`}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '0.45rem 0.85rem',
                      color: isOpen ? 'var(--primary)' : 'var(--text)',
                      fontWeight: 500,
                      fontSize: '0.88rem',
                      letterSpacing: '0.01em',
                      borderRadius: 'var(--radius-sm)',
                      transition: 'all var(--duration) var(--ease)',
                    }}
                    onClick={() => setOpenGroup(isOpen ? null : group)}
                  >
                    {meta.title}
                    <svg
                      width="10" height="10" viewBox="0 0 10 10"
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                        transition: 'transform var(--duration) var(--ease)',
                        opacity: 0.55,
                        marginLeft: 2,
                      }}
                    >
                      <path d="M1 3 L5 7 L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                    </svg>
                  </button>

                  {/* Mega dropdown panel */}
                  {isOpen && (
                    <div
                      className="glass-dropdown-panel mega-dropdown-panel"
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        minWidth: '300px',
                        maxWidth: '360px',
                        background: 'var(--dropdown-bg)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        backdropFilter: 'blur(24px) saturate(180%)',
                        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
                        padding: '0.35rem',
                        zIndex: 1050,
                        animation: 'dropdownReveal 0.18s var(--ease) both',
                      }}
                    >
                      {/* Group header */}
                      <div style={{
                        padding: '0.45rem 0.75rem 0.4rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid var(--border-color)',
                        marginBottom: '0.3rem',
                      }}>
                        <span style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.6px', textTransform: 'uppercase', color: 'var(--muted)' }}>
                          {meta.icon} {group}
                        </span>
                        <span style={{
                          fontSize: '0.62rem',
                          fontWeight: 600,
                          padding: '0.1rem 0.4rem',
                          borderRadius: '999px',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--muted)',
                        }}>
                          {items.length}
                        </span>
                      </div>

                      {items.map(item => {
                        const isActive = activePath === item.path;
                        return (
                          <React.Fragment key={item.path + group}>
                            {item.dividerBefore && (
                              <div style={{ height: '1px', background: 'var(--border-color)', margin: '0.25rem 0.5rem' }} />
                            )}
                            <a
                              href={item.path}
                              onClick={() => setOpenGroup(null)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.65rem',
                                padding: '0.5rem 0.7rem',
                                borderRadius: 'var(--radius-sm)',
                                textDecoration: 'none',
                                color: isActive ? 'var(--primary)' : 'var(--text)',
                                background: isActive ? 'var(--primary-light)' : 'transparent',
                                transition: 'background var(--duration) var(--ease), color var(--duration) var(--ease)',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => {
                                if (!isActive) {
                                  (e.currentTarget as HTMLElement).style.background = 'var(--glass-nav-hover)';
                                  (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                                }
                              }}
                              onMouseLeave={e => {
                                if (!isActive) {
                                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                                  (e.currentTarget as HTMLElement).style.color = 'var(--text)';
                                }
                              }}
                            >
                              {/* Icon bubble */}
                              <span style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: 'var(--radius-sm)',
                                background: isActive ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                border: `1px solid ${isActive ? 'var(--border-hover)' : 'var(--border-color)'}`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1rem',
                                flexShrink: 0,
                                transition: 'background var(--duration) var(--ease)',
                              }}>
                                {item.navIcon ?? item.icon}
                              </span>

                              {/* Text */}
                              <span style={{ flex: 1, minWidth: 0 }}>
                                <span style={{
                                  display: 'block',
                                  fontWeight: 600,
                                  fontSize: '0.84rem',
                                  lineHeight: 1.25,
                                  letterSpacing: '-0.01em',
                                }}>
                                  {item.navLabel ?? item.title}
                                </span>
                                <span style={{
                                  display: 'block',
                                  fontSize: '0.71rem',
                                  color: 'var(--muted)',
                                  lineHeight: 1.35,
                                  marginTop: '0.1rem',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}>
                                  {item.description}
                                </span>
                              </span>

                              {/* Active pip */}
                              {isActive && (
                                <span style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'var(--primary)',
                                  flexShrink: 0,
                                }} />
                              )}
                            </a>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </Nav>
          </div>
          {/* Search + Theme row */}
          <div className="d-flex align-items-center gap-2 mt-lg-0 mt-2 pb-lg-0 pb-2 ms-auto" style={{ maxWidth: '380px' }}>
          <div className="position-relative flex-grow-1" ref={searchRef}>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)',
                pointerEvents: 'none', opacity: 0.4, fontSize: '0.85rem',
              }}>🔍</span>
              <Form.Control
                id="navbar-search"
                type="search"
                placeholder={`Search tools… (${navigator.platform.includes('Mac') ? '⌘' : 'Ctrl+'}K)`}
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery && setShowSearchResults(true)}
                aria-label="Search tools"
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text)',
                  borderRadius: '999px',
                  paddingLeft: '2.3rem',
                  paddingRight: '1rem',
                  height: '38px',
                  fontSize: '0.84rem',
                  transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                }}
                onFocusCapture={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring), 0 2px 12px var(--input-focus-ring)';
                  e.currentTarget.style.backgroundColor = 'var(--input-bg)';
                }}
                onBlurCapture={e => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                }}
              />
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div
                className="position-absolute mt-1"
                style={{ zIndex: 1050, top: '100%', left: 0, width: '100%' }}
              >
                <Dropdown.Menu show style={{
                  maxHeight: '380px',
                  overflowY: 'auto',
                  backgroundColor: 'var(--dropdown-bg)',
                  borderColor: 'var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-lg)',
                  backdropFilter: 'blur(20px)',
                  zIndex: 1051,
                  position: 'static',
                  width: '100%',
                  padding: '0.35rem',
                }}>
                  {searchResults.map((result, index) => (
                    <Dropdown.Item
                      key={index}
                      onClick={() => handleSearchResultClick(result.path)}
                      style={{
                        cursor: 'pointer',
                        whiteSpace: 'normal',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.65rem',
                        color: 'var(--text)',
                      }}
                    >
                      <span style={{
                        width: '28px', height: '28px',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.95rem', flexShrink: 0,
                      }}>
                        {result.icon}
                      </span>
                      <span>
                        <span style={{ display: 'block', fontWeight: 600, fontSize: '0.84rem' }}>
                          {result.title}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--muted)' }}>
                          {result.description}
                        </span>
                      </span>
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </div>
            )}
          </div>

          {/* Theme toggle — single cycling button */}
          <button
            onClick={() => {
              const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'auto' : 'light';
              setTheme(next);
            }}
            aria-label={`Theme: ${theme}. Click to switch.`}
            title={`Theme: ${theme === 'light' ? 'Light' : theme === 'dark' ? 'Dark' : 'Auto'}`}
            className="theme-cycle-btn"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              cursor: 'pointer',
              flexShrink: 0,
              overflow: 'hidden',
              transition: 'border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--input-focus-ring)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span
              key={theme}
              style={{
                fontSize: '1.15rem',
                lineHeight: 1,
                animation: 'themeIconSpin 0.35s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              {theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '💫'}
            </span>
          </button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
