import React from 'react';
import {Container, Image, Row, Col} from "react-bootstrap";
import homePhoto from '../assets/img.gif'

export const Home: React.FC = () => {
  return(
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8} className="text-center">
          <div className="glass-card">
            <Image 
              src={homePhoto} 
              alt="QA Utils - Quality Assurance Tools"
              className="img-fluid shadow-sm rounded animated-home-image"
              style={{ 
                marginBottom: '2rem',
                maxHeight: '400px',
                objectFit: 'contain'
              }}
            />
            <div className="mt-4">
              <h1 className="h2 glass-text" style={{ color: '#2d3748', fontWeight: 700 }}>
                Welcome to QA Utils
              </h1>
              <p className="lead glass-text" style={{ 
                fontSize: '1.25rem', 
                color: '#4a5568',
                lineHeight: 1.8,
                marginTop: '1rem'
              }}>
                A comprehensive collection of quality assurance tools and utilities 
                to enhance your testing workflow.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}