import React, { useState, useCallback, useEffect } from 'react';
import { Container, Form, Row, Col, Button, Card, Alert, Modal, Badge, ButtonGroup } from 'react-bootstrap';
import { 
  getAvailableTemplates, 
  generateWorkflowContent, 
  validateConfiguration,
  getPlacementInstructions,
  type WorkflowConfig,
  type GeneratedFile,
  type GeneratedWorkflow,
  type AvailableTemplates
} from '../../utils/workflowGenerator.ts';
import CopyWithToast from '../CopyWithToast.tsx';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';

export const WorkflowGenerator: React.FC = () => {
  const [config, setConfig] = useState<WorkflowConfig>({
    pipelineType: 'github',
    testType: 'api',
    nodeVersion: '18',
    runTestCommand: 'npm test',
    npmPublish: false
  });

  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [error, setError] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(false);
  const [templates, setTemplates] = useState<AvailableTemplates | null>(null);
  const ai = useAIAssistant();

  // Load available templates on component mount
  useEffect(() => {
    try {
      const availableTemplates = getAvailableTemplates();
      setTemplates(availableTemplates);
    } catch (err) {
      setError('Failed to load available templates. Please refresh the page.');
      console.error('Error loading templates:', err);
    }
  }, []);

  const handleConfigChange = useCallback((field: keyof WorkflowConfig, value: string | boolean) => {
    setConfig(prev => {
      const newConfig = { ...prev, [field]: value };
      
      // Reset test runner when switching from e2e to api
      if (field === 'testType' && value === 'api') {
        delete newConfig.testRunner;
      }
      
      // Reset drone pipeline type when switching away from drone
      if (field === 'pipelineType' && value !== 'drone') {
        delete newConfig.dronePipelineType;
      }

      return newConfig;
    });
    
    // Clear previous workflow when config changes
    setGeneratedWorkflow(null);
    setError('');
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError('');
    
    try {
      // Validate configuration first
      validateConfiguration(config);
      
      // Generate workflow content
      const result = generateWorkflowContent(config);
      setGeneratedWorkflow(result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate workflow. Please check your configuration.');
      console.error('Error generating workflow:', err);
    } finally {
      setIsGenerating(false);
    }
  }, [config]);

  const handleDownload = useCallback((file: GeneratedFile) => {
    const blob = new Blob([file.content], { type: 'text/yaml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);

  const getInstructions = useCallback((pipelineType: string) => {
    return getPlacementInstructions(pipelineType);
  }, []);

  if (!templates) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading templates...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
        <Row className="justify-content-center">
          <Col xs={12} lg={10}>
            <div className="text-center mb-4">
              <h1 className="h2">🚀 CI/CD Workflow Generator</h1>
              <p className="text-muted">
                Generate CI/CD workflow files for your project using Flowmatic CI/CD
              </p>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                <strong>Error:</strong> {error}
              </Alert>
            )}

            <Card className="mb-4">
              <Card.Header>
                <h3 className="h5 mb-0">🔧 Configuration</h3>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>CI/CD Platform *</Form.Label>
                        <Form.Select
                          value={config.pipelineType}
                          onChange={(e) => handleConfigChange('pipelineType', e.target.value)}
                        >
                          {templates.pipelineTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Test Type *</Form.Label>
                        <Form.Select
                          value={config.testType}
                          onChange={(e) => handleConfigChange('testType', e.target.value)}
                        >
                          {templates.testTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Text className="text-muted">
                          {templates.testTypes.find(t => t.value === config.testType)?.description}
                        </Form.Text>
                      </Form.Group>
                    </Col>
                  </Row>

                  {config.testType === 'e2e' && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Test Runner *</Form.Label>
                          <Form.Select
                            value={config.testRunner || ''}
                            onChange={(e) => handleConfigChange('testRunner', e.target.value)}
                            required
                          >
                            <option value="">Select test runner...</option>
                            {templates.testRunners.map((runner) => (
                              <option key={runner.value} value={runner.value}>
                                {runner.label}
                              </option>
                            ))}
                          </Form.Select>
                          {config.testRunner && (
                            <Form.Text className="text-muted">
                              Supports: {templates.testRunners.find(r => r.value === config.testRunner)?.frameworks.join(', ')}
                            </Form.Text>
                          )}
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Node.js Version</Form.Label>
                        <Form.Select
                          value={config.nodeVersion}
                          onChange={(e) => handleConfigChange('nodeVersion', e.target.value)}
                        >
                          {templates.nodeVersions.map((version: string) => (
                            <option key={version} value={version}>
                              Node.js {version}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Test Command</Form.Label>
                        <Form.Control
                          type="text"
                          value={config.runTestCommand}
                          onChange={(e) => handleConfigChange('runTestCommand', e.target.value)}
                          placeholder="npm test"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  {config.pipelineType === 'drone' && (
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Drone Pipeline Type</Form.Label>
                          <Form.Select
                            value={config.dronePipelineType || ''}
                            onChange={(e) => handleConfigChange('dronePipelineType', e.target.value)}
                          >
                            <option value="">Select pipeline type...</option>
                            {templates.dronePipelineTypes.map((type: string) => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  {config.pipelineType === 'github' && (
                    <Row>
                      <Col md={12}>
                        <Form.Group className="mb-3">
                          <Form.Check
                            type="checkbox"
                            id="npm-publish"
                            label="Include NPM publish workflow"
                            checked={config.npmPublish}
                            onChange={(e) => handleConfigChange('npmPublish', e.target.checked)}
                          />
                          <Form.Text className="text-muted">
                            Generates an additional workflow for publishing packages to NPM
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  )}

                  <div className="d-flex gap-2">
                    <Button
                      variant="primary"
                      onClick={handleGenerate}
                      disabled={isGenerating || (config.testType === 'e2e' && !config.testRunner)}
                    >
                      {isGenerating ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Generating...
                        </>
                      ) : (
                        '🚀 Generate Workflow'
                      )}
                    </Button>
                    <Button
                      variant="outline-info"
                      onClick={() => setShowInstructions(true)}
                    >
                      📚 Instructions
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>

            {generatedWorkflow && (
              <Card>
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h3 className="h5 mb-0">
                    ✅ Generated Workflow Files 
                    <Badge bg="secondary" className="ms-2">
                      {generatedWorkflow.files.length} file{generatedWorkflow.files.length !== 1 ? 's' : ''}
                    </Badge>
                  </h3>
                  <div>
                    {getInstructions(generatedWorkflow.pipelineType).folder && (
                      <Badge bg="info">
                        📁 {getInstructions(generatedWorkflow.pipelineType).folder}
                      </Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  {generatedWorkflow.files.map((file, index) => (
                    <div key={index} className={index > 0 ? 'mt-4' : ''}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h4 className="h6 mb-0">
                          📄 {file.name}
                          {file.description && (
                            <small className="text-muted ms-2">— {file.description}</small>
                          )}
                        </h4>
                        <ButtonGroup size="sm">
                          <CopyWithToast text={file.content} />
                          <Button
                            variant="outline-success"
                            size="sm"
                            onClick={() => handleDownload(file)}
                          >
                            💾 Download
                          </Button>
                        </ButtonGroup>
                      </div>
                      <pre className="theme-code-block p-3 rounded border overflow-auto" style={{ maxHeight: '400px' }}>
                        <code>{file.content}</code>
                      </pre>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            )}

            {ai.isConfigured && generatedWorkflow && (
              <AIAssistButton
                label="AI Optimize Workflow"
                onClick={async () => {
                  const workflowContent = generatedWorkflow.files.map(f => f.content).join('\n---\n');
                  try {
                    await ai.sendRequest(
                      'You are a CI/CD and DevOps expert. Analyze the provided workflow configuration and suggest optimizations for performance, security, and best practices. Be concise and actionable.',
                      `Analyze and suggest optimizations for this CI/CD workflow:\n\n${workflowContent}`
                    );
                  } catch {
                    // error displayed by AIAssistButton
                  }
                }}
                isLoading={ai.isLoading}
                error={ai.error}
                result={ai.result}
                onClear={ai.clear}
                className="mb-4"
              />
            )}
          </Col>
        </Row>

        {/* Instructions Modal */}
        <Modal show={showInstructions} onHide={() => setShowInstructions(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>📚 How to Use Generated Workflow Files</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <h5>🎯 General Instructions</h5>
            <ol>
              <li>Configure your workflow using the form above</li>
              <li>Click "Generate Workflow" to create the files</li>
              <li>Copy or download the generated workflow files</li>
              <li>Place them in the correct location in your repository</li>
              <li>Commit and push the files to activate your CI/CD pipeline</li>
            </ol>

            <h5 className="mt-4">📁 File Placement by Platform</h5>
            <div className="table-responsive">
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Platform</th>
                    <th>Location</th>
                    <th>Example</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.pipelineTypes.map((type) => {
                    const instructions = getInstructions(type.value);
                    return (
                      <tr key={type.value}>
                        <td>
                          <Badge bg="primary">{type.icon} {type.label}</Badge>
                        </td>
                        <td>{instructions.folder}</td>
                        <td><code>{instructions.example}</code></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <h5 className="mt-4">💡 Tips</h5>
            <ul>
              <li><strong>GitHub Actions:</strong> Create the <code>.github/workflows/</code> directory if it doesn't exist</li>
              <li><strong>Test Commands:</strong> Ensure your test command is defined in your package.json scripts</li>
              <li><strong>Node.js Version:</strong> Choose a version that matches your project requirements</li>
              <li><strong>NPM Publishing:</strong> Only available for GitHub Actions, requires proper NPM token setup</li>
            </ul>

            <Alert variant="info" className="mt-3">
              <strong>🔒 Security Note:</strong> Remember to configure any required secrets (API keys, tokens) in your CI/CD platform's settings before running the workflows.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowInstructions(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
  );
};