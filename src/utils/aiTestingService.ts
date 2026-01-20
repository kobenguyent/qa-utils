/**
 * AI Testing Service - Generates intelligent test plans using AI
 */

import { sendChatMessage, ChatConfig, ChatMessage } from './aiChatClient';
import { ScanResult, createScanner, ScanConfiguration } from './websiteScanner';
import { RobustJSONParser } from './robustJSONParser';

export interface TestStep {
  id: string;
  description: string;
  expectedResult: string;
  instructions: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface TestCase {
  id: string;
  title: string;
  category: 'functional' | 'ui-ux' | 'performance' | 'security';
  description: string;
  steps: TestStep[];
  estimatedTime: number;
}

export interface TestPlan {
  id: string;
  url: string;
  timestamp: number;
  context: string;
  testCases: TestCase[];
  scanData?: ScanResult;
}

export interface TestResult {
  testCaseId: string;
  stepId: string;
  status: 'pass' | 'fail' | 'skip';
  notes: string;
  evidence?: string; // base64 screenshot or file
  timestamp: number;
}

export interface TestExecution {
  planId: string;
  results: TestResult[];
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed';
}

export class AITestingService {
  private config?: ChatConfig;
  private useAI: boolean;

  constructor(config?: ChatConfig) {
    this.config = config;
    this.useAI = !!config?.apiKey;
  }

