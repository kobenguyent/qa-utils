import { Button, Container, Toast } from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export const UuidGenerator = () => {
  const [postContent, setPostContent] = useState(uuidv4());
  const [show, setShow] = useState(false);

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>UUID Generator</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Your UUID:
          </Form.Label>
          <Col sm="10">
            {/*
// @ts-ignore */}
            <Form.Control id="uuid" readOnly plaintext value={postContent}></Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
          <Col sm="10">
            <Button onClick={() => setPostContent(uuidv4())}>New UUID</Button>
            <CopyToClipboard text={postContent}>
              <Button onClick={() => setShow(true)}>Copy to clipboard</Button>
            </CopyToClipboard>
          </Col>
        </Form.Group>
      </Form>
      <Row>
        <Col xs={6}>
          <Toast onClose={() => setShow(false)} show={show} delay={3000} autohide>
            <Toast.Header>
              <strong className="me-auto">Info</strong>
            </Toast.Header>
            <Toast.Body>Woohoo, your UUID is copied!</Toast.Body>
          </Toast>
        </Col>
      </Row>
      <Footer></Footer>
    </Container>
  )
}
