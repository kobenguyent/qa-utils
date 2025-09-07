// Browser-compatible workflow generator
// Templates for popular CI/CD platforms

export interface WorkflowConfig {
  pipelineType: string;
  testType: string;
  testRunner?: string;
  nodeVersion: string;
  runTestCommand: string;
  dronePipelineType?: string;
  npmPublish: boolean;
  customFileName?: string;
}

export interface GeneratedFile {
  name: string;
  content: string;
  description: string;
  path: string;
}

export interface GeneratedWorkflow {
  pipelineType: string;
  testType: string;
  files: GeneratedFile[];
}

export interface AvailableTemplates {
  pipelineTypes: Array<{value: string, label: string, icon: string}>;
  testTypes: Array<{value: string, label: string, description: string}>;
  testRunners: Array<{value: string, label: string, frameworks: string[]}>;
  nodeVersions: string[];
  dronePipelineTypes: string[];
}

// Available templates and configurations
export function getAvailableTemplates(): AvailableTemplates {
  return {
    pipelineTypes: [
      { value: 'github', label: 'GitHub Actions', icon: '🐙' },
      { value: 'gitlab', label: 'GitLab CI', icon: '🦊' },
      { value: 'azure', label: 'Azure DevOps', icon: '☁️' },
      { value: 'jenkins', label: 'Jenkins', icon: '🤖' },
      { value: 'bitbucket', label: 'Bitbucket Pipelines', icon: '🪣' }
    ],
    testTypes: [
      { 
        value: 'api', 
        label: 'API Testing', 
        description: 'REST API testing with tools like Jest, Mocha, or Supertest' 
      },
      { 
        value: 'e2e', 
        label: 'E2E Testing', 
        description: 'End-to-end browser testing with Playwright, Puppeteer, or WebDriverIO' 
      }
    ],
    testRunners: [
      { 
        value: 'playwright', 
        label: 'Playwright', 
        frameworks: ['@playwright/test', 'Cross-browser testing', 'Mobile testing'] 
      },
      { 
        value: 'puppeteer', 
        label: 'Puppeteer', 
        frameworks: ['Jest + Puppeteer', 'Chrome automation', 'PDF generation'] 
      },
      { 
        value: 'webdriverio', 
        label: 'WebDriverIO', 
        frameworks: ['WebDriverIO', 'Appium integration', 'Multi-browser'] 
      },
      { 
        value: 'cypress', 
        label: 'Cypress', 
        frameworks: ['Cypress', 'Real-time reloads', 'Time travel debugging'] 
      }
    ],
    nodeVersions: ['16', '18', '20', '21'],
    dronePipelineTypes: ['docker', 'kubernetes']
  };
}

// Validation function
export function validateConfiguration(config: WorkflowConfig): WorkflowConfig {
  const templates = getAvailableTemplates();
  
  if (!config.pipelineType) {
    throw new Error('Pipeline type is required');
  }
  
  if (!templates.pipelineTypes.find(p => p.value === config.pipelineType)) {
    throw new Error(`Unsupported pipeline type: ${config.pipelineType}`);
  }
  
  if (!config.testType) {
    throw new Error('Test type is required');
  }
  
  if (!templates.testTypes.find(t => t.value === config.testType)) {
    throw new Error(`Unsupported test type: ${config.testType}`);
  }
  
  if (config.testType === 'e2e' && !config.testRunner) {
    throw new Error('Test runner is required for E2E tests');
  }
  
  if (config.testType === 'e2e' && !templates.testRunners.find(r => r.value === config.testRunner)) {
    throw new Error(`Unsupported test runner: ${config.testRunner}`);
  }
  
  if (!config.nodeVersion) {
    throw new Error('Node.js version is required');
  }
  
  if (!templates.nodeVersions.includes(config.nodeVersion)) {
    throw new Error(`Unsupported Node.js version: ${config.nodeVersion}`);
  }
  
  if (!config.runTestCommand || config.runTestCommand.trim().length === 0) {
    throw new Error('Test command is required');
  }
  
  return config;
}

// Template generation functions
const generateGitHubWorkflow = (config: WorkflowConfig): GeneratedFile[] => {
  const files: GeneratedFile[] = [];
  
  // Main workflow file
  const workflowContent = `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [${config.nodeVersion}]

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint || echo "No lint script found"

    - name: Run tests
      run: ${config.runTestCommand}
${config.testType === 'e2e' ? `
    - name: Upload test results
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: test-results
        path: test-results/
        retention-days: 30` : ''}
${config.testType === 'e2e' && config.testRunner === 'playwright' ? `
    - name: Upload Playwright Report
      uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30` : ''}

    - name: Upload coverage reports
      uses: codecov/codecov-action@v4
      if: always()
      with:
        file: ./coverage/lcov.info
        fail_ci_if_error: false
`;

  files.push({
    name: config.customFileName || 'ci.yml',
    content: workflowContent,
    description: 'Main CI workflow for GitHub Actions',
    path: '.github/workflows/'
  });

  // NPM publish workflow (optional)
  if (config.npmPublish) {
    const publishContent = `name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${config.nodeVersion}
        registry-url: 'https://registry.npmjs.org'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: ${config.runTestCommand}

    - name: Build package
      run: npm run build || echo "No build script found"

    - name: Publish to NPM
      run: npm publish
      env:
        NODE_AUTH_TOKEN: \${{ secrets.NPM_TOKEN }}
`;

    files.push({
      name: 'npm-publish.yml',
      content: publishContent,
      description: 'NPM package publishing workflow',
      path: '.github/workflows/'
    });
  }

  return files;
};

