interface Bumper {
  gridX: number;
  gridY: number;
  radius: number;
  flashIntensity: number;
  hitCount: number;
  pulsePhase: number;
  color: number;
  points: number;
}

interface BumperHitEffect {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  rings: { radius: number; alpha: number }[];
  sparks: { x: number; y: number; vx: number; vy: number; life: number; size: number }[];
  points: number;
}

interface Flipper {
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  targetAngle: number;
  side: 'left' | 'right';
  flashIntensity: number;
}

interface PinballLane {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  glowPhase: number;
}

export interface PinballState {
  active: boolean;
  activationTick: number;
  bumpers: Bumper[];
  hitEffects: BumperHitEffect[];
  flippers: Flipper[];
  lanes: PinballLane[];
  frameCount: number;
  transitionAlpha: number;
  totalBumperHits: number;
  bannerText: string;
  bannerLife: number;
}

const BUMPER_COLORS = [0xff3366, 0x33ccff, 0xffcc00, 0x66ff33, 0xff6633];
const BUMPER_POINTS = [10, 15, 20, 25, 30];
const MAX_BUMPERS = 6;
const MAX_HIT_EFFECTS = 4;
const BUMPER_FLASH_DECAY = 0.92;
const PINBALL_ACTIVATION_TICKS = 67;

export function createPinballState(): PinballState {
  return {
    active: false,
    activationTick: 0,
    bumpers: [],
    hitEffects: [],
    flippers: [],
    lanes: [],
    frameCount: 0,
    transitionAlpha: 0,
    totalBumperHits: 0,
    bannerText: '',
    bannerLife: 0,
  };
}

export function shouldActivatePinball(tickCount: number, gameStarted: boolean, active: boolean): boolean {
  return gameStarted && !active && tickCount >= PINBALL_ACTIVATION_TICKS;
}

export function activatePinball(
  state: PinballState,
  gridSize: number,
  cellSize: number,
  snakePositions: { x: number; y: number }[],
  foodPos: { x: number; y: number }
): void {
  state.active = true;
  state.transitionAlpha = 0;
  state.bannerText = 'PINBALL MODE';
  state.bannerLife = 90;
  state.bumpers = generateBumpers(gridSize, snakePositions, foodPos);
  state.flippers = generateFlippers(gridSize, cellSize);
  state.lanes = generateLanes(gridSize, cellSize);
}

function generateBumpers(
  gridSize: number,
  snakePositions: { x: number; y: number }[],
  foodPos: { x: number; y: number }
): Bumper[] {
  const bumpers: Bumper[] = [];
  const occupied = new Set(snakePositions.map(p => `${p.x},${p.y}`));
  occupied.add(`${foodPos.x},${foodPos.y}`);

  const margin = 3;
  const minDist = 3;
  let attempts = 0;

  while (bumpers.length < MAX_BUMPERS && attempts < 200) {
    attempts++;
    const gx = margin + Math.floor(Math.random() * (gridSize - margin * 2));
    const gy = margin + Math.floor(Math.random() * (gridSize - margin * 2));

    if (occupied.has(`${gx},${gy}`)) continue;

    let tooClose = false;
    for (const b of bumpers) {
      const dx = b.gridX - gx;
      const dy = b.gridY - gy;
      if (Math.sqrt(dx * dx + dy * dy) < minDist) {
        tooClose = true;
        break;
      }
    }
    if (tooClose) continue;

    const colorIdx = bumpers.length % BUMPER_COLORS.length;
    bumpers.push({
      gridX: gx,
      gridY: gy,
      radius: 0.7,
      flashIntensity: 0,
      hitCount: 0,
      pulsePhase: Math.random() * Math.PI * 2,
      color: BUMPER_COLORS[colorIdx],
      points: BUMPER_POINTS[colorIdx],
    });

    occupied.add(`${gx},${gy}`);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        occupied.add(`${gx + dx},${gy + dy}`);
      }
    }
  }

  return bumpers;
}

function generateFlippers(gridSize: number, cellSize: number): Flipper[] {
  const width = gridSize * cellSize;
  const bottomY = (gridSize - 2) * cellSize;
  const flipperWidth = cellSize * 3;
  const flipperHeight = cellSize * 0.4;

  return [
    {
      x: width * 0.25,
      y: bottomY,
      width: flipperWidth,
      height: flipperHeight,
      angle: 0.3,
      targetAngle: 0.3,
      side: 'left',
      flashIntensity: 0,
    },
    {
      x: width * 0.75,
      y: bottomY,
      width: flipperWidth,
      height: flipperHeight,
      angle: -0.3,
      targetAngle: -0.3,
      side: 'right',
      flashIntensity: 0,
    },
  ];
}

