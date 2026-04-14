import { describe, it, expect } from 'vitest';
import { generateUuids } from '../lib/tools.js';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

describe('generateUuids', () => {
  it('generates a single UUID by default', () => {
    const result = generateUuids();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatch(UUID_REGEX);
  });

  it('generates the requested number of UUIDs', () => {
    const result = generateUuids(5);
    expect(result).toHaveLength(5);
    result.forEach((uuid) => expect(uuid).toMatch(UUID_REGEX));
  });

  it('all generated UUIDs are unique', () => {
    const result = generateUuids(10);
    const unique = new Set(result);
    expect(unique.size).toBe(10);
  });

  it('caps output at 100 when given a larger quantity', () => {
    const result = generateUuids(500);
    expect(result).toHaveLength(100);
  });

  it('generates at least 1 UUID even when quantity is 0 or negative', () => {
    expect(generateUuids(0)).toHaveLength(1);
    expect(generateUuids(-5)).toHaveLength(1);
  });

  it('generates v4 UUIDs (version digit is 4)', () => {
    const result = generateUuids(20);
    result.forEach((uuid) => expect(uuid[14]).toBe('4'));
  });
});
