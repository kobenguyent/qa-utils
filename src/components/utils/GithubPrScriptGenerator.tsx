import React, { useState, useEffect } from 'react';
import { Container, Form, Row, Col, Button, Card, Alert, Badge } from 'react-bootstrap';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { createGenerator, defaultConfig, type ScriptConfig, type GeneratedScript } from '../../utils/githubPrScriptGenerator';
import { useSessionStorage } from '../../utils/useSessionStorage';
import { useAIAssistant } from '../../utils/useAIAssistant';
import { AIAssistButton } from '../AIAssistButton';
import { AIConfigureHint } from '../AIConfigureHint';

export const GithubPrScriptGenerator: React.FC = () => {
  const [config, setConfig] = useSessionStorage<ScriptConfig>('github-pr-config', defaultConfig);
  const [generatedScript, setGeneratedScript] = useState<GeneratedScript | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const ai = useAIAssistant();

  const generator = createGenerator();

  useEffect(() => {
    if (config.repoUrl && config.featureBranch && config.prTitle) {
      handleGenerate();
    }
  }, [config]);

  const handleConfigChange = (field: keyof ScriptConfig, value: string | boolean | string[]) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    try {
      const result = generator.generateScript(config);
      setGeneratedScript(result);
    } catch (error) {
      console.error('Script generation failed:', error);
    }
  };

  const handleDownload = () => {
    if (!generatedScript) return;

    const blob = new Blob([generatedScript.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedScript.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Container className="py-4">
      <Row>
        <Col>
          <h1 className="mb-4">🚀 GitHub PR Script Generator</h1>
          <p className="text-muted mb-4">
            Generate customizable bash scripts for creating GitHub pull requests with full git workflow support.
          </p>
        </Col>
      </Row>

      <Row>
        <Col lg={6}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Configuration</h5>
            </Card.Header>
            <Card.Body>
              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Repository URL</Form.Label>
                      <Form.Control
                        type="url"
                        placeholder="https://github.com/owner/repo"
                        value={config.repoUrl}
                        onChange={(e) => handleConfigChange('repoUrl', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Base Branch</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="main"
                        value={config.baseBranch}
                        onChange={(e) => handleConfigChange('baseBranch', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Feature Branch</Form.Label>
                      <Form.Control
                        type="text"
                        placeholder="feature/my-feature"
                        value={config.featureBranch}
                        onChange={(e) => handleConfigChange('featureBranch', e.target.value)}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Authentication Method</Form.Label>
                      <Form.Select
                        value={config.authMethod}
                        onChange={(e) => handleConfigChange('authMethod', e.target.value as any)}
                      >
                        <option value="github-cli">GitHub CLI</option>
                        <option value="pat">Personal Access Token</option>
                        <option value="ssh">SSH Key</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                {config.authMethod === 'pat' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Personal Access Token</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={config.patToken || ''}
                      onChange={(e) => handleConfigChange('patToken', e.target.value)}
                    />
                  </Form.Group>
                )}

                <Form.Group className="mb-3">
                  <Form.Label>PR Title</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Add new feature"
                    value={config.prTitle}
                    onChange={(e) => handleConfigChange('prTitle', e.target.value)}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>PR Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Describe your changes..."
                    value={config.prDescription}
                    onChange={(e) => handleConfigChange('prDescription', e.target.value)}
                  />
                  {ai.isConfigured ? (
                    <AIAssistButton
                      label="Draft PR Description"
                      onClick={async () => {
                        try {
                          const response = await ai.sendRequest(
                            'You are a software engineer. Write a clear, professional PR description based on the given context. Return ONLY the description text without markdown formatting headers.',
                            `Draft a PR description for:\nTitle: ${config.prTitle}\nBranch: ${config.featureBranch}\nBase: ${config.baseBranch}\nCommit message: ${config.commitMessage}`
                          );
                          handleConfigChange('prDescription', response);
                        } catch {
                          // error displayed by AIAssistButton
                        }
                      }}
                      isLoading={ai.isLoading}
                      disabled={!config.prTitle}
                      error={ai.error}
                      onClear={ai.clear}
                      className="mt-2"
                    />
                  ) : (
                    <AIConfigureHint className="mt-2" />
                  )}
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Commit Message</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="feat: add new feature"
                    value={config.commitMessage}
                    onChange={(e) => handleConfigChange('commitMessage', e.target.value)}
                  />
                </Form.Group>

                <Row>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Create Branch"
                      checked={config.createBranch}
                      onChange={(e) => handleConfigChange('createBranch', e.target.checked)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Stage Files"
                      checked={config.stageFiles}
                      onChange={(e) => handleConfigChange('stageFiles', e.target.checked)}
                    />
                  </Col>
                  <Col md={4}>
                    <Form.Check
                      type="checkbox"
                      label="Force Push"
                      checked={config.forcePush}
                      onChange={(e) => handleConfigChange('forcePush', e.target.checked)}
                    />
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Generated Script</h5>
              <div>
                {generatedScript && generatedScript.errors.length === 0 && (
                  <>
                    <CopyToClipboard
                      text={generatedScript.content}
                      onCopy={handleCopy}
                    >
                      <Button variant="outline-primary" size="sm" className="me-2">
                        📋 {copySuccess ? 'Copied!' : 'Copy'}
                      </Button>
                    </CopyToClipboard>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleDownload}
                    >
                      💾 Download
                    </Button>
                  </>
                )}
              </div>
            </Card.Header>
            <Card.Body>
              {generatedScript?.errors && generatedScript.errors.length > 0 && (
                <Alert variant="danger">
                  <strong>Errors:</strong>
                  <ul className="mb-0 mt-2">
                    {generatedScript.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {generatedScript?.warnings && generatedScript.warnings.length > 0 && (
                <Alert variant="warning">
                  <strong>Warnings:</strong>
                  <ul className="mb-0 mt-2">
                    {generatedScript.warnings.map((warning, index) => (
                      <li key={index}>{warning}</li>
                    ))}
                  </ul>
                </Alert>
              )}

              {generatedScript && (!generatedScript.errors || generatedScript.errors.length === 0) && (
                <div>
                  <div className="mb-2">
                    <Badge bg="success">✓ Script Ready</Badge>
                    <Badge bg="info" className="ms-2">{generatedScript.filename}</Badge>
                  </div>
                  <pre className="theme-code-block p-3 rounded" style={{ fontSize: '0.85rem', maxHeight: '400px', overflow: 'auto' }}>
                    <code>{generatedScript.content}</code>
                  </pre>
                </div>
              )}

              {!generatedScript && (
                <div className="text-center text-muted py-4">
                  <p>Fill in the configuration to generate your script</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">📖 Usage Instructions</h5>
            </Card.Header>
            <Card.Body>
              <ol>
                <li><strong>Configure:</strong> Fill in your repository details and preferences above</li>
                <li><strong>Generate:</strong> The script will be generated automatically as you type</li>
                <li><strong>Download:</strong> Click "Download" to save the script as a .sh file</li>
                <li><strong>Execute:</strong> Make the script executable and run it:
                  <pre className="theme-code-block p-2 mt-2 rounded"><code>chmod +x {generatedScript?.filename || 'create-pr.sh'}{'\n'}./{generatedScript?.filename || 'create-pr.sh'}</code></pre>
                </li>
              </ol>

              <Alert variant="info" className="mt-3">
                <strong>💡 Tips:</strong>
                <ul className="mb-0 mt-2">
                  <li>GitHub CLI method is recommended for ease of use</li>
                  <li>Personal Access Token requires repo permissions</li>
                  <li>SSH method works with existing SSH key setup</li>
                  <li>Your preferences are automatically saved in your browser</li>
                </ul>
              </Alert>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
