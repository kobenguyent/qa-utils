import React, { useState } from 'react';
import { Container, Card, Badge, Row, Col, Button } from 'react-bootstrap';
import { searchData } from '../../utils/searchData';
import { addAnchor, isAnchored, removeAnchor, ROOM_OPTIONS } from '../../utils/palaceStorage';

interface PalaceRoom {
  category: string;
  roomName: string;
  roomIcon: string;
  gradient: string;
}

const PALACE_ROOMS: PalaceRoom[] = [
  { category: 'Converters & Formatters', roomName: 'The Converter Sanctum', roomIcon: '🔄', gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { category: 'Generators', roomName: 'The Generator Lab', roomIcon: '⚗️', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { category: 'API Testing', roomName: 'The Protocol Corridor', roomIcon: '🌐', gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
  { category: 'Developer Tools', roomName: 'The Forge', roomIcon: '🔧', gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  { category: 'AI Tools', roomName: 'The AI Workshop', roomIcon: '🤖', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { category: 'Testing Tools', roomName: 'The Observatory', roomIcon: '🔍', gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)' },
  { category: 'Utilities', roomName: 'The Utility Vault', roomIcon: '🛠️', gradient: 'linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)' },
  { category: 'ISTQB', roomName: 'The Learning Tower', roomIcon: '🎓', gradient: 'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)' },
  { category: 'Checklists', roomName: 'The Checklist Chambers', roomIcon: '✅', gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)' },
  { category: 'Hints', roomName: 'The Wisdom Hall', roomIcon: '💡', gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)' },
  { category: 'Terms', roomName: 'The Library', roomIcon: '📚', gradient: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)' },
];

export const QAPalace: React.FC = () => {
  const [anchorState, setAnchorState] = useState<Record<string, boolean>>(() => {
    const state: Record<string, boolean> = {};
    searchData.forEach(item => {
      state[item.path] = isAnchored(item.path);
    });
    return state;
  });
  const [showAnchorModal, setShowAnchorModal] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState(0);

  const handleAnchorToggle = (item: { path: string; title: string; icon: string }) => {
    if (anchorState[item.path]) {
      const updated = removeAnchor(item.path);
      setAnchorState(prev => ({ ...prev, [item.path]: false }));
      return updated;
    }
    setShowAnchorModal(item.path);
  };

  const confirmAnchor = (item: { path: string; title: string; icon: string }) => {
    const room = ROOM_OPTIONS[selectedRoom];
    addAnchor({
      toolPath: item.path,
      toolTitle: item.title,
      toolIcon: item.icon,
      roomIcon: room.icon,
      roomName: room.name,
    });
    setAnchorState(prev => ({ ...prev, [item.path]: true }));
    setShowAnchorModal(null);
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5">🏛️ The QA Palace</h1>
        <p className="lead text-muted">
          Walk through the QA Palace — each room holds a set of tools, spatially grouped so your
          memory can navigate by place. Click any tool to enter its room.
        </p>
      </div>

      {PALACE_ROOMS.map(room => {
        const tools = searchData.filter(item => item.category === room.category);
        if (tools.length === 0) return null;
        return (
          <Card key={room.category} className="mb-4 shadow-sm border-0 overflow-hidden">
            <Card.Header
              className="d-flex align-items-center gap-2 py-3"
              style={{ background: room.gradient, color: '#fff' }}
            >
              <span style={{ fontSize: '1.5rem' }}>{room.roomIcon}</span>
              <div>
                <h5 className="mb-0 fw-bold" style={{ color: '#fff' }}>{room.roomName}</h5>
                <small style={{ opacity: 0.85 }}>{tools.length} tool{tools.length !== 1 ? 's' : ''} in this room</small>
              </div>
            </Card.Header>
            <Card.Body style={{ backgroundColor: 'var(--card-bg)' }}>
              <Row xs={1} sm={2} md={3} lg={4} className="g-2">
                {tools.map(tool => (
                  <Col key={tool.path}>
                    <div
                      className="d-flex align-items-start gap-2 p-2 rounded h-100"
                      style={{
                        border: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg)',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <a
                        href={tool.path}
                        className="text-decoration-none flex-grow-1"
                        style={{ color: 'var(--text)' }}
                        aria-label={`Open ${tool.title}`}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: '1.2rem' }}>{tool.icon}</span>
                          <div>
                            <div className="fw-semibold small">{tool.title}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem', lineHeight: 1.3 }}>{tool.description}</div>
                          </div>
                        </div>
                      </a>
                      <button
                        className="btn btn-link p-0 border-0"
                        title={anchorState[tool.path] ? 'Remove from My Palace' : 'Pin to My Palace'}
                        aria-label={anchorState[tool.path] ? `Remove ${tool.title} from My Palace` : `Pin ${tool.title} to My Palace`}
                        onClick={() => handleAnchorToggle(tool)}
                        style={{ color: anchorState[tool.path] ? '#ffc107' : 'var(--muted)', fontSize: '1rem', lineHeight: 1 }}
                      >
                        {anchorState[tool.path] ? '⚓' : '📌'}
                      </button>
                    </div>
                  </Col>
                ))}
              </Row>
            </Card.Body>
          </Card>
        );
      })}

      {/* Anchor room picker modal */}
      {showAnchorModal && (() => {
        const tool = searchData.find(t => t.path === showAnchorModal);
        if (!tool) return null;
        return (
          <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
            style={{ zIndex: 1050, backgroundColor: 'rgba(0,0,0,0.5)' }}
            role="dialog"
            aria-modal="true"
            aria-label="Pin tool to palace room"
          >
            <Card style={{ maxWidth: 400, width: '90%', backgroundColor: 'var(--card-bg)' }}>
              <Card.Header>
                <h5 className="mb-0">⚓ Pin to My Palace</h5>
              </Card.Header>
              <Card.Body>
                <p className="mb-3">Choose which room <strong>{tool.icon} {tool.title}</strong> belongs in:</p>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  {ROOM_OPTIONS.map((room, idx) => (
                    <Badge
                      key={idx}
                      bg={selectedRoom === idx ? 'primary' : 'secondary'}
                      style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
                      onClick={() => setSelectedRoom(idx)}
                    >
                      {room.icon} {room.name}
                    </Badge>
                  ))}
                </div>
              </Card.Body>
              <Card.Footer className="d-flex gap-2 justify-content-end">
                <Button variant="outline-secondary" size="sm" onClick={() => setShowAnchorModal(null)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={() => confirmAnchor(tool)}>
                  ⚓ Pin Here
                </Button>
              </Card.Footer>
            </Card>
          </div>
        );
      })()}
    </Container>
  );
};
