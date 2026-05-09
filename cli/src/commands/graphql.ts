/**
 * graphql command — Execute GraphQL queries and introspect schemas
 *
 * Usage:
 *   qautils graphql query <endpoint> <query>     Execute a GraphQL query/mutation
 *   qautils graphql introspect <endpoint>        Fetch and display the schema
 */

import type { Command } from 'commander';
import chalk from 'chalk';

import { printError, printTable, printRow, printOk } from '../utils/output.js';
import {
  executeGraphQL,
  introspectSchema,
  parseIntrospection,
  validateQuery,
  validateVariables,
  detectOperationType,
  buildCurlCommand,
} from '../lib/tools.js';

// ── graphql query ─────────────────────────────────────────────────────────────

function registerQuerySubcommand(graphql: Command): void {
  graphql
    .command('query <endpoint> <query>')
    .description('Execute a GraphQL query or mutation against an endpoint')
    .option('-v, --variables <json>', 'GraphQL variables as JSON string', '{}')
    .option('-H, --header <key:value...>', 'HTTP headers (repeatable: -H "Authorization: Bearer token")')
    .option('-o, --operation-name <name>', 'Operation name to execute')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
    .option('--curl', 'Print the equivalent curl command and exit')
    .option('--raw', 'Output raw JSON response only')
    .action(
      async (
        endpoint: string,
        query: string,
        options: {
          variables: string;
          header?: string[];
          operationName?: string;
          timeout: string;
          curl?: boolean;
          raw?: boolean;
        },
      ) => {
        // ── Validate inputs ──────────────────────────────────────────────────
        const queryErr = validateQuery(query);
        if (queryErr) {
          printError(queryErr);
          process.exit(1);
        }

        const varErr = validateVariables(options.variables);
        if (varErr) {
          printError(`Variables: ${varErr}`);
          process.exit(1);
        }

        // ── Parse headers ────────────────────────────────────────────────────
        const headers: Record<string, string> = {};
        if (options.header) {
          for (const h of options.header) {
            const idx = h.indexOf(':');
            if (idx === -1) {
              printError(`Invalid header format "${h}". Expected "Key: Value"`);
              process.exit(1);
            }
            headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
          }
        }

        const variables =
          options.variables && options.variables.trim() !== '{}'
            ? (JSON.parse(options.variables) as Record<string, unknown>)
            : undefined;

        const request = {
          query,
          variables,
          operationName: options.operationName,
        };

        // ── Curl mode ────────────────────────────────────────────────────────
        if (options.curl) {
          console.log(buildCurlCommand(endpoint, request, headers));
          return;
        }

        // ── Execute ──────────────────────────────────────────────────────────
        const opType = detectOperationType(query);
        console.log(
          chalk.dim(`\n  ► ${chalk.bold(opType.toUpperCase())}  ${chalk.cyan(endpoint)}\n`),
        );

        try {
          const config = {
            endpoint,
            headers,
            timeout: parseInt(options.timeout, 10),
          };

          const response = await executeGraphQL(config, request);

          if (options.raw) {
            console.log(response.raw);
            return;
          }

          // ── Summary ────────────────────────────────────────────────────────
          const statusOk = response.status >= 200 && response.status < 300;
          const hasErrors = response.errors && response.errors.length > 0;

          printTable([
            ['Status', statusOk ? chalk.green(`${response.status} ${response.statusText}`) : chalk.red(`${response.status} ${response.statusText}`)],
            ['Duration', chalk.yellow(`${response.duration}ms`)],
            ['Errors', hasErrors ? chalk.red(String(response.errors?.length ?? 0)) : chalk.green('none')],
          ]);

          // ── GraphQL errors ────────────────────────────────────────────────
          if (hasErrors) {
            console.log(`\n  ${chalk.bold.red('GraphQL Errors:')}`);
            for (const err of (response.errors ?? [])) {
              console.log(`  ${chalk.red('•')} ${err.message}`);
              if (err.locations) {
                for (const loc of err.locations) {
                  console.log(chalk.dim(`    at line ${loc.line}, column ${loc.column}`));
                }
              }
            }
          }

          // ── Data ──────────────────────────────────────────────────────────
          if (response.data !== null && response.data !== undefined) {
            console.log(`\n  ${chalk.bold.green('Response Data:')}`);
            console.log(JSON.stringify(response.data, null, 2));
          }

          console.log();
        } catch (e) {
          printError(e instanceof Error ? e.message : 'Request failed');
          process.exit(1);
        }
      },
    );
}

