import { useState } from 'react';
import { Header } from "../Header.tsx";
import { Footer } from "../Footer.tsx";
import { Button, Container } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast.tsx';

import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import js from 'react-syntax-highlighter/dist/esm/languages/hljs/javascript';
import docco from 'react-syntax-highlighter/dist/esm/styles/hljs/docco';

SyntaxHighlighter.registerLanguage('javascript', js);

const examplePlaywrightCode = `import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('https://todomvc.com/examples/vanilla-es6/');
});

/**
 * Locators are used to represent a selector on a page and re-use them. They have
 * strictMode enabled by default. This option will throw an error if the selector
 * will resolve to multiple elements.
 * In this example we create a todo item, assert that it exists and then filter
 * by the completed items to ensure that the item is not visible anymore.
 * @see https://playwright.dev/docs/api/class-locator
 */
test('basic interaction', async ({ page }) => {
  const inputBox = page.locator('input.new-todo');
  const todoList = page.locator('.todo-list');

  await inputBox.fill('Learn Playwright');
  await inputBox.press('Enter');
  await expect(todoList).toHaveText('Learn Playwright');
  await page.locator('.filters >> text=Completed').click();
  await expect(todoList).not.toHaveText('Learn Playwright');
});

/**
 * Playwright supports different selector engines which you can combine with '>>'.
 * @see https://playwright.dev/docs/selectors
 */
test('element selectors', async ({ page }) => {
  // When no selector engine is specified, Playwright will use the css selector engine.
  await page.type('.header input', 'Learn Playwright');
  // So the selector above is the same as the following:
  await page.press('css=.header input', 'Enter');

  // select by text with the text selector engine:
  await page.click('text=All');

  // css allows you to select by attribute:
  await page.click('[id="toggle-all"]');

  // Combine css and text selectors (https://playwright.dev/docs/selectors/#text-selector)
  await page.click('.todo-list > li:has-text("Playwright")');
  await page.click('.todoapp .footer >> text=Completed');

  // Selecting based on layout, with css selector
  expect(await page.innerText('a:right-of(:text("Active"))')).toBe('Completed1'); //TODO: to fix this test use ".toBe('Completed')"

  // Only visible elements, with css selector
  await page.click('text=Completed >> visible=true');

  // XPath selector
  await page.click('xpath=//html/body/section/section/label');
});`

