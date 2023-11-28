import {Container} from "react-bootstrap";
import blf from "../../assets/blf.png";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";

export const BusyLampField = () => {
  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>Busy Lamp Field (BLF)</h1>
        <p>A busy lamp field (BLF) is a light on a VoIP phone -- also known as an IP phone -- that tells end users when another extension within the system is in use by displaying a clear status on the phone's display. The BLF must be manually configured on a compatible device by the phone user either as an add-on feature that can be connected to the phone or as a software on a computer. The number of BLFs that can be applied to a phone vary based on the area and type of application. BLF is a valuable asset to companies that utilize a large amount of phone line extensions under one system.</p>
        <img src={blf} width={450}></img>
      </div>
      <Footer></Footer>
    </Container>
  )
}