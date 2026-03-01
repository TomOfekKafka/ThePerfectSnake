import Phaser from 'phaser';

interface BandMember {
  x: number;
  baseY: number;
  bobPhase: number;
  bobSpeed: number;
  bobAmount: number;
  armPhase: number;
  armSpeed: number;
  instrument: 'drums' | 'guitar' | 'bass' | 'keys';
  spotlightHue: number;
}

interface Spotlight {
  x: number;
  baseAngle: number;
  sweepSpeed: number;
  sweepAmount: number;
  hue: number;
  intensity: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface NoteParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  type: 0 | 1 | 2;
}

export interface BackgroundBandState {
  members: BandMember[];
  spotlights: Spotlight[];
  notes: NoteParticle[];
  beatPhase: number;
  energyPulse: number;
}

const MAX_NOTES = 16;
const BAND_Y_BASE = 370;
const SILHOUETTE_COLOR = 0x050a06;
const STAGE_FLOOR_COLOR = 0x0a1510;

export function createBackgroundBandState(): BackgroundBandState {
  return {
    members: [],
    spotlights: [],
    notes: [],
    beatPhase: 0,
    energyPulse: 0,
  };
}

export function initBackgroundBand(state: BackgroundBandState, width: number): void {
  const spacing = width / 5;

  state.members = [
    {
      x: spacing * 1 - 10,
      baseY: BAND_Y_BASE,
      bobPhase: 0,
      bobSpeed: 0.12,
      bobAmount: 2.5,
      armPhase: 0,
      armSpeed: 0.24,
      instrument: 'drums',
      spotlightHue: 320,
    },
    {
      x: spacing * 2,
      baseY: BAND_Y_BASE - 4,
      bobPhase: Math.PI * 0.5,
      bobSpeed: 0.08,
      bobAmount: 3.5,
      armPhase: Math.PI * 0.3,
      armSpeed: 0.10,
      instrument: 'guitar',
      spotlightHue: 140,
    },
    {
      x: spacing * 3,
      baseY: BAND_Y_BASE - 2,
      bobPhase: Math.PI,
      bobSpeed: 0.07,
      bobAmount: 3,
      armPhase: Math.PI * 0.7,
      armSpeed: 0.09,
      instrument: 'bass',
      spotlightHue: 220,
    },
    {
      x: spacing * 4 + 10,
      baseY: BAND_Y_BASE - 1,
      bobPhase: Math.PI * 1.5,
      bobSpeed: 0.06,
      bobAmount: 2,
      armPhase: Math.PI * 1.2,
      armSpeed: 0.15,
      instrument: 'keys',
      spotlightHue: 40,
    },
  ];

  state.spotlights = [
    { x: spacing * 0.5, baseAngle: -0.3, sweepSpeed: 0.015, sweepAmount: 0.4, hue: 320, intensity: 0.08, pulsePhase: 0, pulseSpeed: 0.04 },
    { x: spacing * 1.5, baseAngle: -0.1, sweepSpeed: 0.012, sweepAmount: 0.3, hue: 140, intensity: 0.06, pulsePhase: Math.PI * 0.5, pulseSpeed: 0.035 },
    { x: spacing * 2.5, baseAngle: 0.1, sweepSpeed: 0.018, sweepAmount: 0.35, hue: 220, intensity: 0.07, pulsePhase: Math.PI, pulseSpeed: 0.03 },
    { x: spacing * 3.5, baseAngle: 0.2, sweepSpeed: 0.014, sweepAmount: 0.25, hue: 40, intensity: 0.06, pulsePhase: Math.PI * 1.5, pulseSpeed: 0.045 },
    { x: spacing * 4.5, baseAngle: 0.3, sweepSpeed: 0.01, sweepAmount: 0.5, hue: 280, intensity: 0.05, pulsePhase: Math.PI * 0.3, pulseSpeed: 0.025 },
  ];

  state.notes = [];
}