// Helper function to convert Playwright syntax to CodeceptJS syntax
function convertPlaywrightToCodeceptJS(playwrightCode: string) {
  let convertedCode = '';

  // Remove imports from '@playwright/test'
  const codeceptjsCode = playwrightCode.replace(/import.*from '@playwright\/test';?/g, '');

  // Extract `test.describe` blocks and their associated tests
  const describeBlocks = Array.from(codeceptjsCode.matchAll(/test\.describe\((['"`])(.*?)\1, \(\) => {(.*?)\n}\);/gs));

  if (describeBlocks.length > 0) {
    // Handle code with `test.describe` blocks
    describeBlocks.forEach((block: RegExpMatchArray) => {
      const describeName = block[2];
      const tests = block[3].trim();

      // Start the Feature block
      convertedCode += `Feature("${describeName}");\n\n`;

      // Convert each `test()` within this `describe` block to a Scenario
      let scenarios = tests.replaceAll('test(', 'Scenario(');

      // Replace Playwright methods with equivalent CodeceptJS methods in the scenario body
      scenarios = _scenarioConversion(scenarios)

      // Add the converted Scenario to the output
      convertedCode += `${scenarios}\n\n`;
    });
  } else {
    // Handle code with only standalone `test()` blocks
    convertedCode += `Feature("Converted Playwright Tests");\n\n`;

    let standaloneTests = _scenarioConversion(codeceptjsCode)

    convertedCode += `${standaloneTests}\n\n`;
    convertedCode = convertedCode.replaceAll('test.beforeEach', 'Before')
  }

  return convertedCode;
}

function _scenarioConversion(text: string) {
  return text
    .replaceAll('test(', 'Scenario(')
    .replaceAll('({ page })', '({ I })')
    .replaceAll(/const (.*?) = page\.locator\((['"`])(.*?)\2\);/g, 'const $1 = locate("$3");')  // Convert page.locator to locate
    .replaceAll(/await (.*?)\.fill\((['"`])(.*?)\2\);/g, 'I.fillField($1, "$3");')  // Convert inputBox.fill to I.fillField
    .replaceAll(/await page\.goto\((['"`])(.*?)\1\);/g, 'I.amOnPage("$2");')
    .replaceAll(/await page\.locator\((['"`])(.*?)\1\);/g, 'I.amOnPage("$2");')
    .replaceAll(/await expect\(page\.getByText\((['"`])(.*?)\1(?:, ?\{ exact: true \})?\)\)\.toBeVisible\(\);/g, 'I.see("$2");')
    .replaceAll(/await page\.route\((['"`])(.*?)\1, async \(route\) => {/g, 'I.mockRoute("$2", async (request) => {')
    .replaceAll(/route\.fulfill\(/g, 'request.continue(')
    .replaceAll('await page.routeFromHAR', 'I.replayFromHar')
    .replaceAll(/await (.*?)\.locator\((['"`])(.*?)\2\)\.click\(\);/g, 'I.click("$3");')  // Convert locator with text to I.click
    .replaceAll(/await (.*?)\.locator\((['"`])(.*?)\2\);/g, 'I.$1("$3");')
    .replaceAll(/await expect\((.*?)\)\.toHaveText\((['"`])(.*?)\2\);/g, 'I.see("$3", $1);')
    .replaceAll(/await expect\((.*?)\)\.not.toHaveText\((['"`])(.*?)\2\);/g, 'I.dontSee("$3", $1);')
    .replaceAll(/await (.*?)\.press\((['"`])(.*?)\2\);/g, 'I.pressKey("$3");')
    .replaceAll(/await (.*?)\.click\((['"`])(.*?)\2\);/g, 'I.click("$3");')
    .replaceAll(/await (.*?)\.type\((['"`])(.*?)\2\);/g, 'I.type("$3");');
}

const TestConverter = () => {
  const [playwrightCode, setPlaywrightCode] = useState('');
  const [codeceptjsCode, setCodeceptjsCode] = useState('');

  const handleConversion = () => {
    const convertedCode = convertPlaywrightToCodeceptJS(playwrightCode);
    setCodeceptjsCode(convertedCode.trim());
  };

  const handleClearInput = () => {
    setPlaywrightCode('');
    setCodeceptjsCode('');
  };

  const handleFillOutSampleCode = () => {
    setPlaywrightCode(examplePlaywrightCode)
  }

  return (
    <Container>
      <Header />
      <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
        <h2>Playwright to CodeceptJS Test Converter</h2>

        <textarea
          placeholder="Paste your Playwright test code here"
          value={playwrightCode}
          onChange={(e) => setPlaywrightCode (e.target.value)}
          rows={10}
          style={{width: '100%', marginBottom: '10px', fontFamily: 'monospace'}}
        />

        <Button onClick={handleFillOutSampleCode} style={{marginRight: '10px'}}>
          Example Playwright Tests code
        </Button>
        <Button onClick={handleConversion} style={{marginRight: '10px'}} disabled={playwrightCode === ""}>
          Convert
        </Button>
        <Button onClick={handleClearInput} style={{marginRight: '10px'}} disabled={playwrightCode === ""}>
          Clear
        </Button>

        <div style={{width: '100%', marginTop: '10px'}}>
          <SyntaxHighlighter language="typescript" style={docco} wrapLongLines>
            {codeceptjsCode || "Converted CodeceptJS test code will appear here"}
          </SyntaxHighlighter>
        </div>
        <CopyWithToast text={codeceptjsCode}></CopyWithToast>
      </div>
      <Footer/>
    </Container>
  );
};

export default TestConverter;
