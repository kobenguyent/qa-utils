import chroma from 'chroma-js';
import { ColorFormats, convertColor, ColorInput } from './colorConverter';

// Performance cache for color conversions
const conversionCache = new Map<string, ColorFormats>();
const maxCacheSize = 1000;

export const getCachedConversion = (input: ColorInput): ColorFormats => {
  const key = JSON.stringify(input);
  
  if (conversionCache.has(key)) {
    return conversionCache.get(key)!;
  }
  
  const result = convertColor(input);
  
  if (conversionCache.size >= maxCacheSize) {
    const firstKey = conversionCache.keys().next().value;
    conversionCache.delete(firstKey);
  }
  
  conversionCache.set(key, result);
  return result;
};

// WCAG contrast ratio calculations
export const getContrastRatio = (color1: ColorInput, color2: ColorInput): number => {
  const c1 = chroma(convertColor(color1).hex);
  const c2 = chroma(convertColor(color2).hex);
  
  return chroma.contrast(c1, c2);
};

export const getWCAGLevel = (contrastRatio: number, fontSize: 'normal' | 'large' = 'normal'): string => {
  if (fontSize === 'large') {
    if (contrastRatio >= 4.5) return 'AAA';
    if (contrastRatio >= 3) return 'AA';
  } else {
    if (contrastRatio >= 7) return 'AAA';
    if (contrastRatio >= 4.5) return 'AA';
  }
  return 'Fail';
};

export interface AccessibilityAnalysis {
  contrastRatio: number;
  wcagLevel: string;
  wcagLevelLarge: string;
  isReadable: boolean;
  isReadableLarge: boolean;
}

export const analyzeAccessibility = (foreground: ColorInput, background: ColorInput): AccessibilityAnalysis => {
  const contrastRatio = getContrastRatio(foreground, background);
  const wcagLevel = getWCAGLevel(contrastRatio, 'normal');
  const wcagLevelLarge = getWCAGLevel(contrastRatio, 'large');
  
  return {
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    wcagLevel,
    wcagLevelLarge,
    isReadable: wcagLevel !== 'Fail',
    isReadableLarge: wcagLevelLarge !== 'Fail'
  };
};

// Color blindness simulation
export const simulateColorBlindness = (input: ColorInput, type: 'protanopia' | 'deuteranopia' | 'tritanopia'): ColorFormats => {
  const color = chroma(convertColor(input).hex);
  let simulatedColor: chroma.Color;
  
  switch (type) {
    case 'protanopia':
      // Simulate red-blind (remove red channel influence)
      simulatedColor = chroma.rgb(0, color.get('rgb.g'), color.get('rgb.b'));
      break;
    case 'deuteranopia':
      // Simulate green-blind (remove green channel influence)
      simulatedColor = chroma.rgb(color.get('rgb.r'), 0, color.get('rgb.b'));
      break;
    case 'tritanopia':
      // Simulate blue-blind (remove blue channel influence)
      simulatedColor = chroma.rgb(color.get('rgb.r'), color.get('rgb.g'), 0);
      break;
    default:
      simulatedColor = color;
  }
  
  return convertColor(simulatedColor.hex());
};

export interface ColorBlindnessSimulation {
  original: ColorFormats;
  protanopia: ColorFormats;
  deuteranopia: ColorFormats;
  tritanopia: ColorFormats;
}

export const simulateAllColorBlindness = (input: ColorInput): ColorBlindnessSimulation => {
  return {
    original: convertColor(input),
    protanopia: simulateColorBlindness(input, 'protanopia'),
    deuteranopia: simulateColorBlindness(input, 'deuteranopia'),
    tritanopia: simulateColorBlindness(input, 'tritanopia')
  };
};

// Delta E color difference calculation
export const calculateDeltaE = (color1: ColorInput, color2: ColorInput): number => {
  const c1 = chroma(convertColor(color1).hex);
  const c2 = chroma(convertColor(color2).hex);
  
  return chroma.deltaE(c1, c2);
};

export const getColorDifferenceDescription = (deltaE: number): string => {
  if (deltaE < 1) return 'Not perceptible';
  if (deltaE < 2) return 'Perceptible through close observation';
  if (deltaE < 10) return 'Perceptible at a glance';
  if (deltaE < 49) return 'Colors are more similar than opposite';
  return 'Colors are exact opposite';
};

// Performance utilities
export const clearConversionCache = (): void => {
  conversionCache.clear();
};

export const getCacheStats = (): { size: number; maxSize: number } => {
  return {
    size: conversionCache.size,
    maxSize: maxCacheSize
  };
};
