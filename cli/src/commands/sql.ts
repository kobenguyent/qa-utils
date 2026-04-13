import type { Command } from 'commander';
import chalk from 'chalk';
import { generateSql, SQL_OPERATIONS, type SqlOperation } from '../lib/tools.js';
import { printError } from '../utils/output.js';

export function registerSqlCommand(program: Command): void {
  program
    .command('sql <operation>')
    .description(
      `Generate a SQL statement.\n  Operations: ${SQL_OPERATIONS.join(', ')}\n\n` +
        '  Examples:\n' +
        '    qautils sql SELECT --table users --columns id,name --where "age>18" --limit 10\n' +
        '    qautils sql INSERT --table users --columns id,name --values 1,Alice\n' +
        '    qautils sql UPDATE --table users --columns name --values Bob --where "id=1"\n' +
        '    qautils sql DELETE --table users --where "id=1"\n' +
        '    qautils sql CREATE_TABLE --table users --columns "id INTEGER PRIMARY KEY,name TEXT"',
    )
    .option('-t, --table <name>', 'table name (required)')
    .option('-c, --columns <cols>', 'comma-separated column names')
    .option('-v, --values <vals>', 'comma-separated values')
    .option('-w, --where <clause>', 'WHERE clause')
    .option('-o, --order-by <col>', 'ORDER BY column')
    .option('-l, --limit <n>', 'LIMIT row count')
    .action(
      (
        operation: string,
        options: {
          table?: string;
          columns?: string;
          values?: string;
          where?: string;
          orderBy?: string;
          limit?: string;
        },
      ) => {
        const op = operation.toUpperCase() as SqlOperation;
        if (!SQL_OPERATIONS.includes(op)) {
          printError(
            `Unknown operation "${operation}". Supported: ${SQL_OPERATIONS.join(', ')}`,
          );
          process.exit(1);
        }
        if (!options.table) {
          printError('--table <name> is required');
          process.exit(1);
        }

        const sql = generateSql({
          operation: op,
          tableName: options.table,
          columns: options.columns?.split(',').map((c) => c.trim()),
          values: options.values?.split(',').map((v) => v.trim()),
          whereClause: options.where,
          orderBy: options.orderBy,
          limit: options.limit !== undefined ? parseInt(options.limit, 10) : undefined,
        });

        console.log(chalk.yellow(sql));
      },
    );
}
