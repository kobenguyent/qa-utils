import { Button, Container } from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';
import { countCharacters } from '../../utils/helpers.ts';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

export const CharacterCounter = () => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);

  const handleTextChange = (value: string) => {
    setText(value);
    setCount(countCharacters(value));
  };

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
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
        }}>Clear</Button>
      </Form>

      <Footer></Footer>
    </Container>
  )
}
