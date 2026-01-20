import chroma from 'chroma-js';
import { ColorFormats, convertColor, ColorInput } from './colorConverter';

export interface PaletteOptions {
  count?: number;
  angle?: number;
}

export interface ColorPalette {
  name: string;
  colors: ColorFormats[];
}

// Basic color harmony functions
export const generateComplementary = (input: ColorInput): ColorPalette => {
  const baseColor = chroma(convertColor(input).hex);
  const complementary = baseColor.set('hsl.h', '+180');
  
  return {
    name: 'Complementary',
    colors: [
      convertColor(input),
      convertColor(complementary.hex())
    ]
  };
};

export const generateAnalogous = (input: ColorInput, options: PaletteOptions = {}): ColorPalette => {
  const { count = 3, angle = 30 } = options;
  const baseColor = chroma(convertColor(input).hex);
  const colors: ColorFormats[] = [convertColor(input)];
  
  for (let i = 1; i < count; i++) {
    const newColor = baseColor.set('hsl.h', `+${angle * i}`);
    colors.push(convertColor(newColor.hex()));
  }
  
  return {
    name: 'Analogous',
    colors
  };
};

export const generateTriadic = (input: ColorInput): ColorPalette => {
  const baseColor = chroma(convertColor(input).hex);
  const triadic1 = baseColor.set('hsl.h', '+120');
  const triadic2 = baseColor.set('hsl.h', '+240');
  
  return {
    name: 'Triadic',
    colors: [
      convertColor(input),
      convertColor(triadic1.hex()),
      convertColor(triadic2.hex())
    ]
  };
};

// Advanced color harmony functions
export const generateSplitComplementary = (input: ColorInput): ColorPalette => {
  const baseColor = chroma(convertColor(input).hex);
  const split1 = baseColor.set('hsl.h', '+150');
  const split2 = baseColor.set('hsl.h', '+210');
  
  return {
    name: 'Split Complementary',
    colors: [
      convertColor(input),
      convertColor(split1.hex()),
      convertColor(split2.hex())
    ]
  };
};

export const generateTetradic = (input: ColorInput): ColorPalette => {
  const baseColor = chroma(convertColor(input).hex);
  const tetradic1 = baseColor.set('hsl.h', '+90');
  const tetradic2 = baseColor.set('hsl.h', '+180');
  const tetradic3 = baseColor.set('hsl.h', '+270');
  
  return {
    name: 'Tetradic',
    colors: [
      convertColor(input),
      convertColor(tetradic1.hex()),
      convertColor(tetradic2.hex()),
      convertColor(tetradic3.hex())
    ]
  };
};

export const generateMonochromatic = (input: ColorInput, options: PaletteOptions = {}): ColorPalette => {
  const { count = 5 } = options;
  const baseColor = chroma(convertColor(input).hex);
  const colors: ColorFormats[] = [];
  
  for (let i = 0; i < count; i++) {
    const lightness = 0.2 + (0.6 * i / (count - 1));
    const newColor = baseColor.set('hsl.l', lightness);
    colors.push(convertColor(newColor.hex()));
  }
  
  return {
    name: 'Monochromatic',
    colors
  };
};

// Palette generation with all algorithms
export const generateAllPalettes = (input: ColorInput): ColorPalette[] => {
  return [
    generateComplementary(input),
    generateAnalogous(input),
    generateTriadic(input),
    generateSplitComplementary(input),
    generateTetradic(input),
    generateMonochromatic(input)
  ];
};

// Export palette to different formats
export const exportPalette = (palette: ColorPalette, format: 'json' | 'css' | 'scss' = 'json'): string => {
  switch (format) {
    case 'css':
      return palette.colors.map((color, index) => 
        `--color-${palette.name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}: ${color.hex};`
      ).join('\n');
    
    case 'scss':
      return palette.colors.map((color, index) => 
        `$color-${palette.name.toLowerCase().replace(/\s+/g, '-')}-${index + 1}: ${color.hex};`
      ).join('\n');
    
    case 'json':
    default:
      return JSON.stringify(palette, null, 2);
  }
};
