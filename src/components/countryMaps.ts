import Phaser from 'phaser';

interface CountryOutline {
  points: number[][];
  centerX: number;
  centerY: number;
}

const OUTLINES: Record<string, CountryOutline> = {
  FR: {
    points: [[0.46,0.05],[0.55,0.08],[0.65,0.15],[0.7,0.3],[0.75,0.45],[0.68,0.6],[0.72,0.75],[0.65,0.85],[0.55,0.95],[0.42,0.9],[0.3,0.82],[0.2,0.7],[0.15,0.55],[0.18,0.4],[0.25,0.25],[0.3,0.15],[0.38,0.08]],
    centerX: 0.45, centerY: 0.5,
  },
  DE: {
    points: [[0.35,0.05],[0.55,0.03],[0.7,0.1],[0.75,0.25],[0.8,0.4],[0.72,0.55],[0.68,0.7],[0.6,0.85],[0.48,0.95],[0.35,0.88],[0.25,0.75],[0.2,0.6],[0.22,0.4],[0.25,0.25],[0.3,0.12]],
    centerX: 0.5, centerY: 0.48,
  },
  IT: {
    points: [[0.3,0.05],[0.55,0.03],[0.65,0.1],[0.6,0.2],[0.55,0.3],[0.52,0.45],[0.55,0.55],[0.58,0.65],[0.55,0.75],[0.48,0.85],[0.42,0.92],[0.38,0.88],[0.4,0.78],[0.38,0.68],[0.32,0.55],[0.28,0.4],[0.25,0.25],[0.28,0.12]],
    centerX: 0.45, centerY: 0.45,
  },
  JP: {
    points: [[0.45,0.05],[0.55,0.1],[0.6,0.2],[0.58,0.35],[0.55,0.45],[0.58,0.55],[0.55,0.65],[0.5,0.75],[0.45,0.85],[0.4,0.9],[0.35,0.8],[0.38,0.65],[0.4,0.55],[0.38,0.45],[0.42,0.3],[0.4,0.15]],
    centerX: 0.48, centerY: 0.5,
  },
  BR: {
    points: [[0.5,0.05],[0.65,0.1],[0.78,0.2],[0.85,0.35],[0.82,0.5],[0.75,0.65],[0.65,0.78],[0.55,0.88],[0.42,0.95],[0.3,0.88],[0.2,0.75],[0.15,0.6],[0.18,0.45],[0.22,0.3],[0.3,0.18],[0.4,0.1]],
    centerX: 0.5, centerY: 0.5,
  },
  SE: {
    points: [[0.4,0.02],[0.5,0.05],[0.55,0.15],[0.52,0.3],[0.55,0.4],[0.5,0.5],[0.48,0.6],[0.52,0.7],[0.48,0.8],[0.42,0.9],[0.35,0.95],[0.3,0.85],[0.32,0.7],[0.28,0.55],[0.3,0.4],[0.35,0.25],[0.38,0.12]],
    centerX: 0.42, centerY: 0.5,
  },
  TR: {
    points: [[0.1,0.3],[0.25,0.2],[0.4,0.18],[0.55,0.22],[0.7,0.2],[0.85,0.25],[0.92,0.4],[0.88,0.55],[0.75,0.65],[0.6,0.7],[0.45,0.68],[0.3,0.65],[0.15,0.6],[0.08,0.45]],
    centerX: 0.5, centerY: 0.45,
  },
  IN: {
    points: [[0.45,0.02],[0.6,0.08],[0.72,0.18],[0.78,0.3],[0.75,0.45],[0.7,0.58],[0.62,0.7],[0.55,0.82],[0.48,0.95],[0.4,0.85],[0.32,0.72],[0.25,0.58],[0.2,0.42],[0.22,0.28],[0.3,0.15],[0.38,0.06]],
    centerX: 0.48, centerY: 0.48,
  },
  AR: {
    points: [[0.35,0.02],[0.55,0.05],[0.62,0.15],[0.58,0.28],[0.55,0.4],[0.58,0.52],[0.55,0.65],[0.52,0.78],[0.48,0.88],[0.42,0.98],[0.35,0.92],[0.3,0.8],[0.28,0.65],[0.3,0.5],[0.28,0.35],[0.32,0.2],[0.33,0.1]],
    centerX: 0.45, centerY: 0.5,
  },
  NG: {
    points: [[0.2,0.15],[0.4,0.1],[0.6,0.1],[0.8,0.15],[0.85,0.3],[0.82,0.5],[0.78,0.65],[0.7,0.8],[0.55,0.88],[0.4,0.85],[0.25,0.75],[0.18,0.6],[0.15,0.4]],
    centerX: 0.5, centerY: 0.5,
  },
  TH: {
    points: [[0.4,0.05],[0.55,0.08],[0.62,0.18],[0.58,0.3],[0.55,0.42],[0.6,0.52],[0.58,0.65],[0.52,0.78],[0.45,0.88],[0.38,0.95],[0.32,0.85],[0.35,0.7],[0.3,0.55],[0.32,0.4],[0.35,0.25],[0.38,0.12]],
    centerX: 0.47, centerY: 0.5,
  },
  CO: {
    points: [[0.3,0.1],[0.5,0.05],[0.65,0.1],[0.75,0.25],[0.78,0.4],[0.72,0.55],[0.65,0.7],[0.55,0.82],[0.42,0.9],[0.3,0.82],[0.22,0.65],[0.18,0.5],[0.2,0.32],[0.25,0.2]],
    centerX: 0.48, centerY: 0.48,
  },
  UA: {
    points: [[0.1,0.3],[0.25,0.18],[0.45,0.12],[0.65,0.15],[0.8,0.22],[0.9,0.35],[0.88,0.5],[0.8,0.62],[0.65,0.72],[0.48,0.75],[0.3,0.7],[0.15,0.6],[0.08,0.45]],
    centerX: 0.5, centerY: 0.45,
  },
  PL: {
    points: [[0.15,0.2],[0.35,0.12],[0.55,0.1],[0.75,0.15],[0.85,0.3],[0.82,0.5],[0.78,0.65],[0.65,0.78],[0.48,0.82],[0.3,0.78],[0.18,0.65],[0.12,0.45]],
    centerX: 0.5, centerY: 0.47,
  },
  KR: {
    points: [[0.4,0.05],[0.55,0.1],[0.6,0.25],[0.58,0.4],[0.55,0.55],[0.5,0.7],[0.45,0.82],[0.4,0.92],[0.35,0.85],[0.38,0.7],[0.35,0.55],[0.38,0.4],[0.35,0.25],[0.38,0.12]],
    centerX: 0.47, centerY: 0.48,
  },
  EG: {
    points: [[0.15,0.1],[0.45,0.08],[0.7,0.1],[0.85,0.15],[0.88,0.35],[0.82,0.55],[0.75,0.7],[0.6,0.82],[0.45,0.9],[0.3,0.85],[0.2,0.7],[0.12,0.5],[0.1,0.3]],
    centerX: 0.5, centerY: 0.48,
  },
  MX: {
    points: [[0.1,0.25],[0.25,0.15],[0.45,0.1],[0.6,0.15],[0.75,0.25],[0.88,0.35],[0.9,0.5],[0.82,0.6],[0.7,0.68],[0.55,0.75],[0.4,0.72],[0.25,0.65],[0.15,0.5],[0.08,0.35]],
    centerX: 0.5, centerY: 0.45,
  },
  IE: {
    points: [[0.3,0.1],[0.5,0.05],[0.65,0.12],[0.72,0.3],[0.7,0.5],[0.65,0.68],[0.55,0.82],[0.42,0.9],[0.3,0.82],[0.22,0.65],[0.2,0.45],[0.22,0.25]],
    centerX: 0.45, centerY: 0.48,
  },
  PE: {
    points: [[0.25,0.08],[0.5,0.05],[0.68,0.12],[0.75,0.28],[0.72,0.45],[0.68,0.6],[0.6,0.75],[0.48,0.88],[0.35,0.92],[0.25,0.8],[0.2,0.62],[0.18,0.42],[0.2,0.22]],
    centerX: 0.47, centerY: 0.48,
  },
  IS: {
    points: [[0.08,0.3],[0.22,0.18],[0.42,0.12],[0.62,0.15],[0.78,0.2],[0.9,0.32],[0.88,0.5],[0.78,0.62],[0.6,0.7],[0.4,0.72],[0.22,0.65],[0.1,0.5]],
    centerX: 0.5, centerY: 0.42,
  },
  AU: {
    points: [[0.15,0.15],[0.35,0.08],[0.6,0.1],[0.78,0.18],[0.88,0.32],[0.9,0.5],[0.82,0.65],[0.7,0.78],[0.55,0.85],[0.38,0.82],[0.22,0.72],[0.12,0.55],[0.1,0.35]],
    centerX: 0.5, centerY: 0.48,
  },
  CA: {
    points: [[0.08,0.35],[0.15,0.2],[0.3,0.1],[0.5,0.05],[0.7,0.08],[0.85,0.18],[0.92,0.35],[0.9,0.52],[0.82,0.65],[0.68,0.75],[0.5,0.78],[0.32,0.75],[0.18,0.65],[0.1,0.5]],
    centerX: 0.5, centerY: 0.42,
  },
  GR: {
    points: [[0.3,0.08],[0.5,0.05],[0.65,0.12],[0.72,0.28],[0.75,0.45],[0.7,0.6],[0.6,0.72],[0.48,0.82],[0.38,0.9],[0.28,0.82],[0.2,0.68],[0.18,0.5],[0.2,0.32],[0.25,0.18]],
    centerX: 0.47, centerY: 0.48,
  },
  CL: {
    points: [[0.35,0.02],[0.5,0.05],[0.55,0.15],[0.52,0.28],[0.5,0.4],[0.52,0.52],[0.5,0.65],[0.48,0.78],[0.45,0.88],[0.42,0.98],[0.38,0.9],[0.4,0.78],[0.38,0.65],[0.4,0.5],[0.38,0.35],[0.4,0.2],[0.38,0.1]],
    centerX: 0.45, centerY: 0.5,
  },
};

