import { readFileSync } from 'node:fs';
import type { Command } from 'commander';
import chalk from 'chalk';
import {
    buildJsonPrompt,
    parseJsonPrompt,
    extractTemplateVariables,
    validatePromptTemplate,
    type PromptProviderFormat,
} from '../lib/tools.js';
import { printError } from '../utils/output.js';

/** If the argument looks like a file path, try to read it; otherwise return as-is. */
function resolveInput(input: string): string {
    if (
        input.endsWith('.json') ||
        input.startsWith('/') ||
        input.startsWith('./') ||
        input.startsWith('../')
    ) {
        try {
            return readFileSync(input, 'utf-8');
        } catch {
            // Fall through — treat it as a raw JSON string
        }
    }
    return input;
}

/** Parse `key=value` pairs from --var options. */
function parseVarOptions(vars: string[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const v of vars) {
        const idx = v.indexOf('=');
        if (idx > 0) {
            result[v.slice(0, idx)] = v.slice(idx + 1);
        }
    }
    return result;
}

const FORMATS: PromptProviderFormat[] = ['openai', 'anthropic', 'gemini', 'generic'];

export function registerPromptCommand(program: Command): void {
    const cmd = program
        .command('prompt')
        .description('Build and manage structured JSON prompts for AI providers');

    cmd
        .command('build')
        .description('Build a JSON prompt from command-line options')
        .option('--format <format>', 'Provider format: openai | anthropic | gemini | generic', 'openai')
        .option('--model <model>', 'Model name (default depends on format)')
        .option('--temperature <number>', 'Temperature 0–2', '0.7')
        .option('--max-tokens <number>', 'Max tokens', '1024')
        .option(
            '-s, --system <content>',
            'System message content (can be used once)',
        )
        .option(
            '-u, --user <content>',
            'User message content (can be repeated)',
            (val: string, acc: string[]) => { acc.push(val); return acc; },
            [] as string[],
        )
        .option(
            '-a, --assistant <content>',
            'Assistant message content (can be repeated)',
            (val: string, acc: string[]) => { acc.push(val); return acc; },
            [] as string[],
        )
        .option(
            '--var <key=value>',
            'Template variable (repeatable)',
            (val: string, acc: string[]) => { acc.push(val); return acc; },
            [] as string[],
        )
        .action((options: {
            format: string;
            model?: string;
            temperature: string;
            maxTokens: string;
            system?: string;
            user: string[];
            assistant: string[];
            var: string[];
        }) => {
            const format = (FORMATS.includes(options.format as PromptProviderFormat)
                ? options.format
                : 'openai') as PromptProviderFormat;

            const defaultModels: Record<PromptProviderFormat, string> = {
                openai:    'gpt-4o',
                anthropic: 'claude-3-5-sonnet-20241022',
                gemini:    'gemini-1.5-flash',
                generic:   'my-model',
            };

            const model = options.model ?? defaultModels[format];
            const temperature = parseFloat(options.temperature) || 0.7;
            const maxTokens = parseInt(options.maxTokens, 10) || 1024;
            const variables = parseVarOptions(options.var ?? []);

            // Build message list: interleave system (once), then user/assistant
            // in the order they appear; we rely on commander collecting them
            const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

            if (options.system) {
                messages.push({ role: 'system', content: options.system });
            }

            // Interleave user / assistant in order
            const maxTurns = Math.max(options.user.length, options.assistant.length);
            for (let i = 0; i < maxTurns; i++) {
                if (i < options.user.length)      messages.push({ role: 'user',      content: options.user[i] });
                if (i < options.assistant.length) messages.push({ role: 'assistant', content: options.assistant[i] });
            }

            if (messages.length === 0) {
                printError('Provide at least one message with --system, --user, or --assistant');
                process.exit(1);
            }

            const template = { model, temperature, maxTokens, messages };
            const result = buildJsonPrompt(template, variables, format);

            if (!result.valid) {
                printError(result.error ?? 'Failed to build prompt');
                process.exit(1);
            }

            console.log(result.json);
        });

    cmd
        .command('parse <input>')
        .description('Parse and display a JSON prompt structure (accepts a JSON string or file path)')
        .action((input: string) => {
            const raw = resolveInput(input);
            const result = parseJsonPrompt(raw);
            if (!result.template) {
                printError(result.error ?? 'Failed to parse prompt');
                process.exit(1);
            }
            const t = result.template;
            console.log();
            console.log(`${chalk.bold.cyan('Model:       ')} ${chalk.white(t.model)}`);
            console.log(`${chalk.bold.cyan('Temperature: ')} ${chalk.white(String(t.temperature))}`);
            console.log(`${chalk.bold.cyan('Max tokens:  ')} ${chalk.white(String(t.maxTokens))}`);
            console.log(`${chalk.bold.cyan('Messages:    ')} ${chalk.white(String(t.messages.length))}`);
            console.log();
            t.messages.forEach((m, i) => {
                const roleColor = m.role === 'system'
                    ? chalk.bold.gray
                    : m.role === 'user'
                        ? chalk.bold.blue
                        : chalk.bold.green;
                console.log(`  ${chalk.dim(`${i + 1}.`)} ${roleColor(`[${m.role}]`)}  ${chalk.white(m.content.slice(0, 80))}${m.content.length > 80 ? chalk.dim('…') : ''}`);
            });

            // Show detected variables
            const allVars = new Set<string>();
            t.messages.forEach((m) => extractTemplateVariables(m.content).forEach((v) => allVars.add(v)));
            if (allVars.size > 0) {
                console.log();
                console.log(chalk.bold.yellow('  Template variables detected:'));
                allVars.forEach((v) => console.log(`    ${chalk.cyan(`{{${v}}}}`)}`));
            }
            console.log();
        });

    cmd
        .command('render <input>')
        .description('Render a JSON prompt template by substituting {{variable}} placeholders')
        .option(
            '--var <key=value>',
            'Variable substitution (repeatable)',
            (val: string, acc: string[]) => { acc.push(val); return acc; },
            [] as string[],
        )
        .option('--format <format>', 'Output provider format: openai | anthropic | gemini | generic', 'openai')
        .action((input: string, options: { var: string[]; format: string }) => {
            const raw = resolveInput(input);
            const parseResult = parseJsonPrompt(raw);
            if (!parseResult.template) {
                printError(parseResult.error ?? 'Failed to parse prompt');
                process.exit(1);
            }

            const format = (FORMATS.includes(options.format as PromptProviderFormat)
                ? options.format
                : 'openai') as PromptProviderFormat;

            const variables = parseVarOptions(options.var ?? []);
            const result = buildJsonPrompt(parseResult.template, variables, format);

            if (!result.valid) {
                printError(result.error ?? 'Failed to render prompt');
                process.exit(1);
            }

            console.log(result.json);
        });

    cmd
        .command('validate <input>')
        .description('Validate the structure of a JSON prompt')
        .action((input: string) => {
            const raw = resolveInput(input);
            const parseResult = parseJsonPrompt(raw);
            if (!parseResult.template) {
                console.log(`${chalk.red('✗')}  Parse error: ${parseResult.error ?? 'Invalid JSON'}`);
                process.exit(1);
            }
            const validation = validatePromptTemplate(parseResult.template);
            if (validation.valid) {
                console.log(`${chalk.green('✓')}  Valid JSON prompt`);
            } else {
                console.log(`${chalk.red('✗')}  Invalid JSON prompt:`);
                validation.errors.forEach((e) => console.log(`   • ${e}`));
                process.exit(1);
            }
        });
}
