export const THEME = {
  bg: {
    deep: 0x0a0418,
    mid: 0x140828,
    light: 0x1e1040,
    accent: 0x2a1855,
  },

  grid: {
    line: 0x1a1040,
    accent: 0x2a1858,
    dot: 0x3a2868,
  },

  snake: {
    head: 0xcc1122,
    body: 0xbb0022,
    tail: 0x2244cc,
    glow: 0xff2244,
    highlight: 0xff4466,
    eye: 0xffffff,
    pupil: 0x111111,
    edge: 0x880016,
  },

  food: {
    body: 0x222222,
    core: 0xcc1122,
    glow: 0xff2244,
    particle: 0xcc3344,
  },

  wall: {
    core: 0x2a1858,
    glow: 0x3a2878,
    highlight: 0x5544aa,
    corner: 0x7766cc,
    spark: 0xaa88ee,
  },

  hud: {
    text: 0xe8e0f0,
    textDim: 0x8877aa,
    score: 0xcc1122,
    scoreGlow: 0xaa0018,
  },

  effects: {
    ripple: 0xff2244,
    mote: 0xc8c0d8,
    sparkle: 0xcc1122,
    trail: 0xdddddd,
    burst: 0xff4466,
  },

  nebula: [
    0x1a1040,
    0x1e1248,
    0x221850,
    0x1a1040,
    0x1e1445,
  ],

  dust: [
    0x6655aa,
    0x8877cc,
    0x5544aa,
    0x7766bb,
  ],

  gameOver: {
    overlay: 0x0a0418,
    text: 0xcc1122,
    label: 0x8877aa,
  },

  segments: [
    { primary: 0xbb0022, secondary: 0xcc1133 },
    { primary: 0x2244bb, secondary: 0x3355cc },
    { primary: 0xbb0022, secondary: 0xcc1133 },
    { primary: 0x2244bb, secondary: 0x3355cc },
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
