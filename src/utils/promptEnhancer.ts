/**
 * Prompt Enhancer Utility
 * Transform basic prompts into detailed, structured, and effective versions
 * with support for multiple output formats.
 */

export type OutputFormat = 'text' | 'json' | 'toon' | 'markdown' | 'yaml';

export type EnhancementTechnique =
    | 'addContext'
    | 'specifyRole'
    | 'clarifyOutput'
    | 'addConstraints'
    | 'includeExamples'
    | 'specifyTone';

export interface EnhancementOptions {
    techniques: EnhancementTechnique[];
    context?: string;
    role?: string;
    outputDescription?: string;
    constraints?: string[];
    examples?: string[];
    tone?: string;
}

export interface EnhancedPrompt {
    original: string;
    enhanced: string;
    format: OutputFormat;
    appliedTechniques: EnhancementTechnique[];
}

// Default enhancement templates
const ROLE_TEMPLATES: Record<string, string> = {
    expert: 'You are an expert in this field with deep knowledge and years of experience.',
    teacher: 'You are a patient and knowledgeable teacher who explains concepts clearly.',
    assistant: 'You are a helpful assistant focused on providing accurate and useful information.',
    coder: 'You are an experienced software developer with expertise in clean, efficient code.',
    writer: 'You are a skilled writer with a talent for clear, engaging communication.',
    analyst: 'You are a detail-oriented analyst who provides thorough, data-driven insights.',
};

const TONE_TEMPLATES: Record<string, string> = {
    professional: 'Use a professional and formal tone.',
    friendly: 'Use a friendly and approachable tone.',
    technical: 'Use precise technical language appropriate for experts.',
    simple: 'Use simple language that anyone can understand.',
    creative: 'Use a creative and engaging tone.',
    concise: 'Be concise and get straight to the point.',
};

/**
 * Enhance a basic prompt with selected techniques
 */
export function enhancePrompt(
    originalPrompt: string,
    options: EnhancementOptions
): EnhancedPrompt {
    const parts: string[] = [];
    const appliedTechniques: EnhancementTechnique[] = [];

    // Apply role specification
    if (options.techniques.includes('specifyRole') && options.role) {
        const roleText = ROLE_TEMPLATES[options.role] || options.role;
        parts.push(`### Role\n${roleText}`);
        appliedTechniques.push('specifyRole');
    }

    // Apply context
    if (options.techniques.includes('addContext') && options.context) {
        parts.push(`### Context\n${options.context}`);
        appliedTechniques.push('addContext');
    }

    // Main task/prompt
    parts.push(`### Task\n${originalPrompt}`);

    // Apply output clarification
    if (options.techniques.includes('clarifyOutput') && options.outputDescription) {
        parts.push(`### Expected Output\n${options.outputDescription}`);
        appliedTechniques.push('clarifyOutput');
    }

    // Apply constraints
    if (options.techniques.includes('addConstraints') && options.constraints?.length) {
        const constraintsList = options.constraints.map(c => `- ${c}`).join('\n');
        parts.push(`### Constraints\n${constraintsList}`);
        appliedTechniques.push('addConstraints');
    }

    // Apply examples
    if (options.techniques.includes('includeExamples') && options.examples?.length) {
        const examplesList = options.examples.map((e, i) => `Example ${i + 1}:\n${e}`).join('\n\n');
        parts.push(`### Examples\n${examplesList}`);
        appliedTechniques.push('includeExamples');
    }

    // Apply tone
    if (options.techniques.includes('specifyTone') && options.tone) {
        const toneText = TONE_TEMPLATES[options.tone] || options.tone;
        parts.push(`### Tone\n${toneText}`);
        appliedTechniques.push('specifyTone');
    }

    const enhanced = parts.join('\n\n');

    return {
        original: originalPrompt,
        enhanced,
        format: 'text',
        appliedTechniques,
    };
}

/**
 * Convert enhanced prompt to specified format
 */
export function formatPrompt(enhancedPrompt: EnhancedPrompt, format: OutputFormat): string {
    const { enhanced, original, appliedTechniques } = enhancedPrompt;

    switch (format) {
        case 'text':
            return enhanced;

        case 'json':
            return formatAsJSON(enhanced, original, appliedTechniques);

        case 'toon':
            return formatAsTOON(enhanced, original, appliedTechniques);

        case 'markdown':
            return formatAsMarkdown(enhanced);

        case 'yaml':
            return formatAsYAML(enhanced, original, appliedTechniques);

        default:
            return enhanced;
    }
}

/**
 * Format as JSON structure
 */
function formatAsJSON(enhanced: string, original: string, techniques: EnhancementTechnique[]): string {
    const sections = parseEnhancedSections(enhanced);

    const jsonObj: Record<string, unknown> = {
        prompt: {
            original,
            enhanced: {
                ...sections,
            },
            metadata: {
                appliedTechniques: techniques,
                timestamp: new Date().toISOString(),
            },
        },
    };

    return JSON.stringify(jsonObj, null, 2);
}

/**
 * Format as TOON (XML-like hierarchical format)
 */