interface ContinentOutline {
  points: number[][];
  color: number;
}

const CONTINENTS: ContinentOutline[] = [
  { // North America
    points: [[0.05,0.12],[0.12,0.08],[0.2,0.1],[0.25,0.18],[0.22,0.28],[0.2,0.38],[0.15,0.45],[0.12,0.38],[0.08,0.3],[0.05,0.22]],
    color: 0x334433,
  },
  { // South America
    points: [[0.18,0.52],[0.22,0.48],[0.25,0.55],[0.24,0.65],[0.22,0.75],[0.18,0.85],[0.15,0.78],[0.14,0.68],[0.15,0.58]],
    color: 0x334433,
  },
  { // Europe
    points: [[0.42,0.1],[0.48,0.08],[0.52,0.12],[0.5,0.2],[0.48,0.28],[0.45,0.25],[0.42,0.18]],
    color: 0x334433,
  },
  { // Africa
    points: [[0.42,0.32],[0.48,0.3],[0.55,0.35],[0.56,0.48],[0.54,0.6],[0.5,0.7],[0.46,0.72],[0.42,0.65],[0.4,0.52],[0.4,0.4]],
    color: 0x334433,
  },
  { // Asia
    points: [[0.55,0.08],[0.65,0.06],[0.75,0.1],[0.82,0.18],[0.8,0.28],[0.75,0.35],[0.7,0.38],[0.65,0.35],[0.58,0.28],[0.55,0.2],[0.53,0.14]],
    color: 0x334433,
  },
  { // Oceania
    points: [[0.78,0.55],[0.85,0.52],[0.9,0.58],[0.88,0.65],[0.82,0.68],[0.78,0.62]],
    color: 0x334433,
  },
];