  async generateTestPlan(url: string, userContext: string): Promise<TestPlan> {
    console.log('Starting test plan generation for:', url);
    
    // First, scan the website to get technical data
    const scanConfig: ScanConfiguration = {
      url,
      scanType: 'single',
      checks: {
        brokenLinks: true,
        accessibility: true,
        performance: true,
        seo: true,
        security: true,
        htmlValidation: true
      },
      wcagLevel: 'AA'
    };

    let scanData: ScanResult | undefined;
    try {
      const scanner = createScanner(scanConfig);
      scanData = await scanner.scan();
      console.log('Website scan completed:', scanData);
    } catch (error) {
      console.warn('Website scan failed, proceeding with AI-only analysis:', error);
    }

    // Generate test cases for each category
    const categories: Array<'functional' | 'ui-ux' | 'performance' | 'security'> = 
      ['functional', 'ui-ux', 'performance', 'security'];

    const allTestCases: TestCase[] = [];

    for (const category of categories) {
      try {
        console.log(`Generating test cases for category: ${category}`);
        const testCases = await this.generateTestCasesForCategory(url, userContext, category, scanData);
        console.log(`Generated ${testCases.length} test cases for ${category}:`, testCases);
        allTestCases.push(...testCases);
      } catch (error) {
        console.error(`Failed to generate ${category} test cases:`, error);
        
        // Add fallback test case if AI generation fails
        const fallbackTestCase: TestCase = {
          id: `${category}_fallback`,
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Test`,
          category,
          description: `Basic ${category} testing for ${url}`,
          steps: [{
            id: `${category}_step_1`,
            description: `Test ${category} functionality`,
            expectedResult: `${category} works as expected`,
            instructions: [`Navigate to ${url}`, `Verify ${category} aspects`, 'Document results'],
            priority: 'medium' as const
          }],
          estimatedTime: 5
        };
        allTestCases.push(fallbackTestCase);
        console.log(`Added fallback test case for ${category}:`, fallbackTestCase);
      }
    }

    console.log('Total test cases generated:', allTestCases.length);

    return {
      id: `plan_${Date.now()}`,
      url,
      timestamp: Date.now(),
      context: userContext,
      testCases: allTestCases,
      scanData
    };
  }

  private async generateTestCasesForCategory(
    url: string, 
    userContext: string, 
    category: 'functional' | 'ui-ux' | 'performance' | 'security',
    scanData?: ScanResult
  ): Promise<TestCase[]> {
    console.log(`Generating test cases for ${category}... (AI: ${this.useAI})`);
    
    if (this.useAI && this.config) {
      try {
        return await this.generateAITestCases(url, userContext, category, scanData);
      } catch (error) {
        console.error(`AI generation failed for ${category}, using template:`, error);
      }
    }
    
    // Use reliable template system
    return this.generateTemplateTestCases(url, category);
  }

  private async generateAITestCases(
    url: string,
    userContext: string,
    category: 'functional' | 'ui-ux' | 'performance' | 'security',
    _scanData?: ScanResult
  ): Promise<TestCase[]> {
    const prompt = `Generate 2 ${category} test cases for ${url}. ${userContext ? `Context: ${userContext}` : ''}

Create test cases with:
- Clear test titles
- Step-by-step instructions  
- Expected results
- Priority levels (high/medium/low)

Format as JSON array with test cases containing id, title, description, steps, and estimatedTime.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: `You are a QA expert. Generate comprehensive ${category} test cases in JSON format.` },
      { role: 'user', content: prompt }
    ];

    const response = await sendChatMessage(messages, this.config!);
    
    // Use robust parser to handle any AI response format
    const parsedTestCases = RobustJSONParser.parseAIResponse(response.message, category);
    
    if (parsedTestCases.length === 0) {
      throw new Error('No valid test cases could be extracted from AI response');
    }
    
    // Convert to internal TestCase format
    return parsedTestCases.map(tc => ({
      id: tc.id,
      title: tc.title,
      category: category,
      description: tc.description,
      steps: tc.steps.map(step => ({
        id: step.id,
        description: step.description,
        expectedResult: step.expectedResult,
        instructions: step.instructions,
        priority: step.priority
      })),
      estimatedTime: tc.estimatedTime
    }));
  }

  private generateTemplateTestCases(url: string, category: 'functional' | 'ui-ux' | 'performance' | 'security'): TestCase[] {
    const testCase: TestCase = {
      id: `${category}_template_${Date.now()}`,
      title: this.getCategoryTitle(category, url),
      category,
      description: this.getCategoryDescription(category, url),
      steps: this.getCategorySteps(category, url),
      estimatedTime: 5
    };
    
    return [testCase];
  }

  private getCategoryTitle(category: string, _url: string): string {
    const titles = {
      functional: `Website Functionality Test`,
      'ui-ux': `User Interface & Experience Test`,
      performance: `Performance & Speed Test`,
      security: `Security & Safety Test`
    };
    return titles[category as keyof typeof titles] || `${category} Test`;
  }

  private getCategoryDescription(category: string, _url: string): string {
    const descriptions = {
      functional: 'Verify core website functionality, navigation, forms, and user interactions work correctly',
      'ui-ux': 'Test user interface design, responsiveness, accessibility, and overall user experience',
      performance: 'Evaluate page load times, resource optimization, and overall website performance',
      security: 'Check for security vulnerabilities, HTTPS implementation, and data protection measures'
    };
    return descriptions[category as keyof typeof descriptions] || `Test ${category} aspects of the website`;
  }

  private getCategorySteps(category: string, _url: string): TestStep[] {
    const stepTemplates = {
      functional: [
        {
          id: 'func_step_1',
          description: 'Test main navigation and page loading',
          expectedResult: 'All main pages load successfully and navigation works smoothly',
          instructions: [
            'Navigate to the website',
            'Click on main navigation links',
            'Verify all pages load within 3 seconds',
            'Check for broken links or 404 errors'
          ],
          priority: 'high' as const
        },
        {
          id: 'func_step_2', 
          description: 'Test interactive elements and forms',
          expectedResult: 'Forms submit correctly and interactive elements respond properly',
          instructions: [
            'Locate contact forms or search functionality',
            'Fill out forms with valid test data',
            'Test buttons, dropdowns, and interactive elements',
            'Verify form validation and error messages'
          ],
          priority: 'high' as const
        }
      ],
      'ui-ux': [
        {
          id: 'ui_step_1',
          description: 'Test responsive design across devices',
          expectedResult: 'Website displays correctly on desktop, tablet, and mobile devices',
          instructions: [
            'Open website in desktop browser',
            'Resize browser window to tablet size (768px)',
            'Resize to mobile size (375px)',
            'Verify layout adapts properly at each breakpoint'
          ],
          priority: 'high' as const
        },
        {
          id: 'ui_step_2',
          description: 'Evaluate visual design and accessibility',
          expectedResult: 'Design is visually appealing and meets accessibility standards',
          instructions: [
            'Check color contrast and readability',
            'Test keyboard navigation (Tab key)',
            'Verify images have alt text',
            'Check for consistent branding and typography'
          ],
          priority: 'medium' as const
        }
      ],
      performance: [
        {
          id: 'perf_step_1',
          description: 'Measure page load performance',
          expectedResult: 'Pages load within 3 seconds on standard connection',
          instructions: [
            'Open browser DevTools (F12)',
            'Go to Network tab and reload page',
            'Check total load time and resource sizes',
            'Verify largest contentful paint < 2.5s'
          ],
          priority: 'high' as const
        },
        {
          id: 'perf_step_2',
          description: 'Test performance under load',
          expectedResult: 'Website remains responsive during heavy usage',
          instructions: [
            'Open multiple tabs with the website',
            'Navigate quickly between different pages',
            'Check for memory leaks in DevTools',
            'Verify smooth scrolling and interactions'
          ],
          priority: 'medium' as const
        }
      ],
      security: [
        {
          id: 'sec_step_1',
          description: 'Verify HTTPS and security headers',
          expectedResult: 'Website uses HTTPS and has proper security headers',
          instructions: [
            'Check URL starts with https://',
            'Verify SSL certificate is valid (green lock icon)',
            'Use browser DevTools to check security headers',
            'Test that HTTP redirects to HTTPS'
          ],
          priority: 'high' as const
        },
        {
          id: 'sec_step_2',
          description: 'Test input validation and XSS protection',
          expectedResult: 'Forms properly validate input and prevent malicious scripts',
          instructions: [
            'Try entering special characters in forms',
            'Test with script tags like <script>alert("test")</script>',
            'Verify error messages don\'t expose sensitive info',
            'Check that user input is properly sanitized'
          ],
          priority: 'high' as const
        }
      ]
    };
    
    return stepTemplates[category as keyof typeof stepTemplates] || [];
  }
}
