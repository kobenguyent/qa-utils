import { useState } from "react";
import { Container, Form, Button, Badge } from "react-bootstrap";
import { ChecklistRoom } from "./ChecklistRoom";

export const MobileTestingChecklist = () => {
  const [roomMode, setRoomMode] = useState(false);

  return (
    <Container className="py-4">
      <div className="d-flex align-items-start justify-content-between flex-wrap gap-2 mb-4">
        <div>
          <h1 className="mb-1">📱 Mobile Testing Checklist</h1>
          <p className="lead mb-0">
            A comprehensive checklist for testing mobile applications (iOS, Android) and mobile web.
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
          <strong>🏛️ Palace Walk Mode</strong> — Complete each room to mark it visited.{" "}
          <Badge bg="secondary">13 rooms to explore</Badge>
        </div>
      )}

      <ChecklistRoom title="Functional Testing" icon="🧪" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test app installation and uninstallation" className="mb-2" />
          <Form.Check type="checkbox" label="Verify app launch and splash screen" className="mb-2" />
          <Form.Check type="checkbox" label="Test user registration and login flows" className="mb-2" />
          <Form.Check type="checkbox" label="Verify all navigation and menu items" className="mb-2" />
          <Form.Check type="checkbox" label="Test CRUD operations in the app" className="mb-2" />
          <Form.Check type="checkbox" label="Verify form inputs and validation" className="mb-2" />
          <Form.Check type="checkbox" label="Test search functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Verify push notification functionality" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="UI/UX Testing" icon="🎨" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test on different screen sizes and resolutions" className="mb-2" />
          <Form.Check type="checkbox" label="Verify portrait and landscape orientations" className="mb-2" />
          <Form.Check type="checkbox" label="Check touch targets are at least 44x44 points" className="mb-2" />
          <Form.Check type="checkbox" label="Test gestures (swipe, pinch, zoom, long press)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify scroll behavior and bounce effects" className="mb-2" />
          <Form.Check type="checkbox" label="Test animations and transitions" className="mb-2" />
          <Form.Check type="checkbox" label="Check text readability and font sizes" className="mb-2" />
          <Form.Check type="checkbox" label="Verify icons and images display correctly" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Device-Specific Testing" icon="📱" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test on different iOS versions (latest and previous 2)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on different Android versions (latest and previous 2)" className="mb-2" />
          <Form.Check type="checkbox" label="Test on various device manufacturers (Samsung, Google, etc.)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify on devices with different screen densities" className="mb-2" />
          <Form.Check type="checkbox" label="Test on tablets and foldable devices" className="mb-2" />
          <Form.Check type="checkbox" label="Check app behavior with notch/cutout displays" className="mb-2" />
          <Form.Check type="checkbox" label="Test dark mode and light mode themes" className="mb-2" />
          <Form.Check type="checkbox" label="Verify on devices with different RAM/storage" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Network & Connectivity" icon="🌐" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test with WiFi connection" className="mb-2" />
          <Form.Check type="checkbox" label="Test with cellular data (3G, 4G, 5G)" className="mb-2" />
          <Form.Check type="checkbox" label="Test in airplane mode" className="mb-2" />
          <Form.Check type="checkbox" label="Test network switching (WiFi to cellular)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify offline functionality and caching" className="mb-2" />
          <Form.Check type="checkbox" label="Test with poor network conditions" className="mb-2" />
          <Form.Check type="checkbox" label="Verify sync functionality when coming back online" className="mb-2" />
          <Form.Check type="checkbox" label="Test timeout handling for API calls" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Performance Testing" icon="⚡" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test app launch time (should be under 3 seconds)" className="mb-2" />
          <Form.Check type="checkbox" label="Monitor CPU usage during operations" className="mb-2" />
          <Form.Check type="checkbox" label="Check memory usage and potential leaks" className="mb-2" />
          <Form.Check type="checkbox" label="Test battery consumption" className="mb-2" />
          <Form.Check type="checkbox" label="Verify app responsiveness (60fps target)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with large data sets" className="mb-2" />
          <Form.Check type="checkbox" label="Monitor network data usage" className="mb-2" />
          <Form.Check type="checkbox" label="Test app size and download time" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Security Testing" icon="🔐" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Verify secure data storage (Keychain, KeyStore)" className="mb-2" />
          <Form.Check type="checkbox" label="Test encryption for sensitive data" className="mb-2" />
          <Form.Check type="checkbox" label="Check SSL certificate pinning" className="mb-2" />
          <Form.Check type="checkbox" label="Verify biometric authentication (Face ID, Touch ID, fingerprint)" className="mb-2" />
          <Form.Check type="checkbox" label="Test app behavior on jailbroken/rooted devices" className="mb-2" />
          <Form.Check type="checkbox" label="Check for code obfuscation" className="mb-2" />
          <Form.Check type="checkbox" label="Test session management and timeouts" className="mb-2" />
          <Form.Check type="checkbox" label="Verify app permissions are appropriate" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Interruption Testing" icon="🔔" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test incoming call during app usage" className="mb-2" />
          <Form.Check type="checkbox" label="Test incoming SMS/message notifications" className="mb-2" />
          <Form.Check type="checkbox" label="Verify app behavior with low battery warning" className="mb-2" />
          <Form.Check type="checkbox" label="Test with system alerts and popups" className="mb-2" />
          <Form.Check type="checkbox" label="Verify app pause/resume functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Test app behavior when backgrounded" className="mb-2" />
          <Form.Check type="checkbox" label="Check app state after force close" className="mb-2" />
          <Form.Check type="checkbox" label="Test with device reboot" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Hardware Integration" icon="🎤" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test camera functionality (photo and video)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify microphone and audio recording" className="mb-2" />
          <Form.Check type="checkbox" label="Test GPS and location services" className="mb-2" />
          <Form.Check type="checkbox" label="Verify accelerometer and gyroscope" className="mb-2" />
          <Form.Check type="checkbox" label="Test Bluetooth connectivity" className="mb-2" />
          <Form.Check type="checkbox" label="Check NFC functionality (if applicable)" className="mb-2" />
          <Form.Check type="checkbox" label="Test with headphones/external audio devices" className="mb-2" />
          <Form.Check type="checkbox" label="Verify haptic feedback and vibration" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Data Management" icon="💾" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test app data backup and restore" className="mb-2" />
          <Form.Check type="checkbox" label="Verify data persistence after app restart" className="mb-2" />
          <Form.Check type="checkbox" label="Test data synchronization across devices" className="mb-2" />
          <Form.Check type="checkbox" label="Check cache management" className="mb-2" />
          <Form.Check type="checkbox" label="Verify local database operations" className="mb-2" />
          <Form.Check type="checkbox" label="Test with storage space constraints" className="mb-2" />
          <Form.Check type="checkbox" label="Check data export/import functionality" className="mb-2" />
          <Form.Check type="checkbox" label="Verify data clearing functionality" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Accessibility Testing" icon="♿" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test with VoiceOver (iOS) and TalkBack (Android)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify all interactive elements are accessible" className="mb-2" />
          <Form.Check type="checkbox" label="Check accessibility labels and hints" className="mb-2" />
          <Form.Check type="checkbox" label="Test with dynamic text sizes" className="mb-2" />
          <Form.Check type="checkbox" label="Verify color contrast ratios" className="mb-2" />
          <Form.Check type="checkbox" label="Test with reduce motion settings" className="mb-2" />
          <Form.Check type="checkbox" label="Check keyboard navigation (external keyboard)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify switch control compatibility" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Update & Migration Testing" icon="🔄" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Test app update from previous version" className="mb-2" />
          <Form.Check type="checkbox" label="Verify data migration after update" className="mb-2" />
          <Form.Check type="checkbox" label="Test forced update flow" className="mb-2" />
          <Form.Check type="checkbox" label="Check backward compatibility" className="mb-2" />
          <Form.Check type="checkbox" label="Verify release notes display" className="mb-2" />
          <Form.Check type="checkbox" label="Test app rollback scenarios" className="mb-2" />
          <Form.Check type="checkbox" label="Check for breaking changes in updates" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="App Store Compliance" icon="🛒" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Verify app icon meets store requirements" className="mb-2" />
          <Form.Check type="checkbox" label="Check app name and description accuracy" className="mb-2" />
          <Form.Check type="checkbox" label="Verify privacy policy is accessible" className="mb-2" />
          <Form.Check type="checkbox" label="Test in-app purchases (if applicable)" className="mb-2" />
          <Form.Check type="checkbox" label="Check subscription management (if applicable)" className="mb-2" />
          <Form.Check type="checkbox" label="Verify age rating is appropriate" className="mb-2" />
          <Form.Check type="checkbox" label="Test deep linking and universal links" className="mb-2" />
          <Form.Check type="checkbox" label="Check compliance with platform guidelines" className="mb-2" />
        </Form>
      </ChecklistRoom>

      <ChecklistRoom title="Final Checks" icon="✅" roomMode={roomMode}>
        <Form>
          <Form.Check type="checkbox" label="Run automated UI tests" className="mb-2" />
          <Form.Check type="checkbox" label="Perform beta testing with real users" className="mb-2" />
          <Form.Check type="checkbox" label="Check crash reporting integration" className="mb-2" />
          <Form.Check type="checkbox" label="Verify analytics tracking" className="mb-2" />
          <Form.Check type="checkbox" label="Test localization and internationalization" className="mb-2" />
          <Form.Check type="checkbox" label="Check all third-party SDK integrations" className="mb-2" />
          <Form.Check type="checkbox" label="Verify compliance with GDPR/privacy regulations" className="mb-2" />
          <Form.Check type="checkbox" label="Test app in production environment" className="mb-2" />
        </Form>
      </ChecklistRoom>
    </Container>
  );
};
