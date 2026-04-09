import React, { useState } from 'react';
import { Container, Card, Row, Col, Form, Badge, ProgressBar } from 'react-bootstrap';

interface CoverageLayer {
  id: string;
  name: string;
  icon: string;
  description: string;
  roomName: string;
  gradient: string;
  defaultCoverage: number;
}

const LAYERS: CoverageLayer[] = [
  {
    id: 'unit',
    name: 'Unit Tests',
    icon: '🧩',
    description: 'Individual functions and methods tested in isolation.',
    roomName: 'The Isolation Chamber',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'integration',
    name: 'Integration Tests',
    icon: '🔌',
    description: 'Component interfaces and service interactions tested together.',
    roomName: 'The Junction Hall',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'e2e',
    name: 'End-to-End Tests',
    icon: '✈️',
    description: 'Full user workflows tested from UI to database.',
    roomName: 'The Grand Corridor',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'accessibility',
    name: 'Accessibility Tests',
    icon: '♿',
    description: 'WCAG compliance and assistive technology compatibility.',
    roomName: 'The Inclusive Gallery',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'security',
    name: 'Security Tests',
    icon: '🔒',
    description: 'Vulnerability scans, auth checks, and input validation.',
    roomName: 'The Security Vault',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'performance',
    name: 'Performance Tests',
    icon: '⚡',
    description: 'Load, stress, and response time benchmarks.',
    roomName: 'The Speed Arena',
    gradient: 'linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'api',
    name: 'API Tests',
    icon: '🌐',
    description: 'REST, GraphQL, and gRPC endpoint contract verification.',
    roomName: 'The Protocol Chamber',
    gradient: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    defaultCoverage: 0,
  },
  {
    id: 'smoke',
    name: 'Smoke Tests',
    icon: '🚒',
    description: 'Critical path sanity checks run on every deployment.',
    roomName: 'The Watchtower',
    gradient: 'linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%)',
    defaultCoverage: 0,
  },
];

function glowStyle(coverage: number): React.CSSProperties {
  if (coverage >= 80) {
    return { boxShadow: '0 0 18px rgba(25, 135, 84, 0.6)', borderColor: '#198754' };
  }
  if (coverage >= 50) {
    return { boxShadow: '0 0 12px rgba(255, 193, 7, 0.5)', borderColor: '#ffc107' };
  }
  if (coverage > 0) {
    return { boxShadow: '0 0 8px rgba(220, 53, 69, 0.4)', borderColor: '#dc3545' };
  }
  return { filter: 'grayscale(0.7)', opacity: 0.65 };
}

function coverageLabel(coverage: number): { text: string; variant: string } {
  if (coverage >= 80) return { text: '✅ Well covered', variant: 'success' };
  if (coverage >= 50) return { text: '⚠️ Partial', variant: 'warning' };
  if (coverage > 0) return { text: '🔴 Low', variant: 'danger' };
  return { text: '⬛ Dark area', variant: 'secondary' };
}

export const CoveragePalace: React.FC = () => {
  const [coverages, setCoverages] = useState<Record<string, number>>(() =>
    Object.fromEntries(LAYERS.map(l => [l.id, l.defaultCoverage]))
  );

  const overallCoverage =
    LAYERS.reduce((sum, l) => sum + coverages[l.id], 0) / LAYERS.length;

  const handleChange = (id: string, value: number) => {
    setCoverages(prev => ({ ...prev, [id]: value }));
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-5">
        <h1>🗺️ Coverage Palace</h1>
        <p className="lead text-muted">
          A spatial map of your test coverage across different layers. Glowing rooms are well-covered;
          dark rooms need attention. Enter your coverage percentages to illuminate the palace.
        </p>
        <div className="mx-auto" style={{ maxWidth: 400 }}>
          <div className="d-flex justify-content-between mb-1">
            <small className="text-muted">Overall Palace Coverage</small>
            <small className="fw-bold">{Math.round(overallCoverage)}%</small>
          </div>
          <ProgressBar
            now={overallCoverage}
            variant={overallCoverage >= 80 ? 'success' : overallCoverage >= 50 ? 'warning' : 'danger'}
            style={{ height: '0.75rem', borderRadius: 8 }}
          />
        </div>
      </div>

      <Row xs={1} sm={2} lg={3} xl={4} className="g-3">
        {LAYERS.map(layer => {
          const cov = coverages[layer.id];
          const label = coverageLabel(cov);
          return (
            <Col key={layer.id}>
              <Card
                className="h-100 border-2"
                style={{
                  backgroundColor: 'var(--card-bg)',
                  transition: 'box-shadow 0.3s, border-color 0.3s',
                  ...glowStyle(cov),
                }}
              >
                <Card.Header
                  className="text-center py-3"
                  style={{ background: cov > 0 ? layer.gradient : 'var(--border-color)', color: cov > 0 ? '#fff' : 'var(--muted)' }}
                >
                  <div style={{ fontSize: '2rem' }}>{layer.icon}</div>
                  <div className="fw-bold small">{layer.roomName}</div>
                </Card.Header>
                <Card.Body className="pb-2">
                  <h6 className="mb-1">{layer.name}</h6>
                  <p className="text-muted small mb-3" style={{ lineHeight: 1.4 }}>{layer.description}</p>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="text-muted">Coverage</small>
                    <Badge bg={label.variant} text={label.variant === 'warning' ? 'dark' : undefined}>
                      {label.text}
                    </Badge>
                  </div>
                  <ProgressBar
                    now={cov}
                    variant={label.variant === 'warning' ? 'warning' : label.variant}
                    label={`${cov}%`}
                    style={{ height: '0.5rem', marginBottom: 8 }}
                  />
                  <Form.Range
                    min={0}
                    max={100}
                    step={5}
                    value={cov}
                    onChange={e => handleChange(layer.id, Number(e.target.value))}
                    aria-label={`${layer.name} coverage percentage`}
                  />
                  <div className="text-center">
                    <small className="fw-bold">{cov}%</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Card className="mt-4" style={{ backgroundColor: 'var(--card-bg)' }}>
        <Card.Body>
          <h6 className="mb-2">🏛️ Reading Your Palace</h6>
          <div className="d-flex flex-wrap gap-3">
            <span><span style={{ color: '#198754' }}>✅</span> <strong>Glowing green</strong> — &gt;80% covered, well-lit room</span>
            <span><span style={{ color: '#ffc107' }}>⚠️</span> <strong>Amber glow</strong> — 50–80%, partially explored</span>
            <span><span style={{ color: '#dc3545' }}>🔴</span> <strong>Red tinge</strong> — &lt;50%, dark and risky area</span>
            <span>⬛ <strong>Grey room</strong> — 0%, uncharted territory</span>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};
