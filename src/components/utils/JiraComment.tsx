import { Button, Container, Toast } from "react-bootstrap";
import { Header } from "../Header.tsx";
import { Footer } from "../Footer.tsx";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { useState } from 'react';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Markdown from 'react-markdown';
import { useUA } from 'use-ua-parser-js';

export const JiraComment = () => {
  const UADetails = useUA();
  const osInfo: any = `${UADetails?.os.name}`;
  const browserInfo = `${UADetails?.browser.name} - ${UADetails?.browser.version}`;
  const installedBrowsers = navigator.userAgent
    .split(' ')
    .filter(browser => browser.toLowerCase().includes('chrome') || browser.toLowerCase().includes('safari') || browser.toLowerCase().includes('mozilla'))
    .join(', ');

  const [selectedContent, setSelectedContent] = useState('frontend');
  const [show, setShow] = useState(false);

  // Content options
  const postContentFE = `{panel:title= Test Setup}
(i)
||Environment|LOCALHOST|
||OS details|${osInfo} |
||Browsers|${browserInfo}|
||Branch|...|
||Commit|...|
{panel}

*QA passed* (/)
 * Scenario  (/)

Ticket will be marked as Done. 🎉`;

  const postContentBE = `1. APP: [url] - "version": "v1.0.0"

||Scenarios||Request||Response||Status||
| Scenario |GET endpoint|200 OK|(/)|

Ticket will be marked as Done. 🎉`;

  // Dynamically set the post content based on selection
  const postContent = selectedContent === 'frontend' ? postContentFE : postContentBE;

  return (
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>Test Setup Generator for JIRA</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2"><b>Content Type:</b></Form.Label>
          <Col sm="10">
            <Form.Select
              value={selectedContent}
              onChange={(e) => setSelectedContent(e.target.value)}
            >
              <option value="frontend">FrontEnd</option>
              <option value="backend">BackEnd</option>
            </Form.Select>
          </Col>

          <Form.Label column sm="2"><b>OS Info:</b></Form.Label>
          <Col sm="10">
            <Form.Control id="osInfo" readOnly plaintext value={osInfo}></Form.Control>
          </Col>

          <Form.Label column sm="2"><b>Installed Browser Info:</b></Form.Label>
          <Col sm="10">
            <Form.Control id="installedBrowsers" readOnly plaintext value={installedBrowsers}></Form.Control>
          </Col>

          <Form.Label column sm="2">Your comment:</Form.Label>
          <Col sm="10">
            <Markdown>{postContent}</Markdown>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
          <Col sm="10">
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
            <Toast.Body>Woohoo, your text is copied!</Toast.Body>
          </Toast>
        </Col>
      </Row>

      <Footer></Footer>
    </Container>
  );
};
