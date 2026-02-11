#!/usr/bin/env node

/**
 * Automatically bump the patch version in package.json for Electron builds
 * This ensures each desktop build has a unique version number
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.resolve(__dirname, '../package.json');

try {
  // Read package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  // Parse current version
  const versionParts = packageJson.version.split('.');
  if (versionParts.length !== 3) {
    console.error(`Invalid version format: ${packageJson.version}`);
    process.exit(1);
  }
  
  // Bump patch version
  const [major, minor, patch] = versionParts;
  const newPatch = parseInt(patch, 10) + 1;
  const newVersion = `${major}.${minor}.${newPatch}`;
  
  // Update version
  packageJson.version = newVersion;
  
  // Write back to package.json with pretty formatting
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n', 'utf-8');
  
  console.log(`✓ Version bumped: ${versionParts.join('.')} → ${newVersion}`);
  console.log(`  Package version updated to: ${newVersion}`);
  
} catch (error) {
  console.error('Error bumping version:', error.message);
  process.exit(1);
}
