import React, { useState, useEffect } from 'react';
import {Container, Image, Row, Col, Button, Card, Badge} from "react-bootstrap";
import qaHeroImage from '../assets/qa-hero.svg'
import { getRandomTool } from '../utils/randomTool';
import { SearchItem } from '../utils/searchData';
import { getRandomQuote, Quote } from '../utils/quotes';
import { loadAnchors, PalaceAnchor } from '../utils/palaceStorage';

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
            <Image 
              src={qaHeroImage} 
              alt="QA Utils - Quality Assurance Tools"
              className="img-fluid shadow-sm rounded animated-home-image home-image"
            />
            <div className="mt-4">
              <h1 className="h2 glass-text home-title">
                Welcome to QA Utils
              </h1>
              <p className="lead glass-text home-description">
                A comprehensive collection of quality assurance tools and utilities 
                to enhance your testing workflow.
              </p>

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