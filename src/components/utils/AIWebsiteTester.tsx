import React, { useState } from 'react';
import { 
  Container, 
  Card, 
  Form, 
  Button, 
  Row, 
  Col, 
  Tabs, 
  Tab, 
  Alert, 
  Badge, 
  Spinner,
  ProgressBar,
  ListGroup,
  Accordion
} from 'react-bootstrap';
import { AITestingService, TestPlan, TestExecution, TestResult } from '../../utils/aiTestingService';
import { ChatConfig, AIProvider } from '../../utils/aiChatClient';

// Helper functions
const getCategoryIcon = (category: string) => {
  const icons = {
    functional: '⚙️',
    'ui-ux': '🎨',
    performance: '⚡',
    security: '🔒'
  };
  return icons[category as keyof typeof icons] || '📋';
};

const getCategoryColor = (category: string) => {
  const colors = {
    functional: 'primary',
    'ui-ux': 'info',
    performance: 'warning',
    security: 'danger'
  };
  return colors[category as keyof typeof colors] || 'secondary';
};

interface TestConfig {
  url: string;
  userContext: string;
  aiProvider: AIProvider;
  apiKey: string;
  useAI: boolean;
  categories: {
    functional: boolean;
    'ui-ux': boolean;
    performance: boolean;
    security: boolean;
  };
}