const generateGitLabWorkflow = (config: WorkflowConfig): GeneratedFile[] => {
  const content = `image: node:${config.nodeVersion}

stages:
  - install
  - test
  - build

cache:
  paths:
    - node_modules/

install_dependencies:
  stage: install
  script:
    - npm ci
  artifacts:
    paths:
      - node_modules/
    expire_in: 1 hour

run_tests:
  stage: test
  script:
    - npm run lint || echo "No lint script found"
    - ${config.runTestCommand}
${config.testType === 'e2e' ? `  artifacts:
    when: on_failure
    paths:
      - test-results/
      - screenshots/
    expire_in: 1 week` : ''}
  coverage: '/Lines\\s*:\\s*(\\d+\\.?\\d*)%/'

build_project:
  stage: build
  script:
    - npm run build || echo "No build script found"
  artifacts:
    paths:
      - dist/
      - build/
    expire_in: 1 week
  only:
    - main
    - develop
`;

  return [{
    name: '.gitlab-ci.yml',
    content,
    description: 'GitLab CI/CD pipeline configuration',
    path: 'Root directory'
  }];
};

const generateAzureWorkflow = (config: WorkflowConfig): GeneratedFile[] => {
  const content = `trigger:
- main
- develop

pool:
  vmImage: 'ubuntu-latest'

variables:
  nodeVersion: '${config.nodeVersion}'

stages:
- stage: Test
  displayName: 'Test Stage'
  jobs:
  - job: Test
    displayName: 'Run Tests'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '` + `$(nodeVersion)` + `'
      displayName: 'Install Node.js'

    - script: |
        npm ci
      displayName: 'Install dependencies'

    - script: |
        npm run lint || echo "No lint script found"
      displayName: 'Run linter'

    - script: |
        ${config.runTestCommand}
      displayName: 'Run tests'

${config.testType === 'e2e' ? `    - task: PublishTestResults@2
      condition: succeededOrFailed()
      inputs:
        testResultsFiles: '**/test-results.xml'
        testRunTitle: 'Test Results'

    - task: PublishCodeCoverageResults@1
      condition: succeededOrFailed()
      inputs:
        codeCoverageTool: 'Cobertura'
        summaryFileLocation: '**/coverage/cobertura-coverage.xml'` : ''}

- stage: Build
  displayName: 'Build Stage'
  condition: and(succeeded(), in(variables['Build.SourceBranch'], 'refs/heads/main', 'refs/heads/develop'))
  jobs:
  - job: Build
    displayName: 'Build Application'
    steps:
    - task: NodeTool@0
      inputs:
        versionSpec: '` + `$(nodeVersion)` + `'
      displayName: 'Install Node.js'

    - script: |
        npm ci
      displayName: 'Install dependencies'

    - script: |
        npm run build || echo "No build script found"
      displayName: 'Build application'

    - task: PublishBuildArtifacts@1
      inputs:
        pathToPublish: 'dist'
        artifactName: 'build-artifacts'
`;

  return [{
    name: 'azure-pipelines.yml',
    content,
    description: 'Azure DevOps pipeline configuration',
    path: 'Root directory'
  }];
};

const generateJenkinsWorkflow = (config: WorkflowConfig): GeneratedFile[] => {
  const envVar = '${env.JOB_NAME}';
  const buildNumVar = '${env.BUILD_NUMBER}';
  const buildUrlVar = '${env.BUILD_URL}';
  const emailVar = '${env.CHANGE_AUTHOR_EMAIL}';
  
  const content = `pipeline {
    agent any

    tools {
        nodejs "${config.nodeVersion}"
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                script {
                    try {
                        sh 'npm run lint'
                    } catch (Exception e) {
                        echo 'No lint script found or linting failed'
                    }
                }
            }
        }

        stage('Test') {
            steps {
                sh '${config.runTestCommand}'
            }
            post {
                always {
                    // Publish test results if they exist
                    script {
                        try {
                            publishHTML([
                                allowMissing: false,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'coverage',
                                reportFiles: 'index.html',
                                reportName: 'Coverage Report'
                            ])
                        } catch (Exception e) {
                            echo 'No coverage report found'
                        }
                    }
${config.testType === 'e2e' ? `                    // Archive test artifacts
                    archiveArtifacts artifacts: 'test-results/**/*', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'screenshots/**/*', allowEmptyArchive: true` : ''}
                }
            }
        }

        stage('Build') {
            when {
                anyOf {
                    branch 'main'
                    branch 'develop'
                }
            }
            steps {
                script {
                    try {
                        sh 'npm run build'
                    } catch (Exception e) {
                        echo 'No build script found'
                    }
                }
            }
            post {
                success {
                    archiveArtifacts artifacts: 'dist/**/*', allowEmptyArchive: true
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
        failure {
            emailext (
                subject: "Build Failed: ${envVar} - ${buildNumVar}",
                body: "Build failed. Please check the console output at ${buildUrlVar}",
                to: "${emailVar}"
            )
        }
    }
}`;

  return [{
    name: 'Jenkinsfile',
    content,
    description: 'Jenkins pipeline configuration',
    path: 'Root directory'
  }];
};

