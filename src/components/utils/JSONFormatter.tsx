import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';

export const JSONFormatter = () => {
  const [postContent, setPostContent] = useState('{\n' +
    '  "sub": "1234567890",\n' +
    '  "name": "John Doe",\n' +
    '  "iat": 1516239022\n' +
    '}');

  function jsonParse (string: string) {
    try {
      return JSON.parse(string)
    } catch (e: any) {
      return { error: e.message }
    }
  }

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>JSON Formatter</h1>
      </div>
      <label>
        Enter JSON here to format:
      </label> <br />
      <textarea id="jwt-input"  rows={4}
                cols={150} value={postContent}
                onChange={e => setPostContent(e.target.value)}></textarea>

      <div>
        <JSONViewer data={jsonParse(postContent)} collapsible styles={jsonStyles}/>
      </div>
      <Footer></Footer>
    </Container>
  )
}
