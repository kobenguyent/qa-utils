import { describe, it, expect } from 'vitest';
import { convertColor } from '../lib/tools.js';

describe('convertColor', () => {
  it('converts a 6-digit hex (with #) to RGB and HSL', () => {
    const result = convertColor('#FF0000');
    expect(result.error).toBeUndefined();
    expect(result.hex).toBe('#ff0000');
    expect(result.rgb).toEqual({ r: 255, g: 0, b: 0 });
    expect(result.hsl).toEqual({ h: 0, s: 100, l: 50 });
  });

  it('converts a 6-digit hex (without #)', () => {
    const result = convertColor('00FF00');
    expect(result.error).toBeUndefined();
    expect(result.hex).toBe('#00ff00');
    expect(result.rgb).toEqual({ r: 0, g: 255, b: 0 });
  });

  it('expands a 3-digit hex shorthand', () => {
    const result = convertColor('#FFF');
    expect(result.hex).toBe('#ffffff');
    expect(result.rgb).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converts an rgb() string', () => {
    const result = convertColor('rgb(0, 0, 255)');
    expect(result.error).toBeUndefined();
    expect(result.hex).toBe('#0000ff');
    expect(result.rgb).toEqual({ r: 0, g: 0, b: 255 });
  });

  it('converts pure black correctly', () => {
    const result = convertColor('#000000');
    expect(result.hex).toBe('#000000');
    expect(result.rgb).toEqual({ r: 0, g: 0, b: 0 });
    expect(result.hsl).toEqual({ h: 0, s: 0, l: 0 });
  });

  it('converts pure white correctly', () => {
    const result = convertColor('#FFFFFF');
    expect(result.hex).toBe('#ffffff');
    expect(result.hsl).toEqual({ h: 0, s: 0, l: 100 });
  });

  it('clamps RGB values that are out of range', () => {
    // The rgb() regex only captures \d+ so '300' → 255 (clamped),
    // '-5' → the regex finds the digit '5' (unsigned), so g=5.
    const result = convertColor('rgb(300, 5, 128)');
    expect(result.rgb.r).toBe(255); // 300 clamped to 255
    expect(result.rgb.g).toBe(5);   // 5 passes through as-is
    expect(result.rgb.b).toBe(128);
  });

  it('returns an error for an unsupported format', () => {
    const result = convertColor('hsl(120, 100%, 50%)');
    expect(result.error).toBeDefined();
  });

  it('returns an error for invalid rgb() syntax', () => {
    const result = convertColor('rgb(invalid)');
    expect(result.error).toBeDefined();
  });

  it('returns an error for a random string', () => {
    const result = convertColor('banana');
    expect(result.error).toBeDefined();
  });
});
