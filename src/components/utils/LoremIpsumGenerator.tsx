import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const LoremIpsumGenerator: React.FC = () => {
  const [text, setText] = useState('');
  const [type, setType] = useState<'paragraphs' | 'words' | 'sentences'>('paragraphs');
  const [count, setCount] = useState(3);
  const [aiTopic, setAiTopic] = useState('');
  const ai = useAIAssistant();

  const loremWords = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
    'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
    'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
    'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
    'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
    'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
    'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
    'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
  ];

  const generateSentence = () => {
    const length = Math.floor(Math.random() * 10) + 8;
    const words = [];
    for (let i = 0; i < length; i++) {
      words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
    }
    return words.join(' ').charAt(0).toUpperCase() + words.join(' ').slice(1) + '.';
  };

  const generateParagraph = () => {
    const sentenceCount = Math.floor(Math.random() * 4) + 4;
    const sentences = [];
    for (let i = 0; i < sentenceCount; i++) {
      sentences.push(generateSentence());
    }
    return sentences.join(' ');
  };

  const generateText = () => {
    let result = '';
    
    if (type === 'paragraphs') {
      const paragraphsArray = [];
      for (let i = 0; i < count; i++) {
        paragraphsArray.push(generateParagraph());
      }
      result = paragraphsArray.join('\n\n');
    } else if (type === 'sentences') {
      const sentences = [];
      for (let i = 0; i < count; i++) {
        sentences.push(generateSentence());
      }
      result = sentences.join(' ');
    } else if (type === 'words') {
      const words = [];
      for (let i = 0; i < count; i++) {
        words.push(loremWords[Math.floor(Math.random() * loremWords.length)]);
      }
      result = words.join(' ');
    }
    
    setText(result);
  };

  return (
    <Container className="py-4">
      <h1 className="h3 mb-4">📝 Lorem Ipsum Generator</h1>
      <p className="text-muted">Generate placeholder text for your designs and mockups</p>

      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Body>
              <h5 className="mb-3">Settings</h5>
              
              <Form.Group className="mb-3">
                <Form.Label>Type</Form.Label>
                <Form.Select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'paragraphs' | 'words' | 'sentences')}
                >
                  <option value="paragraphs">Paragraphs</option>
                  <option value="sentences">Sentences</option>
                  <option value="words">Words</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Count: {count} {type}
                </Form.Label>
                <Form.Range
                  min={1}
                  max={type === 'words' ? 100 : type === 'sentences' ? 20 : 10}
                  value={count}
                  onChange={(e) => setCount(parseInt(e.target.value))}
                />
              </Form.Group>

              <Button variant="primary" onClick={generateText} className="w-100 mb-3">
                Generate Text
              </Button>

              {ai.isConfigured ? (
                <>
                  <hr />
                  <h6 className="mb-2">🤖 AI-Powered Text</h6>
                  <Form.Group className="mb-2">
                    <Form.Control
                      type="text"
                      placeholder="Topic, e.g., 'e-commerce product descriptions'"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      size="sm"
                    />
                  </Form.Group>
                  <AIAssistButton
                    label="Generate AI Text"
                    onClick={async () => {
                      try {
                        const response = await ai.sendRequest(
                          'You are a content writer. Generate realistic placeholder text based on the given topic. Return ONLY the generated text without any explanation or formatting.',
                          `Generate ${count} ${type} of realistic placeholder text about: ${aiTopic || 'general topics'}. Make it sound natural and professional.`
                        );
                        setText(response);
                      } catch {
                        // error displayed by AIAssistButton
                      }
                    }}
                    isLoading={ai.isLoading}
                    error={ai.error}
                    onClear={ai.clear}
                  />
                </>
              ) : (
                <AIConfigureHint className="mt-3" />
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={8}>
          <Card>
            <Card.Body>
              <h5 className="mb-3">Generated Text</h5>
              
              {text && (
                <>
                  <Form.Control
                    as="textarea"
                    rows={12}
                    value={text}
                    readOnly
                    className="mb-3"
                  />
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted">
                      {text.split(/\s+/).length} words, {text.length} characters
                    </small>
                    <CopyWithToast text={text} />
                  </div>
                </>
              )}

              {!text && (
                <p className="text-muted text-center py-5">
                  Click "Generate Text" to create Lorem Ipsum placeholder text
                </p>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="mt-4">
        <Card.Body>
          <h5>ℹ️ About Lorem Ipsum</h5>
          <p>
            Lorem Ipsum is placeholder text commonly used in the graphic, print, and publishing 
            industries for previewing layouts and visual mockups. It allows designers to focus on 
            design elements without being distracted by meaningful content.
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};