function formatAsTOON(enhanced: string, original: string, techniques: EnhancementTechnique[]): string {
    const sections = parseEnhancedSections(enhanced);

    let toon = '<prompt>\n';
    toon += `  <original>${escapeXML(original)}</original>\n`;
    toon += '  <enhanced>\n';

    for (const [key, value] of Object.entries(sections)) {
        const tagName = key.toLowerCase().replace(/\s+/g, '_');
        if (Array.isArray(value)) {
            toon += `    <${tagName}>\n`;
            value.forEach(item => {
                toon += `      <item>${escapeXML(item)}</item>\n`;
            });
            toon += `    </${tagName}>\n`;
        } else {
            toon += `    <${tagName}>${escapeXML(String(value))}</${tagName}>\n`;
        }
    }

    toon += '  </enhanced>\n';
    toon += '  <metadata>\n';
    toon += `    <techniques>${techniques.join(', ')}</techniques>\n`;
    toon += `    <timestamp>${new Date().toISOString()}</timestamp>\n`;
    toon += '  </metadata>\n';
    toon += '</prompt>';

    return toon;
}

/**
 * Format as Markdown
 */
function formatAsMarkdown(enhanced: string): string {
    // Already in markdown-like format, just clean it up
    return enhanced
        .replace(/^### /gm, '## ')
        .replace(/^- /gm, '* ');
}

/**
 * Format as YAML
 */
function formatAsYAML(enhanced: string, original: string, techniques: EnhancementTechnique[]): string {
    const sections = parseEnhancedSections(enhanced);

    let yaml = 'prompt:\n';
    yaml += `  original: |\n    ${original.split('\n').join('\n    ')}\n`;
    yaml += '  enhanced:\n';

    for (const [key, value] of Object.entries(sections)) {
        const yamlKey = key.toLowerCase().replace(/\s+/g, '_');
        if (Array.isArray(value)) {
            yaml += `    ${yamlKey}:\n`;
            value.forEach(item => {
                yaml += `      - "${escapeYAML(item)}"\n`;
            });
        } else {
            const lines = String(value).split('\n');
            if (lines.length > 1) {
                yaml += `    ${yamlKey}: |\n`;
                lines.forEach(line => {
                    yaml += `      ${line}\n`;
                });
            } else {
                yaml += `    ${yamlKey}: "${escapeYAML(String(value))}"\n`;
            }
        }
    }

    yaml += '  metadata:\n';
    yaml += `    techniques:\n`;
    techniques.forEach(t => {
        yaml += `      - ${t}\n`;
    });
    yaml += `    timestamp: "${new Date().toISOString()}"\n`;

    return yaml;
}

/**
 * Parse enhanced prompt into sections
 */
function parseEnhancedSections(enhanced: string): Record<string, string | string[]> {
    const sections: Record<string, string | string[]> = {};
    const sectionRegex = /### (\w+)\n([\s\S]*?)(?=### |\s*$)/g;

    let match;
    while ((match = sectionRegex.exec(enhanced)) !== null) {
        const [, title, content] = match;
        const trimmedContent = content.trim();

        // Check if content is a list
        if (trimmedContent.startsWith('- ')) {
            sections[title] = trimmedContent
                .split('\n')
                .filter(line => line.trim().startsWith('- '))
                .map(line => line.replace(/^- /, '').trim());
        } else {
            sections[title] = trimmedContent;
        }
    }

    return sections;
}

/**
 * Escape special XML characters
 */
function escapeXML(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

/**
 * Escape special YAML characters
 */
function escapeYAML(str: string): string {
    return str
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n');
}

/**
 * Get available roles
 */
export function getAvailableRoles(): { id: string; label: string; description: string }[] {
    return [
        { id: 'expert', label: 'Expert', description: 'Deep knowledge and experience in the field' },
        { id: 'teacher', label: 'Teacher', description: 'Patient and clear explanations' },
        { id: 'assistant', label: 'Assistant', description: 'Helpful and accurate responses' },
        { id: 'coder', label: 'Developer', description: 'Clean, efficient code solutions' },
        { id: 'writer', label: 'Writer', description: 'Clear, engaging communication' },
        { id: 'analyst', label: 'Analyst', description: 'Thorough, data-driven insights' },
    ];
}

/**
 * Get available tones
 */
export function getAvailableTones(): { id: string; label: string }[] {
    return [
        { id: 'professional', label: 'Professional' },
        { id: 'friendly', label: 'Friendly' },
        { id: 'technical', label: 'Technical' },
        { id: 'simple', label: 'Simple' },
        { id: 'creative', label: 'Creative' },
        { id: 'concise', label: 'Concise' },
    ];
}

/**
 * Get enhancement technique descriptions
 */
export function getEnhancementTechniques(): { id: EnhancementTechnique; label: string; description: string }[] {
    return [
        { id: 'specifyRole', label: 'Specify Role', description: 'Define AI persona for better responses' },
        { id: 'addContext', label: 'Add Context', description: 'Provide background information' },
        { id: 'clarifyOutput', label: 'Clarify Output', description: 'Describe expected output format' },
        { id: 'addConstraints', label: 'Add Constraints', description: 'Set limitations and boundaries' },
        { id: 'includeExamples', label: 'Include Examples', description: 'Add sample inputs/outputs' },
        { id: 'specifyTone', label: 'Specify Tone', description: 'Define communication style' },
    ];
}
