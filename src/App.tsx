import './App.css'
import {Header} from "./components/Header.tsx";
import {Container} from "react-bootstrap";
import {Footer} from "./components/Footer.tsx";
import {Home} from "./components/Home.tsx";
import { useEffect } from 'react';
import { trackPageView } from './utils/umami.ts';

function App() {
  // This function is used to track the page view using the current hash.
  const trackCurrentHash = () => {
    const currentHash = window.location.hash || '#';
    trackPageView(currentHash);
  };

  useEffect(() => {
    // Track the initial load
    trackCurrentHash();

    // Set up a listener for hash changes
    window.addEventListener('hashchange', trackCurrentHash);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener('hashchange', trackCurrentHash);
    };
  }, []);

  return (
    <Container>
      <Header></Header>
      <Home></Home>
      <Footer></Footer>
    </Container>
  )
}

export default App
