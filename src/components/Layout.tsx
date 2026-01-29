import React, { useState, useEffect, useCallback } from 'react';
import { Container } from "react-bootstrap";
import { Header } from "./Header.tsx";
import { Footer } from "./Footer.tsx";
import { trackPageView } from '../utils/umami.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';
import { CommandPalette } from './CommandPalette.tsx';
import { JarvisWidget } from './JarvisWidget.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // This function is used to track the page view using the current hash.
  const trackCurrentHash = useCallback(() => {
    const currentHash = window.location.hash || '#';
    trackPageView(currentHash);
  }, []);

  useEffect(() => {
    // Track the initial load
    trackCurrentHash();

    // Set up a listener for hash changes
    window.addEventListener('hashchange', trackCurrentHash);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('hashchange', trackCurrentHash);
    };
  }, [trackCurrentHash]);

  // Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorBoundary>
      <Container fluid className="d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1">
          {children}
        </main>
        <Footer />
      </Container>
      <CommandPalette
        show={showCommandPalette}
        onHide={() => setShowCommandPalette(false)}
      />
      <JarvisWidget />
    </ErrorBoundary>
  );
};
