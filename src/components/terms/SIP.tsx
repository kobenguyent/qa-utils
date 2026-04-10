import { useState } from "react";
import {Container, Card, Badge} from "react-bootstrap";
import sip from "../../assets/sip.png";

export const SIP = () => {
  const [showMnemonics, setShowMnemonics] = useState(false);
  const mnemonics = [
    { term: "SIP (Session Initiation Protocol)", mnemonic: "📞 A formal letter of introduction before a phone call — SIP says 'Hello, I'd like to start a conversation' and both parties agree before talking." },
    { term: "SIP Invite", mnemonic: "💌 A wedding invitation — sent to start a session, accepted or declined, then the ceremony (call) begins." },
    { term: "SIP Registration", mnemonic: "📋 Signing the hotel register — your phone announces 'I'm here, at this address' to the SIP server so calls can find you." },
    { term: "SIP Proxy", mnemonic: "🏤 A post office — receives your call request and forwards it to the right address, acting as a middleman." },
    { term: "SIP BYE", mnemonic: "🚪 Politely saying goodbye and walking out the door — formally ending the session so both sides can hang up cleanly." },
  ];

  return(
    <Container>
      <div className="text-center">
        <h1>Session Initiation Protocol (SIP)</h1>
        <p>The Session Initiation Protocol (SIP) is a signaling protocol used for initiating, maintaining, and terminating communication sessions that include voice, video and messaging applications. SIP is used in Internet telephony, in private IP telephone systems, as well as mobile phone calling over LTE (VoLTE)</p>
        <img src={sip} width={650} alt="SIP diagram"></img>
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
            <p className="text-muted small mb-3">Vivid metaphors to anchor each SIP concept to a memorable image:</p>
            <div className="d-flex flex-column gap-2">
              {mnemonics.map((m, i) => (
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
