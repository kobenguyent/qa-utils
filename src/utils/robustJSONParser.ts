/**
 * Bulletproof JSON Parser for AI Responses
 * Handles all possible malformed JSON scenarios
 */

export interface ParsedTestCase {
  id: string;
  title: string;
  category: string;
  description: string;
  steps: Array<{
    id: string;
    description: string;
    expectedResult: string;
    instructions: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
  estimatedTime: number;
}

export class RobustJSONParser {
  static parseAIResponse(response: string, category: string): ParsedTestCase[] {
    try {
      // Step 1: Extract potential JSON from response
      const jsonCandidates = this.extractJSONCandidates(response);
      
      // Step 2: Try parsing each candidate
      for (const candidate of jsonCandidates) {
        try {
          const cleaned = this.cleanJSON(candidate);
          const parsed = JSON.parse(cleaned);
          const validated = this.validateAndNormalize(parsed, category);
          if (validated.length > 0) {
            return validated;
          }
        } catch (error) {
          // Continue to next candidate
          continue;
        }
      }
      
      // Step 3: If all parsing fails, extract data manually
      return this.extractDataManually(response, category);
      
    } catch (error) {
      // Step 4: Ultimate fallback - return empty array (will trigger template fallback)
      console.error('All parsing methods failed:', error);
      return [];
    }
  }

  private static extractJSONCandidates(response: string): string[] {
    const candidates: string[] = [];
    
    // Remove markdown code blocks
    const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Pattern 1: Standard JSON array
    const arrayMatch = cleaned.match(/\[[\s\S]*?\]/g);
    if (arrayMatch) candidates.push(...arrayMatch);
    
    // Pattern 2: JSON objects (convert to array)
    const objectMatches = cleaned.match(/\{[\s\S]*?\}/g);
    if (objectMatches) {
      candidates.push(`[${objectMatches.join(',')}]`);
    }
    
    // Pattern 3: Partial JSON (try to complete)
    const partialMatch = cleaned.match(/\[[\s\S]*$/);
    if (partialMatch) {
      candidates.push(partialMatch[0] + ']');
    }
    
    return candidates;
  }

  private static cleanJSON(jsonString: string): string {
    return jsonString
      // Remove trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Add quotes to unquoted keys
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Replace single quotes with double quotes
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      // Fix unterminated strings
      .replace(/:\s*"([^"]*?)$/gm, ': "$1"')
      // Remove extra text after closing bracket
      .replace(/\][\s\S]*$/, ']')
      // Fix missing commas between objects
      .replace(/}\s*{/g, '},{')
      // Ensure proper array structure
      .trim();
  }

  private static validateAndNormalize(data: any, category: string): ParsedTestCase[] {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    return data
      .filter((item: any) => item && typeof item === 'object')
      .map((item: any, index: number): ParsedTestCase => ({
        id: this.getString(item.id) || `${category}_${index + 1}`,
        title: this.getString(item.title) || `${category} Test ${index + 1}`,
        category: category,
        description: this.getString(item.description) || `Test ${category} functionality`,
        steps: this.normalizeSteps(item.steps, category, index),
        estimatedTime: this.getNumber(item.estimatedTime) || 5
      }));
  }

  private static normalizeSteps(steps: any, category: string, testIndex: number): ParsedTestCase['steps'] {
    if (!Array.isArray(steps)) {
      steps = steps ? [steps] : [];
    }
    
    if (steps.length === 0) {
      // Create default step
      return [{
        id: `${category}_${testIndex}_step_1`,
        description: `Perform ${category} testing`,
        expectedResult: `${category} functionality works correctly`,
        instructions: ['Navigate to the website', `Test ${category} aspects`, 'Verify results'],
        priority: 'medium' as const
      }];
    }
    
    return steps.map((step: any, stepIndex: number) => ({
      id: this.getString(step.id) || `${category}_${testIndex}_step_${stepIndex + 1}`,
      description: this.getString(step.description) || `Test step ${stepIndex + 1}`,
      expectedResult: this.getString(step.expectedResult) || 'Expected result',
      instructions: this.getStringArray(step.instructions) || ['Perform test action'],
      priority: this.getPriority(step.priority)
    }));
  }

  private static extractDataManually(response: string, category: string): ParsedTestCase[] {
    // Manual extraction when JSON parsing completely fails
    const lines = response.split('\n').map(line => line.trim()).filter(line => line);
    
    const testCase: ParsedTestCase = {
      id: `${category}_manual_${Date.now()}`,
      title: `AI-Generated ${category} Test`,
      category: category,
      description: `Manually extracted ${category} test case`,
      steps: [{
        id: `${category}_manual_step_1`,
        description: `Test ${category} functionality`,
        expectedResult: `${category} works as expected`,
        instructions: lines.slice(0, 3).length > 0 ? lines.slice(0, 3) : ['Perform manual test'],
        priority: 'medium' as const
      }],
      estimatedTime: 5
    };
    
    return [testCase];
  }

  // Helper methods for safe data extraction
  private static getString(value: any): string | null {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return value.toString();
    return null;
  }

  private static getNumber(value: any): number | null {
    if (typeof value === 'number' && !isNaN(value)) return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  }

  private static getStringArray(value: any): string[] | null {
    if (Array.isArray(value)) {
      const strings = value.filter(item => typeof item === 'string' && item.trim());
      return strings.length > 0 ? strings : null;
    }
    if (typeof value === 'string' && value.trim()) {
      return [value.trim()];
    }
    return null;
  }

  private static getPriority(value: any): 'high' | 'medium' | 'low' {
    if (typeof value === 'string') {
      const lower = value.toLowerCase();
      if (['high', 'critical', 'important'].includes(lower)) return 'high';
      if (['low', 'minor', 'optional'].includes(lower)) return 'low';
    }
    return 'medium';
  }
}
