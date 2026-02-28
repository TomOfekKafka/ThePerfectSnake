function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpColor(c1: number, c2: number, t: number): number {
  const r = lerpChannel((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t);
  const g = lerpChannel((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t);
  const b = lerpChannel(c1 & 0xff, c2 & 0xff, t);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

const WHITE_HOT = 0xfff8e8;
const YELLOW_FIRE = 0xffdd44;
const ORANGE_FIRE = 0xff8800;
const RED_FIRE = 0xdd2200;
const DEEP_EMBER = 0x881100;

const HIGHLIGHT_WHITE = 0xffffff;
const HIGHLIGHT_YELLOW = 0xffeeaa;
const HIGHLIGHT_ORANGE = 0xffbb55;

const EDGE_ORANGE = 0xaa5500;
const EDGE_RED = 0x661100;
const EDGE_EMBER = 0x440800;

export function getFireColors(
  segmentIndex: number,
  snakeLength: number
): { base: number; highlight: number; edge: number } {
  const t = snakeLength > 1 ? segmentIndex / (snakeLength - 1) : 0;

  let base: number;
  if (t < 0.15) {
    base = lerpColor(WHITE_HOT, YELLOW_FIRE, t / 0.15);
  } else if (t < 0.4) {
    base = lerpColor(YELLOW_FIRE, ORANGE_FIRE, (t - 0.15) / 0.25);
  } else if (t < 0.75) {
    base = lerpColor(ORANGE_FIRE, RED_FIRE, (t - 0.4) / 0.35);
  } else {
    base = lerpColor(RED_FIRE, DEEP_EMBER, (t - 0.75) / 0.25);
  }

  let highlight: number;
  if (t < 0.3) {
    highlight = lerpColor(HIGHLIGHT_WHITE, HIGHLIGHT_YELLOW, t / 0.3);
  } else if (t < 0.7) {
    highlight = lerpColor(HIGHLIGHT_YELLOW, HIGHLIGHT_ORANGE, (t - 0.3) / 0.4);
  } else {
    highlight = lerpColor(HIGHLIGHT_ORANGE, ORANGE_FIRE, (t - 0.7) / 0.3);
  }

  let edge: number;
  if (t < 0.3) {
    edge = lerpColor(EDGE_ORANGE, EDGE_RED, t / 0.3);
  } else {
    edge = lerpColor(EDGE_RED, EDGE_EMBER, (t - 0.3) / 0.7);
  }

  return { base, highlight, edge };
}
