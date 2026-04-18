import React, { useState } from 'react';
import { Container } from 'react-bootstrap';
import CopyWithToast from '../CopyWithToast';

// ─── Framework data ───────────────────────────────────────────────────────────

interface Command {
  command: string;
  usage: string;
}

interface Framework {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  commands: Command[];
}

const FRAMEWORKS: Framework[] = [
  {
    id: 'codeceptjs',
    name: 'CodeceptJS',
    icon: '🧪',
    color: '#7c3aed',
    description: 'BDD-style end-to-end testing framework for Node.js',
    commands: [
      { command: 'npx codeceptjs run --grep "CI"', usage: 'Run tests matching a tag/grep pattern' },
      { command: 'npx codeceptjs run-workers 2', usage: 'Run tests in parallel with 2 workers' },
      { command: 'npx codeceptjs run --verbose', usage: 'Run tests with verbose output' },
      { command: 'npx codeceptjs run --steps', usage: 'Show step-by-step execution' },
      { command: 'npx codeceptjs run --debug', usage: 'Run in debug mode with pauses' },
      { command: 'npx codeceptjs run tests/login_test.js', usage: 'Run a specific test file' },
      { command: "npx codeceptjs run --override '{\"helpers\":{\"Playwright\":{\"show\":true}}}'", usage: 'Run with browser visible' },
      { command: 'npx codeceptjs generate:test', usage: 'Generate a new test file interactively' },
      { command: 'npx codeceptjs generate:pageobject', usage: 'Generate a new Page Object' },
      { command: 'npx codeceptjs generate:helper', usage: 'Generate a custom helper' },
      { command: 'npx codeceptjs shell', usage: 'Open interactive shell to test commands' },
      { command: 'npx codeceptjs dry-run', usage: 'List all tests without executing them' },
      { command: 'npx codeceptjs def', usage: 'Generate TypeScript definitions for steps' },
    ],
  },
  {
    id: 'playwright',
    name: 'Playwright',
    icon: '🎭',
    color: '#2d7d46',
    description: 'Modern end-to-end testing framework by Microsoft',
    commands: [
      { command: 'npx playwright test', usage: 'Run all tests' },
      { command: 'npx playwright test --headed', usage: 'Run with browser UI visible' },
      { command: 'npx playwright test --ui', usage: 'Open interactive UI mode' },
      { command: 'npx playwright test --debug', usage: 'Run in debug mode with Inspector' },
      { command: 'npx playwright test tests/login.spec.ts', usage: 'Run a specific test file' },
      { command: 'npx playwright test -g "login"', usage: 'Run tests matching a pattern' },
      { command: 'npx playwright test --project=chromium', usage: 'Run tests in a specific browser' },
      { command: 'npx playwright test --workers=4', usage: 'Run with 4 parallel workers' },
      { command: 'npx playwright test --retries=2', usage: 'Retry failed tests up to 2 times' },
      { command: 'npx playwright test --reporter=html', usage: 'Generate HTML report' },
      { command: 'npx playwright show-report', usage: 'Open the last HTML report' },
      { command: 'npx playwright codegen https://example.com', usage: 'Record actions and generate code' },
      { command: 'npx playwright install', usage: 'Install all browser binaries' },
      { command: 'npx playwright test --trace on', usage: 'Capture trace for debugging' },
      { command: 'npx playwright show-trace trace.zip', usage: 'View a captured trace file' },
      { command: 'npx playwright test --shard=1/3', usage: 'Shard tests across CI machines' },
      { command: 'npx playwright test --last-failed', usage: 'Re-run only previously failed tests' },
      { command: 'npx playwright test --update-snapshots', usage: 'Update visual comparison baselines' },
    ],
  },
  {
    id: 'pytest',
    name: 'Pytest',
    icon: '🐍',
    color: '#3776ab',
    description: "Python's most popular testing framework",
    commands: [
      { command: 'pytest', usage: 'Run all tests in current directory' },
      { command: 'pytest tests/test_login.py', usage: 'Run a specific test file' },
      { command: 'pytest -k "login"', usage: 'Run tests matching a keyword expression' },
      { command: 'pytest -m smoke', usage: 'Run tests with a specific marker' },
      { command: 'pytest -v', usage: 'Verbose output with test names' },
      { command: 'pytest -s', usage: 'Show stdout/print statements' },
      { command: 'pytest -x', usage: 'Stop on first failure' },
      { command: 'pytest --maxfail=3', usage: 'Stop after 3 failures' },
      { command: 'pytest -n auto', usage: 'Run tests in parallel (pytest-xdist)' },
      { command: 'pytest --lf', usage: 'Re-run only last failed tests' },
      { command: 'pytest --ff', usage: 'Run failed tests first, then the rest' },
      { command: 'pytest --co', usage: 'Collect and list tests without running' },
      { command: 'pytest --html=report.html', usage: 'Generate HTML report (pytest-html)' },
      { command: 'pytest --cov=src --cov-report=html', usage: 'Run with coverage report' },
      { command: 'pytest --tb=short', usage: 'Use short traceback format' },
      { command: 'pytest --durations=10', usage: 'Show 10 slowest tests' },
      { command: 'pytest -p no:warnings', usage: 'Suppress all warnings' },
      { command: 'pytest --fixtures', usage: 'List all available fixtures' },
    ],
  },
  {
    id: 'cypress',
    name: 'Cypress',
    icon: '🌲',
    color: '#04c38e',
    description: 'JavaScript end-to-end testing with time-travel debugging',
    commands: [
      { command: 'npx cypress open', usage: 'Open Cypress Test Runner UI' },
      { command: 'npx cypress run', usage: 'Run all tests headlessly' },
      { command: 'npx cypress run --spec "cypress/e2e/login.cy.ts"', usage: 'Run a specific spec file' },
      { command: 'npx cypress run --browser chrome', usage: 'Run in a specific browser' },
      { command: 'npx cypress run --headed', usage: 'Run with browser visible' },
      { command: 'npx cypress run --record --key <key>', usage: 'Record results to Cypress Cloud' },
      { command: 'npx cypress run --env host=staging', usage: 'Pass environment variables' },
      { command: 'npx cypress run --config viewportWidth=375,viewportHeight=667', usage: 'Override config values' },
      { command: 'npx cypress run --reporter mochawesome', usage: 'Use a custom reporter' },
      { command: 'npx cypress run --tag "smoke"', usage: 'Tag the run for filtering in Cloud' },
      { command: 'npx cypress run --parallel --record', usage: 'Parallelize across CI machines' },
      { command: 'npx cypress verify', usage: 'Verify Cypress is installed correctly' },
      { command: 'npx cypress info', usage: 'Show system info and config paths' },
      { command: 'npx cypress run --component', usage: 'Run component tests' },
    ],
  },
  {
    id: 'jest',
    name: 'Jest',
    icon: '🃏',
    color: '#c21325',
    description: 'Delightful JavaScript unit testing framework by Meta',
    commands: [
      { command: 'npx jest', usage: 'Run all tests' },
      { command: 'npx jest --watch', usage: 'Run in watch mode (re-run on changes)' },
      { command: 'npx jest --watchAll', usage: 'Watch all files, not just changed' },
      { command: 'npx jest tests/utils.test.ts', usage: 'Run a specific test file' },
      { command: 'npx jest -t "should validate"', usage: 'Run tests matching a name pattern' },
      { command: 'npx jest --coverage', usage: 'Generate code coverage report' },
      { command: 'npx jest --verbose', usage: 'Show individual test results' },
      { command: 'npx jest --bail', usage: 'Stop after first failure' },
      { command: 'npx jest --maxWorkers=50%', usage: 'Limit parallel workers' },
      { command: 'npx jest --onlyChanged', usage: 'Run tests related to changed files' },
      { command: 'npx jest --clearCache', usage: 'Clear the Jest cache' },
      { command: 'npx jest --listTests', usage: 'List all test files without running' },
      { command: 'npx jest --updateSnapshot', usage: 'Update snapshot baselines' },
      { command: "npx jest --detectOpenHandles", usage: "Debug tests that won't exit" },
    ],
  },
  {
    id: 'vitest',
    name: 'Vitest',
    icon: '⚡',
    color: '#729b1b',
    description: 'Blazing fast Vite-native unit test framework',
    commands: [
      { command: 'npx vitest', usage: 'Run tests in watch mode' },
      { command: 'npx vitest run', usage: 'Run all tests once and exit' },
      { command: 'npx vitest --ui', usage: 'Open interactive web UI' },
      { command: 'npx vitest run tests/utils.test.ts', usage: 'Run a specific test file' },
      { command: 'npx vitest -t "validate"', usage: 'Run tests matching a name pattern' },
      { command: 'npx vitest --coverage', usage: 'Generate coverage report' },
      { command: 'npx vitest --reporter=html', usage: 'Generate HTML report' },
      { command: 'npx vitest --bail 1', usage: 'Stop after first failure' },
      { command: 'npx vitest --pool=threads', usage: 'Use thread pool for isolation' },
      { command: 'npx vitest bench', usage: 'Run benchmark tests' },
      { command: 'npx vitest typecheck', usage: 'Run type checking tests' },
      { command: 'npx vitest --update', usage: 'Update snapshot baselines' },
      { command: 'npx vitest list', usage: 'List all test files' },
    ],
  },
  {
    id: 'selenium',
    name: 'Selenium',
    icon: '🌐',
    color: '#43b02a',
    description: 'Browser automation and testing across multiple languages',
    commands: [
      { command: 'mvn test -Dtest=LoginTest', usage: 'Run specific Java Selenium test (Maven)' },
      { command: 'mvn test -Dgroups=smoke', usage: 'Run tests by group/tag (TestNG)' },
      { command: 'mvn test -pl module-name', usage: 'Run tests in a specific module' },
      { command: 'mvn surefire-report:report', usage: 'Generate Surefire HTML report' },
      { command: 'gradle test --tests "LoginTest"', usage: 'Run specific test (Gradle)' },
      { command: 'pytest tests/ --driver Chrome', usage: 'Run Selenium Python tests with Chrome' },
      { command: 'dotnet test --filter "Category=Smoke"', usage: 'Run C# Selenium tests by category' },
      { command: 'selenium-side-runner project.side', usage: 'Run Selenium IDE exported project' },
      { command: 'java -jar selenium-server.jar standalone', usage: 'Start Selenium Grid standalone' },
      { command: 'java -jar selenium-server.jar hub', usage: 'Start Selenium Grid hub' },
      { command: 'java -jar selenium-server.jar node', usage: 'Start Selenium Grid node' },
    ],
  },
  {
    id: 'robot',
    name: 'Robot Framework',
    icon: '🤖',
    color: '#00b0d8',
    description: 'Keyword-driven test automation framework for Python',
    commands: [
      { command: 'robot tests/', usage: 'Run all tests in a directory' },
      { command: 'robot tests/login.robot', usage: 'Run a specific test file' },
      { command: 'robot --include smoke tests/', usage: 'Run tests with a specific tag' },
      { command: 'robot --exclude wip tests/', usage: 'Exclude tests with a tag' },
      { command: 'robot --test "Login Test" tests/', usage: 'Run a test by name' },
      { command: 'robot --variable BROWSER:firefox tests/', usage: 'Pass variables from command line' },
      { command: 'robot --outputdir results tests/', usage: 'Specify output directory' },
      { command: 'robot --loglevel DEBUG tests/', usage: 'Set log level to DEBUG' },
      { command: 'robot --dryrun tests/', usage: 'Verify test data without executing' },
      { command: 'rebot --merge output1.xml output2.xml', usage: 'Merge results from parallel runs' },
      { command: 'robot --listener allure_robotframework tests/', usage: 'Run with Allure reporting' },
      { command: 'robot --rerunfailed output.xml tests/', usage: 'Re-run only failed tests' },
    ],
  },
  {
    id: 'k6',
    name: 'k6',
    icon: '📊',
    color: '#7d64ff',
    description: 'Modern load testing tool for performance testing',
    commands: [
      { command: 'k6 run script.js', usage: 'Run a load test script' },
      { command: 'k6 run --vus 10 --duration 30s script.js', usage: 'Run with 10 virtual users for 30s' },
      { command: 'k6 run --out json=results.json script.js', usage: 'Export results to JSON' },
      { command: 'k6 run --out influxdb=http://localhost:8086/k6 script.js', usage: 'Stream results to InfluxDB' },
      { command: 'k6 run --env BASE_URL=https://staging.example.com script.js', usage: 'Pass environment variables' },
      { command: 'k6 run --http-debug script.js', usage: 'Show HTTP request/response details' },
      { command: 'k6 run --iterations 100 script.js', usage: 'Run a fixed number of iterations' },
      { command: 'k6 run --config options.json script.js', usage: 'Use external config file' },
      { command: 'k6 inspect script.js', usage: 'Show test script options without running' },
      { command: 'k6 cloud script.js', usage: 'Run on Grafana k6 Cloud' },
    ],
  },
  {
    id: 'postman',
    name: 'Newman / Postman',
    icon: '📮',
    color: '#ff6c37',
    description: 'Run Postman collections from the command line with Newman',
    commands: [
      { command: 'newman run collection.json', usage: 'Run a Postman collection' },
      { command: 'newman run collection.json -e env.json', usage: 'Run with an environment file' },
      { command: 'newman run collection.json -d data.csv', usage: 'Run with data-driven iterations' },
      { command: 'newman run collection.json --delay-request 500', usage: 'Add delay between requests' },
      { command: 'newman run collection.json -r htmlextra', usage: 'Generate HTML report' },
      { command: 'newman run collection.json --bail', usage: 'Stop on first failure' },
      { command: 'newman run collection.json -n 5', usage: 'Run collection 5 times' },
      { command: 'newman run collection.json --timeout-request 10000', usage: 'Set request timeout (ms)' },
      { command: 'newman run collection.json --folder "Auth"', usage: 'Run only a specific folder' },
      { command: 'newman run collection.json --global-var "token=abc"', usage: 'Set global variables' },
    ],
  },
];

