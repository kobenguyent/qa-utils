/**
 * Sequence Diagram Generator
 * 
 * Parses CodeceptJS and Playwright test code and generates
 * Mermaid sequence diagram syntax representing the test flow.
 */

export type TestFramework = 'codeceptjs' | 'playwright' | 'pytest';

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
  const firstArg = extractFirstStringArg(args);
  const allArgs = extractStringArgs(args);

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
    return { from: 'User', to: 'Browser', action: `Navigate to ${firstArg || args}` };
  }
  if (inputActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `${action}: ${allArgs || args}` };
  }
  if (clickActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Click ${firstArg || args}` };
  }
  if (seeActions.includes(action)) {
    return { from: 'Browser', to: 'User', action: `Verify: ${allArgs || args}`, isResponse: true };
  }
  if (dontSeeActions.includes(action)) {
    return { from: 'Browser', to: 'User', action: `Verify absent: ${allArgs || args}`, isResponse: true };
  }
  if (waitActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Wait: ${action.replace('waitFor', '')} ${allArgs || args}` };
  }
  if (grabActions.includes(action)) {
    return { from: 'Browser', to: 'User', action: `Grab: ${action.replace('grab', '')} ${allArgs || args}`, isResponse: true };
  }
  if (selectActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `${action}: ${allArgs || args}` };
  }
  if (keyActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Press key: ${firstArg || args}` };
  }
  if (apiActions.includes(action)) {
    return { from: 'User', to: 'Server', action: `${action}: ${allArgs || args}` };
  }
  if (scrollActions.includes(action)) {
    return { from: 'User', to: 'Browser', action: `Scroll: ${allArgs || args}` };
  }

  // Generic fallback
  return { from: 'User', to: 'Browser', action: `${action}(${allArgs || args})` };
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
      const subject = expectMatch[1];
      const assertion = expectMatch[2];
      const argValue = extractFirstStringArg(expectMatch[3]) || expectMatch[3];
      // Extract locator/selector info from subject
      const locatorInfo = extractFirstStringArg(subject);
      let actionText = `Assert ${assertion}`;
      if (argValue) {
        actionText += `: ${argValue}`;
      } else if (locatorInfo) {
        actionText += ` (${locatorInfo})`;
      }
      steps.push({ from: 'Browser', to: 'User', action: actionText, isResponse: true });
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
 * Parse pytest test code and extract actions as diagram steps.
 */
function parsePytest(code: string): ParsedTest[] {
  const tests: ParsedTest[] = [];

  // Match def test_ functions: def test_name(page, ...):
  const testRegex = /def\s+(test_\w+)\s*\([^)]*\)\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = testRegex.exec(code)) !== null) {
    const title = match[1].replace(/^test_/, '').replace(/_/g, ' ');
    const startIndex = match.index + match[0].length;
    const body = extractPythonBody(code, startIndex);
    const steps = extractPytestSteps(body);
    tests.push({ title, steps });
  }

  // If no test functions found, try parsing the entire code as steps
  if (tests.length === 0) {
    const steps = extractPytestSteps(code);
    if (steps.length > 0) {
      tests.push({ title: 'Test Flow', steps });
    }
  }

  return tests;
}

/**
 * Extract indented body from a Python function definition.
 */
function extractPythonBody(code: string, startIndex: number): string {
  const lines = code.substring(startIndex).split('\n');
  const bodyLines: string[] = [];
  let baseIndent: number | null = null;

  for (const line of lines) {
    if (line.trim() === '') {
      bodyLines.push(line);
      continue;
    }
    const indent = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (baseIndent === null) {
      if (indent === 0 && line.trim() !== '') continue; // skip same-line content
      baseIndent = indent;
    }
    if (indent < baseIndent && line.trim() !== '') break;
    bodyLines.push(line);
  }

  return bodyLines.join('\n');
}

/**
 * Extract steps from pytest test body.
 */
function extractPytestSteps(body: string): DiagramStep[] {
  const steps: DiagramStep[] = [];
  const lines = body.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // page.goto(...)
    const gotoMatch = trimmed.match(/page\.goto\s*\((.*)\)/);
    if (gotoMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Navigate to ${extractPythonStringArg(gotoMatch[1])}` });
      continue;
    }

    // page.fill(...) or page.locator(...).fill(...)
    const fillMatch = trimmed.match(/page\.(?:locator\(.*?\)\.)?fill\s*\((.*)\)/);
    if (fillMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Fill: ${extractPythonStringArgs(fillMatch[1])}` });
      continue;
    }

    // page.click(...) or page.locator(...).click(...)
    const clickMatch = trimmed.match(/page\.(?:locator\(.*?\)\.)?\s*click\s*\((.*?)\)/);
    if (clickMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Click ${extractPythonStringArg(clickMatch[1]) || clickMatch[1]}` });
      continue;
    }

    // page.get_by_role/get_by_text/get_by_label/etc(...).click()
    const getByClickMatch = trimmed.match(/page\.(get_by_\w+)\s*\((.*?)\)\s*\.click\s*\(/);
    if (getByClickMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Click ${getByClickMatch[1]}(${extractPythonStringArg(getByClickMatch[2]) || getByClickMatch[2]})` });
      continue;
    }

    // page.get_by_role/get_by_text/etc(...).fill(...)
    const getByFillMatch = trimmed.match(/page\.(get_by_\w+)\s*\((.*?)\)\s*\.fill\s*\((.*?)\)/);
    if (getByFillMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Fill ${getByFillMatch[1]}(${extractPythonStringArg(getByFillMatch[2])}): ${extractPythonStringArg(getByFillMatch[3])}` });
      continue;
    }

    // expect(page...).to_be_visible/to_have_text/etc
    const expectMatch = trimmed.match(/expect\s*\((.*?)\)\s*\.(to_\w+)\s*\((.*?)\)/);
    if (expectMatch) {
      const subject = expectMatch[1];
      const assertion = expectMatch[2];
      const argValue = extractPythonStringArg(expectMatch[3]);
      const locatorInfo = extractPythonStringArg(subject);
      let actionText = `Assert ${assertion}`;
      if (argValue) {
        actionText += `: ${argValue}`;
      } else if (locatorInfo) {
        actionText += ` (${locatorInfo})`;
      }
      steps.push({ from: 'Browser', to: 'User', action: actionText, isResponse: true });
      continue;
    }

    // assert statements
    const assertMatch = trimmed.match(/assert\s+(.*)/);
    if (assertMatch) {
      steps.push({ from: 'Browser', to: 'User', action: `Assert: ${assertMatch[1].substring(0, 60)}`, isResponse: true });
      continue;
    }

    // page.wait_for_selector/wait_for_url/wait_for_load_state/wait_for_timeout
    const waitMatch = trimmed.match(/page\.(wait_for_\w+)\s*\((.*?)\)/);
    if (waitMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `${waitMatch[1]}: ${extractPythonStringArg(waitMatch[2]) || waitMatch[2]}` });
      continue;
    }

    // page.type(...)
    const typeMatch = trimmed.match(/page\.type\s*\((.*)\)/);
    if (typeMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Type: ${extractPythonStringArgs(typeMatch[1])}` });
      continue;
    }

    // page.keyboard.press(...)
    const keyMatch = trimmed.match(/page\.keyboard\.press\s*\((.*?)\)/);
    if (keyMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Press key: ${extractPythonStringArg(keyMatch[1]) || keyMatch[1]}` });
      continue;
    }

    // page.select_option(...)
    const selectMatch = trimmed.match(/page\.select_option\s*\((.*)\)/);
    if (selectMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Select: ${extractPythonStringArgs(selectMatch[1])}` });
      continue;
    }

    // page.screenshot(...)
    const screenshotMatch = trimmed.match(/page\.screenshot\s*\(/);
    if (screenshotMatch) {
      steps.push({ from: 'Browser', to: 'User', action: 'Take screenshot', isResponse: true });
      continue;
    }

    // API: page.request.get/post/put/delete/patch or requests.get/post/etc
    const apiMatch = trimmed.match(/(?:page\.)?request[s]?\.(get|post|put|delete|patch)\s*\((.*?)\)/);
    if (apiMatch) {
      steps.push({ from: 'User', to: 'Server', action: `${apiMatch[1].toUpperCase()} ${extractPythonStringArg(apiMatch[2]) || apiMatch[2]}` });
      continue;
    }

    // page.evaluate(...)
    const evalMatch = trimmed.match(/page\.evaluate\s*\(/);
    if (evalMatch) {
      steps.push({ from: 'User', to: 'Browser', action: 'Execute JavaScript' });
      continue;
    }

    // page.set_viewport_size(...)
    const viewportMatch = trimmed.match(/page\.set_viewport_size\s*\((.*?)\)/);
    if (viewportMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Set viewport: ${viewportMatch[1]}` });
      continue;
    }

    // page.locator(...).action() - generic locator actions
    const locatorMatch = trimmed.match(/page\.locator\s*\((.*?)\)\s*\.([\w]+)\s*\((.*?)\)/);
    if (locatorMatch) {
      const selector = extractPythonStringArg(locatorMatch[1]) || locatorMatch[1];
      const locAction = locatorMatch[2];
      const locArgs = extractPythonStringArg(locatorMatch[3]) || locatorMatch[3];
      steps.push({ from: 'User', to: 'Browser', action: `${locAction}(${selector}${locArgs ? ', ' + locArgs : ''})` });
      continue;
    }

    // client.get/post/put/delete/patch - Django/Flask/FastAPI test client
    const clientMatch = trimmed.match(/client\.(get|post|put|delete|patch)\s*\((.*?)\)/);
    if (clientMatch) {
      steps.push({ from: 'User', to: 'Server', action: `${clientMatch[1].toUpperCase()} ${extractPythonStringArg(clientMatch[2]) || clientMatch[2]}` });
      continue;
    }

    // response.status_code or response.json() assertions
    const responseAssert = trimmed.match(/assert\s+response\.(status_code|json\(\))/);
    if (responseAssert) {
      steps.push({ from: 'Server', to: 'User', action: `Verify ${responseAssert[1]}`, isResponse: true });
      continue;
    }

    // Selenium: driver.get(...)
    const driverGetMatch = trimmed.match(/driver\.get\s*\((.*)\)/);
    if (driverGetMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Navigate to ${extractPythonStringArg(driverGetMatch[1])}` });
      continue;
    }

    // Selenium: driver.find_element(...).click()
    const seleniumClickMatch = trimmed.match(/driver\.find_element\s*\((.*?)\)\s*\.click\s*\(/);
    if (seleniumClickMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Click ${extractPythonStringArgs(seleniumClickMatch[1])}` });
      continue;
    }

    // Selenium: driver.find_element(...).send_keys(...)
    const seleniumTypeMatch = trimmed.match(/driver\.find_element\s*\((.*?)\)\s*\.send_keys\s*\((.*?)\)/);
    if (seleniumTypeMatch) {
      steps.push({ from: 'User', to: 'Browser', action: `Type: ${extractPythonStringArgs(seleniumTypeMatch[1])}, ${extractPythonStringArg(seleniumTypeMatch[2])}` });
      continue;
    }

    // Selenium: WebDriverWait(...).until(...)
    const waitUntilMatch = trimmed.match(/WebDriverWait\s*\(.*?\)\.until\s*\(/);
    if (waitUntilMatch) {
      steps.push({ from: 'User', to: 'Browser', action: 'Wait for condition' });
      continue;
    }
  }

  return steps;
}

