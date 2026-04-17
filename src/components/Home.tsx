import React, { useState, useEffect } from 'react';
import {Container, Image, Row, Col, Button, Card, Badge} from "react-bootstrap";
import qaHeroImage from '../assets/qa-hero.svg'
import { getRandomTool } from '../utils/randomTool';
import { SearchItem } from '../utils/searchData';
import { getRandomQuote, Quote } from '../utils/quotes';
import { loadAnchors, PalaceAnchor } from '../utils/palaceStorage';
import { NAV_GROUP_ORDER, NAV_GROUP_META, navigationConfig } from '../config/navigationConfig';

// Build a count of tools per nav group for the feature cards
const toolCountByGroup = NAV_GROUP_ORDER.reduce<Record<string, number>>((acc, group) => {
  acc[group] = navigationConfig.filter(item => item.navGroups.includes(group)).length;
  return acc;
}, {});

const FEATURE_GROUP_DESC: Record<string, string> = {
  Converters: 'Base64, JWT, JSON, timestamps & more',
  Generators: 'UUIDs, passwords, lorem ipsum & more',
  API: 'REST client, WebSocket, gRPC tools',
  Tools: 'Hash, encryption, QR code & dev utilities',
  Learn: 'ISTQB terms, flashcards, quizzes & more',
  Palace: 'Memory palace, kanban, coverage map',
};

export const Home: React.FC = () => {
  const [randomTool, setRandomTool] = useState<SearchItem | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [anchors, setAnchors] = useState<PalaceAnchor[]>([]);

  // Common card style for quote and random tool sections
  const cardStyle = {
    backgroundColor: 'var(--card-bg)', 
    borderRadius: '12px',
    border: '1px solid var(--border-color)'
  };

  useEffect(() => {
    // Get a random tool and quote on component mount
    setRandomTool(getRandomTool());
    setQuote(getRandomQuote());
    setAnchors(loadAnchors());
  }, []);

  const handleNewRandomTool = () => {
    setRandomTool(getRandomTool());
  };

  const handleNewRandomQuote = () => {
    setQuote(getRandomQuote());
  };

  return(
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8} className="text-center">
          <div className="glass-card">
            {/* Hero badge */}
            <div className="d-flex justify-content-center">
              <span className="hero-badge">✨ Open-source QA toolkit</span>
            </div>

            <Image 
              src={qaHeroImage} 
              alt="QA Utils - Quality Assurance Tools"
              className="img-fluid shadow-sm rounded animated-home-image home-image"
            />
            <div className="mt-3">
              <h1 className="home-title glass-text">
                Welcome to{' '}
                <span className="gradient-text">QA Utils</span>
              </h1>
              <p className="home-description">
                A comprehensive collection of quality assurance tools and utilities 
                to enhance your testing workflow.
              </p>

              {/* Feature category cards */}
              <hr className="section-divider" />
              <Row className="g-2 mt-1 mb-3 text-start">
                {NAV_GROUP_ORDER.map(group => {
                  const meta = NAV_GROUP_META[group];
                  const count = toolCountByGroup[group] ?? 0;
                  const desc = FEATURE_GROUP_DESC[group] ?? '';
                  return (
                    <Col xs={6} sm={4} key={group}>
                      <div className="feature-card">
                        <span className="feature-card-icon">{meta.icon}</span>
                        <span className="feature-card-title">{group}</span>
                        <span className="feature-card-desc">{desc}</span>
                        <Badge bg="primary" pill style={{ marginTop: '0.35rem', fontSize: '0.7rem' }}>
                          {count} tools
                        </Badge>
                      </div>
                    </Col>
                  );
                })}
              </Row>
              <hr className="section-divider" />

              {quote && (
                <div className="mt-4 p-4" style={{ 
                  ...cardStyle,
                  borderLeft: '4px solid var(--bs-primary)'
                }}>
                  <div className="d-flex flex-column align-items-center gap-2">
                    <div className="text-center">
                      <p className="mb-2 fs-5 fst-italic" style={{ lineHeight: '1.6' }}>
                        "{quote.text}"
                      </p>
                      <p className="text-muted mb-2">— {quote.author}</p>
                    </div>
                    <Button
                      onClick={handleNewRandomQuote}
                      variant="outline-secondary"
                      size="sm"
                      aria-label="Get another random quote"
                    >
                      🔄 New Quote
                    </Button>
                  </div>
                </div>
              )}
              
              {randomTool && (
                <div className="mt-4 p-3" style={cardStyle}>
                  <h3 className="h5 mb-2">
                    🎲 Try a Random Tool
                  </h3>
                  <div className="d-flex flex-column align-items-center gap-2">
                    <Button
                      href={randomTool.path}
                      variant="primary"
                      size="lg"
                      className="w-100"
                      style={{ maxWidth: '400px' }}
                      aria-label={`Visit ${randomTool.title}`}
                    >
                      {randomTool.icon} {randomTool.title}
                    </Button>
                    <p className="text-muted small mb-2">{randomTool.description}</p>
                    <Button
                      onClick={handleNewRandomTool}
                      variant="outline-secondary"
                      size="sm"
                      aria-label="Get another random tool"
                    >
                      🔄 Try Another
                    </Button>
                  </div>
                </div>
              )}

              {anchors.length > 0 && (
                <div className="mt-4 p-3 text-start" style={cardStyle}>
                  <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-1">
                    <h3 className="h5 mb-0">⚓ My Palace</h3>
                    <a href="#/my-palace" className="small" style={{ color: 'var(--primary)' }}>View all →</a>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    {anchors.slice(0, 8).map(anchor => (
                      <a
                        key={anchor.id}
                        href={anchor.toolPath}
                        className="text-decoration-none"
                        aria-label={`Open ${anchor.toolTitle}`}
                      >
                        <Card
                          className="d-flex flex-row align-items-center gap-1 px-2 py-1"
                          style={{
                            backgroundColor: 'var(--bg)',
                            border: '1px solid var(--border-color)',
                            fontSize: '0.8rem',
                            color: 'var(--text)',
                            cursor: 'pointer',
                          }}
                        >
                          <span>{anchor.roomIcon}</span>
                          <span>{anchor.toolIcon}</span>
                          <span className="fw-semibold">{anchor.toolTitle}</span>
                          <Badge bg="light" text="dark" style={{ fontSize: '0.65rem' }}>{anchor.roomName}</Badge>
                        </Card>
                      </a>
                    ))}
                    {anchors.length > 8 && (
                      <a href="#/my-palace" className="small align-self-center" style={{ color: 'var(--muted)' }}>
                        +{anchors.length - 8} more
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}