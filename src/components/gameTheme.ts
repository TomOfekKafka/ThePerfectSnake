export const THEME = {
  bg: {
    deep: 0x0a0a0e,
    mid: 0x14141a,
    light: 0x1e1e26,
    accent: 0x28283a,
  },

  grid: {
    line: 0x1a1a24,
    accent: 0x2a2a3a,
    dot: 0x3a3a4a,
  },

  snake: {
    head: 0xd0d0d8,
    body: 0x909098,
    tail: 0x505058,
    glow: 0xc8c8d0,
    highlight: 0xe8e8f0,
    eye: 0xffffff,
    pupil: 0x111111,
    edge: 0x404048,
  },

  food: {
    body: 0xe0e0e8,
    core: 0xffffff,
    glow: 0xb0b0c0,
    particle: 0xc8c8d0,
  },

  wall: {
    core: 0x28283a,
    glow: 0x3a3a50,
    highlight: 0x505068,
    corner: 0x686880,
    spark: 0x9090a0,
  },

  hud: {
    text: 0xe0ddd0,
    textDim: 0x706858,
    score: 0xf0ece0,
    scoreGlow: 0xc0b8a0,
  },

  effects: {
    ripple: 0xb0b0c0,
    mote: 0x808090,
    sparkle: 0xe0e0e8,
    trail: 0xa0a0b0,
    burst: 0xd0d0d8,
  },

  nebula: [
    0x12121a,
    0x16161e,
    0x1a1a24,
    0x12121a,
    0x18181e,
  ],

  dust: [
    0x505060,
    0x686878,
    0x404050,
    0x585868,
  ],

  gameOver: {
    overlay: 0x060608,
    text: 0xe0ddd0,
    label: 0x706858,
  },

  segments: [
    { primary: 0xb0b0b8, secondary: 0xd0d0d8 },
    { primary: 0x808088, secondary: 0xa0a0a8 },
    { primary: 0xb0b0b8, secondary: 0xd0d0d8 },
    { primary: 0x808088, secondary: 0xa0a0a8 },
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
