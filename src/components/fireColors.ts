import { lerpColor } from './colorUtils';
import { C } from './palette';

const WHITE_HOT = C.VIOLET_FIRE.whiteHot;
const VIOLET_FIRE = C.VIOLET_FIRE.violet;
const MAGENTA_FIRE = C.VIOLET_FIRE.magenta;
const PURPLE_FIRE = C.VIOLET_FIRE.purple;
const DEEP_EMBER = C.VIOLET_FIRE.ember;

const HIGHLIGHT_WHITE = C.VIOLET_FIRE.highlightWhite;
const HIGHLIGHT_PINK = C.VIOLET_FIRE.highlightPink;
const HIGHLIGHT_VIOLET = C.VIOLET_FIRE.highlightViolet;

const EDGE_PURPLE = C.VIOLET_FIRE.edgePurple;
const EDGE_DEEP = C.VIOLET_FIRE.edgeDeep;
const EDGE_EMBER = C.VIOLET_FIRE.edgeEmber;

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
