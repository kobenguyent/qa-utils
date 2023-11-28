import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { decodeToken } from "react-jwt";
import { useState } from 'react';
import {JSONViewer} from 'react-json-editor-viewer';
import { jsonStyles } from '../../styles/jsonStyles.ts';

export const JWTDebugger = () => {
  const [postContent, setPostContent] = useState('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>JWT Decode</h1>
      </div>
      <label>
        Enter JWT here to decode:
      </label> <br />
      <textarea id="jwt-input"  rows={4}
                cols={150} value={postContent}
                onChange={e => setPostContent(e.target.value)}></textarea>

      <div>
        <JSONViewer view="dual" data={decodeToken(postContent)} collapsible styles={jsonStyles}/>
      </div>
      <Footer></Footer>
    </Container>
  )
}
