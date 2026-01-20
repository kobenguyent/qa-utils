import { describe, it, expect } from 'vitest';
import { 
  convertColor, 
  isValidHex, 
  isValidRGB, 
  isValidHSL, 
  isValidHSV, 
  isValidCMYK, 
  isValidLAB,
  hexToRgb,
  rgbToHex,
  hslToRgb,
  rgbToHsl,
  hsvToRgb,
  rgbToHsv,
  cmykToRgb,
  rgbToCmyk,
  labToRgb,
  rgbToLab,
  detectColorFormat
} from '../colorConverter';

describe('Color Converter', () => {
  describe('Validation Functions', () => {
    it('should validate hex colors correctly', () => {
      expect(isValidHex('#ffffff')).toBe(true);
      expect(isValidHex('#fff')).toBe(true);
      expect(isValidHex('#FF0000')).toBe(true);
      expect(isValidHex('ffffff')).toBe(false);
      expect(isValidHex('#gggggg')).toBe(false);
      expect(isValidHex('#12345')).toBe(false);
    });

    it('should validate RGB colors correctly', () => {
      expect(isValidRGB({ r: 255, g: 0, b: 0 })).toBe(true);
      expect(isValidRGB({ r: 0, g: 255, b: 255 })).toBe(true);
      expect(isValidRGB({ r: -1, g: 0, b: 0 })).toBe(false);
      expect(isValidRGB({ r: 256, g: 0, b: 0 })).toBe(false);
    });

    it('should validate HSL colors correctly', () => {
      expect(isValidHSL({ h: 0, s: 100, l: 50 })).toBe(true);
      expect(isValidHSL({ h: 360, s: 0, l: 100 })).toBe(true);
      expect(isValidHSL({ h: -1, s: 50, l: 50 })).toBe(false);
      expect(isValidHSL({ h: 361, s: 50, l: 50 })).toBe(false);
      expect(isValidHSL({ h: 180, s: 101, l: 50 })).toBe(false);
    });

    it('should validate HSV colors correctly', () => {
      expect(isValidHSV({ h: 0, s: 100, v: 100 })).toBe(true);
      expect(isValidHSV({ h: 360, s: 0, v: 0 })).toBe(true);
      expect(isValidHSV({ h: -1, s: 50, v: 50 })).toBe(false);
      expect(isValidHSV({ h: 180, s: 101, v: 50 })).toBe(false);
    });

    it('should validate CMYK colors correctly', () => {
      expect(isValidCMYK({ c: 0, m: 100, y: 100, k: 0 })).toBe(true);
      expect(isValidCMYK({ c: 100, m: 0, y: 0, k: 100 })).toBe(true);
      expect(isValidCMYK({ c: -1, m: 50, y: 50, k: 50 })).toBe(false);
      expect(isValidCMYK({ c: 50, m: 101, y: 50, k: 50 })).toBe(false);
    });

    it('should validate LAB colors correctly', () => {
      expect(isValidLAB({ l: 50, a: 0, b: 0 })).toBe(true);
      expect(isValidLAB({ l: 100, a: 127, b: -128 })).toBe(true);
      expect(isValidLAB({ l: -1, a: 0, b: 0 })).toBe(false);
      expect(isValidLAB({ l: 101, a: 0, b: 0 })).toBe(false);
      expect(isValidLAB({ l: 50, a: 128, b: 0 })).toBe(false);
    });
  });

  describe('Color Conversion', () => {
    it('should convert hex to all formats', () => {
      const result = convertColor('#ff0000');
      expect(result.hex).toBe('#ff0000');
      expect(result.rgb.r).toBe(255);
      expect(result.rgb.g).toBe(0);
      expect(result.rgb.b).toBe(0);
      expect(result.hsl.h).toBe(0);
      expect(result.hsl.s).toBe(100);
      expect(result.hsl.l).toBe(50);
    });

    it('should convert RGB to all formats', () => {
      const result = convertColor({ r: 0, g: 255, b: 0 });
      expect(result.hex).toBe('#00ff00');
      expect(result.rgb.r).toBe(0);
      expect(result.rgb.g).toBe(255);
      expect(result.rgb.b).toBe(0);
      expect(result.hsl.h).toBe(120);
    });

    it('should convert HSL to all formats', () => {
      const result = convertColor({ h: 240, s: 100, l: 50 });
      expect(result.hex).toBe('#0000ff');
      expect(result.rgb.r).toBe(0);
      expect(result.rgb.g).toBe(0);
      expect(result.rgb.b).toBe(255);
    });

    it('should handle precision parameter', () => {
      const result = convertColor('#ff8080', 1);
      expect(result.rgb.r).toBe(255);
      expect(result.rgb.g).toBe(128);
      expect(result.rgb.b).toBe(128);
    });

    it('should throw error for invalid input', () => {
      expect(() => convertColor('#invalid')).toThrow();
      expect(() => convertColor({ r: -1, g: 0, b: 0 })).toThrow();
    });
  });

  describe('Format-specific conversions', () => {
    it('should convert hex to RGB', () => {
      const rgb = hexToRgb('#ff0000');
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should convert RGB to hex', () => {
      const hex = rgbToHex({ r: 255, g: 0, b: 0 });
      expect(hex).toBe('#ff0000');
    });

    it('should convert HSL to RGB', () => {
      const rgb = hslToRgb({ h: 0, s: 100, l: 50 });
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it('should convert RGB to HSL', () => {
      const hsl = rgbToHsl({ r: 255, g: 0, b: 0 });
      expect(hsl.h).toBe(0);
      expect(hsl.s).toBe(100);
      expect(hsl.l).toBe(50);
    });
  });

  describe('Format Detection', () => {
    it('should detect hex format', () => {
      expect(detectColorFormat('#ffffff')).toBe('hex');
      expect(detectColorFormat('#fff')).toBe('hex');
    });

    it('should detect RGB format', () => {
      expect(detectColorFormat('rgb(255, 0, 0)')).toBe('rgb');
    });

    it('should detect HSL format', () => {
      expect(detectColorFormat('hsl(0, 100%, 50%)')).toBe('hsl');
    });

    it('should return null for unknown format', () => {
      expect(detectColorFormat('invalid')).toBe(null);
    });
  });
});
