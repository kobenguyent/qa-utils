import { describe, it, expect } from 'vitest';
import { 
  generateComplementary,
  generateAnalogous,
  generateTriadic,
  generateSplitComplementary,
  generateTetradic,
  generateMonochromatic,
  generateAllPalettes,
  exportPalette
} from '../colorPalette';

describe('Color Palette Generator', () => {
  const testColor = '#ff0000';

  describe('Basic Harmonies', () => {
    it('should generate complementary colors', () => {
      const palette = generateComplementary(testColor);
      expect(palette.name).toBe('Complementary');
      expect(palette.colors).toHaveLength(2);
      expect(palette.colors[0].hex).toBe('#ff0000');
      expect(palette.colors[1].hex).toBe('#00ffff');
    });

    it('should generate analogous colors', () => {
      const palette = generateAnalogous(testColor, { count: 3, angle: 30 });
      expect(palette.name).toBe('Analogous');
      expect(palette.colors).toHaveLength(3);
      expect(palette.colors[0].hex).toBe('#ff0000');
    });

    it('should generate triadic colors', () => {
      const palette = generateTriadic(testColor);
      expect(palette.name).toBe('Triadic');
      expect(palette.colors).toHaveLength(3);
      expect(palette.colors[0].hex).toBe('#ff0000');
    });
  });

  describe('Advanced Harmonies', () => {
    it('should generate split complementary colors', () => {
      const palette = generateSplitComplementary(testColor);
      expect(palette.name).toBe('Split Complementary');
      expect(palette.colors).toHaveLength(3);
    });

    it('should generate tetradic colors', () => {
      const palette = generateTetradic(testColor);
      expect(palette.name).toBe('Tetradic');
      expect(palette.colors).toHaveLength(4);
    });

    it('should generate monochromatic colors', () => {
      const palette = generateMonochromatic(testColor, { count: 5 });
      expect(palette.name).toBe('Monochromatic');
      expect(palette.colors).toHaveLength(5);
    });
  });

  describe('Palette Generation', () => {
    it('should generate all palettes', () => {
      const palettes = generateAllPalettes(testColor);
      expect(palettes).toHaveLength(6);
      expect(palettes.map(p => p.name)).toEqual([
        'Complementary',
        'Analogous',
        'Triadic',
        'Split Complementary',
        'Tetradic',
        'Monochromatic'
      ]);
    });
  });

  describe('Palette Export', () => {
    const palette = generateComplementary(testColor);

    it('should export as JSON', () => {
      const exported = exportPalette(palette, 'json');
      const parsed = JSON.parse(exported);
      expect(parsed.name).toBe('Complementary');
      expect(parsed.colors).toHaveLength(2);
    });

    it('should export as CSS', () => {
      const exported = exportPalette(palette, 'css');
      expect(exported).toContain('--color-complementary-1: #ff0000;');
      expect(exported).toContain('--color-complementary-2: #00ffff;');
    });

    it('should export as SCSS', () => {
      const exported = exportPalette(palette, 'scss');
      expect(exported).toContain('$color-complementary-1: #ff0000;');
      expect(exported).toContain('$color-complementary-2: #00ffff;');
    });
  });
});
