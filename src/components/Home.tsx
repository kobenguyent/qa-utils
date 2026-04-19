import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button } from "react-bootstrap";
import { getRandomTool } from '../utils/randomTool';
import { SearchItem } from '../utils/searchData';
import { getRandomQuote, Quote } from '../utils/quotes';
import { navigationConfig } from '../config/navigationConfig';
import { AmbientDots } from './AmbientDots';

const totalTools = navigationConfig.length;

export const Home: React.FC = () => {
  const [randomTool, setRandomTool] = useState<SearchItem | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    setRandomTool(getRandomTool());
    setQuote(getRandomQuote());
  }, []);

  return (
    <div className="home-root">
      <div className="home-glow" aria-hidden="true" />
      <AmbientDots />

      {/* ── Hero ── */}
      <section className="home-hero">
        <Container>
          <Row className="justify-content-center">
            <Col xs={12} md={10} lg={8} className="text-center">
              <h1 className="home-title">
                <span className="gradient-text">QA Utils</span>
              </h1>
              <p className="home-subtitle">
                {totalTools}+ developer tools for testing, converting,
                <br className="d-none d-sm-block" />
                generating, and learning — all in one place.
              </p>
              <div className="home-hero-actions">
                <Button
                  href="#/explore"
                  variant="primary"
                  className="home-btn-primary"
                  aria-label="Explore tools"
                >
                  Explore Tools
                </Button>
                <Button
                  href="https://github.com/kobenguyent/qa-utils"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outline-secondary"
                  className="home-btn-ghost"
                  aria-label="View on GitHub"
                >
                  GitHub ↗
                </Button>
              </div>
              <div className="home-stats" aria-label="Project stats">
                <span className="home-stat">{totalTools} tools</span>
                <span className="home-stat-dot" aria-hidden="true" />
                <span className="home-stat">Open source</span>
                <span className="home-stat-dot" aria-hidden="true" />
                <span className="home-stat">Free forever</span>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* ── Quote & Discover ── */}
      <section className="home-section home-bottom">
        <Container>
          <Row className="justify-content-center g-4">
            {/* Quote card */}
            <Col xs={12} md={6} lg={5}>
              {quote && (
                <button
                  type="button"
                  className="home-card home-card-quote"
                  onClick={() => setQuote(getRandomQuote())}
                  aria-label="Get another random quote"
                >
                  <span className="home-card-quote-text">"{quote.text}"</span>
                  <span className="home-card-quote-author">— {quote.author}</span>
                </button>
              )}
            </Col>

            {/* Random tool card */}
            <Col xs={12} md={6} lg={5}>
              {randomTool && (
                <div className="home-card home-card-discover">
                  <span className="home-card-label">Try something new</span>
                  <a
                    href={randomTool.path}
                    className="home-card-tool-link"
                    aria-label={`Visit ${randomTool.title}`}
                  >
                    <span className="home-card-tool-icon">{randomTool.icon}</span>
                    <span className="home-card-tool-name">{randomTool.title}</span>
                    <span className="home-card-tool-arrow">→</span>
                  </a>
                  <p className="home-card-tool-desc">{randomTool.description}</p>
                  <button
                    type="button"
                    className="home-card-shuffle"
                    onClick={() => setRandomTool(getRandomTool())}
                    aria-label="Shuffle random tool"
                  >
                    ↻ Shuffle
                  </button>
                </div>
              )}
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}