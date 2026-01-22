/**
 * Script Translator - Convert scripts between API client formats
 */

/**
 * Convert Postman script syntax to Insomnia syntax
 */
export const postmanToInsomniaScript = (script: string): string => {
  if (!script) return script;

  let converted = script;

  // Environment variables
  converted = converted.replace(/pm\.environment\.get\(['"]([^'"]+)['"]\)/g, 'insomnia.environment.get("$1")');
  converted = converted.replace(/pm\.environment\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'insomnia.environment.set("$1", $2)');
  converted = converted.replace(/pm\.environment\.unset\(['"]([^'"]+)['"]\)/g, 'insomnia.environment.unset("$1")');

  // Collection variables
  converted = converted.replace(/pm\.collectionVariables\.get\(['"]([^'"]+)['"]\)/g, 'insomnia.baseEnvironment.get("$1")');
  converted = converted.replace(/pm\.collectionVariables\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'insomnia.baseEnvironment.set("$1", $2)');

  // Global variables -> local variables (Insomnia doesn't have globals)
  converted = converted.replace(/pm\.globals\.get\(['"]([^'"]+)['"]\)/g, 'insomnia.variables.get("$1")');
  converted = converted.replace(/pm\.globals\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'insomnia.variables.set("$1", $2)');

  // Variables (generic)
  converted = converted.replace(/pm\.variables\.get\(['"]([^'"]+)['"]\)/g, 'insomnia.variables.get("$1")');
  converted = converted.replace(/pm\.variables\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'insomnia.variables.set("$1", $2)');

  // Request
  converted = converted.replace(/pm\.request\.url/g, 'insomnia.request.url');
  converted = converted.replace(/pm\.request\.method/g, 'insomnia.request.method');
  converted = converted.replace(/pm\.request\.headers/g, 'insomnia.request.headers');
  converted = converted.replace(/pm\.request\.body/g, 'insomnia.request.body');

  // Response
  converted = converted.replace(/pm\.response\.code/g, 'insomnia.response.status');
  converted = converted.replace(/pm\.response\.status/g, 'insomnia.response.statusText');
  converted = converted.replace(/pm\.response\.json\(\)/g, 'insomnia.response.json()');
  converted = converted.replace(/pm\.response\.text\(\)/g, 'insomnia.response.text()');
  converted = converted.replace(/pm\.response\.headers/g, 'insomnia.response.headers');
  converted = converted.replace(/pm\.response\.responseTime/g, 'insomnia.response.responseTime');

  // Tests
  converted = converted.replace(/pm\.test\(/g, 'insomnia.test(');
  converted = converted.replace(/pm\.expect\(/g, 'insomnia.expect(');

  // Send request
  converted = converted.replace(/pm\.sendRequest\(/g, 'insomnia.sendRequest(');

  // Console
  converted = converted.replace(/console\.log\(/g, 'console.log(');

  return converted;
};

/**
 * Convert Insomnia script syntax to Postman syntax
 */
export const insomniaToPostmanScript = (script: string): string => {
  if (!script) return script;

  let converted = script;

  // Environment variables
  converted = converted.replace(/insomnia\.environment\.get\(['"]([^'"]+)['"]\)/g, 'pm.environment.get("$1")');
  converted = converted.replace(/insomnia\.environment\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'pm.environment.set("$1", $2)');
  converted = converted.replace(/insomnia\.environment\.unset\(['"]([^'"]+)['"]\)/g, 'pm.environment.unset("$1")');

  // Base environment -> collection variables
  converted = converted.replace(/insomnia\.baseEnvironment\.get\(['"]([^'"]+)['"]\)/g, 'pm.collectionVariables.get("$1")');
  converted = converted.replace(/insomnia\.baseEnvironment\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'pm.collectionVariables.set("$1", $2)');

  // Local variables -> variables
  converted = converted.replace(/insomnia\.variables\.get\(['"]([^'"]+)['"]\)/g, 'pm.variables.get("$1")');
  converted = converted.replace(/insomnia\.variables\.set\(['"]([^'"]+)['"]\s*,\s*([^)]+)\)/g, 'pm.variables.set("$1", $2)');

  // Request
  converted = converted.replace(/insomnia\.request\.url/g, 'pm.request.url');
  converted = converted.replace(/insomnia\.request\.method/g, 'pm.request.method');
  converted = converted.replace(/insomnia\.request\.headers/g, 'pm.request.headers');
  converted = converted.replace(/insomnia\.request\.body/g, 'pm.request.body');

  // Response
  converted = converted.replace(/insomnia\.response\.status/g, 'pm.response.code');
  converted = converted.replace(/insomnia\.response\.statusText/g, 'pm.response.status');
  converted = converted.replace(/insomnia\.response\.json\(\)/g, 'pm.response.json()');
  converted = converted.replace(/insomnia\.response\.text\(\)/g, 'pm.response.text()');
  converted = converted.replace(/insomnia\.response\.headers/g, 'pm.response.headers');
  converted = converted.replace(/insomnia\.response\.responseTime/g, 'pm.response.responseTime');

  // Tests
  converted = converted.replace(/insomnia\.test\(/g, 'pm.test(');
  converted = converted.replace(/insomnia\.expect\(/g, 'pm.expect(');

  // Send request
  converted = converted.replace(/insomnia\.sendRequest\(/g, 'pm.sendRequest(');

  return converted;
};

/**
 * Convert Postman script to Thunder Client (limited support)
 */
export const postmanToThunderClientScript = (script: string): string => {
  if (!script) return script;

  // Thunder Client has very limited scripting - mostly just tests
  let converted = script;

  // Basic test conversion
  converted = converted.replace(/pm\.test\(/g, 'tc.test(');
  converted = converted.replace(/pm\.expect\(/g, 'tc.expect(');
  converted = converted.replace(/pm\.response\.json\(\)/g, 'tc.response.json');
  converted = converted.replace(/pm\.response\.code/g, 'tc.response.status');

  // Add warning comment if complex features detected
  if (script.includes('pm.sendRequest') || script.includes('pm.environment')) {
    converted = '// Warning: Thunder Client has limited script support\n// Some features may not work\n' + converted;
  }

  return converted;
};
