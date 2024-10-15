import { Container } from "react-bootstrap";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export const UnixTimestamp = () => {
  const [postContent, setPostContent] = useState<string>(Date.now().toString());

  // Convert Unix timestamp to readable date in both GMT and local time
  const convertTimestamp = (timestamp: string): { gmt: string; local: string } => {
    const unixTimestamp = parseInt(timestamp, 10);

    // Handle invalid timestamp input
    if (isNaN(unixTimestamp)) return { gmt: "Invalid Timestamp", local: "Invalid Timestamp" };

    const date = new Date(unixTimestamp); // Convert Unix timestamp to date object

    // Convert to GMT time (UTC)
    const gmtTime = date.toUTCString();

    // Convert to user's local time
    const localTime = date.toLocaleString();

    return { gmt: gmtTime, local: localTime };
  };

  const { gmt, local } = convertTimestamp(postContent);

  return (
    <Container>
      <Header />
      <div className="text-center">
        <h1>Unix Timestamp Converter</h1>
      </div>
      <Form>
        <Form.Group as={Row} className="mb-3" controlId="input">
          <Form.Label column sm="2">
            Enter Unix Timestamp:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              id="timestamp-input"
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Enter Unix timestamp"
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="result">
          <Form.Label column sm="2">
            GMT Time:
          </Form.Label>
          <Col sm="10">
            <Form.Control plaintext readOnly value={gmt} />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="result">
          <Form.Label column sm="2">
            Local Time:
          </Form.Label>
          <Col sm="10">
            <Form.Control plaintext readOnly value={local} />
          </Col>
        </Form.Group>
      </Form>
      <Footer />
    </Container>
  );
};