function generateLanes(gridSize: number, cellSize: number): PinballLane[] {
  const width = gridSize * cellSize;
  const height = gridSize * cellSize;
  return [
    { x1: 0, y1: height * 0.3, x2: width * 0.1, y2: height * 0.5, glowPhase: 0 },
    { x1: width, y1: height * 0.3, x2: width * 0.9, y2: height * 0.5, glowPhase: Math.PI },
    { x1: width * 0.3, y1: 0, x2: width * 0.2, y2: height * 0.15, glowPhase: Math.PI * 0.5 },
    { x1: width * 0.7, y1: 0, x2: width * 0.8, y2: height * 0.15, glowPhase: Math.PI * 1.5 },
  ];
}

export function checkBumperCollision(
  state: PinballState,
  headX: number,
  headY: number,
  cellSize: number
): { hit: boolean; points: number; bumperIndex: number } {
  if (!state.active) return { hit: false, points: 0, bumperIndex: -1 };

  for (let i = 0; i < state.bumpers.length; i++) {
    const b = state.bumpers[i];
    const bx = b.gridX;
    const by = b.gridY;
    const dx = headX - bx;
    const dy = headY - by;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1.5) {
      return { hit: true, points: b.points, bumperIndex: i };
    }
  }

  return { hit: false, points: 0, bumperIndex: -1 };
}

export function triggerBumperHit(
  state: PinballState,
  bumperIndex: number,
  cellSize: number
): void {
  const bumper = state.bumpers[bumperIndex];
  if (!bumper) return;

  bumper.flashIntensity = 1.0;
  bumper.hitCount++;
  state.totalBumperHits++;

  const px = bumper.gridX * cellSize + cellSize / 2;
  const py = bumper.gridY * cellSize + cellSize / 2;

  if (state.hitEffects.length >= MAX_HIT_EFFECTS) {
    state.hitEffects.shift();
  }

  const sparks: BumperHitEffect['sparks'] = [];
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 2 + Math.random() * 3;
    sparks.push({
      x: px,
      y: py,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 2 + Math.random() * 2,
    });
  }

  state.hitEffects.push({
    x: px,
    y: py,
    life: 1,
    maxLife: 1,
    rings: [
      { radius: 5, alpha: 1 },
      { radius: 3, alpha: 0.7 },
    ],
    sparks,
    points: bumper.points,
  });

  if (state.totalBumperHits % 5 === 0) {
    state.bannerText = `${state.totalBumperHits}x BUMPER COMBO`;
    state.bannerLife = 60;
  }
}

export function updatePinball(state: PinballState): void {
  if (!state.active) return;

  state.frameCount++;

  if (state.transitionAlpha < 1) {
    state.transitionAlpha = Math.min(1, state.transitionAlpha + 0.02);
  }

  if (state.bannerLife > 0) {
    state.bannerLife--;
  }

  for (const b of state.bumpers) {
    b.pulsePhase += 0.06;
    b.flashIntensity *= BUMPER_FLASH_DECAY;
  }

  for (const f of state.flippers) {
    const swing = Math.sin(state.frameCount * 0.05) * 0.15;
    f.targetAngle = f.side === 'left' ? 0.3 + swing : -0.3 - swing;
    f.angle += (f.targetAngle - f.angle) * 0.15;
    f.flashIntensity *= 0.95;
  }

  for (const lane of state.lanes) {
    lane.glowPhase += 0.04;
  }

  for (let i = state.hitEffects.length - 1; i >= 0; i--) {
    const eff = state.hitEffects[i];
    eff.life -= 0.03;

    for (const ring of eff.rings) {
      ring.radius += 2.5;
      ring.alpha *= 0.93;
    }

    for (const spark of eff.sparks) {
      spark.x += spark.vx;
      spark.y += spark.vy;
      spark.vy += 0.08;
      spark.life -= 0.04;
    }

    eff.sparks = eff.sparks.filter(s => s.life > 0);

    if (eff.life <= 0 && eff.sparks.length === 0) {
      state.hitEffects.splice(i, 1);
    }
  }
}

export function drawPinballBumpers(
  g: Phaser.GameObjects.Graphics,
  state: PinballState,
  cellSize: number
): void {
  if (!state.active) return;

  const alpha = state.transitionAlpha;

  for (const b of state.bumpers) {
    const cx = b.gridX * cellSize + cellSize / 2;
    const cy = b.gridY * cellSize + cellSize / 2;
    const pulse = 0.9 + Math.sin(b.pulsePhase) * 0.1;
    const flash = b.flashIntensity;
    const baseRadius = cellSize * b.radius * pulse;

    g.fillStyle(b.color, (0.15 + flash * 0.3) * alpha);
    g.fillCircle(cx, cy, baseRadius * 1.8);

    g.fillStyle(b.color, (0.5 + flash * 0.5) * alpha);
    g.fillCircle(cx, cy, baseRadius);

    g.fillStyle(0xffffff, (0.3 + flash * 0.7) * alpha);
    g.fillCircle(cx, cy, baseRadius * 0.5);

    g.lineStyle(2, b.color, (0.8 + flash * 0.2) * alpha);
    g.strokeCircle(cx, cy, baseRadius * 1.1);

    if (flash > 0.1) {
      g.fillStyle(0xffffff, flash * 0.4 * alpha);
      g.fillCircle(cx, cy, baseRadius * 2.2);
    }
  }
}

