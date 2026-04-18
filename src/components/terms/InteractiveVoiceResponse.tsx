import { useState } from "react";
import {Container, Card, Badge} from "react-bootstrap";
import ivr from "../../assets/ivr-nutshell.jpeg";

const MNEMONICS = [
  { term: "IVR System", mnemonic: "🤖 A robot receptionist who never takes a lunch break — greets every caller, routes them through a menu, and never loses its place." },
  { term: "Touch-Tone Navigation", mnemonic: "🎵 A piano keyboard for phone calls — each key plays a note that opens a different door in the building." },
  { term: "Speech Recognition", mnemonic: "🦜 A parrot trained to understand human speech and carry the message to the right department." },
  { term: "Call Routing", mnemonic: "🚦 A traffic officer at a busy intersection — directing each car (call) to its correct lane (department)." },
];

export const InteractiveVoiceResponse = () => {
  const [showMnemonics, setShowMnemonics] = useState(false);

  return(
    <Container>
      <div className="tool-header">
        <div className="tool-header-icon">📞</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Interactive Voice Response (IVR)</h1>
        </div>
      </div>
      <div className="text-center">
        <p>Interactive Voice Response (IVR) is an automated phone system technology that allows incoming callers to access information via a voice response system of pre recorded messages without having to speak to an agent, as well as to utilize menu options via touch tone keypad selection or speech recognition to have their call routed to specific departments or specialists.</p>
        <img src={ivr} width={450} alt="IVR diagram"></img>
      </div>

      <div className="mt-4">
        <button
          className="btn btn-outline-secondary btn-sm mb-3"
          onClick={() => setShowMnemonics(m => !m)}
          aria-label={showMnemonics ? "Hide memory anchors" : "Show memory anchors"}
        >
          {showMnemonics ? '🖼️ Hide Memory Anchors' : '🖼️ Show Memory Anchors'}
        </button>
        {showMnemonics && (
          <div>
            <h5 className="mb-3">🖼️ Visual Memory Anchors</h5>
            <p className="text-muted small mb-3">Vivid metaphors to anchor each IVR concept to a memorable image:</p>
            <div className="d-flex flex-column gap-2">
              {MNEMONICS.map((m, i) => (
                <Card key={i} style={{ backgroundColor: 'var(--info-bg)', border: '1px solid var(--border-color)' }}>
                  <Card.Body className="py-2 px-3">
                    <Badge bg="secondary" className="mb-1">{m.term}</Badge>
                    <p className="mb-0 small" style={{ color: 'var(--info-text)' }}>{m.mnemonic}</p>
                  </Card.Body>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Container>
  )
}