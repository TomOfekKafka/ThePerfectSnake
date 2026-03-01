export function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

export function lerpColor(c1: number, c2: number, t: number): number {
  const r = lerpChannel((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t);
  const g = lerpChannel((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t);
  const b = lerpChannel(c1 & 0xff, c2 & 0xff, t);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

export function colorWithBrightness(color: number, factor: number): number {
  const r = Math.min(0xff, Math.round(((color >> 16) & 0xff) * factor));
  const g = Math.min(0xff, Math.round(((color >> 8) & 0xff) * factor));
  const b = Math.min(0xff, Math.round((color & 0xff) * factor));
  return (r << 16) | (g << 8) | b;
}
