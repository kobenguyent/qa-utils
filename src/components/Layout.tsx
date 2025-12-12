import React, { useEffect, useCallback } from 'react';
import { Container } from "react-bootstrap";
import { Header } from "./Header.tsx";
import { Footer } from "./Footer.tsx";
import { trackPageView } from '../utils/umami.ts';
import { ErrorBoundary } from './ErrorBoundary.tsx';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
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

  return (
    <ErrorBoundary>
      <Container fluid className="d-flex flex-column min-vh-100">
        <Header />
        <main className="flex-grow-1">
          {children}
        </main>
        <Footer />
      </Container>
    </ErrorBoundary>
  );
};
