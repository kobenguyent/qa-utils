import { describe, it, expect, vi, beforeEach } from 'vitest';
import { trackPageView } from '../umami';

describe('umami utilities', () => {
  beforeEach(() => {
    // Reset window.umami before each test
    // @ts-ignore
    delete window.umami;
    vi.clearAllMocks();
  });

  describe('trackPageView', () => {
    it('should call umami.trackView when umami is available', () => {
      const mockTrackView = vi.fn();
      // @ts-ignore
      window.umami = {
        trackView: mockTrackView
      };

      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(mockTrackView).toHaveBeenCalledWith(testUrl);
      expect(mockTrackView).toHaveBeenCalledTimes(1);
    });

    it('should log warning when umami is not available', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const testUrl = '/test-page';
      trackPageView(testUrl);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Umami tracking script not loaded or trackView function not available.'
      );
    });

    it('should log warning when umami.trackView is not a function', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      // @ts-ignore
      window.umami = {
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