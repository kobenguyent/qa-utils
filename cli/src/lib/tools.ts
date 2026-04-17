/**
 * qautils-cli — Core Tool Implementations
 *
 * Re-exports all tools from the shared Node.js tool module so the CLI
 * has a single, consistent set of implementations with the API and MCP server.
 *
 * The actual implementations live in src/utils/sharedToolsNode.ts (Node.js-
 * specific) and src/utils/sharedTools.ts (platform-agnostic).
 */

export {
  // UUID
  generateUuids,
  // Base64
  base64Encode,
  base64Decode,
  // Password
  generatePassword,
  // Hash
  generateHash,
  HASH_ALGORITHMS,
  // Random string
  generateRandomString,
  // NanoID
  generateNanoId,
  // JWT
  decodeJwt,
  // Lorem ipsum
  generateLoremIpsum,
  // Text stats
  countTextStats,
  // Email
  validateEmail,
  // JSON
  formatJson,
  // Timestamp
  convertTimestamp,
  // SQL
  generateSql,
  SQL_OPERATIONS,
  // Color
  convertSimpleColor as convertColor,
  // HTML
  sanitizeHtml,
  // URL
  urlEncode,
  urlDecode,
  parseUrl,
  // Regex
  testRegex,
  // Base converter
  convertBase,
  // Case converter
  convertCase,
  CASE_TYPES,
} from '../../../src/utils/sharedToolsNode.js';

export type {
  TextStats,
  EmailValidationResult,
  JsonFormatResult,
  TimestampResult,
  SqlOperation,
  ColorResult,
  RGBColor,
  HSLColor,
  JwtDecodeResult,
  PasswordOptions,
  HashAlgorithm,
  ParsedUrl,
  UrlParseResult,
  RegexMatch,
  RegexTestResult,
  BaseConversionResult,
  CaseType,
} from '../../../src/utils/sharedToolsNode.js';
