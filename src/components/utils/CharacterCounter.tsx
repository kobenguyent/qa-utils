import { Button, Container } from "react-bootstrap";
import { useState } from 'react';
import { countCharacters } from '../../utils/helpers.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const CharacterCounter = () => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);
  const ai = useAIAssistant();

  const handleTextChange = (value: string) => {
    setText(value);
    setCount(countCharacters(value));
  };

  const handleAIAnalyze = async () => {
    try {
      await ai.sendRequest(
        'You are a text analysis expert. Analyze the provided text and give a brief summary including: reading level, tone/sentiment, language, key topics, and suggestions for improvement. Be concise.',
        `Analyze this text:\n\n${text}`
      );
    } catch {
      // error is displayed by AIAssistButton
    }
  };

  return(
    <Container>      <div className="text-center">
        <h1>Character Counter</h1>
      </div>

      <Form>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Enter text:
          </Form.Label>
          <Col sm="10">
            <Form.Control 
              as="textarea"
              rows={5}
              id="text-input" 
              value={text} 
              onChange={e => handleTextChange(e.target.value)}
              placeholder="Type or paste your text here..."
            ></Form.Control>
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            Character Count:
          </Form.Label>
          <Col sm="10">
            <Form.Control 
              id="character-count" 
              value={count}
              readOnly
              plaintext
            ></Form.Control>
          </Col>
        </Form.Group>
        
        <Button onClick={() => {
          setText('');
          setCount(0);
          ai.clear();
        }}>Clear</Button>
        {ai.isConfigured ? (
          <AIAssistButton
            label="Analyze Text"
            onClick={handleAIAnalyze}
            isLoading={ai.isLoading}
            disabled={!text.trim()}
            error={ai.error}
            result={ai.result}
            onClear={ai.clear}
            className="mt-2"
          />
        ) : (
          <AIConfigureHint className="mt-2" />
        )}
      </Form>    </Container>
  )
}
