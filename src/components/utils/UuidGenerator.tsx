import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { v4 as uuidv4 } from 'uuid';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import {CopyToClipboard} from 'react-copy-to-clipboard';
import { useState } from 'react';

export const UuidGenerator = () => {
  const [postContent] = useState(uuidv4());

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>UUID Generator</h1>
        <label>
          Your UUID:
        </label> <br />
        <div>
          <textarea cols={50} disabled value={postContent}></textarea>
        </div>
        <CopyToClipboard text={postContent}>
          <button>Copy to clipboard</button>
        </CopyToClipboard>
      </div>
      <Footer></Footer>
    </Container>
  )
}
