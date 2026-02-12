import React, { useState } from 'react';
import { Button, Container, Form, Row, Col, Card, ProgressBar, Alert, Badge, Tab, Tabs } from 'react-bootstrap';
import { 
  ScanConfiguration, 
  ScanResult, 
  ScanProgress, 
  createScanner 
} from '../../utils/websiteScanner';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';

export const WebsiteScanner: React.FC = () => {
  const [config, setConfig] = useState<ScanConfiguration>({
    url: 'https://example.com',
    scanType: 'single',
    crawlDepth: 2,
    maxPages: 10,
    checks: {
      brokenLinks: true,
      accessibility: true,
      performance: true,
      seo: true,
      security: true,
      htmlValidation: false
    },
    wcagLevel: 'AA'
  });

  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState<ScanProgress | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string>('');
  const ai = useAIAssistant();

  const handleScan = async () => {
    if (!config.url) {
      setError('Please enter a valid URL');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);
    setProgress(null);

    try {
      const scanner = createScanner(config, (progress) => {
        setProgress(progress);
      });

      const scanResult = await scanner.scan();
      setResult(scanResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
    } finally {
      setScanning(false);
      setProgress(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'danger';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Container>
      <div className="text-center mb-4">
        <h1>🔍 Website Scanner</h1>
        <p className="text-muted">
          Comprehensive website analysis for broken links, accessibility, performance, SEO, and security
        </p>
      </div>

      <Card className="mb-4">
        <Card.Header>
          <h5>Scan Configuration</h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row className="mb-3">
              <Col md={8}>
                <Form.Group>
                  <Form.Label>Website URL</Form.Label>
                  <Form.Control
                    type="url"
                    value={config.url}
                    onChange={(e) => setConfig({ ...config, url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Scan Type</Form.Label>
                  <Form.Select
                    value={config.scanType}
                    onChange={(e) => setConfig({ ...config, scanType: e.target.value as 'single' | 'crawl' })}
                  >
                    <option value="single">Single Page</option>
                    <option value="crawl">Site Crawl</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {config.scanType === 'crawl' && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Crawl Depth</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="5"
                      value={config.crawlDepth}
                      onChange={(e) => setConfig({ ...config, crawlDepth: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Max Pages</Form.Label>
                    <Form.Control
                      type="number"
                      min="1"
                      max="100"
                      value={config.maxPages}
                      onChange={(e) => setConfig({ ...config, maxPages: parseInt(e.target.value) })}
                    />
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Row className="mb-3">
              <Col>
                <Form.Label>Quality Checks</Form.Label>
                <div className="d-flex flex-wrap gap-3">
                  <Form.Check
                    type="checkbox"
                    label="Broken Links"
                    checked={config.checks.brokenLinks}
                    onChange={(e) => setConfig({
                      ...config,
                      checks: { ...config.checks, brokenLinks: e.target.checked }
                    })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Accessibility"
                    checked={config.checks.accessibility}
                    onChange={(e) => setConfig({
                      ...config,
                      checks: { ...config.checks, accessibility: e.target.checked }
                    })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Performance"
                    checked={config.checks.performance}
                    onChange={(e) => setConfig({
                      ...config,
                      checks: { ...config.checks, performance: e.target.checked }
                    })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="SEO"
                    checked={config.checks.seo}
                    onChange={(e) => setConfig({
                      ...config,
                      checks: { ...config.checks, seo: e.target.checked }
                    })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="Security"
                    checked={config.checks.security}
                    onChange={(e) => setConfig({
                      ...config,
                      checks: { ...config.checks, security: e.target.checked }
                    })}
                  />
                  <Form.Check
                    type="checkbox"
                    label="HTML Validation"
                    checked={config.checks.htmlValidation}
                    onChange={(e) => setConfig({
                      ...config,
                      checks: { ...config.checks, htmlValidation: e.target.checked }
                    })}
                  />
                </div>
              </Col>
            </Row>

            {config.checks.performance && (
              <Row className="mb-3">
                <Col>
                  <Alert variant="info" className="small">
                    <strong>Performance Analysis:</strong> Uses Microlink.io API for real Lighthouse metrics (no API key required), 
                    with fallback to load time analysis. Provides Core Web Vitals and performance insights.
                  </Alert>
                </Col>
              </Row>
            )}

            {config.checks.accessibility && (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>WCAG Compliance Level</Form.Label>
                    <Form.Select
                      value={config.wcagLevel}
                      onChange={(e) => setConfig({ ...config, wcagLevel: e.target.value as 'AA' | 'AAA' })}
                    >
                      <option value="AA">WCAG 2.1 AA</option>
                      <option value="AAA">WCAG 2.1 AAA</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            )}

            <Button 
              variant="primary" 
              onClick={handleScan} 
              disabled={scanning}
              size="lg"
            >
              {scanning ? 'Scanning...' : 'Start Scan'}
            </Button>
          </Form>
        </Card.Body>
      </Card>

      {progress && (
        <Card className="mb-4">
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span>{progress.message}</span>
              <span>{progress.progress}%</span>
            </div>
            <ProgressBar now={progress.progress} variant="info" />
          </Card.Body>
        </Card>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {result && (
        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5>Scan Results</h5>
              <div className="d-flex align-items-center gap-2">
                <Badge bg={getScoreColor(result.overallScore)} className="fs-6">
                  {result.overallScore}/100
                </Badge>
                <span className="text-muted">{getScoreLabel(result.overallScore)}</span>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="mb-3">
              <small className="text-muted">
                Scanned: {result.url} • {new Date(result.timestamp).toLocaleString()}
              </small>
              {ai.isConfigured && (
                <AIAssistButton
                  label="AI Analyze Results"
                  onClick={async () => {
                    const summary = [
                      `URL: ${result.url}`,
                      `Overall Score: ${result.overallScore}/100`,
                      result.accessibility ? `Accessibility: ${result.accessibility.score}/100, ${result.accessibility.violations.length} violations` : '',
                      result.performance ? `Performance: ${result.performance.score}/100` : '',
                      result.seo ? `SEO: ${result.seo.score}/100` : '',
                      result.security ? `Security: ${result.security.score}/100` : '',
                    ].filter(Boolean).join('\n');
                    try {
                      await ai.sendRequest(
                        'You are a web development and QA expert. Analyze the website scan results and provide prioritized, actionable recommendations to improve the scores. Be concise.',
                        `Analyze these website scan results and suggest improvements:\n\n${summary}`
                      );
                    } catch {
                      // error displayed by AIAssistButton
                    }
                  }}
                  isLoading={ai.isLoading}
                  error={ai.error}
                  result={ai.result}
                  onClear={ai.clear}
                  className="mt-2"
                />
              )}
            </div>

            <Tabs defaultActiveKey="overview" className="mb-3">
              <Tab eventKey="overview" title="Overview">
                <Row>
                  {result.accessibility && (
                    <Col md={6} lg={4} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h6>Accessibility</h6>
                          <div className={`display-6 text-${getScoreColor(result.accessibility.score)}`}>
                            {result.accessibility.score}
                          </div>
                          <small className="text-muted">
                            {result.accessibility.violations.length} issues found
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}

                  {result.performance && (
                    <Col md={6} lg={4} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h6>Performance</h6>
                          <div className="position-relative d-inline-block mb-2">
                            <svg width="120" height="120" viewBox="0 0 120 120">
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke="#e6e6e6"
                                strokeWidth="8"
                              />
                              <circle
                                cx="60"
                                cy="60"
                                r="50"
                                fill="none"
                                stroke={result.performance.score >= 90 ? '#0cce6b' : result.performance.score >= 50 ? '#ffa400' : '#ff5722'}
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray={`${(result.performance.score / 100) * 314.16} 314.16`}
                                transform="rotate(-90 60 60)"
                                style={{ transition: 'stroke-dasharray 1s ease-in-out' }}
                              />
                            </svg>
                            <div className="position-absolute top-50 start-50 translate-middle">
                              <div className={`h4 mb-0 text-${getScoreColor(result.performance.score)}`}>
                                {result.performance.score}
                              </div>
                            </div>
                          </div>
                          <small className="text-muted d-block">
                            FCP: {Math.round(result.performance.firstContentfulPaint)}ms<br />
                            LCP: {Math.round(result.performance.largestContentfulPaint)}ms
                          </small>
                          <div className="mt-2">
                            <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                              FCP = First Contentful Paint<br />
                              LCP = Largest Contentful Paint
                            </small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}

                  {result.seo && (
                    <Col md={6} lg={4} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h6>SEO</h6>
                          <div className={`display-6 text-${getScoreColor(result.seo.score)}`}>
                            {result.seo.score}
                          </div>
                          <small className="text-muted">
                            {result.seo.title.present ? '✓' : '✗'} Title, {result.seo.metaDescription.present ? '✓' : '✗'} Meta Desc
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}

                  {result.security && (
                    <Col md={6} lg={4} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h6>Security</h6>
                          <div className={`display-6 text-${getScoreColor(result.security.score)}`}>
                            {result.security.score}
                          </div>
                          <small className="text-muted">
                            Security headers analysis
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}

                  {result.links && (
                    <Col md={6} lg={4} className="mb-3">
                      <Card className="h-100">
                        <Card.Body className="text-center">
                          <h6>Links</h6>
                          <div className="display-6 text-info">
                            {result.links.length}
                          </div>
                          <small className="text-muted">
                            {result.links.filter(l => l.status === 'broken').length} broken
                          </small>
                        </Card.Body>
                      </Card>
                    </Col>
                  )}
                </Row>
              </Tab>

              {result.links && (
                <Tab eventKey="links" title={`Links (${result.links.length})`}>
                  <div className="table-responsive">
                    <table className="table table-sm">
                      <thead>
                        <tr>
                          <th>URL</th>
                          <th>Status</th>
                          <th>Response Time</th>
                          <th>Status Code</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.links.map((link, index) => (
                          <tr key={index}>
                            <td className="text-truncate" style={{ maxWidth: '300px' }}>
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                {link.url}
                              </a>
                            </td>
                            <td>
                              <Badge bg={
                                link.status === 'working' ? 'success' :
                                link.status === 'broken' ? 'danger' :
                                link.status === 'slow' ? 'warning' : 'secondary'
                              }>
                                {link.status}
                              </Badge>
                            </td>
                            <td>{link.responseTime ? `${link.responseTime}ms` : '-'}</td>
                            <td>{link.statusCode || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Tab>
              )}

              {result.seo && (
                <Tab eventKey="seo" title="SEO Details">
                  <Row>
                    <Col md={6}>
                      <h6>Title Tag</h6>
                      <p className={result.seo.title.present ? 'text-success' : 'text-danger'}>
                        {result.seo.title.present ? '✓ Present' : '✗ Missing'}
                        {result.seo.title.content && (
                          <>
                            <br />
                            <small className="text-muted">
                              "{result.seo.title.content}" ({result.seo.title.length} chars)
                            </small>
                          </>
                        )}
                      </p>

                      <h6>Meta Description</h6>
                      <p className={result.seo.metaDescription.present ? 'text-success' : 'text-danger'}>
                        {result.seo.metaDescription.present ? '✓ Present' : '✗ Missing'}
                        {result.seo.metaDescription.content && (
                          <>
                            <br />
                            <small className="text-muted">
                              "{result.seo.metaDescription.content}" ({result.seo.metaDescription.length} chars)
                            </small>
                          </>
                        )}
                      </p>
                    </Col>
                    <Col md={6}>
                      <h6>Headings</h6>
                      <p>H1 tags: {result.seo.headings.h1Count}</p>

                      <h6>Images</h6>
                      <p>
                        Total: {result.seo.images.total}<br />
                        Missing alt text: {result.seo.images.missingAlt}
                      </p>
                    </Col>
                  </Row>
                </Tab>
              )}

              {result.security && (
                <Tab eventKey="security" title="Security">
                  <Row>
                    <Col>
                      <h6>Security Headers</h6>
                      <ul className="list-unstyled">
                        <li className={result.security.contentSecurityPolicy ? 'text-success' : 'text-danger'}>
                          {result.security.contentSecurityPolicy ? '✓' : '✗'} Content Security Policy
                        </li>
                        <li className={result.security.strictTransportSecurity ? 'text-success' : 'text-danger'}>
                          {result.security.strictTransportSecurity ? '✓' : '✗'} Strict Transport Security
                        </li>
                        <li className={result.security.xFrameOptions ? 'text-success' : 'text-danger'}>
                          {result.security.xFrameOptions ? '✓' : '✗'} X-Frame-Options
                        </li>
                        <li className={result.security.xContentTypeOptions ? 'text-success' : 'text-danger'}>
                          {result.security.xContentTypeOptions ? '✓' : '✗'} X-Content-Type-Options
                        </li>
                        <li className={result.security.referrerPolicy ? 'text-success' : 'text-danger'}>
                          {result.security.referrerPolicy ? '✓' : '✗'} Referrer Policy
                        </li>
                      </ul>
                    </Col>
                  </Row>
                </Tab>
              )}

              {result.performance && (
                <Tab eventKey="performance" title="Performance Details">
                  <Row>
                    <Col md={12}>
                      <h6>Core Web Vitals</h6>
                      <Row className="text-center mb-4">
                        <Col md={4}>
                          <div className="mb-2">
                            <svg width="80" height="80" viewBox="0 0 80 80">
                              <circle cx="40" cy="40" r="35" fill="none" stroke="#e6e6e6" strokeWidth="6" />
                              <circle
                                cx="40" cy="40" r="35" fill="none"
                                stroke={result.performance.firstContentfulPaint < 1800 ? '#0cce6b' : 
                                       result.performance.firstContentfulPaint < 3000 ? '#ffa400' : '#ff5722'}
                                strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${Math.min((2000 - result.performance.firstContentfulPaint) / 2000 * 219.91, 219.91)} 219.91`}
                                transform="rotate(-90 40 40)"
                              />
                            </svg>
                            <div className="mt-2">
                              <strong>FCP</strong><br />
                              <span className={`text-${result.performance.firstContentfulPaint < 1800 ? 'success' : 
                                             result.performance.firstContentfulPaint < 3000 ? 'warning' : 'danger'}`}>
                                {Math.round(result.performance.firstContentfulPaint)}ms
                              </span>
                            </div>
                          </div>
                        </Col>
                        
                        <Col md={4}>
                          <div className="mb-2">
                            <svg width="80" height="80" viewBox="0 0 80 80">
                              <circle cx="40" cy="40" r="35" fill="none" stroke="#e6e6e6" strokeWidth="6" />
                              <circle
                                cx="40" cy="40" r="35" fill="none"
                                stroke={result.performance.largestContentfulPaint < 2500 ? '#0cce6b' : 
                                       result.performance.largestContentfulPaint < 4000 ? '#ffa400' : '#ff5722'}
                                strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${Math.min((3000 - result.performance.largestContentfulPaint) / 3000 * 219.91, 219.91)} 219.91`}
                                transform="rotate(-90 40 40)"
                              />
                            </svg>
                            <div className="mt-2">
                              <strong>LCP</strong><br />
                              <span className={`text-${result.performance.largestContentfulPaint < 2500 ? 'success' : 
                                             result.performance.largestContentfulPaint < 4000 ? 'warning' : 'danger'}`}>
                                {Math.round(result.performance.largestContentfulPaint)}ms
                              </span>
                            </div>
                          </div>
                        </Col>
                        
                        <Col md={4}>
                          <div className="mb-2">
                            <svg width="80" height="80" viewBox="0 0 80 80">
                              <circle cx="40" cy="40" r="35" fill="none" stroke="#e6e6e6" strokeWidth="6" />
                              <circle
                                cx="40" cy="40" r="35" fill="none"
                                stroke={result.performance.cumulativeLayoutShift < 0.1 ? '#0cce6b' : 
                                       result.performance.cumulativeLayoutShift < 0.25 ? '#ffa400' : '#ff5722'}
                                strokeWidth="6" strokeLinecap="round"
                                strokeDasharray={`${Math.min((0.25 - result.performance.cumulativeLayoutShift) / 0.25 * 219.91, 219.91)} 219.91`}
                                transform="rotate(-90 40 40)"
                              />
                            </svg>
                            <div className="mt-2">
                              <strong>CLS</strong><br />
                              <span className={`text-${result.performance.cumulativeLayoutShift < 0.1 ? 'success' : 
                                             result.performance.cumulativeLayoutShift < 0.25 ? 'warning' : 'danger'}`}>
                                {result.performance.cumulativeLayoutShift.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </Col>
                      </Row>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={12}>
                      <div className="mt-4 p-3 bg-light rounded">
                        <h6>Performance Metrics Legend</h6>
                        <Row>
                          <Col md={4}>
                            <ul className="list-unstyled small">
                              <li><strong>FCP</strong> - First Contentful Paint: Time until first text/image appears</li>
                              <li><strong>LCP</strong> - Largest Contentful Paint: Time until largest element loads</li>
                              <li><strong>CLS</strong> - Cumulative Layout Shift: Visual stability score (lower is better)</li>
                              <li><strong>TTI</strong> - Time to Interactive: Time until fully interactive</li>
                            </ul>
                          </Col>
                          <Col md={4}>
                            <ul className="list-unstyled small">
                              <li><strong>Speed Index</strong> - How quickly page contents are visually populated</li>
                              <li><strong>TBT</strong> - Total Blocking Time: Main thread blocking duration</li>
                              <li><strong>FID</strong> - First Input Delay: Time to respond to first user interaction</li>
                              <li><strong>Server Response</strong> - Initial server response time</li>
                            </ul>
                          </Col>
                          <Col md={4}>
                            <ul className="list-unstyled small">
                              <li><strong>DOM Content Loaded</strong> - DOM parsing complete time</li>
                              <li><strong>Fully Loaded</strong> - All resources loaded time</li>
                              <li><strong>Performance Score</strong> - Overall Lighthouse performance rating</li>
                            </ul>
                          </Col>
                        </Row>
                        <div className="mt-2">
                          <small className="text-muted">
                            <span className="text-success">●</span> Good &nbsp;
                            <span className="text-warning">●</span> Needs Improvement &nbsp;
                            <span className="text-danger">●</span> Poor
                          </small>
                        </div>
                      </div>
                    </Col>
                  </Row>
                  
                  <Row>
                    <Col md={6}>
                      <h6>Additional Metrics</h6>
                      <div className="mb-3">
                        <strong>Speed Index</strong><br />
                        <Badge bg={result.performance.speedIndex < 1300 ? 'success' : 
                                   result.performance.speedIndex < 3400 ? 'warning' : 'danger'}>
                          {Math.round(result.performance.speedIndex)}ms
                        </Badge>
                        <small className="text-muted d-block">Visual loading speed</small>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Total Blocking Time (TBT)</strong><br />
                        <Badge bg={result.performance.totalBlockingTime < 200 ? 'success' : 
                                   result.performance.totalBlockingTime < 600 ? 'warning' : 'danger'}>
                          {Math.round(result.performance.totalBlockingTime)}ms
                        </Badge>
                        <small className="text-muted d-block">Main thread blocking time</small>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Time to Interactive (TTI)</strong><br />
                        <Badge bg={result.performance.timeToInteractive < 3800 ? 'success' : 
                                   result.performance.timeToInteractive < 7300 ? 'warning' : 'danger'}>
                          {Math.round(result.performance.timeToInteractive)}ms
                        </Badge>
                        <small className="text-muted d-block">Time until fully interactive</small>
                      </div>
                      
                      {result.performance.firstInputDelay > 0 && (
                        <div className="mb-3">
                          <strong>First Input Delay (FID)</strong><br />
                          <Badge bg={result.performance.firstInputDelay < 100 ? 'success' : 
                                     result.performance.firstInputDelay < 300 ? 'warning' : 'danger'}>
                            {Math.round(result.performance.firstInputDelay)}ms
                          </Badge>
                          <small className="text-muted d-block">Interactivity delay</small>
                        </div>
                      )}
                    </Col>
                    
                    <Col md={6}>
                      <h6>Loading Metrics</h6>
                      <div className="mb-3">
                        <strong>Server Response Time</strong><br />
                        <Badge bg={result.performance.serverResponseTime < 200 ? 'success' : 
                                   result.performance.serverResponseTime < 600 ? 'warning' : 'danger'}>
                          {Math.round(result.performance.serverResponseTime)}ms
                        </Badge>
                        <small className="text-muted d-block">Initial server response</small>
                      </div>
                      
                      <div className="mb-3">
                        <strong>DOM Content Loaded</strong><br />
                        <Badge bg={result.performance.domContentLoaded < 1500 ? 'success' : 
                                   result.performance.domContentLoaded < 3000 ? 'warning' : 'danger'}>
                          {Math.round(result.performance.domContentLoaded)}ms
                        </Badge>
                        <small className="text-muted d-block">DOM parsing complete</small>
                      </div>
                      
                      <div className="mb-3">
                        <strong>Fully Loaded</strong><br />
                        <Badge bg={result.performance.fullyLoaded < 3000 ? 'success' : 
                                   result.performance.fullyLoaded < 5000 ? 'warning' : 'danger'}>
                          {Math.round(result.performance.fullyLoaded)}ms
                        </Badge>
                        <small className="text-muted d-block">All resources loaded</small>
                      </div>
                    </Col>
                  </Row>
                </Tab>
              )}

              {result.accessibility && (
                <Tab eventKey="accessibility" title={`Accessibility (${result.accessibility.violations?.length || 0} issues)`}>
                  <Row>
                    <Col md={6}>
                      <h6>WCAG Compliance</h6>
                      <p>
                        Score: <Badge bg={getScoreColor(result.accessibility.score)}>
                          {result.accessibility.score}/100
                        </Badge>
                      </p>
                      <p>
                        Compliance Level: <Badge bg="info">{config.wcagLevel}</Badge>
                      </p>
                      <p>
                        Checks Passed: {result.accessibility.passes}<br />
                        Issues Found: {result.accessibility.violations?.length || 0}
                      </p>
                    </Col>
                    <Col md={6}>
                      <h6>Issues by Impact</h6>
                      {['critical', 'serious', 'moderate', 'minor'].map(impact => {
                        const count = result.accessibility?.violations?.filter(v => v.impact === impact).length || 0;
                        return count > 0 ? (
                          <div key={impact}>
                            <Badge bg={
                              impact === 'critical' ? 'danger' :
                              impact === 'serious' ? 'warning' :
                              impact === 'moderate' ? 'info' : 'secondary'
                            } className="me-2">
                              {count}
                            </Badge>
                            {impact.charAt(0).toUpperCase() + impact.slice(1)}
                          </div>
                        ) : null;
                      })}
                    </Col>
                  </Row>
                  
                  {(result.accessibility.violations?.length || 0) > 0 && (
                    <>
                      <hr />
                      <h6>Accessibility Issues</h6>
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Impact</th>
                              <th>Issue</th>
                              <th>Help</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(result.accessibility.violations || []).map((violation, index) => (
                              <tr key={index}>
                                <td>
                                  <Badge bg={
                                    violation.impact === 'critical' ? 'danger' :
                                    violation.impact === 'serious' ? 'warning' :
                                    violation.impact === 'moderate' ? 'info' : 'secondary'
                                  }>
                                    {violation.impact}
                                  </Badge>
                                </td>
                                <td>{violation.description}</td>
                                <td>
                                  <small className="text-muted">
                                    {violation.help}
                                    {violation.helpUrl && (
                                      <> <a href={violation.helpUrl} target="_blank" rel="noopener noreferrer">Learn more</a></>
                                    )}
                                  </small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </Tab>
              )}

              {result.htmlValidation && (
                <Tab eventKey="validation" title={`HTML Validation (${result.htmlValidation.errors.length} errors)`}>
                  <Row>
                    <Col md={6}>
                      <h6>Validation Status</h6>
                      <p className={result.htmlValidation.valid ? 'text-success' : 'text-danger'}>
                        {result.htmlValidation.valid ? '✓ Valid HTML' : '✗ Invalid HTML'}
                      </p>
                      <p>
                        Errors: <Badge bg="danger">{result.htmlValidation.errors.length}</Badge><br />
                        Warnings: <Badge bg="warning">{result.htmlValidation.warnings.length}</Badge>
                      </p>
                    </Col>
                  </Row>
                  
                  {(result.htmlValidation.errors.length > 0 || result.htmlValidation.warnings.length > 0) && (
                    <>
                      <hr />
                      <div className="table-responsive">
                        <table className="table table-sm">
                          <thead>
                            <tr>
                              <th>Type</th>
                              <th>Message</th>
                              <th>Line</th>
                              <th>Column</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.htmlValidation.errors.map((error, index) => (
                              <tr key={`error-${index}`}>
                                <td><Badge bg="danger">Error</Badge></td>
                                <td>{error.message}</td>
                                <td>{error.line || '-'}</td>
                                <td>{error.column || '-'}</td>
                              </tr>
                            ))}
                            {result.htmlValidation.warnings.map((warning, index) => (
                              <tr key={`warning-${index}`}>
                                <td><Badge bg="warning">Warning</Badge></td>
                                <td>{warning.message}</td>
                                <td>{warning.line || '-'}</td>
                                <td>{warning.column || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </Tab>
              )}
            </Tabs>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};
