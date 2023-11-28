import './App.css'
import {Header} from "./components/Header.tsx";
import {Container} from "react-bootstrap";
import {Footer} from "./components/Footer.tsx";
import {Home} from "./components/Home.tsx";

function App() {

  return (
    <Container>
      <Header></Header>
      <Home></Home>
      <Footer></Footer>
    </Container>
  )
}

export default App
