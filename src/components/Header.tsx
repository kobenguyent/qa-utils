import React, { useState, useEffect, useRef } from 'react';
import { Container, Nav, Navbar, NavDropdown, Form, Dropdown } from "react-bootstrap";
import { searchItems, SearchItem } from '../utils/searchData';
import { Theme, getStoredTheme, setStoredTheme, applyTheme } from '../utils/themeManager';

export const Header: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [theme, setTheme] = useState<Theme>('auto');
  const searchRef = useRef<HTMLDivElement>(null);

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme();
    setTheme(storedTheme);
    applyTheme(storedTheme);

    // Listen for system theme changes when in auto mode
    const handleChange = () => {
      const currentTheme = getStoredTheme();
      if (currentTheme === 'auto') {
        applyTheme('auto');
      }
    };

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, []); // Empty dependency array - only run once on mount

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

  // Handle theme change
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    setStoredTheme(newTheme);
    applyTheme(newTheme);
  };

  // Handle search result click
  const handleSearchResultClick = (path: string) => {
    window.location.hash = path;
    setSearchQuery('');
    setShowSearchResults(false);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('navbar-search') as HTMLInputElement;
        searchInput?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        <Navbar.Brand href='#' data-testid="logo" className="fw-bold">
          QA Utils
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
            
            {/* Converters & Formatters */}
            <NavDropdown 
              title="🔄 Converters" 
              id="nav-dropdown-converters"
              aria-label="Converters menu"
            >
              <NavDropdown.Item href="#/jwtDebugger">🔑 JWT Debugger</NavDropdown.Item>
              <NavDropdown.Item href="#/base64">🛸 Base64</NavDropdown.Item>
              <NavDropdown.Item href="#/timestamp">⏰ Timestamp</NavDropdown.Item>
              <NavDropdown.Item href="#/jsonFormatter">﹛﹜ JSON</NavDropdown.Item>
            </NavDropdown>

            {/* Generators */}
            <NavDropdown 
              title="🎲 Generators" 
              id="nav-dropdown-generators"
              aria-label="Generators menu"
            >
              <NavDropdown.Item href="#/uuid">🆔 UUID</NavDropdown.Item>
              <NavDropdown.Item href="#/otp">🔐 OTP</NavDropdown.Item>
              <NavDropdown.Item href="#/password">🔑 Password</NavDropdown.Item>
              <NavDropdown.Item href="#/hash">🔐 Hash</NavDropdown.Item>
              <NavDropdown.Item href="#/htpasswd">🔒 HTPasswd</NavDropdown.Item>
              <NavDropdown.Item href="#/lorem-ipsum">📝 Lorem Ipsum</NavDropdown.Item>
              <NavDropdown.Item href="#/jiraComment">📋 JIRA</NavDropdown.Item>
              <NavDropdown.Item href="#/character-counter">🔢 Counter</NavDropdown.Item>
            </NavDropdown>

            {/* API Testing */}
            <NavDropdown 
              title="🌐 API" 
              id="nav-dropdown-api"
              aria-label="API Testing menu"
            >
              <NavDropdown.Item href="#/rest-client">🌐 REST</NavDropdown.Item>
              <NavDropdown.Item href="#/websocket-client">🔌 WebSocket</NavDropdown.Item>
              <NavDropdown.Item href="#/grpc-client">⚡ gRPC</NavDropdown.Item>
            </NavDropdown>

            {/* Developer Tools */}
            <NavDropdown 
              title="🔧 Tools" 
              id="nav-dropdown-tools"
              aria-label="Developer Tools menu"
            >
              <NavDropdown.Item href="#/ai-chat">🤖 AI Chat</NavDropdown.Item>
              <NavDropdown.Item href="#/encryption">🔒 Encryption</NavDropdown.Item>
              <NavDropdown.Item href="#/playwright2codecept">🎭 PW→CodeceptJS</NavDropdown.Item>
              <NavDropdown.Item href="#/workflow-generator">🚀 CI/CD</NavDropdown.Item>
            </NavDropdown>

            {/* Learning */}
            <NavDropdown 
              title="📚 Learn" 
              id="nav-dropdown-learn"
              aria-label="Learning menu"
            >
              <NavDropdown.Item href="#/codeceptjs">🔥 CodeceptJS Hints</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#/ivr">📞 IVR</NavDropdown.Item>
              <NavDropdown.Item href="#/blf">💡 BLF</NavDropdown.Item>
              <NavDropdown.Item href="#/sip">📡 SIP</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="#/ctfl">🎓 ISTQB CTFL</NavDropdown.Item>
            </NavDropdown>
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
                onClick={() => handleThemeChange('light')}
                active={theme === 'light'}
              >
                ☀️ Light
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => handleThemeChange('dark')}
                active={theme === 'dark'}
              >
                🌙 Dark
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => handleThemeChange('auto')}
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
