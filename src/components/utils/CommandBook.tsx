import React, { useState, useMemo } from 'react';
import { Container, Tab, Tabs, Card, Form, Badge, Button, Accordion } from 'react-bootstrap';

interface CommandItem {
    title: string;
    command: string;
    description: string;
    example?: string;
}

interface CommandSection {
    title: string;
    commands: CommandItem[];
}

// Git/GitHub CLI Commands
const gitCommands: CommandSection[] = [
    {
        title: '📥 Clone & Setup',
        commands: [
            { title: 'Clone repository', command: 'git clone <url>', description: 'Clone a remote repository to local', example: 'git clone https://github.com/user/repo.git' },
            { title: 'Clone with SSH', command: 'git clone git@github.com:<user>/<repo>.git', description: 'Clone using SSH authentication' },
            { title: 'Shallow clone', command: 'git clone --depth 1 <url>', description: 'Clone only the latest commit (faster)' },
            { title: 'Set username', command: 'git config --global user.name "Your Name"', description: 'Set global Git username' },
            { title: 'Set email', command: 'git config --global user.email "email@example.com"', description: 'Set global Git email' },
        ]
    },
    {
        title: '📝 Basic Operations',
        commands: [
            { title: 'Check status', command: 'git status', description: 'Show working tree status' },
            { title: 'Add all files', command: 'git add .', description: 'Stage all changes for commit' },
            { title: 'Add specific file', command: 'git add <file>', description: 'Stage a specific file' },
            { title: 'Commit', command: 'git commit -m "message"', description: 'Commit staged changes with message' },
            { title: 'Commit all', command: 'git commit -am "message"', description: 'Stage and commit all modified files' },
            { title: 'Amend commit', command: 'git commit --amend', description: 'Modify the last commit' },
            { title: 'View log', command: 'git log --oneline -n 10', description: 'Show last 10 commits in one line format' },
            { title: 'View diff', command: 'git diff', description: 'Show unstaged changes' },
        ]
    },
    {
        title: '🌿 Branching',
        commands: [
            { title: 'List branches', command: 'git branch', description: 'List all local branches' },
            { title: 'List all branches', command: 'git branch -a', description: 'List all branches including remote' },
            { title: 'Create branch', command: 'git branch <name>', description: 'Create a new branch' },
            { title: 'Switch branch', command: 'git checkout <branch>', description: 'Switch to an existing branch' },
            { title: 'Create & switch', command: 'git checkout -b <name>', description: 'Create and switch to new branch' },
            { title: 'Delete branch', command: 'git branch -d <name>', description: 'Delete a local branch' },
            { title: 'Force delete', command: 'git branch -D <name>', description: 'Force delete unmerged branch' },
            { title: 'Rename branch', command: 'git branch -m <old> <new>', description: 'Rename a branch' },
        ]
    },
    {
        title: '🔄 Merge & Rebase',
        commands: [
            { title: 'Merge branch', command: 'git merge <branch>', description: 'Merge branch into current branch' },
            { title: 'Rebase', command: 'git rebase <branch>', description: 'Rebase current branch onto another' },
            { title: 'Interactive rebase', command: 'git rebase -i HEAD~<n>', description: 'Interactive rebase last n commits' },
            { title: 'Abort rebase', command: 'git rebase --abort', description: 'Abort rebase in progress' },
            { title: 'Continue rebase', command: 'git rebase --continue', description: 'Continue after resolving conflicts' },
            { title: 'Cherry-pick', command: 'git cherry-pick <commit>', description: 'Apply specific commit to current branch' },
        ]
    },
    {
        title: '📤 Remote Operations',
        commands: [
            { title: 'Push', command: 'git push origin <branch>', description: 'Push branch to remote' },
            { title: 'Push (set upstream)', command: 'git push -u origin <branch>', description: 'Push and set upstream tracking' },
            { title: 'Force push', command: 'git push --force-with-lease', description: 'Force push (safely)' },
            { title: 'Pull', command: 'git pull origin <branch>', description: 'Fetch and merge from remote' },
            { title: 'Fetch', command: 'git fetch origin', description: 'Fetch changes without merging' },
            { title: 'Fetch prune', command: 'git fetch --prune', description: 'Fetch and remove deleted remote branches' },
            { title: 'List remotes', command: 'git remote -v', description: 'Show remote repositories' },
        ]
    },
    {
        title: '🔧 Stash & Reset',
        commands: [
            { title: 'Stash changes', command: 'git stash', description: 'Temporarily store modified files' },
            { title: 'Stash with message', command: 'git stash push -m "message"', description: 'Stash with descriptive message' },
            { title: 'List stashes', command: 'git stash list', description: 'List all stashes' },
            { title: 'Apply stash', command: 'git stash pop', description: 'Apply and remove latest stash' },
            { title: 'Apply specific stash', command: 'git stash apply stash@{n}', description: 'Apply specific stash' },
            { title: 'Soft reset', command: 'git reset --soft HEAD~1', description: 'Undo commit, keep changes staged' },
            { title: 'Mixed reset', command: 'git reset HEAD~1', description: 'Undo commit, unstage changes' },
            { title: 'Hard reset', command: 'git reset --hard HEAD~1', description: 'Undo commit and discard changes' },
        ]
    },
    {
        title: '🐙 GitHub CLI (gh)',
        commands: [
            { title: 'Login', command: 'gh auth login', description: 'Authenticate with GitHub' },
            { title: 'Create PR', command: 'gh pr create --title "title" --body "body"', description: 'Create a pull request' },
            { title: 'List PRs', command: 'gh pr list', description: 'List pull requests in repo' },
            { title: 'View PR', command: 'gh pr view <number>', description: 'View pull request details' },
            { title: 'Checkout PR', command: 'gh pr checkout <number>', description: 'Checkout a pull request locally' },
            { title: 'Merge PR', command: 'gh pr merge <number>', description: 'Merge a pull request' },
            { title: 'Create issue', command: 'gh issue create --title "title"', description: 'Create a new issue' },
            { title: 'List issues', command: 'gh issue list', description: 'List issues in repo' },
            { title: 'Clone repo', command: 'gh repo clone <owner>/<repo>', description: 'Clone a GitHub repository' },
            { title: 'Create repo', command: 'gh repo create <name> --public', description: 'Create a new repository' },
            { title: 'View repo', command: 'gh repo view --web', description: 'Open repository in browser' },
        ]
    },
];

