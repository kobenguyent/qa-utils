import {Container} from "react-bootstrap";
import sip from "../../assets/sip.png";

export const SIP = () => {
  return(
    <Container>
      <div className="text-center">
        <h1>Session Initiation Protocol (SIP)</h1>
        <p>The Session Initiation Protocol (SIP) is a signaling protocol used for initiating, maintaining, and terminating communication sessions that include voice, video and messaging applications. SIP is used in Internet telephony, in private IP telephone systems, as well as mobile phone calling over LTE (VoLTE)</p>
        <img src={sip} width={650}></img>
      </div>
    </Container>
  )
}