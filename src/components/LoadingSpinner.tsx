import React from 'react';
import { Spinner, Container, Row, Col } from 'react-bootstrap';

export const LoadingSpinner: React.FC = () => {
  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
      <Row>
        <Col className="text-center">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <div className="mt-2">Loading...</div>
        </Col>
      </Row>
    </Container>
  );
};