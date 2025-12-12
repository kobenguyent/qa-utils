import {Container} from "react-bootstrap";
import ivr from "../../assets/ivr-nutshell.jpeg";

export const InteractiveVoiceResponse = () => {
  return(
    <Container>
      <div className="text-center">
        <h1>Interactive voice response (IVR)</h1>
        <p>Interactive Voice Response (IVR) is an automated phone system technology that allows incoming callers to access information via a voice response system of pre recorded messages without having to speak to an agent, as well as to utilize menu options via touch tone keypad selection or speech recognition to have their call routed to specific departments or specialists.</p>
        <img src={ivr} width={450}></img>
      </div>
    </Container>
  )
}