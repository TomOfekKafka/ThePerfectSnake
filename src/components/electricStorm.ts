import Phaser from 'phaser';

interface LightningArc {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: number;
  width: number;
  intensity: number;
}

interface ArcSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

interface ElectricGlow {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: number;
}

export interface ElectricStormState {
  bodyArcs: LightningArc[];
  burstArcs: LightningArc[];
  sparks: ArcSpark[];
  glows: ElectricGlow[];
  intensity: number;
  pulsePhase: number;
  burstFlash: number;
  burstX: number;
  burstY: number;
}

const MAX_BODY_ARCS = 6;
const MAX_BURST_ARCS = 8;
const MAX_SPARKS = 30;
const MAX_GLOWS = 4;
const ARC_POINTS = 6;

const ELECTRIC_BLUE = 0x44ccff;
const ELECTRIC_WHITE = 0xeeffff;
const ELECTRIC_CYAN = 0x22aaee;
const ELECTRIC_PURPLE = 0x8866ff;

export function createElectricStormState(): ElectricStormState {
  return {
    bodyArcs: [],
    burstArcs: [],
    sparks: [],
    glows: [],
    intensity: 0,
    pulsePhase: 0,
    burstFlash: 0,
    burstX: 0,
    burstY: 0,
  };
}

function generateArcPath(
  x1: number, y1: number,
  x2: number, y2: number,
  jitter: number
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const dx = x2 - x1;
  const dy = y2 - y1;
  const perpX = -dy;
  const perpY = dx;
  const len = Math.sqrt(dx * dx + dy * dy);
  const normPerpX = len > 0 ? perpX / len : 0;
  const normPerpY = len > 0 ? perpY / len : 0;

  for (let i = 0; i <= ARC_POINTS; i++) {
    const t = i / ARC_POINTS;
    const baseX = x1 + dx * t;
    const baseY = y1 + dy * t;
    const midFactor = 1 - Math.abs(t - 0.5) * 2;
    const offset = (Math.random() - 0.5) * jitter * midFactor;
    points.push({
      x: baseX + normPerpX * offset,
      y: baseY + normPerpY * offset,
    });
  }
  return points;
}

export function triggerElectricBurst(
  state: ElectricStormState,
  cx: number, cy: number,
  radius: number
): void {
  state.burstFlash = 1.0;
  state.burstX = cx;
  state.burstY = cy;
  state.intensity = Math.min(1, state.intensity + 0.5);

  while (state.burstArcs.length + 4 > MAX_BURST_ARCS) {
    state.burstArcs.shift();
  }

  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.random() * 0.8;
    const reach = radius * (0.6 + Math.random() * 0.6);
    const endX = cx + Math.cos(angle) * reach;
    const endY = cy + Math.sin(angle) * reach;
    const life = 0.4 + Math.random() * 0.3;

    state.burstArcs.push({
      points: generateArcPath(cx, cy, endX, endY, reach * 0.5),
      life,
      maxLife: life,
      color: Math.random() > 0.3 ? ELECTRIC_BLUE : ELECTRIC_PURPLE,
      width: 2 + Math.random() * 2,
      intensity: 0.8 + Math.random() * 0.2,
    });
  }

  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    state.sparks.push({
      x: cx + (Math.random() - 0.5) * 10,
      y: cy + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2,
      life: 0.3 + Math.random() * 0.4,
    });
    if (state.sparks.length > MAX_SPARKS) state.sparks.shift();
  }

  state.glows.push({
    x: cx, y: cy,
    radius: radius * 0.5,
    alpha: 0.6,
    color: ELECTRIC_BLUE,
  });
  if (state.glows.length > MAX_GLOWS) state.glows.shift();
}

