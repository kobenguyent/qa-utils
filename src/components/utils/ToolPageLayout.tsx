import React from 'react';
import { Container } from 'react-bootstrap';

interface ToolPageLayoutProps {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  children: React.ReactNode;
}

/**
 * Shared wrapper for every tool page.
 * Renders a consistent header (icon + title + description) and wraps children in a container.
 */
export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  icon,
  title,
  description,
  badge,
  children,
}) => {
  return (
    <Container className="tool-page">
      <div className="tool-header animate-fade-in-up">
        <div className="tool-header-icon">{icon}</div>
        <div className="tool-header-content">
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <h1 className="tool-header-title mb-0">{title}</h1>
            {badge && (
              <span className="badge-pill" style={{ fontSize: '0.7rem' }}>
                {badge}
              </span>
            )}
          </div>
          <p className="tool-header-desc mt-1">{description}</p>
        </div>
      </div>
      {children}
    </Container>
  );
};

export default ToolPageLayout;
