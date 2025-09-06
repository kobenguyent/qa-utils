import { useEffect, useCallback } from 'react';
import './App.css'
import {Header} from "./components/Header.tsx";
import {Container} from "react-bootstrap";
import {Footer} from "./components/Footer.tsx";
import {Home} from "./components/Home.tsx";
import { trackPageView } from './utils/umami.ts';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

function App() {
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
          <Home />
        </main>
        <Footer />
      </Container>
    </ErrorBoundary>
  )
}

export default App
