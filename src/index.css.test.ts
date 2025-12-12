/**
 * Property-based tests and unit tests for color palette
 * Feature: blue-color-palette
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  extractCSSVariables,
  extractColorVariables,
  getColorVariablesByMode,
  isValidHSL,
  extractHSL,
  calculateContrastRatio,
} from './utils/css-test-utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the CSS file
const cssFilePath = join(__dirname, 'index.css');
const cssContent = readFileSync(cssFilePath, 'utf-8');

// Store original variables for comparison
const originalVariables = extractCSSVariables(cssContent);

/**
 * Unit Tests for Light Mode Colors
 * Requirements: 1.1, 1.3
 */
describe('Unit Tests: Light Mode Colors', () => {
  it('should have --background as light blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const background = lightModeColors.get('background');
    
    expect(background).toBeDefined();
    
    const hsl = extractHSL(background!);
    
    // Should be light (high lightness)
    expect(hsl.l).toBeGreaterThan(90);
    
    // Should be blue hue (200-240)
    expect(hsl.h).toBeGreaterThanOrEqual(200);
    expect(hsl.h).toBeLessThanOrEqual(240);
  });
  
  it('should have --primary as medium blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const primary = lightModeColors.get('primary');
    
    expect(primary).toBeDefined();
    
    const hsl = extractHSL(primary!);
    
    // Should be medium lightness (around 50-60%)
    expect(hsl.l).toBeGreaterThanOrEqual(45);
    expect(hsl.l).toBeLessThanOrEqual(65);
    
    // Should be blue hue (200-240)
    expect(hsl.h).toBeGreaterThanOrEqual(200);
    expect(hsl.h).toBeLessThanOrEqual(240);
    
    // Should be vibrant (high saturation)
    expect(hsl.s).toBeGreaterThan(60);
  });
  
  it('should have all required color variables', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    
    const requiredVariables = [
      'background',
      'foreground',
      'primary',
      'secondary',
      'accent',
      'muted',
      'card',
      'border',
    ];
    
    for (const varName of requiredVariables) {
      expect(lightModeColors.has(varName)).toBe(true);
      expect(lightModeColors.get(varName)).toBeDefined();
    }
  });
  
  it('should have --foreground as dark blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const foreground = lightModeColors.get('foreground');
    
    expect(foreground).toBeDefined();
    
    const hsl = extractHSL(foreground!);
    
    // Should be dark (low lightness)
    expect(hsl.l).toBeLessThan(30);
    
    // Should be blue hue (200-240)
    expect(hsl.h).toBeGreaterThanOrEqual(200);
    expect(hsl.h).toBeLessThanOrEqual(240);
  });
  
  it('should have --secondary as light blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const secondary = lightModeColors.get('secondary');
    
    expect(secondary).toBeDefined();
    
    const hsl = extractHSL(secondary!);
    
    // Should be light (high lightness)
    expect(hsl.l).toBeGreaterThanOrEqual(65);
    expect(hsl.l).toBeLessThanOrEqual(75);
    
    // Should be blue hue (200-240)
    expect(hsl.h).toBeGreaterThanOrEqual(200);
    expect(hsl.h).toBeLessThanOrEqual(240);
  });
  
  it('should have --accent as cyan blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const accent = lightModeColors.get('accent');
    
    expect(accent).toBeDefined();
    
    const hsl = extractHSL(accent!);
    
    // Cyan is around 180-200 hue, but we're using blue-cyan (190-200)
    expect(hsl.h).toBeGreaterThanOrEqual(190);
    expect(hsl.h).toBeLessThanOrEqual(200);
    
    // Should be vibrant
    expect(hsl.s).toBeGreaterThan(60);
  });
  
  it('should have --muted as light grayish blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const muted = lightModeColors.get('muted');
    
    expect(muted).toBeDefined();
    
    const hsl = extractHSL(muted!);
    
    // Should be light
    expect(hsl.l).toBeGreaterThanOrEqual(85);
    
    // Should have low saturation (grayish)
    expect(hsl.s).toBeLessThanOrEqual(25);
  });
  
  it('should have --card as bluish white', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const card = lightModeColors.get('card');
    
    expect(card).toBeDefined();
    
    const hsl = extractHSL(card!);
    
    // Should be very light (almost white)
    expect(hsl.l).toBeGreaterThanOrEqual(98);
  });
  
  it('should have --border as soft light blue', () => {
    const lightModeColors = getColorVariablesByMode(cssContent, 'light');
    const border = lightModeColors.get('border');
    
    expect(border).toBeDefined();
    
    const hsl = extractHSL(border!);
    
    // Should be light
    expect(hsl.l).toBeGreaterThanOrEqual(82);
    expect(hsl.l).toBeLessThanOrEqual(88);
    
    // Should be blue hue
    expect(hsl.h).toBeGreaterThanOrEqual(200);
    expect(hsl.h).toBeLessThanOrEqual(240);
  });
});

