import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';
import { encode, decode } from 'js-base64';

export const Base64 = () => {
  const [postContent, setPostContent] = useState('');
  const [result, setResult] = useState('');

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>Base64 Decode/Encode</h1>
      </div>
      <label>
        Enter here:
      </label> <br />
      <textarea id="input"  rows={4}
                cols={150} value={postContent}
                onChange={e => setPostContent(e.target.value)}></textarea>
      <div>
        <label>
          Results:
        </label> <br />
              <textarea id="result"  rows={4}
                        cols={150} value={result}></textarea>
      </div>
      <button onClick={() => setResult(encode(postContent))}>Encode</button>
      <button onClick={() => setResult(decode(postContent))}>Decode</button>
      <Footer></Footer>
    </Container>
  )
}
