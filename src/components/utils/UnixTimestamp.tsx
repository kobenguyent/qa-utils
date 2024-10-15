import { Container } from "react-bootstrap";
import { Header } from "../Header";
import { Footer } from "../Footer";
import { useState } from "react";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

export const UnixTimestamp = () => {
  const [postContent, setPostContent] = useState<string>(Date.now().toString());

  // Convert Unix timestamp to readable date
  const convertTimestamp = (timestamp: string): string => {
    const unixTimestamp = parseInt(timestamp, 10);

    // Handle invalid timestamp input
    if (isNaN(unixTimestamp)) return "Invalid Timestamp";

    const date = new Date(unixTimestamp); // Convert Unix timestamp to date object

    // Format date components with leading zeros if needed
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
  };

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
            Result:
          </Form.Label>
          <Col sm="10">
            <Form.Control
              plaintext
              readOnly
              value={convertTimestamp(postContent)}
            />
          </Col>
        </Form.Group>
      </Form>
      <Footer />
    </Container>
  );
};