export function updateElectricStorm(
  state: ElectricStormState,
  snakeSegments: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  state.pulsePhase += 0.08;
  state.intensity *= 0.985;
  state.burstFlash *= 0.88;
  if (state.burstFlash < 0.01) state.burstFlash = 0;

  for (let i = state.burstArcs.length - 1; i >= 0; i--) {
    state.burstArcs[i].life -= 0.06;
    if (state.burstArcs[i].life <= 0) state.burstArcs.splice(i, 1);
  }

  for (let i = state.bodyArcs.length - 1; i >= 0; i--) {
    state.bodyArcs[i].life -= 0.08;
    if (state.bodyArcs[i].life <= 0) state.bodyArcs.splice(i, 1);
  }

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy += 0.05;
    s.vx *= 0.96;
    s.life -= 0.04;
    s.size *= 0.97;
    if (s.life <= 0 || s.size < 0.3) state.sparks.splice(i, 1);
  }

  for (let i = state.glows.length - 1; i >= 0; i--) {
    state.glows[i].alpha *= 0.9;
    state.glows[i].radius += 1;
    if (state.glows[i].alpha < 0.01) state.glows.splice(i, 1);
  }

  const baseChance = state.intensity > 0.1 ? 0.15 : 0.04;
  const spawnChance = baseChance + state.intensity * 0.3;

  if (snakeSegments.length >= 3 && Math.random() < spawnChance && state.bodyArcs.length < MAX_BODY_ARCS) {
    const segCount = snakeSegments.length;
    const fromIdx = Math.floor(Math.random() * segCount);
    let toIdx = fromIdx + 1 + Math.floor(Math.random() * Math.min(4, segCount - fromIdx - 1));
    toIdx = Math.min(toIdx, segCount - 1);
    if (toIdx <= fromIdx) toIdx = Math.min(fromIdx + 1, segCount - 1);
    if (toIdx === fromIdx) return;

    const from = snakeSegments[fromIdx];
    const to = snakeSegments[toIdx];
    const x1 = from.x * cellSize + cellSize / 2;
    const y1 = from.y * cellSize + cellSize / 2;
    const x2 = to.x * cellSize + cellSize / 2;
    const y2 = to.y * cellSize + cellSize / 2;
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const jitter = dist * 0.4 + state.intensity * 10;
    const life = 0.15 + Math.random() * 0.2 + state.intensity * 0.15;

    state.bodyArcs.push({
      points: generateArcPath(x1, y1, x2, y2, jitter),
      life,
      maxLife: life,
      color: frameCount % 20 < 3 ? ELECTRIC_PURPLE : ELECTRIC_CYAN,
      width: 1 + state.intensity * 1.5,
      intensity: 0.5 + state.intensity * 0.5,
    });

    if (Math.random() < 0.3 + state.intensity * 0.3) {
      const midPt = state.bodyArcs[state.bodyArcs.length - 1].points[Math.floor(ARC_POINTS / 2)];
      state.sparks.push({
        x: midPt.x,
        y: midPt.y,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2 - 0.5,
        size: 1 + Math.random(),
        life: 0.2 + Math.random() * 0.2,
      });
      if (state.sparks.length > MAX_SPARKS) state.sparks.shift();
    }
  }
}

function drawArc(
  g: Phaser.GameObjects.Graphics,
  arc: LightningArc,
  framePhase: number
): void {
  const lifeRatio = arc.life / arc.maxLife;
  const flicker = 0.7 + Math.sin(framePhase * 12 + arc.life * 30) * 0.3;
  const alpha = lifeRatio * arc.intensity * flicker;

  g.lineStyle(arc.width + 3, arc.color, alpha * 0.2);
  drawArcPath(g, arc.points);

  g.lineStyle(arc.width + 1, arc.color, alpha * 0.5);
  drawArcPath(g, arc.points);

  g.lineStyle(arc.width * 0.5, ELECTRIC_WHITE, alpha * 0.8);
  drawArcPath(g, arc.points);
}

function drawArcPath(
  g: Phaser.GameObjects.Graphics,
  points: { x: number; y: number }[]
): void {
  if (points.length < 2) return;
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.strokePath();
}

export function drawElectricStorm(
  g: Phaser.GameObjects.Graphics,
  state: ElectricStormState,
  frameCount: number
): void {
  const phase = frameCount * 0.1;

  if (state.burstFlash > 0.01) {
    g.fillStyle(ELECTRIC_BLUE, state.burstFlash * 0.12);
    g.fillCircle(state.burstX, state.burstY, 60);
    g.fillStyle(ELECTRIC_WHITE, state.burstFlash * 0.25);
    g.fillCircle(state.burstX, state.burstY, 20);
  }

  for (const glow of state.glows) {
    g.fillStyle(glow.color, glow.alpha * 0.3);
    g.fillCircle(glow.x, glow.y, glow.radius);
    g.fillStyle(ELECTRIC_WHITE, glow.alpha * 0.15);
    g.fillCircle(glow.x, glow.y, glow.radius * 0.4);
  }

  for (const arc of state.bodyArcs) {
    drawArc(g, arc, phase);
  }

  for (const arc of state.burstArcs) {
    drawArc(g, arc, phase);
  }

  for (const spark of state.sparks) {
    const sparkAlpha = spark.life * 0.8;
    g.fillStyle(ELECTRIC_BLUE, sparkAlpha * 0.4);
    g.fillCircle(spark.x, spark.y, spark.size * 2);
    g.fillStyle(ELECTRIC_WHITE, sparkAlpha * 0.9);
    g.fillCircle(spark.x, spark.y, spark.size * 0.6);
  }
}