/**
 * Feature: blue-color-palette, Property 1: All color variables use HSL format
 * Validates: Requirements 2.1
 * 
 * Property: For any color variable defined in the CSS, the value should follow
 * the HSL format pattern (H S% L%) where H is a number, S is a percentage,
 * and L is a percentage.
 */
describe('Property 1: HSL Format Validation', () => {
  it('should verify all color variables use valid HSL format', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const lightModeColors = getColorVariablesByMode(cssContent, 'light');
          const darkModeColors = getColorVariablesByMode(cssContent, 'dark');
          
          // Combine all color variables
          const allColorVars = new Map([...lightModeColors, ...darkModeColors]);
          
          // Check each color variable
          for (const [name, value] of allColorVars) {
            // Skip gradient and shadow variables (they contain multiple colors or special syntax)
            if (name.includes('gradient') || name.includes('shadow')) {
              continue;
            }
            
            // Verify HSL format
            if (!isValidHSL(value)) {
              throw new Error(
                `Color variable --${name} has invalid HSL format: "${value}". Expected format: "H S% L%"`
              );
            }
            
            // Verify HSL values are in valid ranges
            const hsl = extractHSL(value);
            
            if (hsl.h < 0 || hsl.h > 360) {
              throw new Error(
                `Color variable --${name} has invalid hue: ${hsl.h}. Must be 0-360.`
              );
            }
            
            if (hsl.s < 0 || hsl.s > 100) {
              throw new Error(
                `Color variable --${name} has invalid saturation: ${hsl.s}%. Must be 0-100%.`
              );
            }
            
            if (hsl.l < 0 || hsl.l > 100) {
              throw new Error(
                `Color variable --${name} has invalid lightness: ${hsl.l}%. Must be 0-100%.`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: blue-color-palette, Property 2: All original CSS variables are preserved
 * Validates: Requirements 2.2
 * 
 * Property: For any CSS variable that existed in the original design system,
 * that variable should still exist after the color palette change with the
 * same variable name.
 */
describe('Property 2: CSS Variable Preservation', () => {
  it('should verify all original CSS variables are preserved', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const currentVariables = extractCSSVariables(cssContent);
          
          // List of expected core variables that must exist
          const requiredVariables = [
            'background',
            'foreground',
            'card',
            'card-foreground',
            'popover',
            'popover-foreground',
            'primary',
            'primary-foreground',
            'secondary',
            'secondary-foreground',
            'accent',
            'accent-foreground',
            'muted',
            'muted-foreground',
            'destructive',
            'destructive-foreground',
            'border',
            'input',
            'ring',
            'radius',
          ];
          
          // Check that all required variables exist
          for (const varName of requiredVariables) {
            if (!currentVariables.has(varName)) {
              throw new Error(
                `Required CSS variable --${varName} is missing from the design system`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify gradient variables are preserved', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const currentVariables = extractCSSVariables(cssContent);
          
          const requiredGradients = [
            'gradient-orkut',
            'gradient-city',
            'gradient-morning',
            'gradient-afternoon',
            'gradient-evening',
            'gradient-night',
          ];
          
          for (const gradientName of requiredGradients) {
            if (!currentVariables.has(gradientName)) {
              throw new Error(
                `Required gradient variable --${gradientName} is missing`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify shadow variables are preserved', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const currentVariables = extractCSSVariables(cssContent);
          
          const requiredShadows = [
            'shadow-card',
            'shadow-elevated',
            'shadow-glow',
          ];
          
          for (const shadowName of requiredShadows) {
            if (!currentVariables.has(shadowName)) {
              throw new Error(
                `Required shadow variable --${shadowName} is missing`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify badge color variables are preserved', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const currentVariables = extractCSSVariables(cssContent);
          
          const requiredBadges = [
            'badge-poet',
            'badge-chronicler',
            'badge-humorist',
            'badge-star',
          ];
          
          for (const badgeName of requiredBadges) {
            if (!currentVariables.has(badgeName)) {
              throw new Error(
                `Required badge variable --${badgeName} is missing`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: blue-color-palette, Property 3: Text contrast meets accessibility standards
 * Validates: Requirements 1.4
 * 
 * Property: For any combination of foreground and background colors in both
 * light and dark modes, the contrast ratio should meet WCAG AA standards
 * (minimum 4.5:1 for normal text).
 */
describe('Property 3: Accessibility Contrast', () => {
  it('should verify light mode text contrast meets WCAG AA standards', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const lightModeColors = getColorVariablesByMode(cssContent, 'light');
          
          const background = lightModeColors.get('background');
          const foreground = lightModeColors.get('foreground');
          
          if (!background || !foreground) {
            throw new Error('Missing background or foreground color in light mode');
          }
          
          const contrastRatio = calculateContrastRatio(foreground, background);
          
          // WCAG AA requires 4.5:1 for normal text
          if (contrastRatio < 4.5) {
            throw new Error(
              `Light mode text contrast ratio ${contrastRatio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1). ` +
              `Foreground: ${foreground}, Background: ${background}`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify dark mode text contrast meets WCAG AA standards', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const darkModeColors = getColorVariablesByMode(cssContent, 'dark');
          
          const background = darkModeColors.get('background');
          const foreground = darkModeColors.get('foreground');
          
          if (!background || !foreground) {
            throw new Error('Missing background or foreground color in dark mode');
          }
          
          const contrastRatio = calculateContrastRatio(foreground, background);
          
          // WCAG AA requires 4.5:1 for normal text
          if (contrastRatio < 4.5) {
            throw new Error(
              `Dark mode text contrast ratio ${contrastRatio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1). ` +
              `Foreground: ${foreground}, Background: ${background}`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify card text contrast meets WCAG AA standards', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (mode) => {
          const colors = getColorVariablesByMode(cssContent, mode);
          
          const cardBackground = colors.get('card');
          const cardForeground = colors.get('card-foreground');
          
          if (!cardBackground || !cardForeground) {
            throw new Error(`Missing card colors in ${mode} mode`);
          }
          
          const contrastRatio = calculateContrastRatio(cardForeground, cardBackground);
          
          if (contrastRatio < 4.5) {
            throw new Error(
              `${mode} mode card text contrast ratio ${contrastRatio.toFixed(2)}:1 does not meet WCAG AA standard (4.5:1)`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify muted text has adequate contrast', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('light', 'dark'),
        (mode) => {
          const colors = getColorVariablesByMode(cssContent, mode);
          
          const background = colors.get('background');
          const mutedForeground = colors.get('muted-foreground');
          
          if (!background || !mutedForeground) {
            throw new Error(`Missing muted colors in ${mode} mode`);
          }
          
          const contrastRatio = calculateContrastRatio(mutedForeground, background);
          
          // Muted text should still meet at least 3:1 for large text (WCAG AA)
          if (contrastRatio < 3.0) {
            throw new Error(
              `${mode} mode muted text contrast ratio ${contrastRatio.toFixed(2)}:1 is too low (minimum 3:1 for large text)`
            );
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: blue-color-palette, Property 4: All blue colors use correct hue range
 * Validates: Requirements 1.1, 1.3, 1.5, 4.1, 4.2, 4.3, 5.1, 5.2
 * 
 * Property: For any color variable intended to be blue (excluding destructive/error colors),
 * the hue value should be in the range of 200-240 degrees, representing the blue spectrum.
 */
describe('Property 4: Blue Hue Range', () => {
  it('should verify all blue color variables use correct hue range', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const lightModeColors = getColorVariablesByMode(cssContent, 'light');
          const darkModeColors = getColorVariablesByMode(cssContent, 'dark');
          
          // Combine all color variables
          const allColorVars = new Map([...lightModeColors, ...darkModeColors]);
          
          // Variables that should NOT be blue (exceptions)
          const nonBlueVariables = new Set([
            'destructive',
            'destructive-foreground',
          ]);
          
          // Check each color variable
          for (const [name, value] of allColorVars) {
            // Skip non-blue variables
            if (nonBlueVariables.has(name)) {
              continue;
            }
            
            // Skip gradient and shadow variables (they're checked separately)
            if (name.includes('gradient') || name.includes('shadow')) {
              continue;
            }
            
            // Skip variables that are grayscale (saturation near 0)
            const hsl = extractHSL(value);
            if (hsl.s < 10) {
              // Low saturation colors are essentially grayscale, skip hue check
              continue;
            }
            
            // Verify hue is in blue range (200-240)
            if (hsl.h < 200 || hsl.h > 240) {
              throw new Error(
                `Color variable --${name} has hue ${hsl.h}° which is outside the blue range (200-240°). ` +
                `Value: ${value}`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify gradient variables use blue hues', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const allVariables = extractCSSVariables(cssContent);
          
          const gradientVariables = [
            'gradient-orkut',
            'gradient-city',
            'gradient-morning',
            'gradient-afternoon',
            'gradient-evening',
            'gradient-night',
          ];
          
          for (const gradientName of gradientVariables) {
            const gradientValue = allVariables.get(gradientName);
            
            if (!gradientValue) {
              throw new Error(`Gradient --${gradientName} not found`);
            }
            
            // Extract HSL values from gradient
            // Pattern: hsl(H S% L%)
            const hslPattern = /hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/g;
            const matches = [...gradientValue.matchAll(hslPattern)];
            
            if (matches.length === 0) {
              throw new Error(
                `Gradient --${gradientName} does not contain HSL colors: ${gradientValue}`
              );
            }
            
            // Check each color in the gradient
            for (const match of matches) {
              const h = parseFloat(match[1]);
              const s = parseFloat(match[2]);
              
              // Skip grayscale colors (low saturation)
              if (s < 10) {
                continue;
              }
              
              // Verify hue is in blue range (200-240) or blue-purple range (240-260 for evening)
              // Evening gradient can extend into purple
              const isEvening = gradientName === 'gradient-evening';
              const maxHue = isEvening ? 260 : 240;
              
              if (h < 200 || h > maxHue) {
                throw new Error(
                  `Gradient --${gradientName} contains hue ${h}° which is outside the blue range (200-${maxHue}°)`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify badge colors use blue spectrum', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const lightModeColors = getColorVariablesByMode(cssContent, 'light');
          
          const badgeVariables = [
            'badge-poet',
            'badge-chronicler',
            'badge-humorist',
            'badge-star',
          ];
          
          for (const badgeName of badgeVariables) {
            const badgeValue = lightModeColors.get(badgeName);
            
            if (!badgeValue) {
              throw new Error(`Badge variable --${badgeName} not found`);
            }
            
            const hsl = extractHSL(badgeValue);
            
            // Skip grayscale
            if (hsl.s < 10) {
              continue;
            }
            
            // Badge-poet can be blue-purple (up to 260)
            const maxHue = badgeName === 'badge-poet' ? 260 : 240;
            
            if (hsl.h < 200 || hsl.h > maxHue) {
              throw new Error(
                `Badge --${badgeName} has hue ${hsl.h}° which is outside the blue range (200-${maxHue}°). ` +
                `Value: ${badgeValue}`
              );
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
  
  it('should verify shadow variables use blue tones', () => {
    fc.assert(
      fc.property(
        fc.constant(null),
        () => {
          const allVariables = extractCSSVariables(cssContent);
          
          const shadowVariables = [
            'shadow-card',
            'shadow-elevated',
            'shadow-glow',
          ];
          
          for (const shadowName of shadowVariables) {
            const shadowValue = allVariables.get(shadowName);
            
            if (!shadowValue) {
              throw new Error(`Shadow variable --${shadowName} not found`);
            }
            
            // Extract HSL values from shadow
            // Pattern: hsl(H S% L% / A) or hsl(H S% L%)
            const hslPattern = /hsl\((\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/g;
            const matches = [...shadowValue.matchAll(hslPattern)];
            
            // Shadows might not have HSL colors (could be rgba or just black)
            if (matches.length === 0) {
              // Check if it's a pure black shadow (acceptable)
              if (shadowValue.includes('hsl(0 0% 0%')) {
                continue;
              }
              // If no HSL found and not black, that's okay for some shadows
              continue;
            }
            
            // Check each color in the shadow
            for (const match of matches) {
              const h = parseFloat(match[1]);
              const s = parseFloat(match[2]);
              
              // Skip grayscale colors (low saturation)
              if (s < 10) {
                continue;
              }
              
              // Verify hue is in blue range (190-240, slightly wider for shadows)
              if (h < 190 || h > 240) {
                throw new Error(
                  `Shadow --${shadowName} contains hue ${h}° which is outside the blue range (190-240°)`
                );
              }
            }
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
