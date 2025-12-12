/**
 * Utility functions for testing CSS color variables
 */

/**
 * Extracts HSL values from a CSS HSL color string
 * @param hslString - HSL color string in format "H S% L%" or "H S% L% / A"
 * @returns Object with h, s, l values (and optional a for alpha)
 */
export function extractHSL(hslString: string): { h: number; s: number; l: number; a?: number } {
  // Remove any whitespace and normalize
  const normalized = hslString.trim();
  
  // Match HSL pattern: "H S% L%" or "H S% L% / A"
  const hslPattern = /^(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%(?:\s*\/\s*(\d+(?:\.\d+)?))?$/;
  const match = normalized.match(hslPattern);
  
  if (!match) {
    throw new Error(`Invalid HSL format: ${hslString}`);
  }
  
  const h = parseFloat(match[1]);
  const s = parseFloat(match[2]);
  const l = parseFloat(match[3]);
  const a = match[4] ? parseFloat(match[4]) : undefined;
  
  return { h, s, l, a };
}

/**
 * Checks if a string is in valid HSL format
 * @param value - String to check
 * @returns true if valid HSL format
 */
export function isValidHSL(value: string): boolean {
  try {
    extractHSL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Converts HSL to RGB for contrast calculation
 * @param h - Hue (0-360)
 * @param s - Saturation (0-100)
 * @param l - Lightness (0-100)
 * @returns RGB values as [r, g, b] where each is 0-255
 */
export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  // Normalize values
  h = h / 360;
  s = s / 100;
  l = l / 100;
  
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Calculates relative luminance for WCAG contrast calculation
 * @param rgb - RGB values as [r, g, b] where each is 0-255
 * @returns Relative luminance value
 */
export function getRelativeLuminance(rgb: [number, number, number]): number {
  const [r, g, b] = rgb.map(val => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates WCAG contrast ratio between two colors
 * @param color1 - First color in HSL format "H S% L%"
 * @param color2 - Second color in HSL format "H S% L%"
 * @returns Contrast ratio (1-21)
 */
export function calculateContrastRatio(color1: string, color2: string): number {
  const hsl1 = extractHSL(color1);
  const hsl2 = extractHSL(color2);
  
  const rgb1 = hslToRgb(hsl1.h, hsl1.s, hsl1.l);
  const rgb2 = hslToRgb(hsl2.h, hsl2.s, hsl2.l);
  
  const lum1 = getRelativeLuminance(rgb1);
  const lum2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Extracts CSS variables from CSS content
 * @param cssContent - CSS file content
 * @returns Map of variable names to values
 */
export function extractCSSVariables(cssContent: string): Map<string, string> {
  const variables = new Map<string, string>();
  
  // Match CSS custom properties: --variable-name: value;
  const variablePattern = /--([\w-]+):\s*([^;]+);/g;
  let match;
  
  while ((match = variablePattern.exec(cssContent)) !== null) {
    const name = match[1];
    const value = match[2].trim();
    variables.set(name, value);
  }
  
  return variables;
}

/**
 * Extracts color variables (those with HSL values) from CSS content
 * @param cssContent - CSS file content
 * @returns Map of color variable names to HSL values
 */
export function extractColorVariables(cssContent: string): Map<string, string> {
  const allVariables = extractCSSVariables(cssContent);
  const colorVariables = new Map<string, string>();
  
  for (const [name, value] of allVariables) {
    // Check if the value looks like an HSL color (contains numbers and %)
    if (isValidHSL(value)) {
      colorVariables.set(name, value);
    }
  }
  
  return colorVariables;
}

/**
 * Gets color variables from a specific mode (light or dark)
 * @param cssContent - CSS file content
 * @param mode - 'light' for :root or 'dark' for .dark
 * @returns Map of color variable names to HSL values
 */
export function getColorVariablesByMode(cssContent: string, mode: 'light' | 'dark'): Map<string, string> {
  const selector = mode === 'light' ? ':root' : '.dark';
  
  // Extract the section for the specified mode
  const selectorPattern = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]+)\\}`, 's');
  const match = cssContent.match(selectorPattern);
  
  if (!match) {
    return new Map();
  }
  
  const sectionContent = match[1];
  return extractColorVariables(sectionContent);
}
