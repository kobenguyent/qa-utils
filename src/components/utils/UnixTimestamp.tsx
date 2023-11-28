import {Container} from "react-bootstrap";
import {Header} from "../Header.tsx";
import {Footer} from "../Footer.tsx";
import { useState } from 'react';

export const UnixTimestamp = () => {
  const [postContent, setPostContent] = useState(Date.now());

  function convertTimestamp (timestamp: any) {
    const unixTimestamp = parseInt(timestamp); // Replace this with your Unix timestamp

    const date = new Date(unixTimestamp); // Convert Unix timestamp to milliseconds

    // Get the various components of the date
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // Month is 0-indexed, so we add 1
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    return (`${day.toString()}.${month.toString()}.${year.toString()} ${hours.toString()}:${minutes.toString()}:${seconds.toString()}`)
  }

  return(
    <Container>
      <Header></Header>
      <div className="text-center">
        <h1>Unix Timestamp Converter</h1>
        <label>
          Enter Unix Timestamp here to convert:
        </label> <br />
        <textarea id="timstamp-input"  rows={1}
                  cols={20} value={postContent}
                  onChange={e => setPostContent(e.target.value)}></textarea>

        <div>
          <textarea disabled value={convertTimestamp(postContent)}></textarea>
        </div>
      </div>
      <Footer></Footer>
    </Container>
  )
}
