import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export const UnixTimestamp = () => {
  const [postContent, setPostContent] = useState(Date.now());

  function convertTimestamp (timestamp: any) {
    const unixTimestamp = parseInt(timestamp); // Replace this with your Unix timestamp

    const date = new Date(unixTimestamp); // Convert Unix timestamp to milliseconds

    // Get the various components of the date
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Month is 0-indexed, so we add 1
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return (`${day.toString()}.${month.toString()}.${year.toString()} ${hours.toString()}:${minutes.toString()}:${seconds.toString()}`)
  }

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>Unix Timestamp Converter</h1>
      </div>
      <Form>
        <Form.Group as={Row} className="mb-3" controlId="input">
          <Form.Label column sm="2">
            Enter Unix Timestamp here to convert:
          </Form.Label>
          <Col sm="10">
            {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
            {/*
// @ts-ignore */}
            <Form.Control id="timstamp-input" value={postContent} onChange={e => setPostContent(e.target.value)}></Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="result">
          <Form.Label column sm="2">
            Results
          </Form.Label>
          <Col sm="10">
            <Form.Control plaintext readOnly value={convertTimestamp(postContent)}></Form.Control>
          </Col>
        </Form.Group>
      </Form>
      <Footer></Footer>
    </Container>
  )
}
