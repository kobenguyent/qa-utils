import { Button, Container } from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';
import { encode, decode } from 'js-base64';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export const Base64 = () => {
  const [postContent, setPostContent] = useState('');
  const [result, setResult] = useState('');

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>Base64 Decode/Encode</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Enter something here:
          </Form.Label>
          <Col sm="10">
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*
// @ts-ignore */}
            <Form.Control id="json-input" value={postContent} onChange={e => setPostContent(e.target.value)}></Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Results
          </Form.Label>
          <Col sm="10">
            <Form.Control id="json-result" value={result}></Form.Control>
          </Col>
        </Form.Group>
        <Button onClick={() => setPostContent('')}>Clear all</Button>
        <Button onClick={() => setResult(encode(postContent))}>Encode</Button>
        <Button onClick={() => setResult(decode(postContent))}>Decode</Button>
      </Form>


      <Footer></Footer>
    </Container>
  )
}
