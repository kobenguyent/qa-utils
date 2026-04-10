import { useState } from "react";
import { Container, Form, Button, Badge } from "react-bootstrap";
import { ChecklistRoom } from "./ChecklistRoom";

export const WebTestingChecklist = () => {
  const [roomMode, setRoomMode] = useState(false);

  const ROOMS = [
    "🎨 User Interface Testing",
    "🧪 Functional Testing",
    "♿ Accessibility Testing",
    "🔒 Security Testing",
    "⚡ Performance Testing",
    "🌍 Cross-Browser Testing",
    "📱 Responsive Testing",
    "🐛 Error Handling",
    "✅ Final Checks",
  ];

  return (
    <Container className="py-4">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="mb-1">🌐 Web Testing Checklist</h1>
          <p className="lead mb-0">
            A comprehensive checklist for testing web applications.
          </p>
        </div>
        <Button
          variant={roomMode ? "success" : "outline-secondary"}
          onClick={() => setRoomMode(r => !r)}
          aria-label={roomMode ? "Switch to list mode" : "Switch to room mode"}
        >
          {roomMode ? "🗺️ Room Mode ON" : "🗺️ Room Mode"}
        </Button>
      </div>

      {roomMode && (
        <div className="mb-3 p-3 rounded" style={{ backgroundColor: "var(--info-bg)", color: "var(--info-text)" }}>
          <strong>🏛️ Palace Walk Mode</strong> — Complete each room to mark it visited. Visited rooms collapse,
          giving you a spatial sense of progress.{" "}
          <Badge bg="secondary">{ROOMS.length} rooms to explore</Badge>
        </div>
      )}

      <ChecklistRoom title="User Interface Testing" icon="🎨" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Verify page layout and responsive design across different screen sizes" className="mb-2" />
          <Form.Check type="checkbox" label="Check all links and navigation work correctly" className="mb-2" />
          <Form.Check type="checkbox" label="Validate forms with valid and invalid inputs" className="mb-2" />
          <Form.Check type="checkbox" label="Test buttons, dropdowns, and interactive elements" className="mb-2" />
          <Form.Check type="checkbox" label="Verify images, icons, and media load properly" className="mb-2" />
          <Form.Check type="checkbox" label="Check color contrast and text readability" className="mb-2" />
          <Form.Check type="checkbox" label="Verify tooltips, popups, and modals display correctly" className="mb-2" />
          <Form.Check type="checkbox" label="Test error messages and validation feedback" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Functional Testing" icon="🧪" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test user registration and login flows" className="mb-2" />
          <Form.Check type="checkbox" label="Verify CRUD operations (Create, Read, Update, Delete)" className="mb-2" />
          <Form.Check type="checkbox" label="Test search functionality with various queries" className="mb-2" />
          <Form.Check type="checkbox" label="Validate filter and sorting features" className="mb-2" />
          <Form.Check type="checkbox" label="Test pagination and data loading" className="mb-2" />
          <Form.Check type="checkbox" label="Verify file upload and download functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Test session management and timeouts" className="mb-2" />
          <Form.Check type="checkbox" label="Validate password reset and recovery flows" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Accessibility Testing" icon="♿" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test keyboard navigation (Tab, Enter, Escape)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify screen reader compatibility" className="mb-2" />
          <Form.Check type="checkbox" label="Check ARIA labels and roles are properly implemented" className="mb-2" />
          <Form.Check type="checkbox" label="Validate focus indicators are visible" className="mb-2" />
          <Form.Check type="checkbox" label="Test with accessibility tools (WAVE, Axe, Lighthouse)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify WCAG 2.1 compliance (A, AA, AAA levels)" className="mb-2" />
          <Form.Check type="checkbox" label="Check alt text for images" className="mb-2" />
          <Form.Check type="checkbox" label="Test with high contrast mode" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Security Testing" icon="🔒" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test for SQL injection vulnerabilities" className="mb-2" />
          <Form.Check type="checkbox" label="Check for Cross-Site Scripting (XSS) vulnerabilities" className="mb-2" />
          <Form.Check type="checkbox" label="Verify CSRF token protection" className="mb-2" />
          <Form.Check type="checkbox" label="Test authentication and authorization" className="mb-2" />
          <Form.Check type="checkbox" label="Check HTTPS/SSL certificate validity" className="mb-2" />
          <Form.Check type="checkbox" label="Verify sensitive data is encrypted" className="mb-2" />
          <Form.Check type="checkbox" label="Test password strength requirements" className="mb-2" />
          <Form.Check type="checkbox" label="Check for exposed sensitive information in responses" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Performance Testing" icon="⚡" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test page load time (should be under 3 seconds)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify Time to First Byte (TTFB)" className="mb-2" />
          <Form.Check type="checkbox" label="Check First Contentful Paint (FCP)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with network throttling (3G, 4G)" className="mb-2" />
          <Form.Check type="checkbox" label="Monitor memory usage and leaks" className="mb-2" />
          <Form.Check type="checkbox" label="Test with browser caching enabled/disabled" className="mb-2" />
          <Form.Check type="checkbox" label="Verify lazy loading for images and content" className="mb-2" />
          <Form.Check type="checkbox" label="Check Core Web Vitals (LCP, FID, CLS)" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Cross-Browser Testing" icon="🌍" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test on Chrome (latest and previous version)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on Firefox (latest and previous version)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on Safari (macOS and iOS)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on Edge (Chromium-based)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify on mobile browsers (Chrome, Safari)" className="mb-2" />
          <Form.Check type="checkbox" label="Check browser console for errors" className="mb-2" />
          <Form.Check type="checkbox" label="Test with different browser extensions enabled" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Responsive Testing" icon="📱" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test on mobile devices (320px to 428px width)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on tablets (768px to 1024px width)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on desktop (1920px and above)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify portrait and landscape orientations" className="mb-2" />
          <Form.Check type="checkbox" label="Check touch targets are at least 44x44px" className="mb-2" />
          <Form.Check type="checkbox" label="Test zoom functionality (up to 200%)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify text doesn't overflow on smaller screens" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Error Handling" icon="🐛" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test 404 error page" className="mb-2" />
          <Form.Check type="checkbox" label="Verify 500 server error handling" className="mb-2" />
          <Form.Check type="checkbox" label="Test network failure scenarios" className="mb-2" />
          <Form.Check type="checkbox" label="Check timeout handling" className="mb-2" />
          <Form.Check type="checkbox" label="Verify user-friendly error messages" className="mb-2" />
          <Form.Check type="checkbox" label="Test back button functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Verify graceful degradation" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Final Checks" icon="✅" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Verify favicon displays correctly" className="mb-2" />
          <Form.Check type="checkbox" label="Check meta tags (title, description, OG tags)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with ad blockers enabled" className="mb-2" />
          <Form.Check type="checkbox" label="Verify analytics and tracking scripts" className="mb-2" />
          <Form.Check type="checkbox" label="Check cookie consent and privacy policies" className="mb-2" />
          <Form.Check type="checkbox" label="Test print stylesheet" className="mb-2" />
          <Form.Check type="checkbox" label="Verify all third-party integrations" className="mb-2" />
          <Form.Check type="checkbox" label="Run automated accessibility audit" className="mb-2" />
        </Form>
      </ChecklistRoom>
    </Container>
  );
};