export const AIWebsiteTester: React.FC = () => {
  const [config, setConfig] = useState<TestConfig>({
    url: '',
    userContext: '',
    aiProvider: 'openai',
    apiKey: '',
    useAI: false,
    categories: {
      functional: true,
      'ui-ux': true,
      performance: true,
      security: true
    }
  });

  const [testPlan, setTestPlan] = useState<TestPlan | null>(null);
  const [execution, setExecution] = useState<TestExecution | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState('config');

  const handleGenerateTests = async () => {
    if (!config.url) {
      setError('Please provide URL');
      return;
    }

    if (config.useAI && !config.apiKey) {
      setError('Please provide API key for AI generation');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting test generation with config:', config);
      
      let service: AITestingService;
      
      if (config.useAI && config.apiKey) {
        const aiConfig: ChatConfig = {
          provider: config.aiProvider,
          apiKey: config.apiKey,
          model: config.aiProvider === 'openai' ? 'gpt-4' : undefined,
          temperature: 0.3,
          maxTokens: 1000
        };
        service = new AITestingService(aiConfig);
        console.log('Using AI-powered generation');
      } else {
        service = new AITestingService();
        console.log('Using template-based generation');
      }
      
      console.log('Generating test plan...');
      const plan = await service.generateTestPlan(config.url, config.userContext);
      
      console.log('Generated plan:', plan);
      console.log('Plan has', plan.testCases.length, 'test cases');
      
      // Filter test cases based on selected categories
      const filteredTestCases = plan.testCases.filter(tc => config.categories[tc.category]);
      console.log('Filtered to', filteredTestCases.length, 'test cases based on selected categories');
      
      setTestPlan({
        ...plan,
        testCases: filteredTestCases
      });
      
      setActiveTab('tests');
      
    } catch (err) {
      console.error('Error generating tests:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate test plan');
    } finally {
      setLoading(false);
    }
  };

  const startTestExecution = () => {
    if (!testPlan) return;

    const newExecution: TestExecution = {
      planId: testPlan.id,
      results: [],
      startTime: Date.now(),
      status: 'running'
    };

    setExecution(newExecution);
    setActiveTab('execution');
  };

  const updateTestResult = (testCaseId: string, stepId: string, result: Partial<TestResult>) => {
    if (!execution) return;

    const existingIndex = execution.results.findIndex(r => r.testCaseId === testCaseId && r.stepId === stepId);
    const newResult: TestResult = {
      testCaseId,
      stepId,
      status: 'pass',
      notes: '',
      timestamp: Date.now(),
      ...result
    };

    const updatedResults = [...execution.results];
    if (existingIndex >= 0) {
      updatedResults[existingIndex] = newResult;
    } else {
      updatedResults.push(newResult);
    }

    setExecution({
      ...execution,
      results: updatedResults
    });
  };

  return (
    <Container className="py-4">
      <div className="text-center mb-4">
        <h1>🤖 AI Website Tester</h1>
        <p className="text-muted">
          AI-powered comprehensive website testing with guided execution and detailed reporting
        </p>
      </div>

      <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'config')} className="mb-4">
        <Tab eventKey="config" title="🔧 Configuration">
          <Card>
            <Card.Header>
              <h5>Test Configuration</h5>
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
                      <Form.Label>AI Provider</Form.Label>
                      <Form.Select
                        value={config.aiProvider}
                        onChange={(e) => setConfig({ ...config, aiProvider: e.target.value as AIProvider })}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="google">Google Gemini</option>
                        <option value="ollama">Ollama (Local)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="useAI"
                    label="🤖 Use AI-Powered Generation (Experimental)"
                    checked={config.useAI}
                    onChange={(e) => setConfig({ ...config, useAI: e.target.checked })}
                  />
                  <Form.Text className="text-muted">
                    <strong>Recommended:</strong> Keep disabled for reliable, professional test cases. 
                    Enable for experimental AI generation (may fall back to templates if AI fails).
                  </Form.Text>
                </Form.Group>

                <Row className="mb-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>API Key {config.useAI && <span className="text-danger">*</span>}</Form.Label>
                      <Form.Control
                        type="password"
                        value={config.apiKey}
                        onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                        placeholder={config.useAI ? "Required for AI generation" : "Optional - leave empty for templates"}
                        disabled={!config.useAI}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>AI Provider</Form.Label>
                      <Form.Select
                        value={config.aiProvider}
                        onChange={(e) => setConfig({ ...config, aiProvider: e.target.value as AIProvider })}
                        disabled={!config.useAI}
                      >
                        <option value="openai">OpenAI</option>
                        <option value="anthropic">Anthropic Claude</option>
                        <option value="google">Google Gemini</option>
                        <option value="ollama">Ollama (Local)</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Website Context (Optional)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={config.userContext}
                    onChange={(e) => setConfig({ ...config, userContext: e.target.value })}
                    placeholder="Describe your website: e.g., 'E-commerce site selling electronics with user accounts, shopping cart, and payment processing'"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Test Categories</Form.Label>
                  <div className="d-flex flex-wrap gap-3">
                    {Object.entries(config.categories).map(([category, enabled]) => (
                      <Form.Check
                        key={category}
                        type="checkbox"
                        id={category}
                        label={`${getCategoryIcon(category)} ${category.toUpperCase().replace('-', '/')}`}
                        checked={enabled}
                        onChange={(e) => setConfig({
                          ...config,
                          categories: { ...config.categories, [category]: e.target.checked }
                        })}
                      />
                    ))}
                  </div>
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <Button 
                  variant="primary" 
                  onClick={handleGenerateTests}
                  disabled={loading || !config.url || (config.useAI && !config.apiKey)}
                  className="w-100"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {config.useAI ? 'AI generating tests...' : 'Generating professional tests...'}
                    </>
                  ) : (
                    config.useAI ? '🤖 Generate AI Test Plan' : '🚀 Generate Professional Test Plan'
                  )}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Tab>

        <Tab eventKey="tests" title="📋 Test Plan" disabled={!testPlan}>
          {testPlan && (
            <div>
              <Card className="mb-3">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5>Generated Test Plan</h5>
                  <div>
                    <Badge bg="info" className="me-2">
                      {testPlan.testCases.length} test cases
                    </Badge>
                    <Button variant="success" size="sm" onClick={startTestExecution}>
                      ▶️ Start Testing
                    </Button>
                  </div>
                </Card.Header>
                <Card.Body>
                  <p><strong>URL:</strong> {testPlan.url}</p>
                  <p><strong>Context:</strong> {testPlan.context || 'No additional context provided'}</p>
                  <p><strong>Generated:</strong> {new Date(testPlan.timestamp).toLocaleString()}</p>
                </Card.Body>
              </Card>

              <Accordion>
                {testPlan.testCases.map((testCase, index) => (
                  <Accordion.Item key={testCase.id} eventKey={index.toString()}>
                    <Accordion.Header>
                      <div className="d-flex align-items-center w-100">
                        <Badge bg={getCategoryColor(testCase.category)} className="me-2">
                          {getCategoryIcon(testCase.category)} {testCase.category.toUpperCase()}
                        </Badge>
                        <span className="flex-grow-1">{testCase.title}</span>
                        <Badge bg="secondary" className="ms-2">
                          {testCase.estimatedTime}min
                        </Badge>
                      </div>
                    </Accordion.Header>
                    <Accordion.Body>
                      <p><strong>Description:</strong> {testCase.description}</p>
                      <h6>Test Steps:</h6>
                      <ListGroup variant="flush">
                        {testCase.steps.map((step) => (
                          <ListGroup.Item key={step.id}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <strong>{step.description}</strong>
                                <div className="mt-2">
                                  <small className="text-muted">Instructions:</small>
                                  <ul className="mt-1">
                                    {step.instructions.map((instruction, i) => (
                                      <li key={i}><small>{instruction}</small></li>
                                    ))}
                                  </ul>
                                </div>
                                <div className="mt-2">
                                  <small className="text-success">
                                    <strong>Expected:</strong> {step.expectedResult}
                                  </small>
                                </div>
                              </div>
                              <Badge bg={step.priority === 'high' ? 'danger' : step.priority === 'medium' ? 'warning' : 'secondary'}>
                                {step.priority}
                              </Badge>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </Accordion.Body>
                  </Accordion.Item>
                ))}
              </Accordion>
            </div>
          )}
        </Tab>

        <Tab eventKey="execution" title="🧪 Test Execution" disabled={!execution}>
          {execution && testPlan && (
            <TestExecutionInterface
              testPlan={testPlan}
              execution={execution}
              onUpdateResult={updateTestResult}
            />
          )}
        </Tab>

        <Tab eventKey="results" title="📊 Results" disabled={!execution}>
          {execution && testPlan && (
            <TestResultsReport
              testPlan={testPlan}
              execution={execution}
            />
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

// Guided Test Execution Interface (Task 3)
const TestExecutionInterface: React.FC<{
  testPlan: TestPlan;
  execution: TestExecution;
  onUpdateResult: (testCaseId: string, stepId: string, result: Partial<TestResult>) => void;
}> = ({ testPlan, execution, onUpdateResult }) => {
  const [currentTestIndex, setCurrentTestIndex] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [notes, setNotes] = useState('');
  const [evidence, setEvidence] = useState<string>('');

  const currentTest = testPlan.testCases[currentTestIndex];
  const currentStep = currentTest?.steps[currentStepIndex];
  
  const getStepResult = (testCaseId: string, stepId: string) => {
    return execution.results.find(r => r.testCaseId === testCaseId && r.stepId === stepId);
  };

  const handleStepResult = (status: 'pass' | 'fail' | 'skip') => {
    if (!currentTest || !currentStep) return;

    onUpdateResult(currentTest.id, currentStep.id, {
      status,
      notes,
      evidence,
      timestamp: Date.now()
    });

    // Move to next step or test
    if (currentStepIndex < currentTest.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else if (currentTestIndex < testPlan.testCases.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
      setCurrentStepIndex(0);
    }

    // Reset form
    setNotes('');
    setEvidence('');
  };

  const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEvidence(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const totalSteps = testPlan.testCases.reduce((sum, tc) => sum + tc.steps.length, 0);
  const completedSteps = execution.results.length;
  const progressPercent = (completedSteps / totalSteps) * 100;

  if (!currentTest || !currentStep) {
    return (
      <Card>
        <Card.Body className="text-center">
          <h5>🎉 All Tests Completed!</h5>
          <p>You have completed all test cases in this plan.</p>
          <ProgressBar now={100} label="100% Complete" variant="success" />
        </Card.Body>
      </Card>
    );
  }

  return (
    <div>
      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5>Test Execution Progress</h5>
            <Badge bg="info">
              {completedSteps} / {totalSteps} steps completed
            </Badge>
          </div>
        </Card.Header>
        <Card.Body>
          <ProgressBar 
            now={progressPercent} 
            label={`${Math.round(progressPercent)}%`}
            className="mb-2"
          />
          <small className="text-muted">
            Current: Test {currentTestIndex + 1} of {testPlan.testCases.length}, 
            Step {currentStepIndex + 1} of {currentTest.steps.length}
          </small>
        </Card.Body>
      </Card>

      <Row>
        <Col md={8}>
          <Card className="mb-3">
            <Card.Header>
              <div className="d-flex align-items-center">
                <Badge bg={getCategoryColor(currentTest.category)} className="me-2">
                  {getCategoryIcon(currentTest.category)} {currentTest.category.toUpperCase()}
                </Badge>
                <h6 className="mb-0">{currentTest.title}</h6>
              </div>
            </Card.Header>
            <Card.Body>
              <h6>Current Step: {currentStep.description}</h6>
              
              <div className="mb-3">
                <strong>Instructions:</strong>
                <ol className="mt-2">
                  {currentStep.instructions.map((instruction, i) => (
                    <li key={i}>{instruction}</li>
                  ))}
                </ol>
              </div>

              <Alert variant="success">
                <strong>Expected Result:</strong> {currentStep.expectedResult}
              </Alert>

              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Test Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any observations, issues, or additional notes..."
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Evidence (Screenshot/File)</Form.Label>
                  <Form.Control
                    type="file"
                    accept="image/*,.pdf,.txt"
                    onChange={handleEvidenceUpload}
                  />
                  {evidence && (
                    <div className="mt-2">
                      <small className="text-success">✓ Evidence uploaded</small>
                    </div>
                  )}
                </Form.Group>

                <div className="d-flex gap-2">
                  <Button 
                    variant="success" 
                    onClick={() => handleStepResult('pass')}
                  >
                    ✅ Pass
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={() => handleStepResult('fail')}
                  >
                    ❌ Fail
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={() => handleStepResult('skip')}
                  >
                    ⏭️ Skip
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <Card.Header>
              <h6>Test Overview</h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                {testPlan.testCases.map((tc, tcIndex) => (
                  <ListGroup.Item 
                    key={tc.id}
                    className={tcIndex === currentTestIndex ? 'bg-light' : ''}
                  >
                    <div className="d-flex justify-content-between align-items-center">
                      <small>
                        <Badge bg={getCategoryColor(tc.category)} className="me-1">
                          {getCategoryIcon(tc.category)}
                        </Badge>
                        {tc.title}
                      </small>
                      <div>
                        {tc.steps.map((step, stepIndex) => {
                          const result = getStepResult(tc.id, step.id);
                          const isActive = tcIndex === currentTestIndex && stepIndex === currentStepIndex;
                          
                          return (
                            <Badge 
                              key={step.id}
                              bg={
                                isActive ? 'primary' :
                                result?.status === 'pass' ? 'success' :
                                result?.status === 'fail' ? 'danger' :
                                result?.status === 'skip' ? 'secondary' : 'light'
                              }
                              className="me-1"
                              style={{ fontSize: '0.6em' }}
                            >
                              {stepIndex + 1}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

// Comprehensive Test Results Report (Task 4)
const TestResultsReport: React.FC<{
  testPlan: TestPlan;
  execution: TestExecution;
}> = ({ testPlan, execution }) => {
  const getTestStats = () => {
    const totalTests = testPlan.testCases.length;
    const totalSteps = testPlan.testCases.reduce((sum, tc) => sum + tc.steps.length, 0);
    const completedSteps = execution.results.length;
    const passedSteps = execution.results.filter(r => r.status === 'pass').length;
    const failedSteps = execution.results.filter(r => r.status === 'fail').length;
    const skippedSteps = execution.results.filter(r => r.status === 'skip').length;
    
    return {
      totalTests,
      totalSteps,
      completedSteps,
      passedSteps,
      failedSteps,
      skippedSteps,
      passRate: completedSteps > 0 ? (passedSteps / completedSteps) * 100 : 0
    };
  };

  const getCategoryStats = () => {
    const categories = ['functional', 'ui-ux', 'performance', 'security'];
    return categories.map(category => {
      const categoryTests = testPlan.testCases.filter(tc => tc.category === category);
      const categorySteps = categoryTests.flatMap(tc => tc.steps);
      const categoryResults = execution.results.filter(r => 
        categorySteps.some(step => step.id === r.stepId)
      );
      
      const passed = categoryResults.filter(r => r.status === 'pass').length;
      const failed = categoryResults.filter(r => r.status === 'fail').length;
      const total = categoryResults.length;
      
      return {
        category,
        total: categorySteps.length,
        completed: total,
        passed,
        failed,
        passRate: total > 0 ? (passed / total) * 100 : 0
      };
    });
  };

  const exportReport = (format: 'json' | 'csv') => {
    const stats = getTestStats();
    const categoryStats = getCategoryStats();
    
    const reportData = {
      summary: {
        url: testPlan.url,
        timestamp: testPlan.timestamp,
        executionTime: execution.endTime ? execution.endTime - execution.startTime : Date.now() - execution.startTime,
        stats,
        categoryStats
      },
      testCases: testPlan.testCases.map(tc => ({
        ...tc,
        results: tc.steps.map(step => {
          const result = execution.results.find(r => r.stepId === step.id);
          return {
            step,
            result: result || { status: 'not_executed', notes: '', timestamp: 0 }
          };
        })
      }))
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      const csvRows = [
        ['Test Case', 'Category', 'Step', 'Status', 'Notes', 'Timestamp'],
        ...testPlan.testCases.flatMap(tc =>
          tc.steps.map(step => {
            const result = execution.results.find(r => r.stepId === step.id);
            return [
              tc.title,
              tc.category,
              step.description,
              result?.status || 'not_executed',
              result?.notes || '',
              result?.timestamp ? new Date(result.timestamp).toISOString() : ''
            ];
          })
        )
      ];
      
      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const stats = getTestStats();
  const categoryStats = getCategoryStats();

  return (
    <div>
      <Card className="mb-4">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5>📊 Test Execution Report</h5>
          <div>
            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => exportReport('json')}>
              📄 Export JSON
            </Button>
            <Button variant="outline-success" size="sm" onClick={() => exportReport('csv')}>
              📊 Export CSV
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <h6>Test Summary</h6>
              <p><strong>Website:</strong> {testPlan.url}</p>
              <p><strong>Executed:</strong> {new Date(execution.startTime).toLocaleString()}</p>
              <p><strong>Duration:</strong> {Math.round((execution.endTime || Date.now() - execution.startTime) / 1000 / 60)} minutes</p>
            </Col>
            <Col md={6}>
              <h6>Overall Results</h6>
              <div className="d-flex justify-content-between mb-2">
                <span>Pass Rate:</span>
                <Badge bg={stats.passRate >= 80 ? 'success' : stats.passRate >= 60 ? 'warning' : 'danger'}>
                  {Math.round(stats.passRate)}%
                </Badge>
              </div>
              <ProgressBar className="mb-2">
                <ProgressBar variant="success" now={(stats.passedSteps / stats.totalSteps) * 100} />
                <ProgressBar variant="danger" now={(stats.failedSteps / stats.totalSteps) * 100} />
                <ProgressBar variant="secondary" now={(stats.skippedSteps / stats.totalSteps) * 100} />
              </ProgressBar>
              <small className="text-muted">
                {stats.passedSteps} passed, {stats.failedSteps} failed, {stats.skippedSteps} skipped
              </small>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Row className="mb-4">
        {categoryStats.map(cat => (
          <Col md={3} key={cat.category}>
            <Card className="h-100">
              <Card.Body className="text-center">
                <h6>
                  {getCategoryIcon(cat.category)} {cat.category.toUpperCase().replace('-', '/')}
                </h6>
                <h4 className={`text-${cat.passRate >= 80 ? 'success' : cat.passRate >= 60 ? 'warning' : 'danger'}`}>
                  {Math.round(cat.passRate)}%
                </h4>
                <small className="text-muted">
                  {cat.passed}/{cat.completed} passed
                </small>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      <Card>
        <Card.Header>
          <h6>Detailed Test Results</h6>
        </Card.Header>
        <Card.Body>
          <Accordion>
            {testPlan.testCases.map((testCase, index) => {
              const testResults = execution.results.filter(r => 
                testCase.steps.some(step => step.id === r.stepId)
              );
              const testPassed = testResults.filter(r => r.status === 'pass').length;
              const testFailed = testResults.filter(r => r.status === 'fail').length;
              
              return (
                <Accordion.Item key={testCase.id} eventKey={index.toString()}>
                  <Accordion.Header>
                    <div className="d-flex align-items-center w-100">
                      <Badge bg={getCategoryColor(testCase.category)} className="me-2">
                        {getCategoryIcon(testCase.category)} {testCase.category.toUpperCase()}
                      </Badge>
                      <span className="flex-grow-1">{testCase.title}</span>
                      <div className="me-3">
                        {testPassed > 0 && <Badge bg="success" className="me-1">{testPassed} ✓</Badge>}
                        {testFailed > 0 && <Badge bg="danger" className="me-1">{testFailed} ✗</Badge>}
                      </div>
                    </div>
                  </Accordion.Header>
                  <Accordion.Body>
                    <ListGroup variant="flush">
                      {testCase.steps.map((step) => {
                        const result = execution.results.find(r => r.stepId === step.id);
                        return (
                          <ListGroup.Item key={step.id}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center mb-2">
                                  <Badge 
                                    bg={
                                      result?.status === 'pass' ? 'success' :
                                      result?.status === 'fail' ? 'danger' :
                                      result?.status === 'skip' ? 'secondary' : 'light'
                                    }
                                    className="me-2"
                                  >
                                    {result?.status === 'pass' ? '✓' :
                                     result?.status === 'fail' ? '✗' :
                                     result?.status === 'skip' ? '⏭' : '○'}
                                  </Badge>
                                  <strong>{step.description}</strong>
                                </div>
                                {result?.notes && (
                                  <div className="mt-2">
                                    <small className="text-muted">Notes:</small>
                                    <p className="mb-0">{result.notes}</p>
                                  </div>
                                )}
                                {result?.evidence && (
                                  <div className="mt-2">
                                    <small className="text-muted">Evidence attached</small>
                                  </div>
                                )}
                              </div>
                              {result && (
                                <small className="text-muted">
                                  {new Date(result.timestamp).toLocaleString()}
                                </small>
                              )}
                            </div>
                          </ListGroup.Item>
                        );
                      })}
                    </ListGroup>
                  </Accordion.Body>
                </Accordion.Item>
              );
            })}
          </Accordion>
        </Card.Body>
      </Card>
    </div>
  );
};
