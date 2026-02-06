/**
 * Sequence Diagram Generator
 * 
 * Parses CodeceptJS and Playwright test code and generates
 * Mermaid sequence diagram syntax representing the test flow.
 */

export type TestFramework = 'codeceptjs' | 'playwright';

export interface DiagramStep {
  from: string;
  to: string;
  action: string;
  isResponse?: boolean;
}

export interface ParsedTest {
  title: string;
  steps: DiagramStep[];
}

/**
 * Parse CodeceptJS test code and extract actions as diagram steps.
 */
function parseCodeceptJS(code: string): ParsedTest[] {
  const tests: ParsedTest[] = [];

  // Match Scenario blocks: Scenario('title', ({ I }) => { ... })
  const scenarioRegex = /Scenario\s*\(\s*['"`](.*?)['"`]\s*,\s*(?:async\s*)?\(\s*\{?\s*([\w\s,]*?)\s*\}?\s*\)\s*=>\s*\{([\s\S]*?)\n\}\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = scenarioRegex.exec(code)) !== null) {
    const title = match[1];
    const body = match[3];
    const steps = extractCodeceptJSSteps(body);
    tests.push({ title, steps });
  }

  // If no Scenario blocks found, try parsing the entire code as steps
  if (tests.length === 0) {
    const steps = extractCodeceptJSSteps(code);
    if (steps.length > 0) {
      tests.push({ title: 'Test Flow', steps });
    }
  }

  return tests;
}

/**
 * Extract steps from CodeceptJS test body.
 */
function extractCodeceptJSSteps(body: string): DiagramStep[] {
  const steps: DiagramStep[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // I.action('...' or I.action(... patterns
    const iActionMatch = trimmed.match(/I\.([\w]+)\s*\((.*)\)/);
    if (iActionMatch) {
      const action = iActionMatch[1];
      const args = iActionMatch[2];
      const step = mapCodeceptJSAction(action, args);
      if (step) steps.push(step);
      continue;
    }

    // await I.action patterns
    const awaitIMatch = trimmed.match(/await\s+I\.([\w]+)\s*\((.*)\)/);
    if (awaitIMatch) {
      const action = awaitIMatch[1];
      const args = awaitIMatch[2];
      const step = mapCodeceptJSAction(action, args);
      if (step) steps.push(step);
    }
  }

  return steps;
}

/**
 * Map a CodeceptJS action to a diagram step.
 */
function mapCodeceptJSAction(action: string, args: string): DiagramStep | null {
  const cleanArgs = extractFirstStringArg(args);

  const navigationActions = ['amOnPage', 'navigateTo', 'openNewTab'];
  const inputActions = ['fillField', 'appendField', 'clearField', 'type'];
  const clickActions = ['click', 'doubleClick', 'rightClick', 'forceClick', 'clickLink'];
  const seeActions = ['see', 'seeElement', 'seeInField', 'seeInTitle', 'seeInCurrentUrl', 'seeCheckboxIsChecked', 'seeNumberOfElements', 'seeCookie', 'seeTextEquals', 'seeAttributesOnElements'];
  const dontSeeActions = ['dontSee', 'dontSeeElement', 'dontSeeInField', 'dontSeeInTitle', 'dontSeeInCurrentUrl', 'dontSeeCheckboxIsChecked', 'dontSeeCookie'];
  const waitActions = ['wait', 'waitForElement', 'waitForVisible', 'waitForText', 'waitForInvisible', 'waitForDetached', 'waitForFunction', 'waitForNavigation', 'waitForRequest', 'waitForResponse', 'waitNumberOfVisibleElements', 'waitForClickable'];
  const grabActions = ['grabTextFrom', 'grabValueFrom', 'grabAttributeFrom', 'grabNumberOfVisibleElements', 'grabTitle', 'grabCurrentUrl', 'grabCookie', 'grabHTMLFrom', 'grabTextFromAll'];
  const selectActions = ['selectOption', 'checkOption', 'uncheckOption'];
  const keyActions = ['pressKey', 'pressKeyDown', 'pressKeyUp'];
  const apiActions = ['sendGetRequest', 'sendPostRequest', 'sendPutRequest', 'sendDeleteRequest', 'sendPatchRequest'];
  const scrollActions = ['scrollTo', 'scrollPageToTop', 'scrollPageToBottom'];

  if (navigationActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Navigate to ${cleanArgs || args}` };
  }
  if (inputActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `${action}: ${cleanArgs || args}` };
  }
  if (clickActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Click ${cleanArgs || args}` };
  }
  if (seeActions.includes(action)) {
    return { from: 'Browser', to: 'User', action: `Verify: ${cleanArgs || args}`, isResponse: true };
  }
  if (dontSeeActions.includes(action)) {
    return { from: 'Browser', to: 'User', action: `Verify absent: ${cleanArgs || args}`, isResponse: true };
  }
  if (waitActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Wait: ${action.replace('waitFor', '')} ${cleanArgs || args}` };
  }
  if (grabActions.includes(action)) {
    return { from: 'Browser', to: 'User', action: `Grab: ${action.replace('grab', '')} ${cleanArgs || args}`, isResponse: true };
  }
  if (selectActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `${action}: ${cleanArgs || args}` };
  }
  if (keyActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Press key: ${cleanArgs || args}` };
  }
  if (apiActions.includes(action)) {
    return { from: 'User', to: 'Server', action: `${action}: ${cleanArgs || args}` };
  }
  if (scrollActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Scroll: ${cleanArgs || args}` };
  }

  // Generic fallback
  return { from: 'User', to: 'Browser', action: `${action}(${cleanArgs || args})` };
}

/**
 * Parse Playwright test code and extract actions as diagram steps.
 */
function parsePlaywright(code: string): ParsedTest[] {
  const tests: ParsedTest[] = [];

  // Match test blocks: test('title', async ({ page }) => { ... })
  const testRegex = /test\s*\(\s*['"`](.*?)['"`]\s*,\s*(?:async\s*)?\(\s*\{?\s*([\w\s,]*?)\s*\}?\s*\)\s*=>\s*\{([\s\S]*?)\n\}\s*\)/g;
  let match: RegExpExecArray | null;

  while ((match = testRegex.exec(code)) !== null) {
    const title = match[1];
    const body = match[3];
    const steps = extractPlaywrightSteps(body);
    tests.push({ title, steps });
  }

  // If no test blocks found, try parsing the entire code as steps
  if (tests.length === 0) {
    const steps = extractPlaywrightSteps(code);
    if (steps.length > 0) {
      tests.push({ title: 'Test Flow', steps });
    }
  }

  return tests;
}