// Docker Commands
const dockerCommands: CommandSection[] = [
    {
        title: '📦 Images',
        commands: [
            { title: 'List images', command: 'docker images', description: 'List all local images' },
            { title: 'Pull image', command: 'docker pull <image>:<tag>', description: 'Download image from registry', example: 'docker pull nginx:latest' },
            { title: 'Build image', command: 'docker build -t <name>:<tag> .', description: 'Build image from Dockerfile', example: 'docker build -t myapp:1.0 .' },
            { title: 'Build no cache', command: 'docker build --no-cache -t <name> .', description: 'Build without using cache' },
            { title: 'Tag image', command: 'docker tag <image> <new-name>:<tag>', description: 'Tag an image with new name' },
            { title: 'Push image', command: 'docker push <image>:<tag>', description: 'Push image to registry' },
            { title: 'Remove image', command: 'docker rmi <image>', description: 'Remove an image' },
            { title: 'Prune images', command: 'docker image prune -a', description: 'Remove all unused images' },
        ]
    },
    {
        title: '🚀 Containers',
        commands: [
            { title: 'Run container', command: 'docker run -d --name <name> <image>', description: 'Run container in background', example: 'docker run -d --name web nginx' },
            { title: 'Run with port', command: 'docker run -d -p <host>:<container> <image>', description: 'Run with port mapping', example: 'docker run -d -p 8080:80 nginx' },
            { title: 'Run with volume', command: 'docker run -v <host>:<container> <image>', description: 'Run with volume mount', example: 'docker run -v $(pwd):/app node' },
            { title: 'Run with env', command: 'docker run -e VAR=value <image>', description: 'Run with environment variable' },
            { title: 'Run interactive', command: 'docker run -it <image> /bin/bash', description: 'Run interactively with shell' },
            { title: 'List containers', command: 'docker ps', description: 'List running containers' },
            { title: 'List all', command: 'docker ps -a', description: 'List all containers' },
            { title: 'Stop container', command: 'docker stop <container>', description: 'Stop a running container' },
            { title: 'Start container', command: 'docker start <container>', description: 'Start a stopped container' },
            { title: 'Restart container', command: 'docker restart <container>', description: 'Restart a container' },
            { title: 'Remove container', command: 'docker rm <container>', description: 'Remove a container' },
            { title: 'Force remove', command: 'docker rm -f <container>', description: 'Force remove running container' },
            { title: 'Prune containers', command: 'docker container prune', description: 'Remove all stopped containers' },
        ]
    },
    {
        title: '🔍 Inspect & Logs',
        commands: [
            { title: 'View logs', command: 'docker logs <container>', description: 'View container logs' },
            { title: 'Follow logs', command: 'docker logs -f <container>', description: 'Follow container logs' },
            { title: 'Tail logs', command: 'docker logs --tail 100 <container>', description: 'View last 100 log lines' },
            { title: 'Exec command', command: 'docker exec -it <container> <cmd>', description: 'Execute command in container', example: 'docker exec -it web /bin/bash' },
            { title: 'Inspect', command: 'docker inspect <container>', description: 'View container details' },
            { title: 'Stats', command: 'docker stats', description: 'View live resource usage' },
            { title: 'Top', command: 'docker top <container>', description: 'View running processes' },
        ]
    },
    {
        title: '🔗 Networks',
        commands: [
            { title: 'List networks', command: 'docker network ls', description: 'List all networks' },
            { title: 'Create network', command: 'docker network create <name>', description: 'Create a new network' },
            { title: 'Connect', command: 'docker network connect <network> <container>', description: 'Connect container to network' },
            { title: 'Disconnect', command: 'docker network disconnect <network> <container>', description: 'Disconnect from network' },
            { title: 'Inspect network', command: 'docker network inspect <network>', description: 'View network details' },
            { title: 'Remove network', command: 'docker network rm <network>', description: 'Remove a network' },
        ]
    },
    {
        title: '💾 Volumes',
        commands: [
            { title: 'List volumes', command: 'docker volume ls', description: 'List all volumes' },
            { title: 'Create volume', command: 'docker volume create <name>', description: 'Create a new volume' },
            { title: 'Inspect volume', command: 'docker volume inspect <name>', description: 'View volume details' },
            { title: 'Remove volume', command: 'docker volume rm <name>', description: 'Remove a volume' },
            { title: 'Prune volumes', command: 'docker volume prune', description: 'Remove all unused volumes' },
        ]
    },
    {
        title: '🎼 Docker Compose',
        commands: [
            { title: 'Start services', command: 'docker-compose up -d', description: 'Start all services in background' },
            { title: 'Stop services', command: 'docker-compose down', description: 'Stop and remove containers' },
            { title: 'Stop with volumes', command: 'docker-compose down -v', description: 'Stop and remove volumes' },
            { title: 'Build & start', command: 'docker-compose up -d --build', description: 'Rebuild and start services' },
            { title: 'View logs', command: 'docker-compose logs -f', description: 'Follow all service logs' },
            { title: 'Service logs', command: 'docker-compose logs -f <service>', description: 'Follow specific service logs' },
            { title: 'List services', command: 'docker-compose ps', description: 'List running services' },
            { title: 'Exec in service', command: 'docker-compose exec <service> <cmd>', description: 'Execute command in service' },
            { title: 'Scale service', command: 'docker-compose up -d --scale <service>=3', description: 'Scale a service to 3 instances' },
            { title: 'Pull images', command: 'docker-compose pull', description: 'Pull all service images' },
        ]
    },
    {
        title: '🧹 Cleanup',
        commands: [
            { title: 'System prune', command: 'docker system prune', description: 'Remove unused data' },
            { title: 'Full prune', command: 'docker system prune -a --volumes', description: 'Remove all unused data including volumes' },
            { title: 'Disk usage', command: 'docker system df', description: 'Show Docker disk usage' },
        ]
    },
];

