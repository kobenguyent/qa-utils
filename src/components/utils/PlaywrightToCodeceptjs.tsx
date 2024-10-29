import { useState } from 'react';
import { Header } from "../Header.tsx";
import { Footer } from "../Footer.tsx";
import { Button, Container } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast.tsx';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';

const examplePlaywrightCode = `import { test, expect, type Page } from '@playwright/test';

test.describe('Mocking an API call', () => {

  test('mocks a fruit and does not call api', async ({ page }) => {
    // Mock the api call before navigating
    await page.route('*/**/api/v1/fruits', async (route) => {
      const json = [{ name: 'Strawberry', id: 21 }];
      await route.fulfill({ json });
    });
    // Go to the page
    await page.goto('https://demo.playwright.dev/api-mocking');
  
    // Assert that the Strawberry fruit is visible
    await expect(page.getByText('Strawberry')).toBeVisible();
  });
  
});

test.describe('Intercepting the request and modifying it', () => {

  test('gets the json from api and adds a new fruit', async ({ page }) => {
    // Get the response and add to it
    await page.route('*/**/api/v1/fruits', async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      json.push({ name: 'Playwright', id: 100 });
      // Fulfill using the original response, while patching the response body
      // with the given JSON object.
      await route.fulfill({ response, json });
    });

    // Go to the page
    await page.goto('https://demo.playwright.dev/api-mocking');

    // Assert that the new fruit is visible
    await expect(page.getByText('Playwright', { exact: true })).toBeVisible();
  });
  
});

test.describe('Mocking with HAR files', () => {

  test('records or updates the HAR file', async ({ page }) => {
    // Get the response from the HAR file
    await page.routeFromHAR('./hars/fruits.har', {
      url: '*/**/api/v1/fruits',
      update: true,
    });

    // Go to the page
    await page.goto('https://demo.playwright.dev/api-mocking');

    // Assert that the Playwright fruit is visible
    await expect(page.getByText('Strawberry')).toBeVisible();
  });

  test('gets the json from HAR and checks the new fruit has been added', async ({ page }) => {
    // Replay API requests from HAR.
    // Either use a matching response from the HAR,
    // or abort the request if nothing matches.
    await page.routeFromHAR('./hars/fruits.har', {
      url: '*/**/api/v1/fruits',
      update: false,
    });

    // Go to the page
    await page.goto('https://demo.playwright.dev/api-mocking');

    // Assert that the Playwright fruit is visible
    await expect(page.getByText('Strawberry')).toBeVisible();
  });
});`

// Helper function to convert Playwright syntax to CodeceptJS syntax
function convertPlaywrightToCodeceptJS(playwrightCode: string) {
  // Remove imports from '@playwright/test'
  const codeceptjsCode = playwrightCode.replace(/import.*from '@playwright\/test';?/g, '');

  // Extract `test.describe` blocks and their associated tests
  const describeBlocks = Array.from(codeceptjsCode.matchAll(/test\.describe\((['"`])(.*?)\1, \(\) => {(.*?)\n}\);/gs));

  let convertedCode = '';

  describeBlocks.forEach((block: RegExpMatchArray) => {
    const describeName = block[2];
    const tests = block[3].trim();

    // Start the Feature block without a function
    convertedCode += `Feature("${describeName}");\n\n`;

    // Convert each `test()` within this `describe` block to a Scenario() outside the Feature block
    let scenarios = tests.replaceAll('test(', 'Scenario(');

    // Replace Playwright methods with equivalent CodeceptJS methods in the scenario body
    scenarios = scenarios
      .replaceAll('({ page })', '({ I })')
      .replaceAll(/await page\.goto\((['"`])(.*?)\1\);/g, 'I.amOnPage("$2");')
      .replaceAll(/await expect\(page\.getByText\((['"`])(.*?)\1(?:, ?\{ exact: true \})?\)\)\.toBeVisible\(\);/g, 'I.see("$2");')
      .replaceAll(/await page\.route\((['"`])(.*?)\1, async \(route\) => {/g, 'I.mockRoute("$2", async (request) => {')
      .replaceAll(/route\.fulfill\(/g, 'request.continue(')
      .replaceAll('await page.routeFromHAR', 'I.replayFromHar');

    // Add the converted Scenario to the output
    convertedCode += `${scenarios}\n\n`;
  });

  return convertedCode;
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
