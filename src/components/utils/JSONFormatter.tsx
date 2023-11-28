import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export const JSONFormatter = () => {
  const [postContent, setPostContent] = useState('{\n' +
    '  "sub": "1234567890",\n' +
    '  "name": "John Doe",\n' +
    '  "iat": 1516239022\n' +
    '}');

  function jsonParse (string: string) {
    try {
      return JSON.parse(string)
    } catch (e: any) {
      return { error: e.message }
    }
  }

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>JSON Formatter</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3" controlId="input">
          <Form.Label column sm="2">
            Enter JSON here to format:
          </Form.Label>
          <Col sm="10">
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*
// @ts-ignore */}
            <Form.Control id="json-input" value={postContent} onChange={e => setPostContent(e.target.value)}></Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="result">
          <Form.Label column sm="2">
            Results
          </Form.Label>
          <Col sm="10">
            <JSONViewer data={jsonParse(postContent)} collapsible styles={jsonStyles}/>
          </Col>
        </Form.Group>
      </Form>
      <Footer></Footer>
    </Container>
  )
}