/**
 * Extract the first string argument from Python function call arguments.
 * Handles both single and double quoted strings.
 */
function extractPythonStringArg(args: string): string {
  const stringMatch = args.match(/'([^']*)'|"([^"]*)"/);
  if (!stringMatch) return '';
  return stringMatch[1] ?? stringMatch[2] ?? '';
}

/**
 * Extract all string arguments from Python function call arguments.
 */
function extractPythonStringArgs(args: string): string {
  const matches: string[] = [];
  const regex = /'([^']*)'|"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(args)) !== null) {
    matches.push(m[1] ?? m[2] ?? '');
  }
  return matches.join(', ') || args;
}

/**
 * Extract the first string argument from a function call arguments string.
 * Handles matching quote pairs properly (e.g., 'button[type="submit"]').
 */
function extractFirstStringArg(args: string): string {
  const stringMatch = args.match(/'([^']*)'|"([^"]*)"|`([^`]*)`/);
  if (!stringMatch) return '';
  return stringMatch[1] ?? stringMatch[2] ?? stringMatch[3] ?? '';
}

/**
 * Extract all string arguments for display.
 * Handles matching quote pairs properly (e.g., 'button[type="submit"]').
 */
function extractStringArgs(args: string): string {
  const matches: string[] = [];
  const regex = /'([^']*)'|"([^"]*)"|`([^`]*)`/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(args)) !== null) {
    matches.push(m[1] ?? m[2] ?? m[3] ?? '');
  }
  return matches.join(', ') || args;
}

/**
 * Escape special characters for Mermaid syntax.
 */
function escapeMermaid(text: string): string {
  return text
    .replace(/#/g, '#35;')
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

  let tests: ParsedTest[];
  if (framework === 'codeceptjs') {
    tests = parseCodeceptJS(code);
  } else if (framework === 'pytest') {
    tests = parsePytest(code);
  } else {
    tests = parsePlaywright(code);
  }
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

/**
 * Sample pytest test code for demo purposes.
 */
export const samplePytest = `def test_login_and_verify_dashboard(page):
    page.goto("https://example.com/login")
    page.fill("#email", "user@example.com")
    page.fill("#password", "secret123")
    page.click('button[type="submit"]')
    page.wait_for_selector(".dashboard")
    expect(page.locator(".welcome")).to_be_visible()
    expect(page).to_have_url("/dashboard")
`;
