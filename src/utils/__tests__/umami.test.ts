import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackPageView } from '../umami';

// Create a minimal window mock
const mockWindow = {
  umami: undefined,
} as any;

// Set up global window mock
Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true,
});

describe('umami utilities', () => {
  beforeEach(() => {
    // Clear all mocks and reset umami
    vi.clearAllMocks();
    mockWindow.umami = undefined;
  });

  describe('trackPageView', () => {
    it('should call umami.trackView when umami is available', () => {
      const mockTrackView = vi.fn();
      mockWindow.umami = {
        trackView: mockTrackView
      };

      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(mockTrackView).toHaveBeenCalledWith(testUrl);
      expect(mockTrackView).toHaveBeenCalledTimes(1);
    });

    it('should log warning when umami is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      
      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Umami tracking script not loaded or trackView function not available.'
      );
    });

    it('should log warning when umami.trackView is not a function', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      mockWindow.umami = {
        trackView: 'not a function'
      };
      
      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Umami tracking script not loaded or trackView function not available.'
      );
    });
  });
});