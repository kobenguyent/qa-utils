import { describe, it, expect } from 'vitest';
import {
  generateSequenceDiagram,
  generateMermaidDiagram,
  sampleCodeceptJS,
  samplePlaywright,
} from '../sequenceDiagramGenerator';

describe('sequenceDiagramGenerator', () => {
  describe('generateSequenceDiagram', () => {
    it('returns empty string for empty input', () => {
      expect(generateSequenceDiagram('', 'playwright')).toBe('');
      expect(generateSequenceDiagram('   ', 'codeceptjs')).toBe('');
    });

    it('parses Playwright test code', () => {
      const result = generateSequenceDiagram(samplePlaywright, 'playwright');
      expect(result).toContain('sequenceDiagram');
      expect(result).toContain('participant User');
      expect(result).toContain('participant Browser');
      expect(result).toContain('Navigate to https://example.com/login');
      expect(result).toContain('Fill: #email, user@example.com');
      expect(result).toContain('Fill: #password, secret123');
      expect(result).toContain("Click button[type='submit']");
      expect(result).toContain('Assert toBeVisible (.welcome)');
    });

    it('parses CodeceptJS test code', () => {
      const result = generateSequenceDiagram(sampleCodeceptJS, 'codeceptjs');
      expect(result).toContain('sequenceDiagram');
      expect(result).toContain('participant User');
      expect(result).toContain('participant Browser');
      expect(result).toContain('Navigate to');
      expect(result).toContain('fillField');
      expect(result).toContain('Click');
    });

    it('handles Playwright goto action', () => {
      const code = `await page.goto('https://example.com');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Navigate to https://example.com');
    });

    it('handles Playwright fill action', () => {
      const code = `await page.fill('#email', 'user@test.com');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Fill: #email, user@test.com');
    });

    it('handles Playwright fill with email address', () => {
      const code = `await page.fill('#email', 'user@example.com');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Fill: #email, user@example.com');
    });

    it('handles Playwright click action', () => {
      const code = `await page.click('button[type="submit"]');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain("Click button[type='submit']");
    });

    it('handles Playwright expect assertions', () => {
      const code = `await expect(page.locator('.title')).toBeVisible();`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Assert toBeVisible (.title)');
      expect(result).toContain('-->>');
    });

    it('handles Playwright waitFor actions', () => {
      const code = `await page.waitForSelector('.loaded');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('waitForSelector');
    });

    it('handles Playwright keyboard actions', () => {
      const code = `await page.keyboard.press('Enter');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Press key: Enter');
    });

    it('handles Playwright screenshot', () => {
      const code = `await page.screenshot();`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Take screenshot');
    });

    it('handles Playwright evaluate', () => {
      const code = `await page.evaluate(() => document.title);`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Execute JavaScript');
    });

    it('handles Playwright API requests', () => {
      const code = `await request.get('/api/users');`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('GET');
      expect(result).toContain('Server');
    });

    it('handles Playwright getByRole click', () => {
      const code = `await page.getByRole('button', { name: 'Submit' }).click();`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('Click getByRole');
    });

    it('handles CodeceptJS amOnPage', () => {
      const code = `I.amOnPage('/login');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Navigate to /login');
    });

    it('handles CodeceptJS fillField', () => {
      const code = `I.fillField('email', 'user@test.com');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('fillField: email, user@test.com');
    });

    it('handles CodeceptJS click', () => {
      const code = `I.click('Submit');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Click Submit');
    });

    it('handles CodeceptJS see (assertion)', () => {
      const code = `I.see('Welcome');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Verify: Welcome');
      expect(result).toContain('-->>');
    });

    it('handles CodeceptJS dontSee', () => {
      const code = `I.dontSee('Error');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Verify absent: Error');
    });

    it('handles CodeceptJS waitForElement', () => {
      const code = `I.waitForElement('.spinner');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Wait');
    });

    it('handles CodeceptJS grabTextFrom', () => {
      const code = `I.grabTextFrom('.title');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Grab');
    });

    it('handles CodeceptJS selectOption', () => {
      const code = `I.selectOption('country', 'USA');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('selectOption: country, USA');
    });

    it('handles CodeceptJS pressKey', () => {
      const code = `I.pressKey('Enter');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Press key: Enter');
    });

    it('handles CodeceptJS API actions', () => {
      const code = `I.sendGetRequest('/api/users');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('sendGetRequest');
      expect(result).toContain('Server');
    });

    it('handles CodeceptJS scroll actions', () => {
      const code = `I.scrollTo('.footer');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Scroll');
    });

    it('handles await prefix on CodeceptJS actions', () => {
      const code = `await I.click('Submit');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('Click Submit');
    });

    it('skips comment lines', () => {
      const code = `// This is a comment\nI.click('Submit');`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).not.toContain('comment');
      expect(result).toContain('Click Submit');
    });

    it('handles multiple Scenario blocks in CodeceptJS', () => {
      const code = `Scenario('login', ({ I }) => {
  I.amOnPage('/login');
  I.click('Submit');
})

Scenario('dashboard', ({ I }) => {
  I.amOnPage('/dashboard');
  I.see('Welcome');
})`;
      const result = generateSequenceDiagram(code, 'codeceptjs');
      expect(result).toContain('login');
      expect(result).toContain('dashboard');
      expect(result).toContain('rect');
    });

    it('handles multiple test blocks in Playwright', () => {
      const code = `test('login', async ({ page }) => {
  await page.goto('/login');
  await page.click('#submit');
})

test('dashboard', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page.locator('.title')).toBeVisible();
})`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toContain('login');
      expect(result).toContain('dashboard');
    });

    it('returns empty when no recognizable steps found', () => {
      const code = `const x = 42;\nconsole.log(x);`;
      const result = generateSequenceDiagram(code, 'playwright');
      expect(result).toBe('');
    });
  });

  describe('generateMermaidDiagram', () => {
    it('returns empty string for empty tests array', () => {
      expect(generateMermaidDiagram([])).toBe('');
    });

    it('generates valid Mermaid syntax with participants', () => {
      const tests = [{
        title: 'Test Flow',
        steps: [
          { from: 'User', to: 'Browser', action: 'Click button' },
          { from: 'Browser', to: 'User', action: 'Show result', isResponse: true },
        ]
      }];
      const result = generateMermaidDiagram(tests);
      expect(result).toContain('sequenceDiagram');
      expect(result).toContain('participant User');
      expect(result).toContain('participant Browser');
      expect(result).toContain('User->>Browser: Click button');
      expect(result).toContain('Browser-->>User: Show result');
    });

    it('wraps named tests in rect blocks', () => {
      const tests = [{
        title: 'My Test',
        steps: [
          { from: 'User', to: 'Browser', action: 'Navigate' },
        ]
      }, {
        title: 'Another Test',
        steps: [
          { from: 'User', to: 'Browser', action: 'Click' },
        ]
      }];
      const result = generateMermaidDiagram(tests);
      expect(result).toContain('rect rgb(200, 220, 255)');
      expect(result).toContain('Note over');
      expect(result).toContain('My Test');
      expect(result).toContain('Another Test');
      expect(result).toContain('end');
    });

    it('includes Server participant for API actions', () => {
      const tests = [{
        title: 'Test Flow',
        steps: [
          { from: 'User', to: 'Server', action: 'GET /api/users' },
        ]
      }];
      const result = generateMermaidDiagram(tests);
      expect(result).toContain('participant Server');
    });
  });
});
