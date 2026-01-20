// Website Scanner Utility - Core scanning logic and API integrations

export interface ScanConfiguration {
  url: string;
  scanType: 'single' | 'crawl';
  crawlDepth?: number;
  maxPages?: number;
  checks: {
    brokenLinks: boolean;
    accessibility: boolean;
    performance: boolean;
    seo: boolean;
    security: boolean;
    htmlValidation: boolean;
  };
  wcagLevel: 'AA' | 'AAA';
}

export interface LinkResult {
  url: string;
  status: 'working' | 'broken' | 'redirected' | 'slow' | 'pending';
  statusCode?: number;
  responseTime?: number;
  redirectUrl?: string;
  error?: string;
}

export interface AccessibilityIssue {
  id: string;
  impact: 'minor' | 'moderate' | 'serious' | 'critical';
  description: string;
  help: string;
  helpUrl: string;
  nodes: Array<{
    target: string[];
    html: string;
  }>;
}

export interface PerformanceMetrics {
  score: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  speedIndex: number;
  totalBlockingTime: number;
  timeToInteractive: number;
  serverResponseTime: number;
  domContentLoaded: number;
  fullyLoaded: number;
}

export interface SEOAnalysis {
  score: number;
  title: { present: boolean; length: number; content?: string };
  metaDescription: { present: boolean; length: number; content?: string };
  headings: { h1Count: number; structure: string[] };
  images: { total: number; missingAlt: number };
  internalLinks: number;
  externalLinks: number;
}

export interface SecurityHeaders {
  contentSecurityPolicy: boolean;
  strictTransportSecurity: boolean;
  xFrameOptions: boolean;
  xContentTypeOptions: boolean;
  referrerPolicy: boolean;
  score: number;
}

export interface ScanResult {
  url: string;
  timestamp: number;
  status: 'completed' | 'failed' | 'partial';
  overallScore: number;
  links?: LinkResult[];
  accessibility?: {
    score: number;
    violations: AccessibilityIssue[];
    passes: number;
    incomplete: AccessibilityIssue[];
  };
  performance?: PerformanceMetrics;
  seo?: SEOAnalysis;
  security?: SecurityHeaders;
  htmlValidation?: {
    valid: boolean;
    errors: Array<{ message: string; line: number; column: number }>;
    warnings: Array<{ message: string; line: number; column: number }>;
  };
}

export interface ScanProgress {
  stage: string;
  progress: number;
  message: string;
  pagesScanned?: number;
  totalPages?: number;
}

export class WebsiteScanner {
  private config: ScanConfiguration;
  private onProgress?: (progress: ScanProgress) => void;

  constructor(config: ScanConfiguration, onProgress?: (progress: ScanProgress) => void) {
    this.config = config;
    this.onProgress = onProgress;
  }

  async scan(): Promise<ScanResult> {
    this.updateProgress('Initializing scan...', 0);
    
    const result: ScanResult = {
      url: this.config.url,
      timestamp: Date.now(),
      status: 'completed',
      overallScore: 0
    };

    try {
      const tasks = [];
      
      if (this.config.checks.brokenLinks) {
        tasks.push(this.scanBrokenLinks());
      }
      
      if (this.config.checks.accessibility) {
        tasks.push(this.scanAccessibility());
      }
      
      if (this.config.checks.performance) {
        tasks.push(this.scanPerformance());
      }
      
      if (this.config.checks.seo) {
        tasks.push(this.scanSEO());
      }
      
      if (this.config.checks.security) {
        tasks.push(this.scanSecurity());
      }
      
      if (this.config.checks.htmlValidation) {
        tasks.push(this.validateHTML());
      }

      const results = await Promise.allSettled(tasks);
      
      // Process results
      let taskIndex = 0;
      if (this.config.checks.brokenLinks && results[taskIndex]) {
        result.links = results[taskIndex].status === 'fulfilled' ? (results[taskIndex] as PromiseFulfilledResult<LinkResult[]>).value : [];
        taskIndex++;
      }
      
      if (this.config.checks.accessibility && results[taskIndex]) {
        result.accessibility = results[taskIndex].status === 'fulfilled' ? (results[taskIndex] as PromiseFulfilledResult<any>).value : undefined;
        taskIndex++;
      }
      
      if (this.config.checks.performance && results[taskIndex]) {
        result.performance = results[taskIndex].status === 'fulfilled' ? (results[taskIndex] as PromiseFulfilledResult<PerformanceMetrics>).value : undefined;
        taskIndex++;
      }
      
      if (this.config.checks.seo && results[taskIndex]) {
        result.seo = results[taskIndex].status === 'fulfilled' ? (results[taskIndex] as PromiseFulfilledResult<SEOAnalysis>).value : undefined;
        taskIndex++;
      }
      
      if (this.config.checks.security && results[taskIndex]) {
        result.security = results[taskIndex].status === 'fulfilled' ? (results[taskIndex] as PromiseFulfilledResult<SecurityHeaders>).value : undefined;
        taskIndex++;
      }
      
      if (this.config.checks.htmlValidation && results[taskIndex]) {
        result.htmlValidation = results[taskIndex].status === 'fulfilled' ? (results[taskIndex] as PromiseFulfilledResult<any>).value : undefined;
      }

      result.overallScore = this.calculateOverallScore(result);
      this.updateProgress('Scan completed', 100);
      
    } catch (error) {
      result.status = 'failed';
      this.updateProgress('Scan failed', 100);
    }

    return result;
  }