const generateBitbucketWorkflow = (config: WorkflowConfig): GeneratedFile[] => {
  const content = `image: node:${config.nodeVersion}

pipelines:
  default:
    - step:
        name: Test and Build
        caches:
          - node
        script:
          - npm ci
          - npm run lint || echo "No lint script found"
          - ${config.runTestCommand}
          - npm run build || echo "No build script found"
${config.testType === 'e2e' ? `        artifacts:
          - test-results/**
          - screenshots/**` : ''}

  branches:
    main:
      - step:
          name: Test
          caches:
            - node
          script:
            - npm ci
            - npm run lint || echo "No lint script found"
            - ${config.runTestCommand}
${config.testType === 'e2e' ? `          artifacts:
            - test-results/**
            - screenshots/**` : ''}
      - step:
          name: Build and Deploy
          script:
            - npm run build || echo "No build script found"
          artifacts:
            - dist/**

    develop:
      - step:
          name: Test and Build
          caches:
            - node
          script:
            - npm ci
            - npm run lint || echo "No lint script found"
            - ${config.runTestCommand}
            - npm run build || echo "No build script found"
${config.testType === 'e2e' ? `          artifacts:
            - test-results/**
            - screenshots/**` : ''}

definitions:
  caches:
    node: node_modules
`;

  return [{
    name: 'bitbucket-pipelines.yml',
    content,
    description: 'Bitbucket Pipelines configuration',
    path: 'Root directory'
  }];
};

// Main generation function
export function generateWorkflowContent(config: WorkflowConfig): GeneratedWorkflow {
  const validatedConfig = validateConfiguration(config);
  
  let files: GeneratedFile[];
  
  switch (validatedConfig.pipelineType) {
    case 'github':
      files = generateGitHubWorkflow(validatedConfig);
      break;
    case 'gitlab':
      files = generateGitLabWorkflow(validatedConfig);
      break;
    case 'azure':
      files = generateAzureWorkflow(validatedConfig);
      break;
    case 'jenkins':
      files = generateJenkinsWorkflow(validatedConfig);
      break;
    case 'bitbucket':
      files = generateBitbucketWorkflow(validatedConfig);
      break;
    default:
      throw new Error(`Unsupported pipeline type: ${validatedConfig.pipelineType}`);
  }
  
  return {
    pipelineType: validatedConfig.pipelineType,
    testType: validatedConfig.testType,
    files
  };
}

// Helper function to get file placement instructions
export function getPlacementInstructions(pipelineType: string) {
  const instructions = {
    github: {
      folder: '.github/workflows/',
      description: 'Create a .github/workflows/ directory in your repository root and place the workflow files inside',
      example: 'your-repo/.github/workflows/ci.yml',
      notes: 'You can have multiple workflow files for different purposes'
    },
    gitlab: {
      folder: 'Root directory',
      description: 'Place the .gitlab-ci.yml file in the root directory of your repository',
      example: 'your-repo/.gitlab-ci.yml',
      notes: 'GitLab automatically detects and runs this file when you push changes'
    },
    azure: {
      folder: 'Root directory',
      description: 'Place the azure-pipelines.yml file in the root directory of your repository',
      example: 'your-repo/azure-pipelines.yml',
      notes: 'Configure the pipeline in Azure DevOps to use this file'
    },
    jenkins: {
      folder: 'Root directory',
      description: 'Place the Jenkinsfile in the root directory of your repository',
      example: 'your-repo/Jenkinsfile',
      notes: 'Configure your Jenkins job to use Pipeline script from SCM'
    },
    bitbucket: {
      folder: 'Root directory',
      description: 'Place the bitbucket-pipelines.yml file in the root directory of your repository',
      example: 'your-repo/bitbucket-pipelines.yml',
      notes: 'Enable Pipelines in your Bitbucket repository settings'
    }
  };
  
  return instructions[pipelineType as keyof typeof instructions] || instructions.github;
}