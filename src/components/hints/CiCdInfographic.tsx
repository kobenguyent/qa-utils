import { Container, Row, Col, Card } from 'react-bootstrap';

export const CiCdInfographic = () => {
  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">CI/CD Pipeline Infographic</h1>
      
      <Row className="mb-4">
        <Col>
          <Card className="mb-3">
            <Card.Body>
              <h2 className="h4">What is CI/CD?</h2>
              <p><strong>Continuous Integration (CI)</strong> and <strong>Continuous Delivery/Deployment (CD)</strong> are practices that automate software development workflows.</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col md={6}>
          <Card className="h-100 border-primary">
            <Card.Header className="bg-primary text-white">
              <h3 className="h5 mb-0">🔄 Continuous Integration (CI)</h3>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>1. Code Commit</strong>
                <p className="mb-2">Developer pushes code to repository</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div className="mb-3">
                <strong>2. Automated Build</strong>
                <p className="mb-2">Code is compiled/bundled</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div className="mb-3">
                <strong>3. Automated Tests</strong>
                <p className="mb-2">Unit, integration, and E2E tests run</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div>
                <strong>4. Feedback</strong>
                <p className="mb-0">Results reported to team</p>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="h-100 border-success">
            <Card.Header className="bg-success text-white">
              <h3 className="h5 mb-0">🚀 Continuous Delivery/Deployment (CD)</h3>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>5. Staging Deployment</strong>
                <p className="mb-2">Deploy to staging environment</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div className="mb-3">
                <strong>6. Acceptance Tests</strong>
                <p className="mb-2">Automated acceptance testing</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div className="mb-3">
                <strong>7. Manual Approval</strong>
                <p className="mb-2">Optional: Human review (CD)</p>
                <div className="ps-3 text-muted">↓</div>
              </div>
              <div>
                <strong>8. Production Deploy</strong>
                <p className="mb-0">Release to production</p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">🎯 Key Benefits</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h4 className="h6">⚡ Faster Releases</h4>
                  <p>Automate repetitive tasks and reduce time to market</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">🐛 Early Bug Detection</h4>
                  <p>Catch issues early in the development cycle</p>
                </Col>
                <Col md={4}>
                  <h4 className="h6">🔒 Improved Quality</h4>
                  <p>Consistent testing and deployment processes</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <h3 className="h5 mb-0">🛠️ Popular CI/CD Tools</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-3">
                  <strong>GitHub Actions</strong>
                  <p className="text-muted small">Integrated with GitHub</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>GitLab CI</strong>
                  <p className="text-muted small">Built into GitLab</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Jenkins</strong>
                  <p className="text-muted small">Open-source automation</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>CircleCI</strong>
                  <p className="text-muted small">Cloud-based CI/CD</p>
                </Col>
              </Row>
              <Row>
                <Col md={3} className="mb-3">
                  <strong>Azure DevOps</strong>
                  <p className="text-muted small">Microsoft ecosystem</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Travis CI</strong>
                  <p className="text-muted small">GitHub integration</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>Bitbucket Pipelines</strong>
                  <p className="text-muted small">Atlassian suite</p>
                </Col>
                <Col md={3} className="mb-3">
                  <strong>AWS CodePipeline</strong>
                  <p className="text-muted small">AWS native</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <h3 className="h5 mb-0">📋 Best Practices</h3>
            </Card.Header>
            <Card.Body>
              <ul>
                <li><strong>Commit Often:</strong> Small, frequent commits are easier to test and debug</li>
                <li><strong>Keep Builds Fast:</strong> Optimize build and test times for quick feedback</li>
                <li><strong>Test Automation:</strong> Automate as many tests as possible</li>
                <li><strong>Monitor Everything:</strong> Track metrics, logs, and performance</li>
                <li><strong>Rollback Strategy:</strong> Always have a plan to revert changes</li>
                <li><strong>Security Scanning:</strong> Include security checks in your pipeline</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