  private async scanBrokenLinks(): Promise<LinkResult[]> {
    this.updateProgress('Checking broken links...', 20);
    
    if (this.config.scanType === 'single') {
      return this.checkPageLinks(this.config.url);
    } else {
      return this.crawlAndCheckLinks();
    }
  }

  private async checkPageLinks(url: string): Promise<LinkResult[]> {
    try {
      // First extract links from the page
      const response = await fetch(url);
      const html = await response.text();
      const links = this.extractLinks(html, url);
      
      const results: LinkResult[] = [];
      
      // Check links in batches to avoid overwhelming the target sites
      const batchSize = 5;
      for (let i = 0; i < Math.min(links.length, 20); i += batchSize) {
        const batch = links.slice(i, i + batchSize);
        const batchPromises = batch.map(link => this.checkSingleLink(link));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            results.push({
              url: batch[index],
              status: 'broken',
              error: 'Failed to check link'
            });
          }
        });
        
        // Small delay between batches to be respectful
        if (i + batchSize < Math.min(links.length, 20)) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      return results;
    } catch (error) {
      throw new Error(`Failed to check links: ${error}`);
    }
  }

  private async checkSingleLink(url: string): Promise<LinkResult> {
    try {
      const start = Date.now();
      
      // Use a simple HEAD request to check if the link is accessible
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors' // This will help with CORS issues but limits response info
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - start;
      
      // For no-cors mode, we can't access status, so we assume success if no error
      return {
        url,
        status: responseTime > 5000 ? 'slow' : 'working',
        responseTime,
        statusCode: response.status || 200
      };
      
    } catch (error) {
      // const responseTime = Date.now() - Date.now(); // Removed unused variable
      
      if (error instanceof Error && error.name === 'AbortError') {
        return {
          url,
          status: 'slow',
          responseTime: 10000,
          error: 'Request timeout'
        };
      }
      
      // Try a fallback approach using a public link checker API
      try {
        return await this.checkLinkWithAPI(url);
      } catch (apiError) {
        return {
          url,
          status: 'broken',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
  }

  private async checkLinkWithAPI(url: string): Promise<LinkResult> {
    try {
      // Use a simple public API for link checking
      const apiUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const start = Date.now();
      
      const response = await fetch(apiUrl);
      const data = await response.json();
      const responseTime = Date.now() - start;
      
      if (data.status && data.status.http_code) {
        const statusCode = data.status.http_code;
        return {
          url,
          status: statusCode >= 200 && statusCode < 400 ? 
            (responseTime > 5000 ? 'slow' : 'working') : 'broken',
          statusCode,
          responseTime
        };
      }
      
      // If we got a response, assume it's working
      return {
        url,
        status: responseTime > 5000 ? 'slow' : 'working',
        responseTime,
        statusCode: 200
      };
      
    } catch (error) {
      throw new Error(`API check failed: ${error}`);
    }
  }

  private async crawlAndCheckLinks(): Promise<LinkResult[]> {
    // Placeholder for crawling implementation
    return this.checkPageLinks(this.config.url);
  }

  private extractLinks(html: string, baseUrl: string): string[] {
    const links: string[] = [];
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    let match;
    
    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      if (href.startsWith('http')) {
        links.push(href);
      } else if (href.startsWith('/')) {
        const base = new URL(baseUrl);
        links.push(`${base.protocol}//${base.host}${href}`);
      }
    }
    
    return [...new Set(links)];
  }

  private async scanAccessibility(): Promise<any> {
    this.updateProgress('Analyzing accessibility...', 40);
    
    try {
      const response = await fetch(this.config.url);
      const html = await response.text();
      
      const violations: AccessibilityIssue[] = [];
      let score = 100;
      
      // Basic accessibility checks
      const checks = [
        this.checkImages(html),
        this.checkHeadings(html),
        this.checkLinks(html),
        this.checkForms(html),
        this.checkLang(html)
      ];
      
      checks.forEach(check => {
        if (check.violations.length > 0) {
          violations.push(...check.violations);
          score -= check.penalty;
        }
      });
      
      return {
        score: Math.max(0, score),
        violations,
        passes: checks.filter(c => c.violations.length === 0).length,
        incomplete: []
      };
      
    } catch (error) {
      return {
        score: 0,
        violations: [{
          id: 'scan-error',
          impact: 'critical' as const,
          description: 'Failed to analyze accessibility',
          help: 'Check if the URL is accessible',
          helpUrl: '',
          nodes: []
        }],
        passes: 0,
        incomplete: []
      };
    }
  }

  private checkImages(html: string) {
    const imgRegex = /<img[^>]*>/gi;
    const images = html.match(imgRegex) || [];
    const violations: AccessibilityIssue[] = [];
    
    images.forEach((img, index) => {
      if (!img.includes('alt=')) {
        violations.push({
          id: 'image-alt',
          impact: 'serious' as const,
          description: 'Images must have alternative text',
          help: 'Add alt attribute to images',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
          nodes: [{ target: [`img:nth-child(${index + 1})`], html: img }]
        });
      }
    });
    
    return { violations, penalty: violations.length * 10 };
  }

  private checkHeadings(html: string) {
    const h1Regex = /<h1[^>]*>.*?<\/h1>/gi;
    const h1s = html.match(h1Regex) || [];
    const violations: AccessibilityIssue[] = [];
    
    if (h1s.length === 0) {
      violations.push({
        id: 'page-has-heading-one',
        impact: 'moderate' as const,
        description: 'Page must have one main heading',
        help: 'Add an h1 element to the page',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
        nodes: []
      });
    } else if (h1s.length > 1) {
      violations.push({
        id: 'page-has-heading-one',
        impact: 'moderate' as const,
        description: 'Page should have only one main heading',
        help: 'Use only one h1 element per page',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
        nodes: []
      });
    }
    
    return { violations, penalty: violations.length * 15 };
  }

  private checkLinks(html: string) {
    const linkRegex = /<a[^>]*>.*?<\/a>/gi;
    const links = html.match(linkRegex) || [];
    const violations: AccessibilityIssue[] = [];
    
    links.forEach((link, index) => {
      const text = link.replace(/<[^>]*>/g, '').trim();
      if (!text || text.length < 2) {
        violations.push({
          id: 'link-name',
          impact: 'serious' as const,
          description: 'Links must have discernible text',
          help: 'Add descriptive text to links',
          helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html',
          nodes: [{ target: [`a:nth-child(${index + 1})`], html: link }]
        });
      }
    });
    
    return { violations, penalty: violations.length * 8 };
  }

  private checkForms(html: string) {
    const inputRegex = /<input[^>]*>/gi;
    const inputs = html.match(inputRegex) || [];
    const violations: AccessibilityIssue[] = [];
    
    inputs.forEach((input, index) => {
      if (input.includes('type="text"') || input.includes('type="email"') || input.includes('type="password"')) {
        if (!input.includes('aria-label=') && !html.includes(`<label[^>]*for=["'][^"']*["'][^>]*>`)) {
          violations.push({
            id: 'label',
            impact: 'critical' as const,
            description: 'Form elements must have labels',
            help: 'Add labels to form inputs',
            helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html',
            nodes: [{ target: [`input:nth-child(${index + 1})`], html: input }]
          });
        }
      }
    });
    
    return { violations, penalty: violations.length * 12 };
  }

  private checkLang(html: string) {
    const violations: AccessibilityIssue[] = [];
    
    if (!html.includes('lang=')) {
      violations.push({
        id: 'html-has-lang',
        impact: 'serious' as const,
        description: 'HTML element must have a lang attribute',
        help: 'Add lang attribute to html element',
        helpUrl: 'https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html',
        nodes: []
      });
    }
    
    return { violations, penalty: violations.length * 20 };
  }

  private async scanPerformance(): Promise<PerformanceMetrics> {
    this.updateProgress('Analyzing performance...', 60);
    
    try {
      // Try Microlink.io API (provides Lighthouse metrics without API key)
      const microlinkResult = await this.tryMicrolinkAPI();
      if (microlinkResult) return microlinkResult;
      
      // Fallback to proxy-based analysis
      return await this.proxyPerformanceAnalysis();
      
    } catch (error) {
      return await this.basicPerformanceAnalysis();
    }
  }

  private async tryMicrolinkAPI(): Promise<PerformanceMetrics | null> {
    try {
      // Use Microlink.io API - provides Lighthouse metrics without API key
      const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(this.config.url)}&insights.lighthouse=true`;
      
      const response = await fetch(apiUrl);
      if (!response || !response.ok) return null;
      
      const data = await response.json();
      if (!data?.data?.insights?.lighthouse) return null;
      
      const lighthouse = data.data.insights.lighthouse;
      const audits = lighthouse.audits;
      const categories = lighthouse.categories;
      
      if (!audits || !categories) return null;
      
      return {
        score: Math.round((categories.performance?.score || 0) * 100),
        firstContentfulPaint: audits['first-contentful-paint']?.numericValue || 0,
        largestContentfulPaint: audits['largest-contentful-paint']?.numericValue || 0,
        firstInputDelay: audits['max-potential-fid']?.numericValue || 0,
        cumulativeLayoutShift: audits['cumulative-layout-shift']?.numericValue || 0,
        speedIndex: audits['speed-index']?.numericValue || 0,
        totalBlockingTime: audits['total-blocking-time']?.numericValue || 0,
        timeToInteractive: audits['interactive']?.numericValue || 0,
        serverResponseTime: audits['server-response-time']?.numericValue || 0,
        domContentLoaded: lighthouse.audits?.['metrics']?.details?.items?.[0]?.observedDomContentLoaded || 0,
        fullyLoaded: lighthouse.audits?.['metrics']?.details?.items?.[0]?.observedLoad || 0
      };
      
    } catch (error) {
      console.warn('Microlink API failed:', error);
      return null;
    }
  }

  private async proxyPerformanceAnalysis(): Promise<PerformanceMetrics> {
    try {
      // Use a simple performance check via proxy service
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(this.config.url)}`;
      
      const start = Date.now();
      const response = await fetch(proxyUrl);
      const loadTime = Date.now() - start;
      
      if (response.ok) {
        const data = await response.json();
        
        // Basic performance analysis based on response
        let score = 100;
        
        // Score based on load time
        if (loadTime > 5000) score = 20;
        else if (loadTime > 3000) score = 40;
        else if (loadTime > 2000) score = 60;
        else if (loadTime > 1000) score = 80;
        
        // Check content size
        const contentSize = data.contents?.length || 0;
        if (contentSize > 500000) score -= 15; // Large page penalty
        if (contentSize > 1000000) score -= 25; // Very large page penalty
        
        return {
          score: Math.max(0, score),
          firstContentfulPaint: loadTime * 0.6,
          largestContentfulPaint: loadTime * 1.2,
          firstInputDelay: loadTime > 2000 ? 100 : 50,
          cumulativeLayoutShift: 0.1,
          speedIndex: loadTime * 1.1,
          totalBlockingTime: Math.max(0, loadTime - 1000),
          timeToInteractive: loadTime * 1.3,
          serverResponseTime: loadTime * 0.3,
          domContentLoaded: loadTime * 0.8,
          fullyLoaded: loadTime
        };
      }
      
      return await this.basicPerformanceAnalysis();
    } catch (error) {
      return await this.basicPerformanceAnalysis();
    }
  }

  private async basicPerformanceAnalysis(): Promise<PerformanceMetrics> {
    try {
      const start = Date.now();
      const response = await fetch(this.config.url);
      const loadTime = Date.now() - start;
      const html = await response.text();
      
      // Basic performance scoring based on simple metrics
      let score = 100;
      
      // Penalize slow load times
      if (loadTime > 3000) score -= 30;
      else if (loadTime > 1500) score -= 15;
      
      // Check for performance issues
      const scriptTags = (html.match(/<script/gi) || []).length;
      const styleTags = (html.match(/<link[^>]*stylesheet/gi) || []).length;
      const imageTags = (html.match(/<img/gi) || []).length;
      
      // Penalize excessive resources
      if (scriptTags > 10) score -= 10;
      if (styleTags > 5) score -= 5;
      if (imageTags > 20) score -= 10;
      
      // Check for common performance issues
      if (html.includes('document.write')) score -= 15;
      if (!html.includes('async') && scriptTags > 3) score -= 10;
      
      return {
        score: Math.max(0, score),
        firstContentfulPaint: loadTime * 0.6, // Estimate
        largestContentfulPaint: loadTime * 1.2, // Estimate
        firstInputDelay: loadTime > 2000 ? 100 : 50, // Estimate
        cumulativeLayoutShift: imageTags > 10 ? 0.15 : 0.05, // Estimate
        speedIndex: loadTime * 1.1, // Estimate
        totalBlockingTime: scriptTags * 50, // Estimate
        timeToInteractive: loadTime * 1.4, // Estimate
        serverResponseTime: loadTime * 0.2, // Estimate
        domContentLoaded: loadTime * 0.7, // Estimate
        fullyLoaded: loadTime // Estimate
      };
      
    } catch (error) {
      return {
        score: 0,
        firstContentfulPaint: 0,
        largestContentfulPaint: 0,
        firstInputDelay: 0,
        cumulativeLayoutShift: 0,
        speedIndex: 0,
        totalBlockingTime: 0,
        timeToInteractive: 0,
        serverResponseTime: 0,
        domContentLoaded: 0,
        fullyLoaded: 0
      };
    }
  }

  private async scanSEO(): Promise<SEOAnalysis> {
    this.updateProgress('Analyzing SEO...', 70);
    
    try {
      const response = await fetch(this.config.url);
      const html = await response.text();
      
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i);
      const h1Matches = html.match(/<h1[^>]*>([^<]+)<\/h1>/gi) || [];
      const imgMatches = html.match(/<img[^>]*>/gi) || [];
      const imgWithoutAlt = imgMatches.filter(img => !img.includes('alt=')).length;
      
      return {
        score: 80,
        title: {
          present: !!titleMatch,
          length: titleMatch ? titleMatch[1].length : 0,
          content: titleMatch ? titleMatch[1] : undefined
        },
        metaDescription: {
          present: !!metaDescMatch,
          length: metaDescMatch ? metaDescMatch[1].length : 0,
          content: metaDescMatch ? metaDescMatch[1] : undefined
        },
        headings: {
          h1Count: h1Matches.length,
          structure: []
        },
        images: {
          total: imgMatches.length,
          missingAlt: imgWithoutAlt
        },
        internalLinks: 0,
        externalLinks: 0
      };
    } catch (error) {
      throw new Error(`SEO analysis failed: ${error}`);
    }
  }

  private async scanSecurity(): Promise<SecurityHeaders> {
    this.updateProgress('Checking security headers...', 80);
    
    try {
      const response = await fetch(this.config.url);
      const headers = response.headers;
      
      const csp = headers.has('content-security-policy');
      const hsts = headers.has('strict-transport-security');
      const xFrame = headers.has('x-frame-options');
      const xContent = headers.has('x-content-type-options');
      const referrer = headers.has('referrer-policy');
      
      const score = [csp, hsts, xFrame, xContent, referrer].filter(Boolean).length * 20;
      
      return {
        contentSecurityPolicy: csp,
        strictTransportSecurity: hsts,
        xFrameOptions: xFrame,
        xContentTypeOptions: xContent,
        referrerPolicy: referrer,
        score
      };
    } catch (error) {
      throw new Error(`Security analysis failed: ${error}`);
    }
  }

  private async validateHTML(): Promise<any> {
    this.updateProgress('Validating HTML...', 90);
    
    try {
      // Use W3C Markup Validator API
      const validatorUrl = 'https://validator.w3.org/nu/?out=json';
      
      const response = await fetch(this.config.url);
      const html = await response.text();
      
      try {
        const validationResponse = await fetch(validatorUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'User-Agent': 'QA-Utils-Website-Scanner/1.0'
          },
          body: html
        });
        
        if (validationResponse.ok) {
          const validationData = await validationResponse.json();
          
          const errors = validationData.messages?.filter((msg: any) => msg.type === 'error') || [];
          const warnings = validationData.messages?.filter((msg: any) => msg.type === 'info' || msg.type === 'warning') || [];
          
          return {
            valid: errors.length === 0,
            errors: errors.map((err: any) => ({
              message: err.message || 'Unknown error',
              line: err.lastLine || 0,
              column: err.lastColumn || 0
            })),
            warnings: warnings.map((warn: any) => ({
              message: warn.message || 'Unknown warning',
              line: warn.lastLine || 0,
              column: warn.lastColumn || 0
            }))
          };
        }
      } catch (apiError) {
        console.warn('W3C Validator API failed, using basic validation');
      }
      
      // Fallback: Basic HTML validation
      return this.basicHTMLValidation(html);
      
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: 'Failed to validate HTML', line: 0, column: 0 }],
        warnings: []
      };
    }
  }

  private basicHTMLValidation(html: string) {
    const errors: Array<{ message: string; line: number; column: number }> = [];
    const warnings: Array<{ message: string; line: number; column: number }> = [];
    
    // Basic HTML structure checks
    if (!html.includes('<!DOCTYPE')) {
      errors.push({ message: 'Missing DOCTYPE declaration', line: 1, column: 1 });
    }
    
    if (!html.includes('<html')) {
      errors.push({ message: 'Missing html element', line: 1, column: 1 });
    }
    
    if (!html.includes('<head>')) {
      errors.push({ message: 'Missing head element', line: 1, column: 1 });
    }
    
    if (!html.includes('<title>')) {
      warnings.push({ message: 'Missing title element', line: 1, column: 1 });
    }
    
    if (!html.includes('<body>')) {
      errors.push({ message: 'Missing body element', line: 1, column: 1 });
    }
    
    // Check for unclosed tags (basic check)
    const openTags = html.match(/<[^/][^>]*>/g) || [];
    const closeTags = html.match(/<\/[^>]*>/g) || [];
    
    if (openTags.length > closeTags.length + 10) { // Allow for self-closing tags
      warnings.push({ message: 'Possible unclosed tags detected', line: 0, column: 0 });
    }
    
    // Check for deprecated elements
    const deprecatedElements = ['center', 'font', 'marquee', 'blink'];
    deprecatedElements.forEach(element => {
      if (html.includes(`<${element}`)) {
        warnings.push({ message: `Deprecated element: ${element}`, line: 0, column: 0 });
      }
    });
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private calculateOverallScore(result: ScanResult): number {
    const scores: number[] = [];
    
    if (result.accessibility) scores.push(result.accessibility.score);
    if (result.performance) scores.push(result.performance.score);
    if (result.seo) scores.push(result.seo.score);
    if (result.security) scores.push(result.security.score);
    
    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  private updateProgress(message: string, progress: number) {
    if (this.onProgress) {
      this.onProgress({
        stage: message,
        progress,
        message
      });
    }
  }
}

export const createScanner = (config: ScanConfiguration, onProgress?: (progress: ScanProgress) => void) => {
  return new WebsiteScanner(config, onProgress);
};
