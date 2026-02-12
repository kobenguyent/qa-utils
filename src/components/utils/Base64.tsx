import { Button, Container } from "react-bootstrap";
import { useState } from 'react';
import { encode, decode } from 'js-base64';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';

export const Base64 = () => {
  const [postContent, setPostContent] = useState('');
  const [result, setResult] = useState('');
  const ai = useAIAssistant();

  const handleAIExplain = async () => {
    const decoded = result || postContent;
    try {
      await ai.sendRequest(
        'You are a helpful assistant. Analyze the provided content and explain what it is, what format it might be in, and any relevant details. Be concise.',
        `Explain this content:\n\n${decoded}`
      );
    } catch {
      // error is displayed by AIAssistButton
    }
  };

  return(
    <Container>
      <div className="text-center">
        <h1>Base64 Decode/Encode</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Enter something here:
          </Form.Label>
          <Col sm="10">
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
        {ai.isConfigured && (
          <AIAssistButton
            label="Explain Content"
            onClick={handleAIExplain}
            isLoading={ai.isLoading}
            disabled={!postContent.trim() && !result.trim()}
            error={ai.error}
            result={ai.result}
            onClear={ai.clear}
            className="mt-2"
          />
        )}
      </Form>


    </Container>
  )
}
