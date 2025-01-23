import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { decodeToken } from "react-jwt";
import { useState } from 'react';
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CopyWithToast from '../CopyWithToast.tsx';

export const JWTDebugger = () => {
  const [postContent, setPostContent] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>JWT Debugger</h1>
      </div>

      <label>
        {/*
// @ts-ignore */}
        Your JWT is:  {decodeToken(postContent)?.exp < Date.now() ? <text style={{ color: 'red' }}>Expired</text> : <text style={{ color: 'green' }}>Valid</text>}
      </label> <br />

      <Form>
        <Form.Group as={Row} className="mb-3" controlId="input">
          <Form.Label column sm="2">
            Enter JWT here to debug:
          </Form.Label>
          <Col sm="10">
            {/*
// @ts-ignore */}
            <Form.Control id="jwt-input" value={postContent} onChange={e => setPostContent(e.target.value)}></Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="result">
          <Form.Label column sm="2">
            Results
          </Form.Label>
          <Col sm="10">
            <JSONViewer data={decodeToken(postContent)} collapsible styles={jsonStyles}/>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
          <Col sm="10">
            <CopyWithToast text={JSON.stringify(decodeToken(postContent), null, 2) || ''}></CopyWithToast>
          </Col>
        </Form.Group>
      </Form>
      <Footer></Footer>
    </Container>
  )
}
