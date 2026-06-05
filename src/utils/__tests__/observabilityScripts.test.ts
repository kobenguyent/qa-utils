import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

interface PackageJsonWithScripts {
  scripts?: Record<string, string>;
}

function readRootPackageJson(): PackageJsonWithScripts {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  return JSON.parse(readFileSync(packageJsonPath, 'utf8')) as PackageJsonWithScripts;
}

describe('package scripts', () => {
  it('keeps a db:up compatibility script for local visualizer work', () => {
    const packageJson = readRootPackageJson();

    expect(packageJson.scripts).toMatchObject({
      'db:up': expect.any(String),
    });
  });
});
