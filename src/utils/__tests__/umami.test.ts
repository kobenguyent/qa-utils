import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackPageView, trackEvent } from '../umami';

// Mock the global constants injected by Vite
declare global {
  const __APP_VERSION__: string;
  const __PACKAGE_VERSION__: string;
}

// @ts-ignore - Set mock values for tests
globalThis.__APP_VERSION__ = '1.0.1+abc123';
// @ts-ignore - Set mock values for tests
globalThis.__PACKAGE_VERSION__ = '1.0.1';

// Create a minimal window mock
const mockWindow = {
  umami: undefined,
  electron: undefined,
} as Partial<Window & { 
  umami?: { track: (event: string, data?: Record<string, string | number>) => void };
  electron?: { platform: string };
}>;

// Set up global window mock
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('umami utilities', () => {
  beforeEach(() => {
    // Clear all mocks and reset umami/electron
    vi.clearAllMocks();
    mockWindow.umami = undefined;
    mockWindow.electron = undefined;
  });

  describe('trackPageView', () => {
    it('should call umami.track when umami is available (web)', () => {
      const mockTrack = vi.fn();
      mockWindow.umami = {
        track: mockTrack
      };

      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(mockTrack).toHaveBeenCalledWith('/test-page', { environment: 'web' });
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('should call umami.track with electron prefix when in Electron', () => {
      const mockTrack = vi.fn();
      mockWindow.umami = {
        track: mockTrack
      };
      mockWindow.electron = {
        platform: 'darwin'
      };

      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(mockTrack).toHaveBeenCalledWith('electron:/test-page', {
        environment: 'electron',
        platform: 'darwin',
        app_version: '1.0.1+abc123'
      });
      expect(mockTrack).toHaveBeenCalledTimes(1);
    });

    it('should log warning when umami is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Umami tracking script not loaded or track function not available.'
      );
    });

    it('should log warning when umami.track is not a function', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockWindow.umami = {
        track: 'not a function' as unknown as (event: string, data?: Record<string, string | number>) => void
      };
      
      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Umami tracking script not loaded or track function not available.'
      );
    });
  });

  describe('trackEvent', () => {
    it('should track custom events with platform info (web)', () => {
      const mockTrack = vi.fn();
      mockWindow.umami = {
        track: mockTrack
      };

      trackEvent('custom-event', { action: 'click', value: 5 });

      expect(mockTrack).toHaveBeenCalledWith('custom-event', {
        environment: 'web',
        action: 'click',
        value: 5
      });
    });

    it('should track custom events with electron platform info', () => {
      const mockTrack = vi.fn();
      mockWindow.umami = {
        track: mockTrack
      };
      mockWindow.electron = {
        platform: 'win32'
      };

      trackEvent('custom-event', { action: 'click' });

      expect(mockTrack).toHaveBeenCalledWith('custom-event', {
        environment: 'electron',
        platform: 'win32',
        app_version: '1.0.1+abc123',
        action: 'click'
      });
    });

    it('should track events without additional data', () => {
      const mockTrack = vi.fn();
      mockWindow.umami = {
        track: mockTrack
      };

      trackEvent('app-opened');

      expect(mockTrack).toHaveBeenCalledWith('app-opened', {
        environment: 'web'
      });
    });

    it('should log warning when umami is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      trackEvent('test-event');

      expect(consoleSpy).toHaveBeenCalledWith(
        'Umami tracking script not loaded or track function not available.'
      );
    });
  });
});