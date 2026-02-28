export const THEME = {
  bg: {
    deep: 0x040d08,
    mid: 0x0a1a10,
    light: 0x122818,
    accent: 0x1a3322,
  },

  grid: {
    line: 0x1a3024,
    accent: 0x243a2c,
    dot: 0x2a4434,
  },

  snake: {
    head: 0x22dd66,
    body: 0x1ab854,
    tail: 0x14a044,
    glow: 0x44ffaa,
    highlight: 0x66ffbb,
    eye: 0xee55cc,
    pupil: 0x111111,
    edge: 0x0d7a33,
  },

  food: {
    body: 0xcc44ee,
    core: 0xdd88ff,
    glow: 0xaa22cc,
    particle: 0xcc66ee,
  },

  wall: {
    core: 0x334a38,
    glow: 0x44664a,
    highlight: 0x558866,
    corner: 0x66aa77,
    spark: 0x88ccaa,
  },

  hud: {
    text: 0xe2f0e8,
    textDim: 0x88aa99,
    score: 0xee55cc,
    scoreGlow: 0xcc22aa,
  },

  effects: {
    ripple: 0x44ffaa,
    mote: 0xc8d8c8,
    sparkle: 0xee55cc,
    trail: 0x33cc88,
    burst: 0xcc66ee,
  },

  nebula: [
    0x1a3322,
    0x1a3328,
    0x223a2e,
    0x1a3024,
    0x1e3528,
  ],

  dust: [
    0x66aa88,
    0x88ccaa,
    0x55aa77,
    0x77bb99,
  ],

  gameOver: {
    overlay: 0x040d08,
    text: 0xee55cc,
    label: 0x88aa99,
  },

  segments: [
    { primary: 0x1ab854, secondary: 0x22dd66 },
    { primary: 0x1a8a54, secondary: 0x22bb66 },
    { primary: 0x1a6644, secondary: 0x229955 },
    { primary: 0x147744, secondary: 0x1aaa55 },
  ],
} as const;

export type Theme = typeof THEME;

export function themeSnakeColor(
  index: number,
  total: number
): { base: number; highlight: number; edge: number } {
  const segIdx = Math.floor(index / 3) % THEME.segments.length;
  const seg = THEME.segments[segIdx];
  const t = total > 1 ? index / (total - 1) : 0;

  const pr = (seg.primary >> 16) & 0xff;
  const pg = (seg.primary >> 8) & 0xff;
  const pb = seg.primary & 0xff;

  const sr = (seg.secondary >> 16) & 0xff;
  const sg = (seg.secondary >> 8) & 0xff;
  const sb = seg.secondary & 0xff;

  const blend = 0.6 + (1 - t) * 0.4;
  const r = Math.round(pr * blend);
  const gv = Math.round(pg * blend);
  const b = Math.round(pb * blend);

  const hr = Math.round(sr * blend);
  const hg = Math.round(sg * blend);
  const hb = Math.round(sb * blend);

  const er = Math.round(pr * blend * 0.5);
  const eg = Math.round(pg * blend * 0.5);
  const eb = Math.round(pb * blend * 0.5);

  return {
    base: (Math.min(0xff, r) << 16) | (Math.min(0xff, gv) << 8) | Math.min(0xff, b),
    highlight: (Math.min(0xff, hr) << 16) | (Math.min(0xff, hg) << 8) | Math.min(0xff, hb),
    edge: (Math.min(0xff, er) << 16) | (Math.min(0xff, eg) << 8) | Math.min(0xff, eb),
  };
}

export function themeGradientStops(
  width: number,
  height: number
): { y: number; color: number; alpha: number }[] {
  return [
    { y: 0, color: THEME.bg.deep, alpha: 1 },
    { y: height * 0.3, color: THEME.bg.mid, alpha: 0.8 },
    { y: height * 0.6, color: THEME.bg.light, alpha: 0.5 },
    { y: height, color: THEME.bg.accent, alpha: 0.3 },
  ];
}
