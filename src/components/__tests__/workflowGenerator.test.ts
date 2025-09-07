/**
 * @vitest-environment jsdom
 */

import { describe, it, expect } from 'vitest';
import { 
  getAvailableTemplates, 
  generateWorkflowContent, 
  validateConfiguration,
  getPlacementInstructions,
  type WorkflowConfig 
} from '../../utils/workflowGenerator';

describe('Workflow Generator', () => {
  describe('getAvailableTemplates', () => {
    it('should return all supported pipeline types', () => {
      const templates = getAvailableTemplates();
      
      expect(templates.pipelineTypes).toHaveLength(5);
      expect(templates.pipelineTypes.map(p => p.value)).toEqual([
        'github', 'gitlab', 'azure', 'jenkins', 'bitbucket'
      ]);
      
      // Check that each pipeline type has required properties
      templates.pipelineTypes.forEach(type => {
        expect(type).toHaveProperty('value');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('icon');
      });
    });

    it('should return supported test types', () => {
      const templates = getAvailableTemplates();
      
      expect(templates.testTypes).toHaveLength(2);
      expect(templates.testTypes.map(t => t.value)).toEqual(['api', 'e2e']);
      
      // Check that each test type has required properties
      templates.testTypes.forEach(type => {
        expect(type).toHaveProperty('value');
        expect(type).toHaveProperty('label');
        expect(type).toHaveProperty('description');
      });
    });

    it('should return supported test runners', () => {
      const templates = getAvailableTemplates();
      
      expect(templates.testRunners.length).toBeGreaterThan(0);
      expect(templates.testRunners.map(r => r.value)).toContain('playwright');
      expect(templates.testRunners.map(r => r.value)).toContain('puppeteer');
      expect(templates.testRunners.map(r => r.value)).toContain('webdriverio');
      expect(templates.testRunners.map(r => r.value)).toContain('cypress');
    });

    it('should return supported Node.js versions', () => {
      const templates = getAvailableTemplates();
      
      expect(templates.nodeVersions).toContain('18');
      expect(templates.nodeVersions).toContain('20');
      expect(templates.nodeVersions.length).toBeGreaterThan(2);
    });
  });

  describe('validateConfiguration', () => {
    it('should validate a valid API testing configuration', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      expect(() => validateConfiguration(config)).not.toThrow();
    });

    it('should validate a valid E2E testing configuration', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'e2e',
        testRunner: 'playwright',
        nodeVersion: '18',
        runTestCommand: 'npm run test:e2e',
        npmPublish: false
      };

      expect(() => validateConfiguration(config)).not.toThrow();
    });

    it('should throw error for missing pipeline type', () => {
      const config = {
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      } as WorkflowConfig;

      expect(() => validateConfiguration(config)).toThrow('Pipeline type is required');
    });

    it('should throw error for missing test type', () => {
      const config = {
        pipelineType: 'github',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      } as WorkflowConfig;

      expect(() => validateConfiguration(config)).toThrow('Test type is required');
    });

    it('should throw error for E2E tests without test runner', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'e2e',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      expect(() => validateConfiguration(config)).toThrow('Test runner is required for E2E tests');
    });

    it('should throw error for unsupported pipeline type', () => {
      const config: WorkflowConfig = {
        pipelineType: 'unsupported',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      expect(() => validateConfiguration(config)).toThrow('Unsupported pipeline type: unsupported');
    });

    it('should throw error for unsupported Node.js version', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'api',
        nodeVersion: '99',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      expect(() => validateConfiguration(config)).toThrow('Unsupported Node.js version: 99');
    });

    it('should throw error for empty test command', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: '',
        npmPublish: false
      };

      expect(() => validateConfiguration(config)).toThrow('Test command is required');
    });
  });

  describe('generateWorkflowContent', () => {
    it('should generate GitHub Actions workflow for API testing', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      const result = generateWorkflowContent(config);

      expect(result.pipelineType).toBe('github');
      expect(result.testType).toBe('api');
      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('ci.yml');
      expect(result.files[0].content).toContain('name: CI');
      expect(result.files[0].content).toContain('node-version: [18]');
      expect(result.files[0].content).toContain('run: npm test');
      expect(result.files[0].path).toBe('.github/workflows/');
    });

    it('should generate GitHub Actions workflow for E2E testing with Playwright', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'e2e',
        testRunner: 'playwright',
        nodeVersion: '20',
        runTestCommand: 'npm run test:e2e',
        npmPublish: false
      };

      const result = generateWorkflowContent(config);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].content).toContain('node-version: [20]');
      expect(result.files[0].content).toContain('run: npm run test:e2e');
      expect(result.files[0].content).toContain('Upload Playwright Report');
    });

    it('should generate GitHub Actions workflow with NPM publish', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: true
      };

      const result = generateWorkflowContent(config);

      expect(result.files).toHaveLength(2);
      expect(result.files[0].name).toBe('ci.yml');
      expect(result.files[1].name).toBe('npm-publish.yml');
      expect(result.files[1].content).toContain('name: Publish to NPM');
      expect(result.files[1].content).toContain('npm publish');
    });

    it('should generate GitLab CI workflow', () => {
      const config: WorkflowConfig = {
        pipelineType: 'gitlab',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      const result = generateWorkflowContent(config);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('.gitlab-ci.yml');
      expect(result.files[0].content).toContain('image: node:18');
      expect(result.files[0].content).toContain('- npm test');
      expect(result.files[0].path).toBe('Root directory');
    });

    it('should generate Azure DevOps workflow', () => {
      const config: WorkflowConfig = {
        pipelineType: 'azure',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      const result = generateWorkflowContent(config);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('azure-pipelines.yml');
      expect(result.files[0].content).toContain('nodeVersion: \'18\'');
      expect(result.files[0].content).toContain('npm test');
      expect(result.files[0].path).toBe('Root directory');
    });

    it('should generate Jenkins workflow', () => {
      const config: WorkflowConfig = {
        pipelineType: 'jenkins',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      const result = generateWorkflowContent(config);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('Jenkinsfile');
      expect(result.files[0].content).toContain('pipeline {');
      expect(result.files[0].content).toContain('nodejs "18"');
      expect(result.files[0].content).toContain('npm test');
      expect(result.files[0].path).toBe('Root directory');
    });

    it('should generate Bitbucket Pipelines workflow', () => {
      const config: WorkflowConfig = {
        pipelineType: 'bitbucket',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false
      };

      const result = generateWorkflowContent(config);

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toBe('bitbucket-pipelines.yml');
      expect(result.files[0].content).toContain('image: node:18');
      expect(result.files[0].content).toContain('- npm test');
      expect(result.files[0].path).toBe('Root directory');
    });

    it('should use custom file name when provided for GitHub', () => {
      const config: WorkflowConfig = {
        pipelineType: 'github',
        testType: 'api',
        nodeVersion: '18',
        runTestCommand: 'npm test',
        npmPublish: false,
        customFileName: 'custom-workflow.yml'
      };

      const result = generateWorkflowContent(config);

      expect(result.files[0].name).toBe('custom-workflow.yml');
    });
  });

  describe('getPlacementInstructions', () => {
    it('should return correct instructions for GitHub Actions', () => {
      const instructions = getPlacementInstructions('github');
      
      expect(instructions.folder).toBe('.github/workflows/');
      expect(instructions.example).toContain('.github/workflows/');
      expect(instructions.description).toContain('workflows');
      expect(instructions.notes).toBeDefined();
    });

    it('should return correct instructions for GitLab CI', () => {
      const instructions = getPlacementInstructions('gitlab');
      
      expect(instructions.folder).toBe('Root directory');
      expect(instructions.example).toContain('.gitlab-ci.yml');
      expect(instructions.description).toContain('root directory');
    });

    it('should return correct instructions for Jenkins', () => {
      const instructions = getPlacementInstructions('jenkins');
      
      expect(instructions.folder).toBe('Root directory');
      expect(instructions.example).toContain('Jenkinsfile');
      expect(instructions.description).toContain('Jenkinsfile');
    });

    it('should fall back to GitHub instructions for unknown platforms', () => {
      const instructions = getPlacementInstructions('unknown');
      const githubInstructions = getPlacementInstructions('github');
      
      expect(instructions).toEqual(githubInstructions);
    });
  });
});