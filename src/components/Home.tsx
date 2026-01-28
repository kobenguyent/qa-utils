import React, { useState, useEffect } from 'react';
import {Container, Image, Row, Col, Button} from "react-bootstrap";
import qaHeroImage from '../assets/qa-hero.svg'
import { getRandomTool } from '../utils/randomTool';
import { SearchItem } from '../utils/searchData';

export const Home: React.FC = () => {
  const [randomTool, setRandomTool] = useState<SearchItem | null>(null);

  useEffect(() => {
    // Get a random tool on component mount
    setRandomTool(getRandomTool());
  }, []);

  const handleNewRandomTool = () => {
    setRandomTool(getRandomTool());
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
              
              {randomTool && (
                <div className="mt-4 p-3" style={{ 
                  backgroundColor: 'var(--card-bg)', 
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)'
                }}>
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
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}