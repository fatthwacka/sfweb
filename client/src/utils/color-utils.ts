// Color utility functions for pricing card theming

/**
 * Convert hex color to HSL
 */
function hexToHsl(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [220, 50, 50]; // Default blue

  const r = parseInt(result[1], 16) / 255;
  const g = parseInt(result[2], 16) / 255;
  const b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

/**
 * Convert HSL to hex color
 */
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate color variants for a pricing card from a base color
 */
export function generateCardColors(baseColor: string = '#3b82f6') {
  const [h, s, l] = hexToHsl(baseColor);

  return {
    // Bright glowing title color (high saturation, bright)
    titleGlow: hslToHex(h, Math.min(90, s + 20), Math.min(85, l + 35)),

    // Medium border color (medium saturation, medium brightness)
    border: hslToHex(h, Math.min(80, s + 10), Math.min(60, l + 10)),

    // Dark background gradient start (low saturation, very dark)
    gradientStart: hslToHex(h, Math.max(20, s - 30), Math.max(8, l - 40)),

    // Dark background gradient end (shift toward purple/grey, very dark)
    gradientEnd: hslToHex(
      h < 280 ? Math.min(360, h + 40) : h - 40, // Shift hue toward purple
      Math.max(15, s - 35),
      Math.max(5, l - 45)
    ),

    // Feature check icon color (medium bright version)
    checkIcon: hslToHex(h, Math.min(85, s + 15), Math.min(70, l + 20)),

    // Original base color for reference
    base: baseColor
  };
}

/**
 * Generate CSS custom properties for a pricing card
 */
export function generateCardCSSProperties(baseColor: string = '#3b82f6') {
  const colors = generateCardColors(baseColor);

  return {
    '--card-title-glow': colors.titleGlow,
    '--card-border': colors.border,
    '--card-bg-start': colors.gradientStart,
    '--card-bg-end': colors.gradientEnd,
    '--card-check-icon': colors.checkIcon,
    '--card-base': colors.base
  } as React.CSSProperties;
}

/**
 * Get default colors for different tier types
 */
export const DEFAULT_TIER_COLORS = {
  essential: '#10b981', // Emerald
  premium: '#3b82f6',   // Blue
  luxury: '#8b5cf6',    // Purple
  basic: '#f59e0b',     // Amber
  professional: '#ef4444', // Red
  enterprise: '#6366f1'  // Indigo
};