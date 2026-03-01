export const THEME = {
  bg: {
    deep: 0x080810,
    mid: 0x10101c,
    light: 0x181828,
    accent: 0x202040,
  },

  grid: {
    line: 0x181830,
    accent: 0x282848,
    dot: 0x3a3a5a,
  },

  snake: {
    head: 0x00e8ff,
    body: 0x0099cc,
    tail: 0x006688,
    glow: 0x00ccff,
    highlight: 0x66eeff,
    eye: 0xeeffff,
    pupil: 0x002233,
    edge: 0x004466,
  },

  food: {
    body: 0xff6633,
    core: 0xffaa44,
    glow: 0xff4400,
    particle: 0xff8844,
  },

  wall: {
    core: 0x1a1a3a,
    glow: 0x3333aa,
    highlight: 0x5555cc,
    corner: 0x7777dd,
    spark: 0x9999ff,
  },

  hud: {
    text: 0xeeddcc,
    textDim: 0x887755,
    score: 0xffe8cc,
    scoreGlow: 0xffaa66,
  },

  effects: {
    ripple: 0x6644ff,
    mote: 0x8866ff,
    sparkle: 0xaa88ff,
    trail: 0x5533dd,
    burst: 0xcc99ff,
  },

  nebula: [
    0x0c0818,
    0x100c22,
    0x14102c,
    0x0c0818,
    0x120e20,
  ],

  dust: [
    0x664488,
    0x886699,
    0x553377,
    0x775588,
  ],

  gameOver: {
    overlay: 0x060410,
    text: 0xeeddcc,
    label: 0x887755,
  },

  segments: [
    { primary: 0x00ccee, secondary: 0x44ddff },
    { primary: 0x0088aa, secondary: 0x22bbdd },
    { primary: 0x00ccee, secondary: 0x44ddff },
    { primary: 0x0088aa, secondary: 0x22bbdd },
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