// Bash Script Commands
const bashCommands: CommandSection[] = [
    {
        title: '📝 Variables',
        commands: [
            { title: 'Define variable', command: 'VAR="value"', description: 'Define a variable (no spaces around =)' },
            { title: 'Use variable', command: 'echo $VAR or echo "${VAR}"', description: 'Reference a variable' },
            { title: 'Command substitution', command: 'RESULT=$(command)', description: 'Store command output in variable' },
            { title: 'Default value', command: '${VAR:-default}', description: 'Use default if VAR is unset' },
            { title: 'Required variable', command: '${VAR:?Error message}', description: 'Exit with error if VAR is unset' },
            { title: 'Export variable', command: 'export VAR="value"', description: 'Make variable available to child processes' },
            { title: 'Read input', command: 'read -p "Enter value: " VAR', description: 'Read user input into variable' },
        ]
    },
    {
        title: '🔁 Loops',
        commands: [
            { title: 'For loop (list)', command: 'for i in 1 2 3; do echo $i; done', description: 'Loop over a list of items' },
            { title: 'For loop (range)', command: 'for i in {1..10}; do echo $i; done', description: 'Loop over a range' },
            { title: 'For loop (files)', command: 'for f in *.txt; do echo "$f"; done', description: 'Loop over files' },
            { title: 'C-style for', command: 'for ((i=0; i<10; i++)); do echo $i; done', description: 'C-style for loop' },
            { title: 'While loop', command: 'while [ condition ]; do commands; done', description: 'Loop while condition is true' },
            { title: 'Until loop', command: 'until [ condition ]; do commands; done', description: 'Loop until condition is true' },
            { title: 'Read file lines', command: 'while IFS= read -r line; do echo "$line"; done < file.txt', description: 'Read file line by line' },
        ]
    },
    {
        title: '❓ Conditionals',
        commands: [
            { title: 'If statement', command: 'if [ condition ]; then\n  commands\nfi', description: 'Basic if statement' },
            { title: 'If-else', command: 'if [ condition ]; then\n  commands\nelse\n  other\nfi', description: 'If-else statement' },
            { title: 'If-elif-else', command: 'if [ cond1 ]; then\n  cmd1\nelif [ cond2 ]; then\n  cmd2\nelse\n  cmd3\nfi', description: 'Multiple conditions' },
            { title: 'String equals', command: '[ "$a" = "$b" ]', description: 'Check if strings are equal' },
            { title: 'String not equals', command: '[ "$a" != "$b" ]', description: 'Check if strings differ' },
            { title: 'String empty', command: '[ -z "$str" ]', description: 'Check if string is empty' },
            { title: 'String not empty', command: '[ -n "$str" ]', description: 'Check if string is not empty' },
            { title: 'Number comparison', command: '[ $a -eq $b ]  # -ne -lt -le -gt -ge', description: 'Compare numbers' },
            { title: 'File exists', command: '[ -f "$file" ]', description: 'Check if file exists' },
            { title: 'Directory exists', command: '[ -d "$dir" ]', description: 'Check if directory exists' },
            { title: 'File readable', command: '[ -r "$file" ]', description: 'Check if file is readable' },
            { title: 'AND condition', command: '[ cond1 ] && [ cond2 ]', description: 'Both conditions must be true' },
            { title: 'OR condition', command: '[ cond1 ] || [ cond2 ]', description: 'Either condition must be true' },
        ]
    },
    {
        title: '⚙️ Functions',
        commands: [
            { title: 'Define function', command: 'function_name() {\n  commands\n}', description: 'Define a function' },
            { title: 'Function with args', command: 'greet() {\n  echo "Hello, $1"\n}', description: 'Access arguments with $1, $2, etc.' },
            { title: 'Return value', command: 'func() {\n  return 0\n}', description: 'Return exit status (0-255)' },
            { title: 'Return string', command: 'func() {\n  echo "result"\n}\nval=$(func)', description: 'Return string via echo' },
            { title: 'Local variable', command: 'func() {\n  local var="value"\n}', description: 'Declare local variable in function' },
            { title: 'All arguments', command: '$@', description: 'All arguments as separate words' },
            { title: 'Argument count', command: '$#', description: 'Number of arguments' },
        ]
    },
    {
        title: '📁 File Operations',
        commands: [
            { title: 'Create directory', command: 'mkdir -p dir/subdir', description: 'Create directory with parents' },
            { title: 'Copy file', command: 'cp source dest', description: 'Copy file' },
            { title: 'Copy recursive', command: 'cp -r source/ dest/', description: 'Copy directory recursively' },
            { title: 'Move/rename', command: 'mv source dest', description: 'Move or rename file' },
            { title: 'Remove file', command: 'rm file', description: 'Remove file' },
            { title: 'Remove directory', command: 'rm -rf dir/', description: 'Remove directory recursively' },
            { title: 'Find files', command: 'find . -name "*.txt"', description: 'Find files by name' },
            { title: 'Find and exec', command: 'find . -name "*.log" -exec rm {} \\;', description: 'Find and execute command' },
            { title: 'Grep in files', command: 'grep -r "pattern" .', description: 'Search pattern in files recursively' },
            { title: 'File content', command: 'cat file.txt', description: 'Display file content' },
            { title: 'Head of file', command: 'head -n 10 file.txt', description: 'Show first 10 lines' },
            { title: 'Tail of file', command: 'tail -n 10 file.txt', description: 'Show last 10 lines' },
            { title: 'Follow file', command: 'tail -f file.log', description: 'Follow file changes' },
        ]
    },
    {
        title: '🔧 Text Processing',
        commands: [
            { title: 'Sed replace', command: "sed 's/old/new/g' file", description: 'Replace text in file' },
            { title: 'Sed in-place', command: "sed -i 's/old/new/g' file", description: 'Replace text in-place' },
            { title: 'Awk columns', command: "awk '{print $1, $3}' file", description: 'Print specific columns' },
            { title: 'Awk filter', command: "awk '/pattern/ {print}' file", description: 'Filter lines matching pattern' },
            { title: 'Cut columns', command: 'cut -d"," -f1,3 file.csv', description: 'Extract CSV columns' },
            { title: 'Sort', command: 'sort file.txt', description: 'Sort lines' },
            { title: 'Sort unique', command: 'sort -u file.txt', description: 'Sort and remove duplicates' },
            { title: 'Count lines', command: 'wc -l file.txt', description: 'Count lines in file' },
            { title: 'Unique lines', command: 'uniq file.txt', description: 'Remove adjacent duplicate lines' },
        ]
    },
    {
        title: '🚀 Script Patterns',
        commands: [
            { title: 'Shebang', command: '#!/bin/bash', description: 'Script interpreter directive' },
            { title: 'Strict mode', command: 'set -euo pipefail', description: 'Exit on error, undefined vars, pipe failures' },
            { title: 'Script directory', command: 'SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"', description: 'Get script directory path' },
            { title: 'Check command exists', command: 'command -v git &>/dev/null || echo "git not found"', description: 'Check if command is available' },
            { title: 'Run as root', command: '[ "$EUID" -eq 0 ] || { echo "Run as root"; exit 1; }', description: 'Require root privileges' },
            { title: 'Trap cleanup', command: 'trap "cleanup" EXIT', description: 'Run cleanup on script exit' },
            { title: 'Parse options', command: 'while getopts "hv" opt; do\n  case $opt in\n    h) usage ;;\n    v) VERBOSE=1 ;;\n  esac\ndone', description: 'Parse command-line options' },
        ]
    },
];

