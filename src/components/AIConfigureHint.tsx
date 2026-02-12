/**
 * AIConfigureHint - Shows a small hint to configure AI provider via Kobean Assistant
 * 
 * Used in utility components when AI features are available but the AI provider
 * is not yet configured. Redirects users to the Kobean Assistant settings.
 */

import React from 'react';
import { Alert } from 'react-bootstrap';

interface AIConfigureHintProps {
  /** Additional CSS class */
  className?: string;
}

export const AIConfigureHint: React.FC<AIConfigureHintProps> = ({
  className = '',
}) => {
  return (
    <Alert variant="light" className={`py-2 small border ${className}`}>
      🤖 AI features available.{' '}
      <Alert.Link href="#/kobean">Configure AI provider in Kobean Assistant</Alert.Link> to enable them.
    </Alert>
  );
};
