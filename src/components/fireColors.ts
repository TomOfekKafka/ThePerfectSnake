function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpColor(c1: number, c2: number, t: number): number {
  const r = lerpChannel((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t);
  const g = lerpChannel((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t);
  const b = lerpChannel(c1 & 0xff, c2 & 0xff, t);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

const WHITE_HOT = 0xf8eeff;
const VIOLET_FIRE = 0xcc55ee;
const MAGENTA_FIRE = 0xaa22cc;
const PURPLE_FIRE = 0x7711aa;
const DEEP_EMBER = 0x440066;

const HIGHLIGHT_WHITE = 0xffffff;
const HIGHLIGHT_PINK = 0xeeaaff;
const HIGHLIGHT_VIOLET = 0xbb66dd;

const EDGE_PURPLE = 0x551188;
const EDGE_DEEP = 0x330066;
const EDGE_EMBER = 0x220044;

export function getFireColors(
  segmentIndex: number,
  snakeLength: number
): { base: number; highlight: number; edge: number } {
  const t = snakeLength > 1 ? segmentIndex / (snakeLength - 1) : 0;

  let base: number;
  if (t < 0.15) {
    base = lerpColor(WHITE_HOT, VIOLET_FIRE, t / 0.15);
  } else if (t < 0.4) {
    base = lerpColor(VIOLET_FIRE, MAGENTA_FIRE, (t - 0.15) / 0.25);
  } else if (t < 0.75) {
    base = lerpColor(MAGENTA_FIRE, PURPLE_FIRE, (t - 0.4) / 0.35);
  } else {
    base = lerpColor(PURPLE_FIRE, DEEP_EMBER, (t - 0.75) / 0.25);
  }

  let highlight: number;
  if (t < 0.3) {
    highlight = lerpColor(HIGHLIGHT_WHITE, HIGHLIGHT_PINK, t / 0.3);
  } else if (t < 0.7) {
    highlight = lerpColor(HIGHLIGHT_PINK, HIGHLIGHT_VIOLET, (t - 0.3) / 0.4);
  } else {
    highlight = lerpColor(HIGHLIGHT_VIOLET, MAGENTA_FIRE, (t - 0.7) / 0.3);
  }

  let edge: number;
  if (t < 0.3) {
    edge = lerpColor(EDGE_PURPLE, EDGE_DEEP, t / 0.3);
  } else {
    edge = lerpColor(EDGE_DEEP, EDGE_EMBER, (t - 0.3) / 0.7);
  }

  return { base, highlight, edge };
}