export function updateBackgroundBand(state: BackgroundBandState): void {
  state.beatPhase += 0.08;
  state.energyPulse = 0.6 + Math.sin(state.beatPhase) * 0.4;

  for (const m of state.members) {
    m.bobPhase += m.bobSpeed;
    m.armPhase += m.armSpeed;
  }

  for (const s of state.spotlights) {
    s.pulsePhase += s.pulseSpeed;
  }

  if (state.notes.length < MAX_NOTES && Math.random() < 0.06) {
    const member = state.members[Math.floor(Math.random() * state.members.length)];
    state.notes.push({
      x: member.x + (Math.random() - 0.5) * 20,
      y: member.baseY - 20,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -0.4 - Math.random() * 0.6,
      size: 3 + Math.random() * 3,
      alpha: 0.5 + Math.random() * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.08,
      type: Math.floor(Math.random() * 3) as 0 | 1 | 2,
    });
  }

  for (let i = state.notes.length - 1; i >= 0; i--) {
    const n = state.notes[i];
    n.x += n.vx;
    n.y += n.vy;
    n.alpha -= 0.008;
    n.rotation += n.rotationSpeed;
    n.vx += (Math.random() - 0.5) * 0.05;
    if (n.alpha <= 0 || n.y < BAND_Y_BASE - 80) {
      state.notes.splice(i, 1);
    }
  }
}