// ── graphql introspect ────────────────────────────────────────────────────────

function registerIntrospectSubcommand(graphql: Command): void {
  graphql
    .command('introspect <endpoint>')
    .description('Fetch and display the GraphQL schema via introspection')
    .option('-H, --header <key:value...>', 'HTTP headers (repeatable)')
    .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '30000')
    .option('--types', 'List all types in the schema')
    .option('--type <name>', 'Show details for a specific type')
    .option('--raw', 'Output raw introspection JSON')
    .action(
      async (
        endpoint: string,
        options: {
          header?: string[];
          timeout: string;
          types?: boolean;
          type?: string;
          raw?: boolean;
        },
      ) => {
        const headers: Record<string, string> = {};
        if (options.header) {
          for (const h of options.header) {
            const idx = h.indexOf(':');
            if (idx === -1) {
              printError(`Invalid header format "${h}". Expected "Key: Value"`);
              process.exit(1);
            }
            headers[h.slice(0, idx).trim()] = h.slice(idx + 1).trim();
          }
        }

        console.log(chalk.dim(`\n  ► INTROSPECT  ${chalk.cyan(endpoint)}\n`));

        try {
          const config = {
            endpoint,
            headers,
            timeout: parseInt(options.timeout, 10),
          };

          const rawResponse = await introspectSchema(config);

          if (options.raw) {
            console.log(JSON.stringify(rawResponse, null, 2));
            return;
          }

          const schema = parseIntrospection(rawResponse);

          // ── Schema overview ──────────────────────────────────────────────
          printOk('Introspection successful');
          printTable([
            ['Query type',        chalk.yellow(schema.queryType ?? chalk.dim('(none)'))],
            ['Mutation type',     chalk.yellow(schema.mutationType ?? chalk.dim('(none)'))],
            ['Subscription type', chalk.yellow(schema.subscriptionType ?? chalk.dim('(none)'))],
            ['Total types',       chalk.cyan(String(schema.types.length))],
          ]);

          if (options.types) {
            console.log(`\n  ${chalk.bold('All Types:')}`);
            for (const t of schema.types) {
              const fieldCount = t.fields?.length ?? t.inputFields?.length ?? 0;
              console.log(
                `  ${chalk.cyan(t.name.padEnd(40))} ${chalk.dim(t.kind.padEnd(12))} ${chalk.dim(fieldCount > 0 ? `${fieldCount} fields` : '')}`,
              );
            }
          }

          if (options.type) {
            const found = schema.types.find(
              (t) => t.name.toLowerCase() === (options.type ?? '').toLowerCase(),
            );
            if (!found) {
              printError(`Type "${options.type}" not found in schema`);
              process.exit(1);
            }
            console.log(`\n  ${chalk.bold.cyan(found.name)} ${chalk.dim(`(${found.kind})`)}`);
            if (found.description) {
              printRow('Description', found.description);
            }
            const fields = found.fields ?? found.inputFields ?? [];
            if (fields.length > 0) {
              console.log(`\n  ${chalk.bold('Fields:')}`);
              for (const f of fields) {
                const args = f.args?.length
                  ? chalk.dim(` (${f.args.map((a) => `${a.name}: ${a.type}`).join(', ')})`)
                  : '';
                console.log(`  ${chalk.yellow(f.name.padEnd(30))} ${chalk.cyan(f.type)}${args}`);
                if (f.description) {
                  console.log(chalk.dim(`    ${f.description}`));
                }
              }
            }
            if (found.enumValues?.length) {
              console.log(`\n  ${chalk.bold('Enum Values:')}`);
              for (const ev of found.enumValues) {
                console.log(`  ${chalk.yellow(ev.name)}`);
              }
            }
          }

          console.log();
        } catch (e) {
          printError(e instanceof Error ? e.message : 'Introspection failed');
          process.exit(1);
        }
      },
    );
}

// ── Export ────────────────────────────────────────────────────────────────────

export function registerGraphqlCommand(program: Command): void {
  const graphql = program
    .command('graphql')
    .description('Execute GraphQL queries and explore schemas via introspection');

  registerQuerySubcommand(graphql);
  registerIntrospectSubcommand(graphql);
}
