let frame = 0;

function hueToChannel(p: number, q: number, t: number): number {
  const tn = t < 0 ? t + 1 : t > 1 ? t - 1 : t;
  if (tn < 1 / 6) return p + (q - p) * 6 * tn;
  if (tn < 1 / 2) return q;
  if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
  return p;
}

function hslToHex(h: number, s: number, l: number): number {
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hueToChannel(p, q, h + 1 / 3) * 255);
  const g = Math.round(hueToChannel(p, q, h) * 255);
  const b = Math.round(hueToChannel(p, q, h - 1 / 3) * 255);
  return (r << 16) | (g << 8) | b;
}

export function tickSparkle(): void {
  frame++;
}

export function sparkle(offset: number = 0): number {
  const hue = ((frame * 0.008 + offset) % 1 + 1) % 1;
  return hslToHex(hue, 0.85, 0.65);
}
