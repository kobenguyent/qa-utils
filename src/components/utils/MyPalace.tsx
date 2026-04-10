import React, { useState, useCallback } from 'react';
import { Container, Card, Row, Col, Button, Badge, Modal, Form } from 'react-bootstrap';
import {
  PalaceAnchor,
  loadAnchors,
  removeAnchor,
  addAnchor,
  ROOM_OPTIONS,
} from '../../utils/palaceStorage';
import { searchData } from '../../utils/searchData';

export const MyPalace: React.FC = () => {
  const [anchors, setAnchors] = useState<PalaceAnchor[]>(() => loadAnchors());
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(0);

  const handleRemove = useCallback((toolPath: string) => {
    const updated = removeAnchor(toolPath);
    setAnchors(updated);
  }, []);

  const handleAdd = useCallback(() => {
    if (!selectedTool) return;
    const tool = searchData.find(t => t.path === selectedTool);
    if (!tool) return;
    const room = ROOM_OPTIONS[selectedRoom];
    const updated = addAnchor({
      toolPath: tool.path,
      toolTitle: tool.title,
      toolIcon: tool.icon,
      roomIcon: room.icon,
      roomName: room.name,
    });
    setAnchors(updated);
    setShowAddModal(false);
    setSelectedTool('');
  }, [selectedTool, selectedRoom]);

  // Group anchors by room
  const rooms = ROOM_OPTIONS.map(room => ({
    ...room,
    anchors: anchors.filter(a => a.roomName === room.name),
  })).filter(r => r.anchors.length > 0);

  const unassigned = anchors.filter(
    a => !ROOM_OPTIONS.find(r => r.name === a.roomName)
  );

  const alreadyPinned = new Set(anchors.map(a => a.toolPath));

  return (
    <Container className="py-4">
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
        <div>
          <h1 className="mb-1">🏠 My Palace</h1>
          <p className="text-muted mb-0">
            Your personal collection of pinned tools, organised into rooms for instant spatial recall.
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} aria-label="Add tool to palace">
          ⚓ Pin a Tool
        </Button>
      </div>

      {anchors.length === 0 ? (
        <Card className="text-center p-5" style={{ backgroundColor: 'var(--card-bg)' }}>
          <Card.Body>
            <div style={{ fontSize: '3rem' }}>🏛️</div>
            <h4 className="mt-3">Your palace is empty</h4>
            <p className="text-muted">
              Pin tools from the{' '}
              <a href="#/palace" style={{ color: 'var(--primary)' }}>QA Palace</a>{' '}
              or click <strong>Pin a Tool</strong> above to begin building your personal workspace.
            </p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {rooms.map(room => (
            <Card key={room.name} className="mb-3 shadow-sm border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
              <Card.Header className="d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--border-color)' }}>
                <span style={{ fontSize: '1.4rem' }}>{room.icon}</span>
                <strong>{room.name}</strong>
                <Badge bg="secondary" className="ms-auto">{room.anchors.length}</Badge>
              </Card.Header>
              <Card.Body>
                <Row xs={1} sm={2} md={3} lg={4} className="g-2">
                  {room.anchors
                    .sort((a, b) => a.position - b.position)
                    .map(anchor => (
                      <Col key={anchor.id}>
                        <div
                          className="d-flex align-items-center gap-2 p-2 rounded"
                          style={{
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg)',
                          }}
                        >
                          <a
                            href={anchor.toolPath}
                            className="text-decoration-none flex-grow-1"
                            style={{ color: 'var(--text)' }}
                            aria-label={`Open ${anchor.toolTitle}`}
                          >
                            <span className="me-1">{anchor.toolIcon}</span>
                            <span className="fw-semibold small">{anchor.toolTitle}</span>
                          </a>
                          <button
                            className="btn btn-link p-0 border-0 text-danger"
                            onClick={() => handleRemove(anchor.toolPath)}
                            aria-label={`Remove ${anchor.toolTitle} from palace`}
                            title="Remove from palace"
                            style={{ fontSize: '0.8rem', lineHeight: 1 }}
                          >
                            ✕
                          </button>
                        </div>
                      </Col>
                    ))}
                </Row>
              </Card.Body>
            </Card>
          ))}

          {unassigned.length > 0 && (
            <Card className="mb-3 shadow-sm border-0" style={{ backgroundColor: 'var(--card-bg)' }}>
              <Card.Header>📌 Unassigned</Card.Header>
              <Card.Body>
                <Row xs={1} sm={2} md={3} className="g-2">
                  {unassigned.map(anchor => (
                    <Col key={anchor.id}>
                      <div
                        className="d-flex align-items-center gap-2 p-2 rounded"
                        style={{ border: '1px solid var(--border-color)', backgroundColor: 'var(--bg)' }}
                      >
                        <a href={anchor.toolPath} className="text-decoration-none flex-grow-1" style={{ color: 'var(--text)' }}>
                          <span className="me-1">{anchor.toolIcon}</span>
                          <span className="fw-semibold small">{anchor.toolTitle}</span>
                        </a>
                        <button
                          className="btn btn-link p-0 border-0 text-danger"
                          onClick={() => handleRemove(anchor.toolPath)}
                          aria-label={`Remove ${anchor.toolTitle}`}
                          style={{ fontSize: '0.8rem', lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          <div className="text-center mt-3">
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => {
                anchors.forEach(a => removeAnchor(a.toolPath));
                setAnchors([]);
              }}
            >
              🗑️ Clear All Anchors
            </Button>
          </div>
        </>
      )}

      {/* Add Tool Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} aria-labelledby="add-anchor-modal-title">
        <Modal.Header closeButton>
          <Modal.Title id="add-anchor-modal-title">⚓ Pin a Tool to Your Palace</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Select Tool</Form.Label>
            <Form.Select
              value={selectedTool}
              onChange={e => setSelectedTool(e.target.value)}
              aria-label="Select tool to pin"
            >
              <option value="">— choose a tool —</option>
              {searchData
                .filter(t => t.category !== 'Navigation')
                .map(t => (
                  <option key={t.path} value={t.path} disabled={alreadyPinned.has(t.path)}>
                    {t.icon} {t.title} {alreadyPinned.has(t.path) ? '(pinned)' : ''}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>
          <Form.Group>
            <Form.Label>Choose Room</Form.Label>
            <div className="d-flex flex-wrap gap-2">
              {ROOM_OPTIONS.map((room, idx) => (
                <Badge
                  key={idx}
                  bg={selectedRoom === idx ? 'primary' : 'secondary'}
                  style={{ cursor: 'pointer', padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={() => setSelectedRoom(idx)}
                >
                  {room.icon} {room.name}
                </Badge>
              ))}
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="outline-secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAdd} disabled={!selectedTool}>
            ⚓ Pin to Palace
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};
