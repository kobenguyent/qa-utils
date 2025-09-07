import React from 'react';
import {Container, Image, Row, Col} from "react-bootstrap";
import homePhoto from '../assets/img.png'

export const Home: React.FC = () => {
  return(
    <Container className="py-4">
      <Row className="justify-content-center">
        <Col xs={12} md={8} lg={6} className="text-center">
          <Image 
            src={homePhoto} 
            alt="QA Utils - Quality Assurance Tools"
            className="img-fluid shadow-sm rounded"
            style={{ 
              marginTop: 10,
              maxHeight: '400px',
              objectFit: 'contain'
            }}
          />
          <div className="mt-4">
            <h1 className="h3 text-muted">Welcome to QA Utils</h1>
            <p className="lead text-muted">
              A comprehensive collection of quality assurance tools and utilities 
              to enhance your testing workflow.
            </p>
          </div>
        </Col>
      </Row>
    </Container>
  )
}