const COUNTRY_CONTINENT: Record<string, number> = {
  FR: 2, DE: 2, IT: 2, SE: 2, TR: 2, UA: 2, PL: 2, IE: 2, IS: 2, GR: 2,
  JP: 4, IN: 4, TH: 4, KR: 4,
  BR: 1, AR: 1, CO: 1, PE: 1, CL: 1,
  NG: 3, EG: 3,
  MX: 0, CA: 0,
  AU: 5,
};

const COUNTRY_MAP_POS: Record<string, { x: number; y: number }> = {
  FR: { x: 0.46, y: 0.2 }, DE: { x: 0.49, y: 0.16 }, IT: { x: 0.49, y: 0.24 },
  SE: { x: 0.5, y: 0.1 }, TR: { x: 0.55, y: 0.24 }, UA: { x: 0.55, y: 0.16 },
  PL: { x: 0.51, y: 0.16 }, IE: { x: 0.42, y: 0.15 }, IS: { x: 0.4, y: 0.08 },
  GR: { x: 0.52, y: 0.26 },
  JP: { x: 0.85, y: 0.24 }, IN: { x: 0.68, y: 0.35 }, TH: { x: 0.74, y: 0.38 },
  KR: { x: 0.82, y: 0.25 },
  BR: { x: 0.22, y: 0.62 }, AR: { x: 0.2, y: 0.75 }, CO: { x: 0.18, y: 0.52 },
  PE: { x: 0.17, y: 0.58 }, CL: { x: 0.18, y: 0.72 },
  NG: { x: 0.46, y: 0.48 }, EG: { x: 0.52, y: 0.35 },
  MX: { x: 0.12, y: 0.35 }, CA: { x: 0.12, y: 0.15 },
  AU: { x: 0.84, y: 0.65 },
};