// CodeceptJS Commands
const codeceptCommands: CommandSection[] = [
    {
        title: '🚀 CLI Commands',
        commands: [
            { title: 'Run all tests', command: 'npx codeceptjs run', description: 'Run all tests' },
            { title: 'Run with tag', command: 'npx codeceptjs run --grep "@smoke"', description: 'Run tests with specific tag' },
            { title: 'Run specific test', command: 'npx codeceptjs run tests/login_test.js', description: 'Run a specific test file' },
            { title: 'Run with workers', command: 'npx codeceptjs run-workers 4', description: 'Run tests in parallel with 4 workers' },
            { title: 'Verbose output', command: 'npx codeceptjs run --verbose', description: 'Run with detailed output' },
            { title: 'Step-by-step', command: 'npx codeceptjs run --steps', description: 'Show step-by-step execution' },
            { title: 'Debug mode', command: 'npx codeceptjs run --debug', description: 'Run in debug mode' },
            { title: 'Generate test', command: 'npx codeceptjs gt', description: 'Generate a new test file' },
            { title: 'Generate page object', command: 'npx codeceptjs gpo', description: 'Generate page object' },
            { title: 'Interactive shell', command: 'npx codeceptjs shell', description: 'Open interactive test shell' },
        ]
    },
    {
        title: '🖱️ Click & Interaction',
        commands: [
            { title: 'Click element', command: "I.click('Button Text');", description: 'Click on element by text' },
            { title: 'Click locator', command: "I.click('#submit-btn');", description: 'Click on element by CSS selector' },
            { title: 'Click XPath', command: "I.click({xpath: '//button[@type=\"submit\"]'});", description: 'Click using XPath' },
            { title: 'Double click', command: "I.doubleClick('Element');", description: 'Double click on element' },
            { title: 'Right click', command: "I.rightClick('Element');", description: 'Right click on element' },
            { title: 'Click in context', command: "I.click('Link', '.container');", description: 'Click element within container' },
            { title: 'Force click', command: "I.forceClick('#hidden-btn');", description: 'Force click on hidden element' },
        ]
    },
    {
        title: '⌨️ Input & Forms',
        commands: [
            { title: 'Fill field', command: "I.fillField('#email', 'test@example.com');", description: 'Fill input field' },
            { title: 'Fill by label', command: "I.fillField('Email', 'test@example.com');", description: 'Fill field by label text' },
            { title: 'Clear field', command: "I.clearField('#email');", description: 'Clear input field' },
            { title: 'Append field', command: "I.appendField('#search', ' more text');", description: 'Append text to field' },
            { title: 'Press key', command: "I.pressKey('Enter');", description: 'Press a keyboard key' },
            { title: 'Press combo', command: "I.pressKey(['Control', 'a']);", description: 'Press key combination' },
            { title: 'Type text', command: "I.type('Hello World');", description: 'Type text character by character' },
            { title: 'Select option', command: "I.selectOption('#country', 'USA');", description: 'Select dropdown option' },
            { title: 'Check checkbox', command: "I.checkOption('#agree');", description: 'Check a checkbox' },
            { title: 'Uncheck', command: "I.uncheckOption('#newsletter');", description: 'Uncheck a checkbox' },
            { title: 'Attach file', command: "I.attachFile('#upload', 'data/file.pdf');", description: 'Upload a file' },
        ]
    },
    {
        title: '✅ Assertions',
        commands: [
            { title: 'See text', command: "I.see('Welcome');", description: 'Assert text is visible on page' },
            { title: 'See in element', command: "I.see('Hello', '.greeting');", description: 'Assert text in specific element' },
            { title: 'Don\'t see', command: "I.dontSee('Error');", description: 'Assert text is not visible' },
            { title: 'See element', command: "I.seeElement('#login-form');", description: 'Assert element is visible' },
            { title: 'Don\'t see element', command: "I.dontSeeElement('.error-message');", description: 'Assert element is not visible' },
            { title: 'See in title', command: "I.seeInTitle('Dashboard');", description: 'Assert page title contains text' },
            { title: 'See in URL', command: "I.seeInCurrentUrl('/dashboard');", description: 'Assert URL contains text' },
            { title: 'See field value', command: "I.seeInField('#email', 'test@example.com');", description: 'Assert field contains value' },
            { title: 'See checkbox', command: "I.seeCheckboxIsChecked('#agree');", description: 'Assert checkbox is checked' },
            { title: 'See enabled', command: "I.seeElement({css: '#submit:enabled'});", description: 'Assert element is enabled' },
            { title: 'See attribute', command: "I.seeAttributesOnElements('#btn', {disabled: true});", description: 'Assert element attributes' },
            { title: 'See number of elements', command: "I.seeNumberOfElements('.item', 5);", description: 'Assert number of elements' },
        ]
    },
    {
        title: '🌐 Navigation',
        commands: [
            { title: 'Go to URL', command: "I.amOnPage('/login');", description: 'Navigate to URL' },
            { title: 'Refresh page', command: 'I.refreshPage();', description: 'Refresh current page' },
            { title: 'Go back', command: 'I.goBack();', description: 'Navigate back in history' },
            { title: 'Scroll to', command: "I.scrollTo('#footer');", description: 'Scroll to element' },
            { title: 'Scroll page', command: 'I.scrollPageToBottom();', description: 'Scroll to page bottom' },
            { title: 'Switch tab', command: 'I.switchToNextTab();', description: 'Switch to next browser tab' },
            { title: 'Close tab', command: 'I.closeCurrentTab();', description: 'Close current browser tab' },
            { title: 'Switch to frame', command: "I.switchTo('iframe#content');", description: 'Switch to iframe' },
            { title: 'Switch to main', command: 'I.switchTo();', description: 'Switch back to main frame' },
        ]
    },
    {
        title: '⏳ Waits',
        commands: [
            { title: 'Wait seconds', command: 'I.wait(3);', description: 'Wait for specified seconds' },
            { title: 'Wait for element', command: "I.waitForElement('#modal', 10);", description: 'Wait for element to appear' },
            { title: 'Wait for visible', command: "I.waitForVisible('.loading', 5);", description: 'Wait for element to be visible' },
            { title: 'Wait for hidden', command: "I.waitForInvisible('.spinner');", description: 'Wait for element to disappear' },
            { title: 'Wait for text', command: "I.waitForText('Success', 10, '.message');", description: 'Wait for text to appear' },
            { title: 'Wait for enabled', command: "I.waitForEnabled('#submit');", description: 'Wait for element to be enabled' },
            { title: 'Wait for URL', command: "I.waitInUrl('/dashboard');", description: 'Wait for URL to contain text' },
            { title: 'Wait for function', command: 'I.waitForFunction(() => document.ready);', description: 'Wait for JS function to return true' },
        ]
    },
    {
        title: '📸 Grabbers',
        commands: [
            { title: 'Grab text', command: "const text = await I.grabTextFrom('.message');", description: 'Get text content from element' },
            { title: 'Grab value', command: "const val = await I.grabValueFrom('#email');", description: 'Get input field value' },
            { title: 'Grab attribute', command: "const href = await I.grabAttributeFrom('a', 'href');", description: 'Get attribute value' },
            { title: 'Grab multiple texts', command: "const texts = await I.grabTextFromAll('.item');", description: 'Get text from multiple elements' },
            { title: 'Grab HTML', command: "const html = await I.grabHTMLFrom('.container');", description: 'Get inner HTML of element' },
            { title: 'Grab URL', command: 'const url = await I.grabCurrentUrl();', description: 'Get current page URL' },
            { title: 'Grab cookie', command: "const cookie = await I.grabCookie('session');", description: 'Get cookie value' },
            { title: 'Grab number of elements', command: "const count = await I.grabNumberOfVisibleElements('.item');", description: 'Count visible elements' },
        ]
    },
    {
        title: '🔌 API Testing',
        commands: [
            { title: 'Send GET', command: "const res = await I.sendGetRequest('/api/users');", description: 'Send GET request' },
            { title: 'Send POST', command: "const res = await I.sendPostRequest('/api/login', {user: 'test', pass: '123'});", description: 'Send POST request' },
            { title: 'Send PUT', command: "const res = await I.sendPutRequest('/api/users/1', {name: 'Updated'});", description: 'Send PUT request' },
            { title: 'Send DELETE', command: "const res = await I.sendDeleteRequest('/api/users/1');", description: 'Send DELETE request' },
            { title: 'Set headers', command: "I.haveRequestHeaders({Authorization: 'Bearer token'});", description: 'Set request headers' },
            { title: 'See response code', command: 'I.seeResponseCodeIs(200);', description: 'Assert response status code' },
            { title: 'See response contains', command: "I.seeResponseContainsJson({success: true});", description: 'Assert response contains JSON' },
        ]
    },
    {
        title: '📄 Page Objects',
        commands: [
            {
                title: 'Page object structure', command: `const { I } = inject();

module.exports = {
  // Locators
  fields: {
    email: '#email',
    password: '#password'
  },
  buttons: {
    submit: 'Login'
  },
  
  // Methods
  login(email, pass) {
    I.fillField(this.fields.email, email);
    I.fillField(this.fields.password, pass);
    I.click(this.buttons.submit);
  }
};`, description: 'Basic page object structure'
            },
            {
                title: 'Use page object', command: `const loginPage = require('./pages/login');

Scenario('Login test', ({ I }) => {
  I.amOnPage('/login');
  loginPage.login('user@test.com', 'password');
  I.see('Dashboard');
});`, description: 'Using page object in test'
            },
        ]
    },
    {
        title: '🧪 Data-Driven Testing',
        commands: [
            {
                title: 'Data table', command: `const testData = new DataTable(['email', 'password', 'expected']);
testData.add(['user1@test.com', 'pass1', 'Dashboard']);
testData.add(['user2@test.com', 'pass2', 'Dashboard']);

Data(testData).Scenario('Login with multiple users', ({ I, current }) => {
  I.amOnPage('/login');
  I.fillField('#email', current.email);
  I.fillField('#password', current.password);
  I.click('Login');
  I.see(current.expected);
});`, description: 'Data-driven tests with DataTable'
            },
            {
                title: 'Before/After hooks', command: `Feature('User Management');

BeforeSuite(({ I }) => {
  // Runs once before all scenarios
});

Before(({ I }) => {
  I.amOnPage('/login');
});

After(({ I }) => {
  I.clearCookie();
});

AfterSuite(({ I }) => {
  // Runs once after all scenarios
});`, description: 'Test hooks for setup/teardown'
            },
        ]
    },
];

