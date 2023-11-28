import {Container, Image} from "react-bootstrap";
import homePhoto from '../assets/img.png'


export const Home = () => {
  return(
    <Container>
      <div className="text-center">
        <Image src={homePhoto} style={{ marginTop: 10}}>

        </Image>
      </div>
    </Container>
  )
}