export const THEME = {
  bg: {
    deep: 0x060d1a,
    mid: 0x0c1a2e,
    light: 0x142844,
    accent: 0x1a3355,
  },

  grid: {
    line: 0x1a2e4a,
    accent: 0x243a5a,
    dot: 0x2a4466,
  },

  snake: {
    head: 0x22dd66,
    body: 0x1ab854,
    tail: 0x14a044,
    glow: 0x44ffaa,
    highlight: 0x66ffbb,
    eye: 0xffd700,
    pupil: 0x111111,
    edge: 0x0d7a33,
  },

  food: {
    body: 0xffd700,
    core: 0xffec80,
    glow: 0xffaa22,
    particle: 0xffcc44,
  },

  wall: {
    core: 0x334466,
    glow: 0x4466aa,
    highlight: 0x5588cc,
    corner: 0x668ecc,
    spark: 0x88bbff,
  },

  hud: {
    text: 0xe2e8f0,
    textDim: 0x8899bb,
    score: 0xffd700,
    scoreGlow: 0xffaa22,
  },

  effects: {
    ripple: 0x44ffaa,
    mote: 0xb8c8e8,
    sparkle: 0xffd700,
    trail: 0x33cc88,
    burst: 0xffcc44,
  },

  nebula: [
    0x1a2e55,
    0x1a3366,
    0x223a66,
    0x1a3055,
    0x1e3558,
  ],

  dust: [
    0x6688bb,
    0x88aacc,
    0x5577aa,
    0x7799bb,
  ],

  gameOver: {
    overlay: 0x060d1a,
    text: 0xffd700,
    label: 0x8899bb,
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