function hslToRgb(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, gv = 0, b = 0;
  if (h < 60) { r = c; gv = x; }
  else if (h < 120) { r = x; gv = c; }
  else if (h < 180) { gv = c; b = x; }
  else if (h < 240) { gv = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((gv + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

function drawSpotlights(
  g: Phaser.GameObjects.Graphics,
  state: BackgroundBandState,
  height: number
): void {
  for (const s of state.spotlights) {
    const angle = s.baseAngle + Math.sin(state.beatPhase * s.sweepSpeed * 10) * s.sweepAmount;
    const pulse = 0.5 + Math.sin(s.pulsePhase) * 0.5;
    const alpha = s.intensity * pulse * state.energyPulse;
    const color = hslToRgb(s.hue, 0.7, 0.5);

    const beamWidth = 35;
    const topX = s.x;
    const topY = 0;
    const bottomLeftX = s.x + Math.sin(angle - 0.15) * height - beamWidth;
    const bottomRightX = s.x + Math.sin(angle + 0.15) * height + beamWidth;

    g.fillStyle(color, alpha * 0.3);
    g.fillTriangle(topX, topY, bottomLeftX, height, bottomRightX, height);

    g.fillStyle(color, alpha * 0.15);
    g.fillTriangle(topX, topY, bottomLeftX - 15, height, bottomRightX + 15, height);
  }
}

function drawStageGlow(
  g: Phaser.GameObjects.Graphics,
  state: BackgroundBandState,
  width: number,
  height: number
): void {
  const glowY = BAND_Y_BASE + 10;
  const pulse = state.energyPulse;

  g.fillStyle(STAGE_FLOOR_COLOR, 0.4 * pulse);
  g.fillRect(0, glowY, width, height - glowY);

  for (const m of state.members) {
    const color = hslToRgb(m.spotlightHue, 0.6, 0.3);
    g.fillStyle(color, 0.04 * pulse);
    g.fillCircle(m.x, glowY + 5, 40);
    g.fillStyle(color, 0.02 * pulse);
    g.fillCircle(m.x, glowY + 5, 60);
  }
}

function drawDrummerSilhouette(
  g: Phaser.GameObjects.Graphics,
  m: BandMember,
  alpha: number
): void {
  const y = m.baseY + Math.sin(m.bobPhase) * m.bobAmount;
  const armSwing = Math.sin(m.armPhase) * 8;

  g.fillStyle(SILHOUETTE_COLOR, alpha);
  g.fillCircle(m.x, y - 18, 6);

  g.fillStyle(SILHOUETTE_COLOR, alpha);
  g.fillRect(m.x - 5, y - 12, 10, 14);

  g.lineStyle(2.5, SILHOUETTE_COLOR, alpha);
  g.lineBetween(m.x - 4, y - 8, m.x - 12 + armSwing, y - 18);
  g.lineBetween(m.x + 4, y - 8, m.x + 12 - armSwing, y - 18);

  g.lineStyle(1.5, SILHOUETTE_COLOR, alpha * 0.7);
  g.lineBetween(m.x - 12 + armSwing, y - 18, m.x - 14 + armSwing, y - 22);
  g.lineBetween(m.x + 12 - armSwing, y - 18, m.x + 14 - armSwing, y - 22);

  g.fillStyle(SILHOUETTE_COLOR, alpha * 0.8);
  g.fillEllipse(m.x, y + 4, 22, 6);

  g.lineStyle(1, SILHOUETTE_COLOR, alpha * 0.5);
  g.lineBetween(m.x - 14, y + 4, m.x - 14, y - 4);
  g.lineBetween(m.x + 14, y + 4, m.x + 14, y - 4);

  g.fillStyle(SILHOUETTE_COLOR, alpha * 0.6);
  g.fillCircle(m.x - 16, y - 6, 5);
  g.fillCircle(m.x + 16, y - 6, 5);

  g.fillStyle(SILHOUETTE_COLOR, alpha * 0.5);
  g.fillCircle(m.x, y - 2, 8);
}

function drawGuitaristSilhouette(
  g: Phaser.GameObjects.Graphics,
  m: BandMember,
  alpha: number,
  flipped: boolean
): void {
  const y = m.baseY + Math.sin(m.bobPhase) * m.bobAmount;
  const lean = Math.sin(m.bobPhase * 0.5) * 3;
  const strum = Math.sin(m.armPhase) * 5;
  const dir = flipped ? -1 : 1;

  g.fillStyle(SILHOUETTE_COLOR, alpha);
  g.fillCircle(m.x + lean, y - 22, 7);

  g.fillStyle(SILHOUETTE_COLOR, alpha);
  g.fillRect(m.x - 5 + lean, y - 15, 10, 18);

  const neckStartX = m.x + dir * 6 + lean;
  const neckStartY = y - 6;
  const neckEndX = m.x + dir * 28 + lean;
  const neckEndY = y - 20 + strum;

  g.lineStyle(2, SILHOUETTE_COLOR, alpha);
  g.lineBetween(neckStartX, neckStartY, neckEndX, neckEndY);

  g.fillStyle(SILHOUETTE_COLOR, alpha * 0.9);
  g.fillEllipse(m.x + dir * 4 + lean, y - 4, 12, 8);

  g.lineStyle(2.5, SILHOUETTE_COLOR, alpha);
  g.lineBetween(m.x - dir * 2 + lean, y - 10, m.x + dir * 4 + lean + strum * 0.3, y - 4);

  g.lineStyle(2.5, SILHOUETTE_COLOR, alpha);
  g.lineBetween(m.x + dir * 3 + lean, y - 10, neckStartX + dir * 6, neckStartY - 4 + strum * 0.5);

  g.lineStyle(2, SILHOUETTE_COLOR, alpha);
  g.lineBetween(m.x - 3 + lean, y + 3, m.x - 8 + lean, y + 16);
  g.lineBetween(m.x + 3 + lean, y + 3, m.x + 6 + lean, y + 16);
}

function drawKeyboardistSilhouette(
  g: Phaser.GameObjects.Graphics,
  m: BandMember,
  alpha: number
): void {
  const y = m.baseY + Math.sin(m.bobPhase) * m.bobAmount;
  const fingerWiggle = Math.sin(m.armPhase) * 3;

  g.fillStyle(SILHOUETTE_COLOR, alpha);
  g.fillCircle(m.x, y - 20, 6.5);

  g.fillStyle(SILHOUETTE_COLOR, alpha);
  g.fillRect(m.x - 5, y - 14, 10, 15);

  g.fillStyle(SILHOUETTE_COLOR, alpha * 0.85);
  g.fillRect(m.x - 16, y - 2, 32, 5);

  g.lineStyle(2, SILHOUETTE_COLOR, alpha * 0.7);
  g.lineBetween(m.x - 16, y + 3, m.x - 18, y + 14);
  g.lineBetween(m.x + 16, y + 3, m.x + 18, y + 14);

  g.lineStyle(2.5, SILHOUETTE_COLOR, alpha);
  g.lineBetween(m.x - 4, y - 10, m.x - 8 + fingerWiggle, y - 2);
  g.lineBetween(m.x + 4, y - 10, m.x + 8 - fingerWiggle, y - 2);

  g.lineStyle(2, SILHOUETTE_COLOR, alpha);
  g.lineBetween(m.x - 3, y + 1, m.x - 7, y + 16);
  g.lineBetween(m.x + 3, y + 1, m.x + 5, y + 16);
}

function drawMusicNotes(
  g: Phaser.GameObjects.Graphics,
  state: BackgroundBandState
): void {
  for (const n of state.notes) {
    const color = hslToRgb(
      (state.beatPhase * 20 + n.x) % 360,
      0.5,
      0.45
    );
    g.fillStyle(color, n.alpha * 0.6);

    if (n.type === 0) {
      g.fillCircle(n.x, n.y, n.size * 0.55);
      g.lineStyle(1, color, n.alpha * 0.5);
      g.lineBetween(n.x + n.size * 0.5, n.y, n.x + n.size * 0.5, n.y - n.size * 1.5);
    } else if (n.type === 1) {
      g.fillCircle(n.x, n.y, n.size * 0.5);
      g.lineStyle(1, color, n.alpha * 0.5);
      g.lineBetween(n.x + n.size * 0.45, n.y, n.x + n.size * 0.45, n.y - n.size * 1.4);
      g.lineStyle(1.5, color, n.alpha * 0.4);
      g.lineBetween(n.x + n.size * 0.45, n.y - n.size * 1.4, n.x + n.size * 1.2, n.y - n.size * 1.1);
    } else {
      g.fillCircle(n.x - n.size * 0.3, n.y, n.size * 0.4);
      g.fillCircle(n.x + n.size * 0.3, n.y + n.size * 0.2, n.size * 0.4);
      g.lineStyle(1, color, n.alpha * 0.5);
      g.lineBetween(n.x - n.size * 0.3 + n.size * 0.35, n.y, n.x - n.size * 0.3 + n.size * 0.35, n.y - n.size * 1.3);
      g.lineBetween(n.x + n.size * 0.3 + n.size * 0.35, n.y + n.size * 0.2, n.x + n.size * 0.3 + n.size * 0.35, n.y - n.size * 1.1);
      g.lineStyle(1.5, color, n.alpha * 0.4);
      g.lineBetween(
        n.x - n.size * 0.3 + n.size * 0.35, n.y - n.size * 1.3,
        n.x + n.size * 0.3 + n.size * 0.35, n.y - n.size * 1.1
      );
    }
  }
}

function drawMemberSilhouettes(
  g: Phaser.GameObjects.Graphics,
  state: BackgroundBandState
): void {
  const baseAlpha = 0.55 + state.energyPulse * 0.15;

  for (const m of state.members) {
    switch (m.instrument) {
      case 'drums':
        drawDrummerSilhouette(g, m, baseAlpha);
        break;
      case 'guitar':
        drawGuitaristSilhouette(g, m, baseAlpha, false);
        break;
      case 'bass':
        drawGuitaristSilhouette(g, m, baseAlpha, true);
        break;
      case 'keys':
        drawKeyboardistSilhouette(g, m, baseAlpha);
        break;
    }
  }
}

function drawMemberGlows(
  g: Phaser.GameObjects.Graphics,
  state: BackgroundBandState
): void {
  for (const m of state.members) {
    const y = m.baseY + Math.sin(m.bobPhase) * m.bobAmount;
    const color = hslToRgb(m.spotlightHue, 0.5, 0.4);
    const pulse = 0.5 + Math.sin(state.beatPhase + m.bobPhase) * 0.5;

    g.fillStyle(color, 0.03 * pulse);
    g.fillCircle(m.x, y - 8, 25);
    g.fillStyle(color, 0.015 * pulse);
    g.fillCircle(m.x, y - 8, 40);
  }
}

export function drawBackgroundBand(
  g: Phaser.GameObjects.Graphics,
  state: BackgroundBandState,
  width: number,
  height: number
): void {
  if (state.members.length === 0) return;

  drawSpotlights(g, state, height);
  drawStageGlow(g, state, width, height);
  drawMemberGlows(g, state);
  drawMemberSilhouettes(g, state);
  drawMusicNotes(g, state);
}
