import { describe, it, expect } from 'vitest';
import { getRandomTool } from '../randomTool';
import { searchData } from '../searchData';

describe('Random Tool Utility', () => {
  it('should return a valid tool item', () => {
    const randomTool = getRandomTool();
    
    expect(randomTool).toBeDefined();
    expect(randomTool).toHaveProperty('title');
    expect(randomTool).toHaveProperty('description');
    expect(randomTool).toHaveProperty('path');
    expect(randomTool).toHaveProperty('category');
    expect(randomTool).toHaveProperty('icon');
  });

  it('should not return the Home page', () => {
    // Run multiple times to ensure consistency
    for (let i = 0; i < 20; i++) {
      const randomTool = getRandomTool();
      expect(randomTool.path).not.toBe('#/');
      expect(randomTool.title).not.toBe('Home');
    }
  });

  it('should return a tool from the searchData', () => {
    const randomTool = getRandomTool();
    const toolExists = searchData.some(item => item.path === randomTool.path);
    
    expect(toolExists).toBe(true);
  });

  it('should return different tools on multiple calls (statistically)', () => {
    const tools = new Set();
    
    // Get 10 random tools
    for (let i = 0; i < 10; i++) {
      const randomTool = getRandomTool();
      tools.add(randomTool.path);
    }
    
    // With multiple calls, we should get at least 2 different tools
    // (extremely unlikely to get the same tool 10 times in a row)
    expect(tools.size).toBeGreaterThan(1);
  });
});