const CommandBook: React.FC = () => {
    const [activeTab, setActiveTab] = useState('git');
    const [searchTerm, setSearchTerm] = useState('');
    const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

    const copyToClipboard = async (command: string) => {
        try {
            await navigator.clipboard.writeText(command);
            setCopiedCommand(command);
            setTimeout(() => setCopiedCommand(null), 2000);
        } catch {
            console.error('Failed to copy');
        }
    };

    const filterCommands = (sections: CommandSection[]): CommandSection[] => {
        if (!searchTerm) return sections;

        const term = searchTerm.toLowerCase();
        return sections
            .map(section => ({
                ...section,
                commands: section.commands.filter(cmd =>
                    cmd.title.toLowerCase().includes(term) ||
                    cmd.command.toLowerCase().includes(term) ||
                    cmd.description.toLowerCase().includes(term)
                )
            }))
            .filter(section => section.commands.length > 0);
    };

    const getActiveCommands = useMemo(() => {
        switch (activeTab) {
            case 'git': return filterCommands(gitCommands);
            case 'docker': return filterCommands(dockerCommands);
            case 'bash': return filterCommands(bashCommands);
            case 'codeceptjs': return filterCommands(codeceptCommands);
            default: return [];
        }
    }, [activeTab, searchTerm]);

    const getTotalCommands = (sections: CommandSection[]) =>
        sections.reduce((count, section) => count + section.commands.length, 0);

    const renderCommand = (cmd: CommandItem) => (
        <div
            key={cmd.title}
            className="command-item p-3 mb-2 rounded"
            style={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                transition: 'all 0.2s ease'
            }}
        >
            <div className="d-flex justify-content-between align-items-start mb-2">
                <strong style={{ color: 'var(--text)' }}>{cmd.title}</strong>
                <Button
                    variant={copiedCommand === cmd.command ? 'success' : 'outline-secondary'}
                    size="sm"
                    onClick={() => copyToClipboard(cmd.command)}
                    style={{ minWidth: '70px' }}
                >
                    {copiedCommand === cmd.command ? '✓ Copied' : '📋 Copy'}
                </Button>
            </div>
            <pre
                className="mb-2 p-2 rounded"
                style={{
                    backgroundColor: 'var(--code-bg, #1e1e1e)',
                    color: 'var(--code-text, #d4d4d4)',
                    fontSize: '0.9rem',
                    overflow: 'auto',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all'
                }}
            >
                <code>{cmd.command}</code>
            </pre>
            <small className="text-muted">{cmd.description}</small>
            {cmd.example && (
                <div className="mt-2">
                    <small className="text-muted">
                        <em>Example: </em>
                        <code style={{
                            backgroundColor: 'var(--code-bg, #1e1e1e)',
                            color: 'var(--code-text, #d4d4d4)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '0.85rem'
                        }}>
                            {cmd.example}
                        </code>
                    </small>
                </div>
            )}
        </div>
    );

    return (
        <Container className="py-4">
            <div className="text-center mb-4">
                <h1 className="display-5 fw-bold" style={{ color: 'var(--text)' }}>
                    📖 Command Book
                </h1>
                <p className="lead text-muted">
                    Hands-on reference for Git, Docker, Bash, and CodeceptJS commands
                </p>
            </div>

            {/* Search Bar */}
            <Card className="mb-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <Card.Body>
                    <Form.Group>
                        <Form.Control
                            type="search"
                            placeholder="🔍 Search commands..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                backgroundColor: 'var(--input-bg)',
                                borderColor: 'var(--input-border)',
                                color: 'var(--text)',
                                fontSize: '1.1rem',
                                padding: '12px 16px'
                            }}
                        />
                    </Form.Group>
                </Card.Body>
            </Card>

            {/* Tabs */}
            <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k || 'git')}
                className="mb-4 command-book-tabs"
                fill
            >
                <Tab
                    eventKey="git"
                    title={
                        <span>
                            🐙 Git/GitHub CLI
                            <Badge bg="secondary" className="ms-2">{getTotalCommands(filterCommands(gitCommands))}</Badge>
                        </span>
                    }
                />
                <Tab
                    eventKey="docker"
                    title={
                        <span>
                            🐳 Docker
                            <Badge bg="secondary" className="ms-2">{getTotalCommands(filterCommands(dockerCommands))}</Badge>
                        </span>
                    }
                />
                <Tab
                    eventKey="bash"
                    title={
                        <span>
                            💻 Bash Scripts
                            <Badge bg="secondary" className="ms-2">{getTotalCommands(filterCommands(bashCommands))}</Badge>
                        </span>
                    }
                />
                <Tab
                    eventKey="codeceptjs"
                    title={
                        <span>
                            🧪 CodeceptJS
                            <Badge bg="secondary" className="ms-2">{getTotalCommands(filterCommands(codeceptCommands))}</Badge>
                        </span>
                    }
                />
            </Tabs>

            {/* Command Sections */}
            {getActiveCommands.length === 0 ? (
                <Card style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                    <Card.Body className="text-center py-5">
                        <h4 className="text-muted">No commands found matching "{searchTerm}"</h4>
                        <p className="text-muted">Try a different search term</p>
                    </Card.Body>
                </Card>
            ) : (
                <Accordion defaultActiveKey="0" alwaysOpen>
                    {getActiveCommands.map((section, index) => (
                        <Accordion.Item
                            key={section.title}
                            eventKey={String(index)}
                            style={{
                                backgroundColor: 'var(--card-bg)',
                                borderColor: 'var(--border-color)',
                                marginBottom: '8px'
                            }}
                        >
                            <Accordion.Header>
                                <span style={{ fontSize: '1.1rem' }}>
                                    {section.title}
                                    <Badge bg="primary" className="ms-2">{section.commands.length}</Badge>
                                </span>
                            </Accordion.Header>
                            <Accordion.Body style={{ backgroundColor: 'var(--body-bg)' }}>
                                {section.commands.map(renderCommand)}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            )}

            {/* Quick Stats */}
            <Card className="mt-4" style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-color)' }}>
                <Card.Body>
                    <div className="d-flex justify-content-around text-center">
                        <div>
                            <h4 style={{ color: 'var(--text)' }}>{getTotalCommands(gitCommands)}</h4>
                            <small className="text-muted">Git Commands</small>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--text)' }}>{getTotalCommands(dockerCommands)}</h4>
                            <small className="text-muted">Docker Commands</small>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--text)' }}>{getTotalCommands(bashCommands)}</h4>
                            <small className="text-muted">Bash Commands</small>
                        </div>
                        <div>
                            <h4 style={{ color: 'var(--text)' }}>{getTotalCommands(codeceptCommands)}</h4>
                            <small className="text-muted">CodeceptJS Snippets</small>
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </Container>
    );
};

export { CommandBook };
