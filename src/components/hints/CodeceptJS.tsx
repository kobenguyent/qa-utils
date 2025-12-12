import {Container, Table} from "react-bootstrap";

export const CodeceptJS = () => {
  return(
    <Container>
      <h1>CodeceptJS useful commands</h1>
      <Table striped bordered hover>
        <thead>
        <tr>
          <th>#</th>
          <th>Command</th>
          <th>Usage</th>
        </tr>
        </thead>
        <tbody>
        <tr>
          <td>1</td>
          <td>npx codeceptjs run --grep "CI"</td>
          <td>Run a test with CI tag</td>
        </tr>
        <tr>
          <td>2</td>
          <td>npx codeceptjs run-workers 2</td>
          <td>Run with 2 workers</td>
        </tr>
        <tr>
          <td>3</td>
          <td>npx codeceptjs run --verbose</td>
          <td>Run test with verbose mode</td>
        </tr>
        </tbody>
      </Table>
    </Container>
  )
}