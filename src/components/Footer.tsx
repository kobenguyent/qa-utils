import React, { useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

export const Footer: React.FC = () => {
  const commitHash = __COMMIT_HASH__ ?? 'unknown'
  const currentYear = new Date().getFullYear();
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <>
      <footer className="glass-footer border-top mt-auto py-3">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-md-6">
              <small className="text-muted">
                © {currentYear} QA Utils - Built with ❤️ for the testing community
              </small>
            </div>
            <div className="col-md-6 text-md-end">
              <small className="text-muted">
                Built by 🏀 KobeT 🏀 | Commit: {commitHash}
                {' | '}
                <button 
                  className="btn btn-link btn-sm text-muted p-0"
                  onClick={() => setShowPrivacy(true)}
                  style={{ textDecoration: 'none', fontSize: 'inherit' }}
                >
                  🔒 Privacy
                </button>
              </small>
            </div>
          </div>
          <div className="row mt-2 align-items-center">
            <div className="col-12 text-center">
              <small className="text-muted">
                Support this project:{' '}
                <a 
                  href="https://github.com/sponsors/kobenguyent" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  style={{ fontSize: 'inherit' }}
                >
                  💖 GitHub Sponsors
                </a>
                {' | '}
                <a 
                  href="https://www.buymeacoffee.com/peternguyew" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="btn btn-link btn-sm p-0 text-decoration-none"
                  style={{ fontSize: 'inherit' }}
                >
                  ☕ Buy Me a Coffee
                </a>
              </small>
            </div>
          </div>
        </div>
      </footer>

      <Modal show={showPrivacy} onHide={() => setShowPrivacy(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>🔒 Privacy & Data Collection</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <h6 className="text-success mb-3">✅ Your Data Stays Private</h6>
          <p>
            <strong>QA Utils is designed with privacy in mind:</strong>
          </p>
          <ul>
            <li>✅ <strong>All tools run locally</strong> in your browser</li>
            <li>✅ <strong>No data is sent to our servers</strong></li>
            <li>✅ <strong>No user data is collected or stored</strong></li>
            <li>✅ <strong>Works offline</strong> (except AI features)</li>
          </ul>

          <h6 className="text-warning mt-4 mb-3">⚠️ Exception: Kobean Assistant AI Feature</h6>
          <p>
            When you use the <strong>Kobean Assistant</strong> with third-party AI providers:
          </p>
          <ul>
            <li>🔗 Your messages are sent to the AI provider you select (OpenAI, Anthropic, Google, etc.)</li>
            <li>📋 Data handling follows the AI provider's privacy policy</li>
            <li>🔑 Your API keys are stored only in your browser's local storage</li>
            <li>🚫 We never see or store your API keys or conversations</li>
          </ul>

          <h6 className="mt-4 mb-3">📊 Analytics</h6>
          <p>
            We use anonymous analytics (Umami) to understand:
          </p>
          <ul>
            <li>Which tools are most popular</li>
            <li>Basic usage statistics</li>
            <li>No personally identifiable information is collected</li>
          </ul>

          <p className="mt-4 mb-0">
            <strong>Questions?</strong> Visit our{' '}
            <a href="https://github.com/kobenguyent/qa-utils" target="_blank" rel="noopener noreferrer">
              GitHub repository
            </a>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowPrivacy(false)}>
            Got it!
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};
