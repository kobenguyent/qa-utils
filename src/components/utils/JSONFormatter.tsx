import {Container} from "react-bootstrap";
import { useState } from 'react';
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import CopyWithToast from '../CopyWithToast.tsx';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const JSONFormatter = () => {
  const [postContent, setPostContent] = useState('{\n' +
    '  "sub": "1234567890",\n' +
    '  "name": "John Doe",\n' +
    '  "iat": 1516239022\n' +
    '}');
  const ai = useAIAssistant();

  function jsonParse (string: string) {
    try {
      return JSON.parse(string)
    } catch (e: unknown) {
      return { error: e instanceof Error ? e.message : 'Unknown error' }
    }
  }

  const handleAIFix = async () => {
    try {
      const response = await ai.sendRequest(
        'You are a JSON expert. Fix the provided malformed JSON and return ONLY the corrected, valid JSON. Do not include any explanation or markdown formatting.',
        `Fix this JSON:\n\n${postContent}`
      );
      setPostContent(response);
    } catch {
      // error is displayed by AIAssistButton
    }
  };

  return(
    <Container>      <div className="text-center">
        <h1>JSON Formatter</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3" controlId="input">
          <Form.Label column sm="2">
            Enter JSON here to format:
          </Form.Label>
          <Col sm="10">
            {/*
// @ts-ignore */}
            <Form.Control id="json-input" value={postContent} onChange={e => setPostContent(e.target.value)}></Form.Control>
            {ai.isConfigured ? (
              <AIAssistButton
                label="Fix JSON with AI"
                onClick={handleAIFix}
                isLoading={ai.isLoading}
                disabled={!postContent.trim()}
                error={ai.error}
                onClear={ai.clear}
                className="mt-2"
              />
            ) : (
              <AIConfigureHint className="mt-2" />
            )}
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

        <Form.Group as={Row} className="mb-3" controlId="copy-to-clipboard">
          <Col sm="10">
            <CopyWithToast text={JSON.stringify(jsonParse(postContent), null, 2) || ''}></CopyWithToast>
          </Col>
        </Form.Group>
      </Form>    </Container>
  )
}
