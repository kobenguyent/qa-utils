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
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}