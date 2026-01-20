import { describe, it, expect, vi } from 'vitest';
import { WebsiteScanner, ScanConfiguration } from '../websiteScanner';

// Mock fetch for testing
global.fetch = vi.fn();

describe('WebsiteScanner Utility', () => {
  const mockConfig: ScanConfiguration = {
    url: 'https://example.com',
    scanType: 'single',
    checks: {
      brokenLinks: true,
      accessibility: true,
      performance: true,
      seo: true,
      security: true,
      htmlValidation: false
    },
    wcagLevel: 'AA'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create scanner instance', () => {
    const scanner = new WebsiteScanner(mockConfig);
    expect(scanner).toBeInstanceOf(WebsiteScanner);
  });

  it('should handle progress callback', async () => {
    const progressCallback = vi.fn();
    const scanner = new WebsiteScanner(mockConfig, progressCallback);
    
    // Mock fetch responses
    (fetch as any).mockResolvedValueOnce({
      text: () => Promise.resolve('<html><head><title>Test</title></head><body><a href="https://test.com">Link</a></body></html>'),
      headers: new Map([['content-security-policy', 'default-src self']])
    });
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200
    });

    await scanner.scan();
    
    expect(progressCallback).toHaveBeenCalled();
    expect(progressCallback).toHaveBeenCalledWith(
      expect.objectContaining({
        stage: expect.any(String),
        progress: expect.any(Number),
        message: expect.any(String)
      })
    );
  });

  it('should return scan result with correct structure', async () => {
    const scanner = new WebsiteScanner(mockConfig);
    
    // Mock fetch responses
    (fetch as any).mockResolvedValueOnce({
      text: () => Promise.resolve('<html><head><title>Test</title></head><body><a href="https://test.com">Link</a></body></html>'),
      headers: new Map([['content-security-policy', 'default-src self']])
    });
    
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200
    });

    const result = await scanner.scan();
    
    expect(result).toHaveProperty('url', 'https://example.com');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('overallScore');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.overallScore).toBeLessThanOrEqual(100);
  });

  it('should handle scan errors gracefully', async () => {
    const scanner = new WebsiteScanner(mockConfig);
    
    // Mock fetch to throw error
    (fetch as any).mockRejectedValue(new Error('Network error'));

    const result = await scanner.scan();
    
    // The scanner should complete but with limited results due to errors
    expect(result.status).toBe('completed');
    expect(result.overallScore).toBeGreaterThanOrEqual(0);
  });
});
