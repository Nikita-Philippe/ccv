/**
 * Professional color interpolation utility
 * Supports only hex colors (#RRGGBB format)
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface HSL {
  h: number;
  s: number;
  l: number;
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) throw new Error(`Invalid hex color: ${hex}`);

  return {
    r: parseInt(result[1]!, 16),
    g: parseInt(result[2]!, 16),
    b: parseInt(result[3]!, 16),
  };
}

/**
 * Convert RGB to hex
 */
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

/**
 * Convert RGB to HSL
 */
function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  const sum = max + min;

  const l = sum / 2;

  if (diff === 0) {
    return { h: 0, s: 0, l };
  }

  const s = l > 0.5 ? diff / (2 - sum) : diff / sum;

  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / diff + 2) / 6;
      break;
    case b:
      h = ((r - g) / diff + 4) / 6;
      break;
    default:
      h = 0;
  }

  return { h, s, l };
}

/**
 * Convert HSL to RGB
 */
function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;

  if (s === 0) {
    const val = Math.round(l * 255);
    return { r: val, g: val, b: val };
  }

  const hue2rgb = (p: number, q: number, t: number): number => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255),
  };
}

/**
 * Easing functions for different interpolation curves
 */
export const EasingFunctions = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

export type EasingFunction = keyof typeof EasingFunctions;

/**
 * Interpolation methods
 */
export enum InterpolationMethod {
  RGB = "rgb",
  HSL = "hsl",
}

/**
 * Generate a palette of colors interpolated between two hex colors
 */
export function generateColorPalette(
  startColor: string,
  endColor: string,
  steps: number,
  options: {
    method?: InterpolationMethod;
    easing?: EasingFunction;
    includeEndpoints?: boolean;
  } = {},
): string[] {
  const {
    method = InterpolationMethod.RGB,
    easing = "linear",
    includeEndpoints = true,
  } = options;

  if (steps < 2) throw new Error("Steps must be at least 2");

  const easingFn = EasingFunctions[easing];
  const actualSteps = includeEndpoints ? steps : steps + 2;
  const stepSize = 1 / (actualSteps - 1);

  const colors: string[] = [];

  for (let i = 0; i < actualSteps; i++) {
    const t = easingFn(i * stepSize);
    const color = interpolateColor(startColor, endColor, t, method);
    colors.push(color);
  }

  return includeEndpoints ? colors : colors.slice(1, -1);
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(
  startHex: string,
  endHex: string,
  t: number,
  method: InterpolationMethod,
): string {
  // Clamp t between 0 and 1
  t = Math.max(0, Math.min(1, t));

  switch (method) {
    case InterpolationMethod.RGB:
      return interpolateRgb(startHex, endHex, t);
    case InterpolationMethod.HSL:
      return interpolateHsl(startHex, endHex, t);
    default:
      throw new Error(`Unsupported interpolation method: ${method}`);
  }
}

/**
 * RGB interpolation (linear in RGB space)
 */
function interpolateRgb(startHex: string, endHex: string, t: number): string {
  const start = hexToRgb(startHex);
  const end = hexToRgb(endHex);

  const interpolated: RGB = {
    r: start.r + (end.r - start.r) * t,
    g: start.g + (end.g - start.g) * t,
    b: start.b + (end.b - start.b) * t,
  };

  return rgbToHex(interpolated);
}

/**
 * HSL interpolation (better for perceptual smoothness)
 */
function interpolateHsl(startHex: string, endHex: string, t: number): string {
  const startRgb = hexToRgb(startHex);
  const endRgb = hexToRgb(endHex);

  const startHsl = rgbToHsl(startRgb);
  const endHsl = rgbToHsl(endRgb);

  // Handle hue interpolation (shortest path around color wheel)
  let hueDiff = endHsl.h - startHsl.h;
  if (hueDiff > 0.5) hueDiff -= 1;
  if (hueDiff < -0.5) hueDiff += 1;

  const interpolated: HSL = {
    h: (startHsl.h + hueDiff * t) % 1,
    s: startHsl.s + (endHsl.s - startHsl.s) * t,
    l: startHsl.l + (endHsl.l - startHsl.l) * t,
  };

  // Ensure h is positive
  if (interpolated.h < 0) interpolated.h += 1;

  const interpolatedRgb = hslToRgb(interpolated);
  return rgbToHex(interpolatedRgb);
}

/**
 * Generate a smooth color scale for data visualization
 * 
 * generated by AI. sorry.
 */
export function generateDataColorScale(
  minValue: number,
  maxValue: number,
  startColor: string = "#FFFFFF", // White
  endColor: string = "#255AEE", // Your main color
  options: {
    method?: InterpolationMethod;
    easing?: EasingFunction;
    steps?: number;
  } = {},
): { value: number; color: string }[] {
  const {
    method = InterpolationMethod.HSL, // HSL is better for data viz
    easing = "linear",
    steps = Math.min(Math.max(Math.abs(maxValue - minValue) + 1, 2), 50), // Dynamic steps
  } = options;

  const colors = generateColorPalette(startColor, endColor, steps, {
    method,
    easing,
    includeEndpoints: true,
  });

  const valueStep = (maxValue - minValue) / (steps - 1);

  return colors.map((color, index) => ({
    value: minValue + (valueStep * index),
    color,
  }));
}
