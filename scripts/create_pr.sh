#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Function to print steps
print_step() {
  echo -e "${BLUE}==>${NC} $1"
}

# Function to check command status
check_status() {
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: $1 failed. Exiting.${NC}"
    exit 1
  fi
}

echo -e "${BLUE}🚀 QA Utils PR Automation Script${NC}"

# Check for uncommitted changes
if [[ -z $(git status -s) ]]; then
  echo -e "${RED}Error: No changes detected to commit.${NC}"
  exit 1
fi

# 1. Run checks
print_step "Running linting..."
npm run lint
check_status "Linting"

print_step "Running build..."
npm run build
check_status "Build"

# 2. Get Info
echo ""
read -p "Enter branch name (e.g., feature/add-utils): " branch_name
read -p "Enter commit message: " commit_msg
read -p "Enter PR Title: " pr_title
read -p "Enter PR Body (optional): " pr_body

# Ensure branch name starts with copilot/ if not specified (optional per user preference, but adhering to existing pattern)
# User didn't strictly say it must be copilot/, but the previous interaction suggested it.
# However, for a general script, allow any name.
# Or better, autocycle to copilot/ if not present? Let's just use what input.

# 3. Create and switch branch
print_step "Creating branch $branch_name..."
git checkout -b "$branch_name"
check_status "Branch creation"

# 4. Commit changes
print_step "Committing changes..."
git add .
git commit -m "$commit_msg"
check_status "Commit"

# 5. Push
print_step "Pushing to origin..."
git push origin "$branch_name"
check_status "Push"

# 6. Create PR
print_step "Creating Pull Request..."
if [ -z "$pr_body" ]; then
    gh pr create --title "$pr_title" --fill
else
    gh pr create --title "$pr_title" --body "$pr_body"
fi
check_status "PR Creation"

echo -e "${GREEN}✅ PR Created Successfully!${NC}"