const codeStyle: React.CSSProperties = {
  background: 'var(--code-bg)',
  borderRadius: '6px',
  padding: '0.4rem 0.65rem',
  fontFamily: 'var(--font-mono)',
  fontSize: '0.78rem',
  color: 'var(--text)',
  display: 'inline-block',
  wordBreak: 'break-all',
};

export const CodeceptJS = () => {
  const [activeId, setActiveId] = useState('codeceptjs');
  const [search, setSearch] = useState('');

  const active = FRAMEWORKS.find(f => f.id === activeId) ?? FRAMEWORKS[0];

  const filtered = active.commands.filter(c =>
    !search || c.command.toLowerCase().includes(search.toLowerCase()) || c.usage.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container className="py-4">
      {/* Header */}
      <div className="tool-header">
        <div className="tool-header-icon">🧪</div>
        <div className="tool-header-content">
          <h1 className="tool-header-title">Testing Cheat Sheet</h1>
          <p className="tool-header-desc">Quick-reference commands for popular test automation frameworks</p>
        </div>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
          padding: '0.3rem 0.75rem', borderRadius: '999px',
          background: `${active.color}18`, border: `1px solid ${active.color}44`, color: active.color,
          fontSize: '0.8rem', fontWeight: 700, flexShrink: 0,
        }}>
          {active.icon} {active.commands.length} commands
        </span>
      </div>

      {/* Framework tabs */}
      <div style={{ display: 'flex', gap: '0.3rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {FRAMEWORKS.map(fw => (
          <button
            key={fw.id}
            onClick={() => { setActiveId(fw.id); setSearch(''); }}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: 'var(--radius-md)',
              border: activeId === fw.id ? `1.5px solid ${fw.color}` : '1px solid var(--border-color)',
              background: activeId === fw.id ? `${fw.color}15` : 'transparent',
              color: activeId === fw.id ? fw.color : 'var(--muted)',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease',
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            <span>{fw.icon}</span> {fw.name}
          </button>
        ))}
      </div>

      {/* Active framework card */}
      <div className="tool-card">
        <div className="tool-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.3rem' }}>{active.icon}</span>
            <span style={{ fontWeight: 700 }}>{active.name}</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', fontWeight: 400 }}>— {active.description}</span>
          </div>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Filter commands…"
            style={{
              padding: '0.3rem 0.7rem', borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text)', fontSize: '0.78rem', width: '100%', maxWidth: '200px', minWidth: '120px', outline: 'none',
            }}
          />
        </div>
        <div className="tool-card-body" style={{ padding: 0, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em', width: '40px', textAlign: 'center' }}>#</th>
                <th style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Command</th>
                <th style={{ padding: '0.6rem 1rem', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Usage</th>
                <th style={{ padding: '0.6rem 1rem', width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.85rem' }}>
                    No commands match &quot;{search}&quot;
                  </td>
                </tr>
              )}
              {filtered.map((cmd, i) => (
                <tr key={i} style={{
                  borderBottom: '1px solid var(--border-color)',
                  transition: 'background 0.1s ease',
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = `${active.color}08`)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.55rem 1rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.75rem', fontWeight: 600 }}>{i + 1}</td>
                  <td style={{ padding: '0.55rem 1rem' }}>
                    <code style={codeStyle}>{cmd.command}</code>
                  </td>
                  <td style={{ padding: '0.55rem 1rem', fontSize: '0.82rem', color: 'var(--text)' }}>{cmd.usage}</td>
                  <td style={{ padding: '0.55rem 0.75rem' }}>
                    <CopyWithToast text={cmd.command} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats footer */}
      <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        {FRAMEWORKS.map(fw => (
          <span key={fw.id} style={{
            padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 600,
            background: `${fw.color}12`, color: fw.color, border: `1px solid ${fw.color}22`,
          }}>
            {fw.icon} {fw.name}: {fw.commands.length}
          </span>
        ))}
        <span style={{
          padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
          background: 'var(--bg-secondary)', color: 'var(--text)',
        }}>
          📊 Total: {FRAMEWORKS.reduce((sum, fw) => sum + fw.commands.length, 0)} commands
        </span>
      </div>
    </Container>
  );
}