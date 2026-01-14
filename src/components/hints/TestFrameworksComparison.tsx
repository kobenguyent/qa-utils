import { Container, Row, Col, Card, Table } from 'react-bootstrap';

export const TestFrameworksComparison = () => {
  return (
    <Container className="py-4">
      <h1 className="text-center mb-4">Test Automation Frameworks Comparison</h1>
      <p className="text-center text-muted mb-4">Compare popular test automation frameworks to choose the right one for your project</p>

      {/* E2E Testing Frameworks */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-primary text-white">
              <h3 className="h5 mb-0">🌐 End-to-End (E2E) Testing Frameworks</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Framework</th>
                    <th>Language</th>
                    <th>Browser Support</th>
                    <th>Pros</th>
                    <th>Cons</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Playwright</strong></td>
                    <td>JS/TS, Python, .NET, Java</td>
                    <td>Chrome, Firefox, Safari, Edge</td>
                    <td>Fast, auto-wait, multi-browser, mobile emulation</td>
                    <td>Newer, smaller community</td>
                    <td>Modern web apps, cross-browser testing</td>
                  </tr>
                  <tr>
                    <td><strong>Cypress</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>Chrome, Firefox, Edge (limited Safari)</td>
                    <td>Easy setup, great DX, time-travel debugging</td>
                    <td>Same-origin only, no multi-tab</td>
                    <td>Frontend developers, React/Vue/Angular apps</td>
                  </tr>
                  <tr>
                    <td><strong>Selenium</strong></td>
                    <td>Java, Python, C#, JS, Ruby</td>
                    <td>All major browsers</td>
                    <td>Mature, huge community, flexible</td>
                    <td>Slow, flaky, complex setup</td>
                    <td>Legacy apps, multi-language teams</td>
                  </tr>
                  <tr>
                    <td><strong>Puppeteer</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>Chrome/Chromium only</td>
                    <td>Fast, headless, PDF generation</td>
                    <td>Chrome-only, low-level API</td>
                    <td>Chrome-specific testing, scraping</td>
                  </tr>
                  <tr>
                    <td><strong>WebDriverIO</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>All major browsers</td>
                    <td>Flexible, mobile support, plugins</td>
                    <td>Complex configuration</td>
                    <td>Web + mobile testing</td>
                  </tr>
                  <tr>
                    <td><strong>CodeceptJS</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>All (via Playwright/Puppeteer/WebDriver)</td>
                    <td>BDD syntax, multi-backend, easy to read</td>
                    <td>Abstraction overhead</td>
                    <td>Teams wanting readable tests</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Unit Testing Frameworks */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-success text-white">
              <h3 className="h5 mb-0">🧪 Unit Testing Frameworks</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Framework</th>
                    <th>Language</th>
                    <th>Pros</th>
                    <th>Cons</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Jest</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>Zero config, snapshot testing, fast, mocking built-in</td>
                    <td>Large bundle size</td>
                    <td>React, Node.js projects</td>
                  </tr>
                  <tr>
                    <td><strong>Vitest</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>Vite-native, extremely fast, Jest-compatible API</td>
                    <td>Newer, smaller ecosystem</td>
                    <td>Vite projects, modern apps</td>
                  </tr>
                  <tr>
                    <td><strong>Mocha</strong></td>
                    <td>JavaScript/TypeScript</td>
                    <td>Flexible, mature, large ecosystem</td>
                    <td>Requires additional libraries (assertions, mocking)</td>
                    <td>Node.js, custom setups</td>
                  </tr>
                  <tr>
                    <td><strong>JUnit</strong></td>
                    <td>Java</td>
                    <td>Industry standard, annotations, parameterized tests</td>
                    <td>Java-only</td>
                    <td>Java applications</td>
                  </tr>
                  <tr>
                    <td><strong>pytest</strong></td>
                    <td>Python</td>
                    <td>Simple syntax, fixtures, plugins, detailed reports</td>
                    <td>Python-only</td>
                    <td>Python projects</td>
                  </tr>
                  <tr>
                    <td><strong>NUnit</strong></td>
                    <td>C#/.NET</td>
                    <td>.NET integration, attributes, parallel execution</td>
                    <td>.NET-only</td>
                    <td>.NET applications</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* API Testing */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-info text-white">
              <h3 className="h5 mb-0">🔌 API Testing Tools</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Tool</th>
                    <th>Type</th>
                    <th>Pros</th>
                    <th>Cons</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Postman</strong></td>
                    <td>GUI + CLI</td>
                    <td>User-friendly, collections, environments, Newman CLI</td>
                    <td>Heavy, paid features</td>
                    <td>Manual + automated API testing</td>
                  </tr>
                  <tr>
                    <td><strong>REST Assured</strong></td>
                    <td>Java Library</td>
                    <td>BDD syntax, Java integration, powerful assertions</td>
                    <td>Java-only</td>
                    <td>Java projects, REST APIs</td>
                  </tr>
                  <tr>
                    <td><strong>SuperTest</strong></td>
                    <td>Node.js Library</td>
                    <td>Simple, Express integration, chainable API</td>
                    <td>Node.js-only</td>
                    <td>Node.js APIs, Express apps</td>
                  </tr>
                  <tr>
                    <td><strong>Karate</strong></td>
                    <td>Framework</td>
                    <td>BDD, API + UI, no coding needed, parallel execution</td>
                    <td>Learning curve, JVM-based</td>
                    <td>API testing, non-programmers</td>
                  </tr>
                  <tr>
                    <td><strong>Pact</strong></td>
                    <td>Contract Testing</td>
                    <td>Consumer-driven contracts, microservices</td>
                    <td>Complex setup</td>
                    <td>Microservices, contract testing</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Mobile Testing */}
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header className="bg-warning">
              <h3 className="h5 mb-0">📱 Mobile Testing Frameworks</h3>
            </Card.Header>
            <Card.Body>
              <Table responsive striped bordered hover>
                <thead>
                  <tr>
                    <th>Framework</th>
                    <th>Platform</th>
                    <th>Pros</th>
                    <th>Cons</th>
                    <th>Best For</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Appium</strong></td>
                    <td>iOS, Android</td>
                    <td>Cross-platform, WebDriver protocol, multiple languages</td>
                    <td>Slow, setup complexity</td>
                    <td>Native + hybrid apps</td>
                  </tr>
                  <tr>
                    <td><strong>Detox</strong></td>
                    <td>iOS, Android</td>
                    <td>Fast, gray-box testing, React Native support</td>
                    <td>React Native focused</td>
                    <td>React Native apps</td>
                  </tr>
                  <tr>
                    <td><strong>XCUITest</strong></td>
                    <td>iOS only</td>
                    <td>Native Apple support, fast, reliable</td>
                    <td>iOS-only, Swift/Objective-C</td>
                    <td>iOS native apps</td>
                  </tr>
                  <tr>
                    <td><strong>Espresso</strong></td>
                    <td>Android only</td>
                    <td>Fast, native Android, auto-sync</td>
                    <td>Android-only, Java/Kotlin</td>
                    <td>Android native apps</td>
                  </tr>
                  <tr>
                    <td><strong>Maestro</strong></td>
                    <td>iOS, Android</td>
                    <td>Simple YAML syntax, fast, no flakiness</td>
                    <td>Newer, limited features</td>
                    <td>Quick mobile testing</td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Decision Matrix */}
      <Row className="mb-4">
        <Col>
          <Card className="border-primary">
            <Card.Header className="bg-primary text-white">
              <h3 className="h5 mb-0">🎯 Quick Decision Guide</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>Choose Playwright if:</h6>
                  <ul className="small">
                    <li>You need cross-browser testing</li>
                    <li>You want modern, fast automation</li>
                    <li>You need mobile emulation</li>
                    <li>You value auto-waiting and stability</li>
                  </ul>

                  <h6>Choose Cypress if:</h6>
                  <ul className="small">
                    <li>You're a frontend developer</li>
                    <li>You want great developer experience</li>
                    <li>You need time-travel debugging</li>
                    <li>Chrome/Firefox is enough</li>
                  </ul>

                  <h6>Choose Selenium if:</h6>
                  <ul className="small">
                    <li>You have legacy applications</li>
                    <li>You need multi-language support</li>
                    <li>You have existing Selenium tests</li>
                    <li>You need maximum browser coverage</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>Choose Jest if:</h6>
                  <ul className="small">
                    <li>You're testing React applications</li>
                    <li>You want zero configuration</li>
                    <li>You need snapshot testing</li>
                    <li>You want all-in-one solution</li>
                  </ul>

                  <h6>Choose Vitest if:</h6>
                  <ul className="small">
                    <li>You're using Vite</li>
                    <li>You want maximum speed</li>
                    <li>You need Jest compatibility</li>
                    <li>You're building modern apps</li>
                  </ul>

                  <h6>Choose Appium if:</h6>
                  <ul className="small">
                    <li>You need cross-platform mobile testing</li>
                    <li>You want to reuse web automation skills</li>
                    <li>You test native + hybrid apps</li>
                    <li>You need multiple language support</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Key Considerations */}
      <Row>
        <Col>
          <Card className="border-secondary">
            <Card.Header>
              <h3 className="h5 mb-0">💡 Key Considerations</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4}>
                  <h6>Team Skills</h6>
                  <p className="small">Choose frameworks matching your team's programming language expertise</p>
                </Col>
                <Col md={4}>
                  <h6>Project Type</h6>
                  <p className="small">Web, mobile, API, or full-stack? Pick specialized tools</p>
                </Col>
                <Col md={4}>
                  <h6>CI/CD Integration</h6>
                  <p className="small">Ensure framework supports your CI/CD pipeline</p>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <h6>Maintenance</h6>
                  <p className="small">Consider long-term support and community activity</p>
                </Col>
                <Col md={4}>
                  <h6>Speed</h6>
                  <p className="small">Faster tests = faster feedback loops</p>
                </Col>
                <Col md={4}>
                  <h6>Learning Curve</h6>
                  <p className="small">Balance power with ease of adoption</p>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
