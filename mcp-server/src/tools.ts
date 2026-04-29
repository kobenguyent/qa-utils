/**
 * MCP Server Tool Implementations
 *
 * Re-exports all tools from the shared Node.js tool module so the MCP server
 * has a single, consistent set of implementations with the CLI and REST API.
 */

export {
  // Platform-agnostic
  generateLoremIpsum,
  countTextStats as countCharacters,
  validateEmail,
  formatJson,
  convertTimestamp,
  generateSql,
  convertSimpleColor as convertColor,
  sanitizeHtml,
  urlEncode,
  urlDecode,
  parseUrl,
  testRegex,
  convertBase,
  convertCase,
  CASE_TYPES,
  SQL_OPERATIONS,
  HASH_ALGORITHMS,
  NANO_ALPHABET,
  convertMarkdownToConfluence,
  // Node.js-specific
  generateUuids,
  base64Encode,
  base64Decode,
  generatePassword,
  generateHash,
  generateRandomString,
  generateNanoId,
  decodeJwt,
} from '../../src/utils/sharedToolsNode.js';

export type { SqlOperation } from '../../src/utils/sharedToolsNode.js';
