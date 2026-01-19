import { describe, it, expect } from 'vitest';
import { createGenerator, defaultConfig } from '../githubPrScriptGenerator';

describe('GitHubPrScriptGenerator', () => {
  it('should generate a valid script with basic configuration', () => {
    const generator = createGenerator();
    const config = {
      ...defaultConfig,
      repoUrl: 'https://github.com/test/repo',
      featureBranch: 'feature/test',
      prTitle: 'Test PR',
      prDescription: 'Test description',
      commitMessage: 'feat: add test feature'
    };

    const result = generator.generateScript(config);

    expect(result.errors).toHaveLength(0);
    expect(result.content).toContain('#!/bin/bash');
    expect(result.content).toContain('GitHub PR Creation Script');
    expect(result.content).toContain('feature/test');
    expect(result.content).toContain('Test PR');
    expect(result.filename).toBe('create-pr-feature/test.sh');
  });

  it('should validate required fields', () => {
    const generator = createGenerator();
    const config = { ...defaultConfig };

    const result = generator.generateScript(config);

    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors).toContain('Repository URL is required');
    expect(result.errors).toContain('Feature branch is required');
    expect(result.errors).toContain('PR title is required');
  });

  it('should handle PAT authentication', () => {
    const generator = createGenerator();
    const config = {
      ...defaultConfig,
      repoUrl: 'https://github.com/test/repo',
      featureBranch: 'feature/test',
      prTitle: 'Test PR',
      authMethod: 'pat' as const,
      patToken: 'ghp_test_token'
    };

    const result = generator.generateScript(config);

    expect(result.errors).toHaveLength(0);
    expect(result.content).toContain('export GITHUB_TOKEN="ghp_test_token"');
    expect(result.content).toContain('curl -X POST');
  });
});
