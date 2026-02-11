import { useState, useEffect } from 'react';
import { Button, Container, Form, Row, Col, Alert, Spinner, ButtonGroup } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast.tsx';
import { 
  sendChatMessage, 
  ChatMessage, 
  ChatConfig, 
  AIProvider,
  testConnection,
  getDefaultModel,
  fetchModels
} from '../../utils/aiChatClient';

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

    const standaloneTests = _scenarioConversion(codeceptjsCode)

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
  
  // Conversion method state
  const [conversionMethod, setConversionMethod] = useState<'default' | 'ai'>('default');
  
  // AI configuration state
  const [useAI, setUseAI] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('http://localhost:11434');
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  // Load saved API key from localStorage and fetch available models
  useEffect(() => {
    const loadModelsAndKey = async () => {
      const savedApiKey = localStorage.getItem(`playwright_converter_${provider}_apiKey`);
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
      
      // Fetch available models from API if possible
      setLoadingModels(true);
      try {
        const models = await fetchModels(provider, { 
          apiKey: savedApiKey || undefined, 
          endpoint: provider === 'ollama' || provider === 'azure-openai' ? endpoint : undefined 
        });
        
        // Set the first available model (should be the default/latest)
        if (models.length > 0) {
          const defaultModel = models.find(m => m.isDefault) || models[0];
          setModel(defaultModel.id);
        } else {
          // Fallback to hardcoded default if API fetch fails
          const defaultModel = getDefaultModel(provider);
          setModel(defaultModel.id);
        }
      } catch (err) {
        // Fallback to hardcoded default if API fetch fails
        const defaultModel = getDefaultModel(provider);
        setModel(defaultModel.id);
      } finally {
        setLoadingModels(false);
      }
    };
    
    loadModelsAndKey();
  }, [provider, endpoint]);

  // Test connection when API key changes
  useEffect(() => {
    const checkConnection = async () => {
      if (!useAI || !apiKey) {
        setConnectionStatus('unknown');
        return;
      }

      const config: ChatConfig = {
        provider,
        apiKey,
        endpoint: provider === 'ollama' || provider === 'azure-openai' ? endpoint : undefined,
        model,
      };

      const isConnected = await testConnection(config);
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    };

    checkConnection();
  }, [useAI, provider, apiKey, endpoint, model]);

  // AI-based conversion using AI provider
  const convertWithAI = async (code: string): Promise<string> => {
    const config: ChatConfig = {
      provider,
      apiKey,
      endpoint: provider === 'ollama' || provider === 'azure-openai' ? endpoint : undefined,
      model,
      temperature: 0.3, // Lower temperature for more consistent code conversion
      maxTokens: 4096,
    };

    const systemPrompt = `You are an expert in test automation. Convert Playwright test code to CodeceptJS format.
Follow these conversion rules:
- Replace 'import { test, expect } from '@playwright/test'' with Feature() and Scenario()
- Convert test.describe() to Feature()
- Convert test() to Scenario()
- Replace ({ page }) with ({ I })
- Convert page.locator() to locate()
- Convert page.goto() to I.amOnPage()
- Convert inputBox.fill() to I.fillField()
- Convert .press() to I.pressKey()
- Convert .click() to I.click()
- Convert expect().toHaveText() to I.see()
- Convert expect().not.toHaveText() to I.dontSee()
- Convert test.beforeEach to Before

Return ONLY the converted CodeceptJS code without any explanations or markdown formatting.`;

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Convert this Playwright test code to CodeceptJS:\n\n${code}` }
    ];

    try {
      const response = await sendChatMessage(messages, config);
      return response.message.trim();
    } catch (err) {
      throw new Error(`AI conversion failed: ${(err as Error).message}`);
    }
  };

  const handleConversion = async () => {
    setError('');
    setLoading(true);

    try {
      let convertedCode: string;
      
      if (conversionMethod === 'ai' && useAI) {
        // Validate AI configuration
        if (!apiKey && provider !== 'ollama') {
          throw new Error(`API key is required for ${provider}`);
        }
        
        // Use AI-based conversion
        convertedCode = await convertWithAI(playwrightCode);
      } else {
        // Use default regex-based conversion
        convertedCode = convertPlaywrightToCodeceptJS(playwrightCode);
      }
      
      setCodeceptjsCode(convertedCode.trim());
    } catch (err) {
      setError((err as Error).message);
      // Fallback to default conversion on AI error
      if (conversionMethod === 'ai') {
        setError(`${(err as Error).message}. Falling back to default conversion...`);
        const convertedCode = convertPlaywrightToCodeceptJS(playwrightCode);
        setCodeceptjsCode(convertedCode.trim());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearInput = () => {
    setPlaywrightCode('');
    setCodeceptjsCode('');
    setError('');
  };

  const handleFillOutSampleCode = () => {
    setPlaywrightCode(examplePlaywrightCode);
  };

  const handleSaveApiKey = () => {
    if (apiKey) {
      localStorage.setItem(`playwright_converter_${provider}_apiKey`, apiKey);
      setError('');
      alert('API key saved successfully!');
    }
  };

  return (
    <Container>
      <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
        <h2>Test Automation Code Converter</h2>
        <p className="text-muted">Convert test automation code between different framework formats</p>
        {/* Conversion Method Selection */}
        <Row className="mb-3">
          <Col>
            <Form.Label>Conversion Method</Form.Label>
            <ButtonGroup className="w-100">
              <Button 
                variant={conversionMethod === 'default' ? 'primary' : 'outline-primary'}
                onClick={() => {
                  setConversionMethod('default');
                  setUseAI(false);
                }}
              >
                Default (Regex-based)
              </Button>
              <Button 
                variant={conversionMethod === 'ai' ? 'primary' : 'outline-primary'}
                onClick={() => {
                  setConversionMethod('ai');
                  setUseAI(true);
                }}
              >
                AI-Powered
              </Button>
            </ButtonGroup>
            <Form.Text className="text-muted">
              {conversionMethod === 'default' 
                ? 'Fast and reliable regex-based conversion' 
                : 'AI-powered conversion with better context understanding'}
            </Form.Text>
          </Col>
        </Row>

        {/* AI Configuration Panel */}
        {conversionMethod === 'ai' && (
          <Row className="mb-3">
            <Col>
              <Alert variant="info">
                <Alert.Heading>AI Configuration</Alert.Heading>
                
                <Form.Group className="mb-2">
                  <Form.Label>AI Provider</Form.Label>
                  <Form.Select 
                    value={provider} 
                    onChange={(e) => setProvider(e.target.value as AIProvider)}
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic Claude</option>
                    <option value="google">Google Gemini</option>
                    <option value="azure-openai">Azure OpenAI</option>
                    <option value="ollama">Ollama (Local)</option>
                  </Form.Select>
                </Form.Group>

                {(provider === 'ollama' || provider === 'azure-openai') && (
                  <Form.Group className="mb-2">
                    <Form.Label>Endpoint</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder={provider === 'ollama' ? 'http://localhost:11434' : 'https://your-resource.openai.azure.com'}
                      value={endpoint}
                      onChange={(e) => setEndpoint(e.target.value)}
                    />
                  </Form.Group>
                )}

                {provider !== 'ollama' && (
                  <Form.Group className="mb-2">
                    <Form.Label>API Key</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Enter your API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      variant="outline-secondary" 
                      className="mt-1"
                      onClick={handleSaveApiKey}
                      disabled={!apiKey}
                    >
                      Save API Key
                    </Button>
                  </Form.Group>
                )}

                {connectionStatus !== 'unknown' && (
                  <Alert variant={connectionStatus === 'connected' ? 'success' : 'warning'} className="mt-2 mb-0">
                    {connectionStatus === 'connected' 
                      ? '✓ Connected to AI provider' 
                      : '⚠ Unable to connect to AI provider. Please check your configuration.'}
                  </Alert>
                )}
              </Alert>
            </Col>
          </Row>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="warning" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <textarea
          placeholder="Paste your Playwright test code here"
          value={playwrightCode}
          onChange={(e) => setPlaywrightCode(e.target.value)}
          rows={10}
          style={{width: '100%', marginBottom: '10px', fontFamily: 'monospace'}}
        />

        <Button onClick={handleFillOutSampleCode} style={{marginRight: '10px'}}>
          Example Playwright Tests code
        </Button>
        <Button 
          onClick={handleConversion} 
          style={{marginRight: '10px'}} 
          disabled={playwrightCode === "" || loading || loadingModels || (conversionMethod === 'ai' && connectionStatus === 'disconnected')}
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Converting...
            </>
          ) : loadingModels ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Loading models...
            </>
          ) : (
            'Convert'
          )}
        </Button>
        <Button onClick={handleClearInput} style={{marginRight: '10px'}} disabled={playwrightCode === "" || loading}>
          Clear
        </Button>

        <div style={{width: '100%', marginTop: '10px'}}>
          <SyntaxHighlighter language="typescript" style={docco} wrapLongLines>
            {codeceptjsCode || "Converted CodeceptJS test code will appear here"}
          </SyntaxHighlighter>
        </div>
        <CopyWithToast text={codeceptjsCode}></CopyWithToast>
      </div>
    </Container>
  );
};

export default TestConverter;