export function drawPinballFlippers(
  g: Phaser.GameObjects.Graphics,
  state: PinballState
): void {
  if (!state.active) return;

  const alpha = state.transitionAlpha;

  for (const f of state.flippers) {
    const pulse = 0.8 + Math.sin(state.frameCount * 0.08) * 0.2;

    g.fillStyle(0x6644aa, 0.3 * alpha);
    g.fillRoundedRect(
      f.x - f.width / 2 - 2,
      f.y - f.height / 2 - 2,
      f.width + 4,
      f.height + 4,
      f.height
    );

    g.fillStyle(0xcc88ff, (0.7 + f.flashIntensity * 0.3) * alpha * pulse);
    g.fillRoundedRect(
      f.x - f.width / 2,
      f.y - f.height / 2,
      f.width,
      f.height,
      f.height / 2
    );

    g.fillStyle(0xffffff, 0.4 * alpha * pulse);
    g.fillRoundedRect(
      f.x - f.width / 2 + 4,
      f.y - f.height / 2 + 2,
      f.width - 8,
      f.height * 0.4,
      f.height / 4
    );
  }
}

export function drawPinballLanes(
  g: Phaser.GameObjects.Graphics,
  state: PinballState
): void {
  if (!state.active) return;

  const alpha = state.transitionAlpha;

  for (const lane of state.lanes) {
    const glow = 0.3 + Math.sin(lane.glowPhase) * 0.15;

    g.lineStyle(4, 0x6644aa, glow * alpha);
    g.beginPath();
    g.moveTo(lane.x1, lane.y1);
    g.lineTo(lane.x2, lane.y2);
    g.strokePath();

    g.lineStyle(2, 0xcc88ff, (glow + 0.2) * alpha);
    g.beginPath();
    g.moveTo(lane.x1, lane.y1);
    g.lineTo(lane.x2, lane.y2);
    g.strokePath();
  }
}

export function drawPinballHitEffects(
  g: Phaser.GameObjects.Graphics,
  state: PinballState
): void {
  if (!state.active) return;

  for (const eff of state.hitEffects) {
    for (const ring of eff.rings) {
      g.lineStyle(3 * eff.life, 0xffcc00, ring.alpha * eff.life);
      g.strokeCircle(eff.x, eff.y, ring.radius);
    }

    for (const spark of eff.sparks) {
      g.fillStyle(0xffcc00, spark.life * 0.8);
      g.fillCircle(spark.x, spark.y, spark.size * spark.life);

      g.fillStyle(0xffffff, spark.life * 0.4);
      g.fillCircle(spark.x, spark.y, spark.size * spark.life * 0.5);
    }
  }
}

export function drawPinballBanner(
  g: Phaser.GameObjects.Graphics,
  state: PinballState,
  width: number,
  height: number,
  drawTextFn: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  if (!state.active) return;

  if (state.bannerLife > 0) {
    const bannerAlpha = Math.min(1, state.bannerLife / 30);
    const bannerY = height * 0.15;
    const shake = state.bannerLife > 60 ? Math.sin(state.frameCount * 0.5) * 2 : 0;

    g.fillStyle(0x000000, 0.5 * bannerAlpha);
    g.fillRect(0, bannerY - 15, width, 30);

    g.fillStyle(0xcc88ff, 0.3 * bannerAlpha);
    g.fillRect(0, bannerY - 15, width, 2);
    g.fillRect(0, bannerY + 13, width, 2);

    drawTextFn(
      g,
      state.bannerText,
      width / 2 - state.bannerText.length * 4 + shake,
      bannerY,
      12,
      0xffcc00,
      bannerAlpha
    );
  }
}

export function drawPinballScorePopups(
  g: Phaser.GameObjects.Graphics,
  state: PinballState,
  drawTextFn: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  if (!state.active) return;

  for (const eff of state.hitEffects) {
    if (eff.life > 0.3) {
      const popupY = eff.y - 20 - (1 - eff.life) * 30;
      const popupAlpha = Math.min(1, (eff.life - 0.3) / 0.3);
      const text = `+${eff.points}`;
      drawTextFn(g, text, eff.x - text.length * 3, popupY, 10, 0xffcc00, popupAlpha);
    }
  }
}
