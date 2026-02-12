/**
 * AIAssistButton - Reusable AI assist button for utility components
 * 
 * Shows an AI-powered button when the AI provider is configured.
 * Displays loading state, results, and errors consistently across all utilities.
 */

import React from 'react';
import { Button, Alert, Spinner, Collapse } from 'react-bootstrap';

interface AIAssistButtonProps {
  /** The label for the AI button */
  label: string;
  /** Click handler that triggers the AI request */
  onClick: () => void;
  /** Whether the AI request is in progress */
  isLoading: boolean;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Error message to display */
  error?: string;
  /** AI result text to display */
  result?: string;
  /** Callback to clear the result */
  onClear?: () => void;
  /** Button variant */
  variant?: string;
  /** Button size */
  size?: 'sm' | 'lg';
  /** Additional CSS class */
  className?: string;
}

export const AIAssistButton: React.FC<AIAssistButtonProps> = ({
  label,
  onClick,
  isLoading,
  disabled = false,
  error,
  result,
  onClear,
  variant = 'outline-info',
  size = 'sm',
  className = '',
}) => {
  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        disabled={isLoading || disabled}
        title="AI-powered feature (requires AI provider configuration)"
      >
        {isLoading ? (
          <>
            <Spinner animation="border" size="sm" className="me-1" />
            Processing...
          </>
        ) : (
          <>🤖 {label}</>
        )}
      </Button>

      <Collapse in={!!error}>
        <div>
          {error && (
            <Alert variant="danger" className="mt-2 mb-0 py-2 small" dismissible onClose={onClear}>
              {error}
            </Alert>
          )}
        </div>
      </Collapse>

      <Collapse in={!!result}>
        <div>
          {result && (
            <Alert variant="info" className="mt-2 mb-0" dismissible onClose={onClear}>
              <pre className="mb-0 small" style={{ whiteSpace: 'pre-wrap', maxHeight: '300px', overflow: 'auto' }}>
                {result}
              </pre>
            </Alert>
          )}
        </div>
      </Collapse>
    </div>
  );
};