export interface CountryMapState {
  activeCountry: string | null;
  fadeIn: number;
  pulsePhase: number;
  pinX: number;
  pinY: number;
}

export function createCountryMapState(): CountryMapState {
  return {
    activeCountry: null,
    fadeIn: 0,
    pulsePhase: 0,
    pinX: 0,
    pinY: 0,
  };
}

export function updateCountryMap(state: CountryMapState, countryCode: string, frameCount: number): void {
  if (state.activeCountry !== countryCode) {
    state.activeCountry = countryCode;
    state.fadeIn = 0;
  }
  state.fadeIn = Math.min(state.fadeIn + 0.04, 1.0);
  state.pulsePhase = frameCount * 0.08;

  const pos = COUNTRY_MAP_POS[countryCode];
  if (pos) {
    state.pinX = pos.x;
    state.pinY = pos.y;
  }
}

export function getCountryOutline(code: string): CountryOutline | undefined {
  return OUTLINES[code];
}

function drawFilledPolygon(
  g: Phaser.GameObjects.Graphics,
  points: number[][],
  offsetX: number,
  offsetY: number,
  scaleX: number,
  scaleY: number
): void {
  if (points.length < 3) return;
  g.beginPath();
  g.moveTo(offsetX + points[0][0] * scaleX, offsetY + points[0][1] * scaleY);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(offsetX + points[i][0] * scaleX, offsetY + points[i][1] * scaleY);
  }
  g.closePath();
  g.fillPath();
}

function drawContinents(
  g: Phaser.GameObjects.Graphics,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  alpha: number
): void {
  for (const continent of CONTINENTS) {
    g.fillStyle(continent.color, alpha * 0.6);
    drawFilledPolygon(g, continent.points, mapX, mapY, mapW, mapH);
  }
}

