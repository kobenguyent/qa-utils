import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getCachedConversion,
  getContrastRatio,
  getWCAGLevel,
  analyzeAccessibility,
  simulateColorBlindness,
  simulateAllColorBlindness,
  calculateDeltaE,
  getColorDifferenceDescription,
  clearConversionCache,
  getCacheStats
} from '../colorAccessibility';

describe('Color Accessibility', () => {
  beforeEach(() => {
    clearConversionCache();
  });

  describe('Performance Cache', () => {
    it('should cache color conversions', () => {
      const color = '#ff0000';
      const result1 = getCachedConversion(color);
      const result2 = getCachedConversion(color);
      
      expect(result1).toEqual(result2);
      expect(getCacheStats().size).toBe(1);
    });

    it('should clear cache', () => {
      getCachedConversion('#ff0000');
      expect(getCacheStats().size).toBe(1);
      
      clearConversionCache();
      expect(getCacheStats().size).toBe(0);
    });
  });

  describe('Contrast Ratio', () => {
    it('should calculate contrast ratio correctly', () => {
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBe(21); // Maximum contrast ratio
    });

    it('should calculate contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#ff0000', '#ff0000');
      expect(ratio).toBe(1); // Minimum contrast ratio
    });
  });

  describe('WCAG Levels', () => {
    it('should determine WCAG level for normal text', () => {
      expect(getWCAGLevel(7, 'normal')).toBe('AAA');
      expect(getWCAGLevel(4.5, 'normal')).toBe('AA');
      expect(getWCAGLevel(3, 'normal')).toBe('Fail');
    });

    it('should determine WCAG level for large text', () => {
      expect(getWCAGLevel(4.5, 'large')).toBe('AAA');
      expect(getWCAGLevel(3, 'large')).toBe('AA');
      expect(getWCAGLevel(2, 'large')).toBe('Fail');
    });
  });

  describe('Accessibility Analysis', () => {
    it('should analyze accessibility correctly', () => {
      const analysis = analyzeAccessibility('#000000', '#ffffff');
      
      expect(analysis.contrastRatio).toBe(21);
      expect(analysis.wcagLevel).toBe('AAA');
      expect(analysis.wcagLevelLarge).toBe('AAA');
      expect(analysis.isReadable).toBe(true);
      expect(analysis.isReadableLarge).toBe(true);
    });

    it('should identify poor contrast', () => {
      const analysis = analyzeAccessibility('#ff0000', '#ff8080');
      
      expect(analysis.wcagLevel).toBe('Fail');
      expect(analysis.isReadable).toBe(false);
    });
  });

  describe('Color Blindness Simulation', () => {
    const testColor = '#ff0000';

    it('should simulate protanopia', () => {
      const result = simulateColorBlindness(testColor, 'protanopia');
      expect(result.hex).not.toBe(testColor);
      expect(result.rgb.r).not.toBe(255); // Red channel modified
    });

    it('should simulate deuteranopia', () => {
      const result = simulateColorBlindness(testColor, 'deuteranopia');
      expect(result.hex).not.toBe(testColor);
      expect(result.rgb.g).not.toBe(0); // Green channel modified
    });

    it('should simulate tritanopia', () => {
      const result = simulateColorBlindness(testColor, 'tritanopia');
      expect(result.hex).toBe(testColor); // Red color unchanged for tritanopia
      expect(result.rgb.b).toBe(0); // Blue channel unchanged for pure red
    });

    it('should simulate all color blindness types', () => {
      const simulation = simulateAllColorBlindness(testColor);
      
      expect(simulation.original.hex).toBe('#ff0000');
      expect(simulation.protanopia.hex).not.toBe('#ff0000');
      expect(simulation.deuteranopia.hex).not.toBe('#ff0000');
      expect(simulation.tritanopia.hex).toBe('#ff0000'); // Red unchanged for tritanopia
    });
  });

  describe('Delta E Calculations', () => {
    it('should calculate Delta E for identical colors', () => {
      const deltaE = calculateDeltaE('#ff0000', '#ff0000');
      expect(deltaE).toBe(0);
    });

    it('should calculate Delta E for different colors', () => {
      const deltaE = calculateDeltaE('#ff0000', '#00ff00');
      expect(deltaE).toBeGreaterThan(0);
    });

    it('should describe color differences', () => {
      expect(getColorDifferenceDescription(0.5)).toBe('Not perceptible');
      expect(getColorDifferenceDescription(1.5)).toBe('Perceptible through close observation');
      expect(getColorDifferenceDescription(5)).toBe('Perceptible at a glance');
      expect(getColorDifferenceDescription(25)).toBe('Colors are more similar than opposite');
      expect(getColorDifferenceDescription(50)).toBe('Colors are exact opposite');
    });
  });
});