/**
 * Extract steps from Playwright test body.
 */
function extractPlaywrightSteps(body: string): DiagramStep[] {
  const steps: DiagramStep[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // page.goto(...)
    const gotoMatch = trimmed.match(/(?:await\s+)?page\.goto\s*\((.*)\)/);
    if (gotoMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Navigate to ${extractFirstStringArg(gotoMatch[1]) || gotoMatch[1]}` });
      continue;
    }

    // page.fill(...) or page.locator(...).fill(...)
    const fillMatch = trimmed.match(/(?:await\s+)?page\.(?:locator\(.*?\)\.)?fill\s*\((.*)\)/);
    if (fillMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Fill: ${extractStringArgs(fillMatch[1])}` });
      continue;
    }

    // page.click(...) or page.locator(...).click(...)
    const clickMatch = trimmed.match(/(?:await\s+)?page\.(?:locator\(.*?\)\.)?\s*click\s*\((.*?)\)/);
    if (clickMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Click ${extractFirstStringArg(clickMatch[1]) || clickMatch[1]}` });
      continue;
    }

    // page.getByRole/getByText/getByLabel/getByPlaceholder/getByTestId(...).click()
    const getByClickMatch = trimmed.match(/(?:await\s+)?page\.(getBy\w+)\s*\((.*?)\)\s*\.click\s*\(/);
    if (getByClickMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Click ${getByClickMatch[1]}(${extractFirstStringArg(getByClickMatch[2]) || getByClickMatch[2]})` });
      continue;
    }

    // page.getByRole/getByText/etc(...).fill(...)
    const getByFillMatch = trimmed.match(/(?:await\s+)?page\.(getBy\w+)\s*\((.*?)\)\s*\.fill\s*\((.*?)\)/);
    if (getByFillMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Fill ${getByFillMatch[1]}(${extractFirstStringArg(getByFillMatch[2])}): ${extractFirstStringArg(getByFillMatch[3])}` });
      continue;
    }

    // expect(page...).toBeVisible/toHaveText/toContainText/etc
    const expectMatch = trimmed.match(/(?:await\s+)?expect\s*\((.*?)\)\s*\.([\w]+)\s*\((.*?)\)/);
    if (expectMatch) {
      const assertion = expectMatch[2];
      const value = extractFirstStringArg(expectMatch[3]) || expectMatch[3];
      steps.push({ from: 'Browser', to: 'User', action: `Assert ${assertion}: ${value}`, isResponse: true });
      continue;
    }

    // page.waitForSelector/waitForURL/waitForLoadState/waitForTimeout
    const waitMatch = trimmed.match(/(?:await\s+)?page\.(waitFor\w+)\s*\((.*?)\)/);
    if (waitMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `${waitMatch[1]}: ${extractFirstStringArg(waitMatch[2]) || waitMatch[2]}` });
      continue;
    }

    // page.type(...)
    const typeMatch = trimmed.match(/(?:await\s+)?page\.type\s*\((.*)\)/);
    if (typeMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Type: ${extractStringArgs(typeMatch[1])}` });
      continue;
    }

    // page.keyboard.press(...)
    const keyMatch = trimmed.match(/(?:await\s+)?page\.keyboard\.press\s*\((.*?)\)/);
    if (keyMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Press key: ${extractFirstStringArg(keyMatch[1]) || keyMatch[1]}` });
      continue;
    }

    // page.selectOption(...)
    const selectMatch = trimmed.match(/(?:await\s+)?page\.selectOption\s*\((.*)\)/);
    if (selectMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Select: ${extractStringArgs(selectMatch[1])}` });
      continue;
    }

    // page.screenshot(...)
    const screenshotMatch = trimmed.match(/(?:await\s+)?page\.screenshot\s*\(/);
    if (screenshotMatch) {
      steps.push({ from: 'Browser', to: 'User', action: 'Take screenshot', isResponse: true });
      continue;
    }

    // API: page.request.get/post/put/delete/patch
    const apiMatch = trimmed.match(/(?:await\s+)?(?:page\.)?request\.(get|post|put|delete|patch)\s*\((.*?)\)/);
    if (apiMatch) {
      steps.push({ from: 'User', to: 'Server', action: `${apiMatch[1].toUpperCase()} ${extractFirstStringArg(apiMatch[2]) || apiMatch[2]}` });
      continue;
    }

    // page.evaluate(...)
    const evalMatch = trimmed.match(/(?:await\s+)?page\.evaluate\s*\(/);
    if (evalMatch) {
      steps.push({ from: 'User', to: 'Browser', action: 'Execute JavaScript' });
      continue;
    }

    // page.setViewportSize(...)
    const viewportMatch = trimmed.match(/(?:await\s+)?page\.setViewportSize\s*\((.*?)\)/);
    if (viewportMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Set viewport: ${viewportMatch[1]}` });
      continue;
    }

    // page.locator(...).action() - generic locator actions
    const locatorMatch = trimmed.match(/(?:await\s+)?page\.locator\s*\((.*?)\)\s*\.([\w]+)\s*\((.*?)\)/);
    if (locatorMatch) {
      const selector = extractFirstStringArg(locatorMatch[1]) || locatorMatch[1];
      const locAction = locatorMatch[2];
      const locArgs = extractFirstStringArg(locatorMatch[3]) || locatorMatch[3];
      steps.push({ from: 'User', to: 'Browser', action: `${locAction}(${selector}${locArgs ? ', ' + locArgs : ''})` });
      continue;
    }
  }

  return steps;
}

/**
 * Extract the first string argument from a function call arguments string.
 */
function extractFirstStringArg(args: string): string {
  const stringMatch = args.match(/['"`](.*?)['"`]/);
  return stringMatch ? stringMatch[1] : '';
}

/**
 * Extract all string arguments for display.
 */
function extractStringArgs(args: string): string {
  const matches: string[] = [];
  const regex = /['"`](.*?)['"`]/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(args)) !== null) {
    matches.push(m[1]);
  }
  return matches.join(', ') || args;
}

/**
 * Escape special characters for Mermaid syntax.
 */
function escapeMermaid(text: string): string {
  return text
    .replace(/;/g, '#59;')
    .replace(/"/g, "'")
    .replace(/\n/g, ' ')
    .substring(0, 80); // Limit length for readability
}

/**
 * Generate Mermaid sequence diagram syntax from parsed tests.
 */
export function generateMermaidDiagram(tests: ParsedTest[]): string {
  if (tests.length === 0) return '';

  const lines: string[] = ['sequenceDiagram'];

  // Collect all participants
  const participants = new Set<string>();
  for (const test of tests) {
    for (const step of test.steps) {
      participants.add(step.from);
      participants.add(step.to);
    }
  }

  // Add participants
  for (const p of participants) {
    lines.push(`    participant ${p}`);
  }

  for (const test of tests) {
    if (tests.length > 1 || test.title !== 'Test Flow') {
      lines.push(`    rect rgb(200, 220, 255)`);
      lines.push(`    Note over ${Array.from(participants).join(',')}: ${escapeMermaid(test.title)}`);
    }

    for (const step of test.steps) {
      const arrow = step.isResponse ? '-->>' : '->>';
      lines.push(`    ${step.from}${arrow}${step.to}: ${escapeMermaid(step.action)}`);
    }

    if (tests.length > 1 || test.title !== 'Test Flow') {
      lines.push(`    end`);
    }
  }

  return lines.join('\n');
}

/**
 * Main function to parse test code and generate a Mermaid sequence diagram.
 */
export function generateSequenceDiagram(code: string, framework: TestFramework): string {
  if (!code.trim()) return '';

  const tests = framework === 'codeceptjs' ? parseCodeceptJS(code) : parsePlaywright(code);
  return generateMermaidDiagram(tests);
}

/**
 * Sample CodeceptJS test code for demo purposes.
 */
export const sampleCodeceptJS = `Scenario('login and verify dashboard', async ({ I }) => {
  I.amOnPage('/login');
  I.fillField('email', 'user@example.com');
  I.fillField('password', 'secret123');
  I.click('Sign In');
  I.waitForElement('.dashboard');
  I.see('Welcome back');
  I.seeInCurrentUrl('/dashboard');
});`;

/**
 * Sample Playwright test code for demo purposes.
 */
export const samplePlaywright = `test('login and verify dashboard', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('#email', 'user@example.com');
  await page.fill('#password', 'secret123');
  await page.click('button[type="submit"]');
  await page.waitForSelector('.dashboard');
  await expect(page.locator('.welcome')).toBeVisible();
  await expect(page).toHaveURL('/dashboard');
});`;