function drawCountryPin(
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  pulsePhase: number,
  alpha: number,
  highlightColor: number
): void {
  const pulseSize = 1.0 + Math.sin(pulsePhase) * 0.3;
  const ringAlpha = 0.3 + Math.sin(pulsePhase * 1.5) * 0.15;

  g.fillStyle(highlightColor, alpha * ringAlpha);
  g.fillCircle(px, py, 8 * pulseSize);

  g.fillStyle(highlightColor, alpha * 0.6);
  g.fillCircle(px, py, 4 * pulseSize);

  g.fillStyle(0xffffff, alpha * 0.9);
  g.fillCircle(px, py, 2);
}

function drawCountryShape(
  g: Phaser.GameObjects.Graphics,
  outline: CountryOutline,
  mapX: number,
  mapY: number,
  mapW: number,
  mapH: number,
  shapeX: number,
  shapeY: number,
  shapeSize: number,
  alpha: number,
  highlightColor: number,
  pulsePhase: number
): void {
  const pulse = 1.0 + Math.sin(pulsePhase) * 0.05;
  const s = shapeSize * pulse;
  const ox = shapeX - s / 2;
  const oy = shapeY - s / 2;

  g.fillStyle(0x000000, alpha * 0.5);
  drawFilledPolygon(g, outline.points, ox + 1, oy + 1, s, s);

  g.fillStyle(highlightColor, alpha * 0.8);
  drawFilledPolygon(g, outline.points, ox, oy, s, s);

  g.lineStyle(1, 0xffffff, alpha * 0.4);
  g.beginPath();
  g.moveTo(ox + outline.points[0][0] * s, oy + outline.points[0][1] * s);
  for (let i = 1; i < outline.points.length; i++) {
    g.lineTo(ox + outline.points[i][0] * s, oy + outline.points[i][1] * s);
  }
  g.closePath();
  g.strokePath();
}

export function drawCountryMap(
  g: Phaser.GameObjects.Graphics,
  state: CountryMapState,
  canvasWidth: number,
  frameCount: number,
  highlightColor: number,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  if (!state.activeCountry || state.fadeIn <= 0) return;

  const alpha = state.fadeIn;
  const mapW = 90;
  const mapH = 55;
  const mapX = canvasWidth - mapW - 6;
  const mapY = 6;

  g.fillStyle(0x0a1628, alpha * 0.85);
  g.fillRoundedRect(mapX - 4, mapY - 4, mapW + 8, mapH + 30, 4);
  g.lineStyle(1, highlightColor, alpha * 0.5);
  g.strokeRoundedRect(mapX - 4, mapY - 4, mapW + 8, mapH + 30, 4);

  drawContinents(g, mapX, mapY, mapW, mapH, alpha);

  const continentIdx = COUNTRY_CONTINENT[state.activeCountry];
  if (continentIdx !== undefined) {
    const continent = CONTINENTS[continentIdx];
    const pulse = 0.7 + Math.sin(frameCount * 0.06) * 0.15;
    g.fillStyle(highlightColor, alpha * pulse * 0.3);
    drawFilledPolygon(g, continent.points, mapX, mapY, mapW, mapH);
  }

  const px = mapX + state.pinX * mapW;
  const py = mapY + state.pinY * mapH;
  drawCountryPin(g, px, py, state.pulsePhase, alpha, highlightColor);

  const outline = OUTLINES[state.activeCountry];
  if (outline) {
    const shapeX = mapX + mapW / 2;
    const shapeY = mapY + mapH + 14;
    drawCountryShape(g, outline, mapX, mapY, mapW, mapH, shapeX, shapeY, 22, alpha, highlightColor, state.pulsePhase);
  }

  const labelY = mapY + mapH + 24;
  const charW = 5 * 0.55;
  const name = state.activeCountry;
  const labelX = mapX + mapW / 2 - (name.length * charW) / 2;
  drawText(g, name, labelX, labelY, 4, highlightColor, alpha * 0.9);
}
