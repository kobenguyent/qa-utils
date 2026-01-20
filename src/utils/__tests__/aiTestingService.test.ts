import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AITestingService, TestPlan } from '../aiTestingService';
import { ChatConfig } from '../aiChatClient';

// Mock the dependencies
vi.mock('../aiChatClient', () => ({
  sendChatMessage: vi.fn()
}));

vi.mock('../websiteScanner', () => ({
  createScanner: vi.fn(() => ({
    scan: vi.fn().mockResolvedValue({
      url: 'https://example.com',
      timestamp: Date.now(),
      status: 'completed',
      overallScore: 85,
      performance: { score: 90, fullyLoaded: 1200, largestContentfulPaint: 800 },
      security: { score: 80, contentSecurityPolicy: true, strictTransportSecurity: true },
      accessibility: { score: 85, violations: [] },
      links: [{ url: 'https://example.com/page1', status: 'working' }]
    })
  }))
}));

describe('AITestingService', () => {
  let service: AITestingService;
  let mockConfig: ChatConfig;

  beforeEach(() => {
    mockConfig = {
      provider: 'openai',
      apiKey: 'test-key',
      model: 'gpt-4',
      temperature: 0.3
    };
    service = new AITestingService(mockConfig);
  });

  it('should create service instance', () => {
    expect(service).toBeInstanceOf(AITestingService);
  });

  it('should generate test plan structure', async () => {
    const { sendChatMessage } = await import('../aiChatClient');
    
    // Mock AI responses for each category
    vi.mocked(sendChatMessage)
      .mockResolvedValueOnce({
        message: JSON.stringify([{
          id: 'func_1',
          title: 'User Login Test',
          category: 'functional',
          description: 'Test user authentication flow',
          steps: [{
            id: 'step_1',
            description: 'Navigate to login page',
            expectedResult: 'Login form is displayed',
            instructions: ['Open browser', 'Go to /login'],
            priority: 'high'
          }],
          estimatedTime: 5
        }]),
        model: 'gpt-4'
      })
      .mockResolvedValueOnce({
        message: JSON.stringify([{
          id: 'ui_1',
          title: 'Responsive Design Test',
          category: 'ui-ux',
          description: 'Test responsive layout',
          steps: [{
            id: 'step_1',
            description: 'Test mobile view',
            expectedResult: 'Layout adapts to mobile',
            instructions: ['Resize browser', 'Check layout'],
            priority: 'medium'
          }],
          estimatedTime: 3
        }]),
        model: 'gpt-4'
      })
      .mockResolvedValueOnce({
        message: JSON.stringify([{
          id: 'perf_1',
          title: 'Page Load Performance',
          category: 'performance',
          description: 'Test page load times',
          steps: [{
            id: 'step_1',
            description: 'Measure load time',
            expectedResult: 'Page loads under 3 seconds',
            instructions: ['Open DevTools', 'Reload page', 'Check Network tab'],
            priority: 'high'
          }],
          estimatedTime: 4
        }]),
        model: 'gpt-4'
      })
      .mockResolvedValueOnce({
        message: JSON.stringify([{
          id: 'sec_1',
          title: 'HTTPS Security Test',
          category: 'security',
          description: 'Test HTTPS implementation',
          steps: [{
            id: 'step_1',
            description: 'Check SSL certificate',
            expectedResult: 'Valid SSL certificate',
            instructions: ['Check browser security indicator', 'Verify certificate'],
            priority: 'high'
          }],
          estimatedTime: 2
        }]),
        model: 'gpt-4'
      });

    const testPlan = await service.generateTestPlan('https://example.com', 'E-commerce website');

    expect(testPlan).toBeDefined();
    expect(testPlan.url).toBe('https://example.com');
    expect(testPlan.context).toBe('E-commerce website');
    expect(testPlan.testCases).toHaveLength(4);
    expect(testPlan.testCases[0].category).toBe('functional');
    expect(testPlan.testCases[1].category).toBe('ui-ux');
    expect(testPlan.testCases[2].category).toBe('performance');
    expect(testPlan.testCases[3].category).toBe('security');
  });

  it('should handle AI response errors gracefully', async () => {
    const { sendChatMessage } = await import('../aiChatClient');
    
    // Mock error for one category, success for others
    vi.mocked(sendChatMessage)
      .mockRejectedValueOnce(new Error('API Error'))
      .mockResolvedValueOnce({
        message: JSON.stringify([{
          id: 'ui_1',
          title: 'Test Case',
          category: 'ui-ux',
          description: 'Test description',
          steps: [],
          estimatedTime: 1
        }]),
        model: 'gpt-4'
      })
      .mockResolvedValueOnce({
        message: JSON.stringify([]),
        model: 'gpt-4'
      })
      .mockResolvedValueOnce({
        message: JSON.stringify([]),
        model: 'gpt-4'
      });

    const testPlan = await service.generateTestPlan('https://example.com', 'Test context');

    expect(testPlan).toBeDefined();
    expect(testPlan.testCases.length).toBeGreaterThan(0);
  });
});
