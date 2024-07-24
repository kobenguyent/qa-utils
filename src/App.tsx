import './App.css'
import {Header} from "./components/Header.tsx";
import {Container} from "react-bootstrap";
import {Footer} from "./components/Footer.tsx";
import {Home} from "./components/Home.tsx";
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from './utils/umami.ts';

function App() {

  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  return (
    <Container>
      <Header></Header>
      <Home></Home>
      <Footer></Footer>
    </Container>
  )
}

export default App
