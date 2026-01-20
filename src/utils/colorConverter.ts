import chroma from 'chroma-js';

// Color format types
export interface RGBColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface HSLColor {
  h: number;
  s: number;
  l: number;
  a?: number;
}

export interface HSVColor {
  h: number;
  s: number;
  v: number;
  a?: number;
}

export interface CMYKColor {
  c: number;
  m: number;
  y: number;
  k: number;
}

export interface LABColor {
  l: number;
  a: number;
  b: number;
}

export interface ColorFormats {
  hex: string;
  rgb: RGBColor;
  hsl: HSLColor;
  hsv: HSVColor;
  cmyk: CMYKColor;
  lab: LABColor;
}

export type ColorInput = string | RGBColor | HSLColor | HSVColor | CMYKColor | LABColor;

// Validation functions
export const isValidHex = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{3}){1,2}$/.test(hex);
};

export const isValidRGB = (rgb: RGBColor): boolean => {
  return rgb.r >= 0 && rgb.r <= 255 && 
         rgb.g >= 0 && rgb.g <= 255 && 
         rgb.b >= 0 && rgb.b <= 255;
};

export const isValidHSL = (hsl: HSLColor): boolean => {
  return hsl.h >= 0 && hsl.h <= 360 && 
         hsl.s >= 0 && hsl.s <= 100 && 
         hsl.l >= 0 && hsl.l <= 100;
};

export const isValidHSV = (hsv: HSVColor): boolean => {
  return hsv.h >= 0 && hsv.h <= 360 && 
         hsv.s >= 0 && hsv.s <= 100 && 
         hsv.v >= 0 && hsv.v <= 100;
};

export const isValidCMYK = (cmyk: CMYKColor): boolean => {
  return cmyk.c >= 0 && cmyk.c <= 100 && 
         cmyk.m >= 0 && cmyk.m <= 100 && 
         cmyk.y >= 0 && cmyk.y <= 100 && 
         cmyk.k >= 0 && cmyk.k <= 100;
};

export const isValidLAB = (lab: LABColor): boolean => {
  return lab.l >= 0 && lab.l <= 100 && 
         lab.a >= -128 && lab.a <= 127 && 
         lab.b >= -128 && lab.b <= 127;
};

// Core conversion functions with high precision
export const convertColor = (input: ColorInput, precision = 2): ColorFormats => {
  try {
    let color: chroma.Color;
    
    if (typeof input === 'string') {
      if (!isValidHex(input)) {
        throw new Error('Invalid hex color format');
      }
      color = chroma(input);
    } else if ('r' in input) {
      if (!isValidRGB(input)) {
        throw new Error('Invalid RGB values');
      }
      color = chroma.rgb(input.r, input.g, input.b);
    } else if ('h' in input && 's' in input && 'l' in input) {
      if (!isValidHSL(input)) {
        throw new Error('Invalid HSL values');
      }
      color = chroma.hsl(input.h, input.s / 100, input.l / 100);
    } else if ('h' in input && 's' in input && 'v' in input) {
      if (!isValidHSV(input)) {
        throw new Error('Invalid HSV values');
      }
      color = chroma.hsv(input.h, input.s / 100, input.v / 100);
    } else if ('c' in input && 'm' in input && 'y' in input && 'k' in input) {
      if (!isValidCMYK(input)) {
        throw new Error('Invalid CMYK values');
      }
      // Convert CMYK to RGB first
      const c = input.c / 100;
      const m = input.m / 100;
      const y = input.y / 100;
      const k = input.k / 100;
      
      const r = 255 * (1 - c) * (1 - k);
      const g = 255 * (1 - m) * (1 - k);
      const b = 255 * (1 - y) * (1 - k);
      
      color = chroma.rgb(r, g, b);
    } else if ('l' in input && 'a' in input && 'b' in input) {
      if (!isValidLAB(input)) {
        throw new Error('Invalid LAB values');
      }
      color = chroma.lab(input.l, input.a, input.b);
    } else {
      throw new Error('Unsupported color format');
    }

    const [r, g, b] = color.rgb();
    const [h, s, l] = color.hsl();
    const [h2, s2, v] = color.hsv();
    const [labL, labA, labB] = color.lab();

    // High precision CMYK conversion
    const cVal = (255 - r) / 255;
    const mVal = (255 - g) / 255;
    const yVal = (255 - b) / 255;
    const kVal = Math.min(cVal, mVal, yVal);
    
    const cmyk = {
      c: parseFloat(((cVal - kVal) / (1 - kVal) * 100 || 0).toFixed(precision)),
      m: parseFloat(((mVal - kVal) / (1 - kVal) * 100 || 0).toFixed(precision)),
      y: parseFloat(((yVal - kVal) / (1 - kVal) * 100 || 0).toFixed(precision)),
      k: parseFloat((kVal * 100).toFixed(precision))
    };

    return {
      hex: color.hex(),
      rgb: { 
        r: parseFloat(r.toFixed(precision)), 
        g: parseFloat(g.toFixed(precision)), 
        b: parseFloat(b.toFixed(precision)) 
      },
      hsl: { 
        h: parseFloat((h || 0).toFixed(precision)), 
        s: parseFloat(((s || 0) * 100).toFixed(precision)), 
        l: parseFloat((l * 100).toFixed(precision)) 
      },
      hsv: { 
        h: parseFloat((h2 || 0).toFixed(precision)), 
        s: parseFloat((s2 * 100).toFixed(precision)), 
        v: parseFloat((v * 100).toFixed(precision)) 
      },
      cmyk,
      lab: { 
        l: parseFloat(labL.toFixed(precision)), 
        a: parseFloat(labA.toFixed(precision)), 
        b: parseFloat(labB.toFixed(precision)) 
      }
    };
  } catch (error) {
    throw new Error(`Color conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Format-specific conversion functions
export const hexToRgb = (hex: string): RGBColor => {
  const result = convertColor(hex);
  return result.rgb;
};

export const rgbToHex = (rgb: RGBColor): string => {
  const result = convertColor(rgb);
  return result.hex;
};

export const hslToRgb = (hsl: HSLColor): RGBColor => {
  const result = convertColor(hsl);
  return result.rgb;
};

export const rgbToHsl = (rgb: RGBColor): HSLColor => {
  const result = convertColor(rgb);
  return result.hsl;
};

export const hsvToRgb = (hsv: HSVColor): RGBColor => {
  const result = convertColor(hsv);
  return result.rgb;
};

export const rgbToHsv = (rgb: RGBColor): HSVColor => {
  const result = convertColor(rgb);
  return result.hsv;
};

export const cmykToRgb = (cmyk: CMYKColor): RGBColor => {
  const result = convertColor(cmyk);
  return result.rgb;
};

export const rgbToCmyk = (rgb: RGBColor): CMYKColor => {
  const result = convertColor(rgb);
  return result.cmyk;
};

export const labToRgb = (lab: LABColor): RGBColor => {
  const result = convertColor(lab);
  return result.rgb;
};

export const rgbToLab = (rgb: RGBColor): LABColor => {
  const result = convertColor(rgb);
  return result.lab;
};

// Format detection utility
export const detectColorFormat = (input: string): string | null => {
  if (isValidHex(input)) return 'hex';
  
  // Try to parse as RGB
  const rgbMatch = input.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (rgbMatch) return 'rgb';
  
  // Try to parse as HSL
  const hslMatch = input.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (hslMatch) return 'hsl';
  
  return null;
};
