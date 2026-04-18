import { useState } from "react";
import {Container, Card, Badge} from "react-bootstrap";
import blf from "../../assets/blf.png";

const MNEMONICS = [
  { term: "Busy Lamp Field (BLF)", mnemonic: "🚦 A traffic light on your desk phone — red means the road is blocked (line busy), green means clear to merge (line free)." },
  { term: "Extension Monitoring", mnemonic: "👁️ A watchtower guard who watches all the phone lines simultaneously, signalling when each one becomes active." },
  { term: "VoIP Phone Status", mnemonic: "🏮 A lantern outside a shop — lit up means the shopkeeper is busy serving a customer; dark means walk right in." },
];

export const BusyLampField = () => {
  const [showMnemonics, setShowMnemonics] = useState(false);

  return(
    <Container>
      <div className="tool-header">
        <div className="tool-header-icon">💡</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Busy Lamp Field (BLF)</h1>
        </div>
      </div>
      <div className="text-center">
        <p>A busy lamp field (BLF) is a light on a VoIP phone -- also known as an IP phone -- that tells end users when another extension within the system is in use by displaying a clear status on the phone's display. The BLF must be manually configured on a compatible device by the phone user either as an add-on feature that can be connected to the phone or as a software on a computer. The number of BLFs that can be applied to a phone vary based on the area and type of application. BLF is a valuable asset to companies that utilize a large amount of phone line extensions under one system.</p>
        <img src={blf} width={450} alt="BLF diagram"></img>
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
            <p className="text-muted small mb-3">Vivid metaphors to anchor each BLF concept to a memorable image:</p>
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