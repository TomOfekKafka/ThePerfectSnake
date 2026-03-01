import { THEME } from './gameTheme';

export interface FallingTile {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  vx: number;
  rotation: number;
  rotSpeed: number;
  color: number;
  alpha: number;
  delay: number;
  fallen: boolean;
}

export interface RisingText {
  text: string;
  targetY: number;
  currentY: number;
  alpha: number;
  size: number;
  color: number;
  glitchTimer: number;
  settled: boolean;
}

export interface DropDeathState {
  active: boolean;
  phase: number;
  tiles: FallingTile[];
  texts: RisingText[];
  shockwaveRadius: number;
  shockwaveAlpha: number;
  crackLines: { x1: number; y1: number; x2: number; y2: number; alpha: number }[];
  screenShake: number;
  flashAlpha: number;
  score: number;
  snakeLength: number;
  deathMessage: string;
  deathReason: string;
}

const MAX_TILES = 80;
const GRAVITY = 0.35;
const CRACK_COUNT = 12;

export function createDropDeathState(): DropDeathState {
  return {
    active: false,
    phase: 0,
    tiles: [],
    texts: [],
    shockwaveRadius: 0,
    shockwaveAlpha: 0,
    crackLines: [],
    screenShake: 0,
    flashAlpha: 0,
    score: 0,
    snakeLength: 0,
    deathMessage: '',
    deathReason: '',
  };
}

export function triggerDropDeath(
  state: DropDeathState,
  snake: { x: number; y: number }[],
  cellSize: number,
  gridSize: number,
  score: number,
  snakeLength: number,
  deathMessage: string,
  deathReason: string
): void {
  state.active = true;
  state.phase = 0;
  state.tiles = [];
  state.texts = [];
  state.score = score;
  state.snakeLength = snakeLength;
  state.deathMessage = deathMessage;
  state.deathReason = deathReason;
  state.flashAlpha = 0.8;
  state.screenShake = 12;

  const headX = snake.length > 0 ? snake[0].x * cellSize + cellSize / 2 : (gridSize * cellSize) / 2;
  const headY = snake.length > 0 ? snake[0].y * cellSize + cellSize / 2 : (gridSize * cellSize) / 2;

  state.shockwaveRadius = 5;
  state.shockwaveAlpha = 1;

  state.crackLines = [];
  for (let i = 0; i < CRACK_COUNT; i++) {
    const angle = (i / CRACK_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const length = 40 + Math.random() * 100;
    state.crackLines.push({
      x1: headX,
      y1: headY,
      x2: headX + Math.cos(angle) * length,
      y2: headY + Math.sin(angle) * length,
      alpha: 1,
    });
  }

  const tileSize = cellSize * 2;
  const cols = Math.ceil(gridSize * cellSize / tileSize);
  const rows = Math.ceil(gridSize * cellSize / tileSize);
  let tileCount = 0;

  for (let row = 0; row < rows && tileCount < MAX_TILES; row++) {
    for (let col = 0; col < cols && tileCount < MAX_TILES; col++) {
      const tx = col * tileSize;
      const ty = row * tileSize;
      const dx = tx + tileSize / 2 - headX;
      const dy = ty + tileSize / 2 - headY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = gridSize * cellSize * 0.7;
      const delay = Math.min(60, (dist / maxDist) * 50) + Math.random() * 8;

      const isSnakeTile = snake.some(s => {
        const sx = s.x * cellSize;
        const sy = s.y * cellSize;
        return sx >= tx - cellSize && sx < tx + tileSize + cellSize &&
               sy >= ty - cellSize && sy < ty + tileSize + cellSize;
      });

      const color = isSnakeTile
        ? (Math.random() > 0.5 ? THEME.snake.head : THEME.snake.tail)
        : (Math.random() > 0.7 ? THEME.bg.light : THEME.bg.mid);

      state.tiles.push({
        x: tx,
        y: ty,
        width: tileSize + 1,
        height: tileSize + 1,
        vy: 0,
        vx: (dx / (dist || 1)) * (0.5 + Math.random()),
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.06,
        color,
        alpha: isSnakeTile ? 0.9 : 0.6,
        delay,
        fallen: false,
      });
      tileCount++;
    }
  }

  const boardHeight = gridSize * cellSize;
  const centerX = (gridSize * cellSize) / 2;

  state.texts = [
    {
      text: deathMessage,
      targetY: boardHeight * 0.28,
      currentY: boardHeight + 40,
      alpha: 0,
      size: 12,
      color: THEME.food.glow,
      glitchTimer: 0,
      settled: false,
    },
    {
      text: deathReason,
      targetY: boardHeight * 0.40,
      currentY: boardHeight + 80,
      alpha: 0,
      size: 10,
      color: THEME.snake.glow,
      glitchTimer: 0,
      settled: false,
    },
    {
      text: `SCORE  ${String(score).padStart(5, '0')}`,
      targetY: boardHeight * 0.55,
      currentY: boardHeight + 120,
      alpha: 0,
      size: 14,
      color: THEME.hud.text,
      glitchTimer: 0,
      settled: false,
    },
    {
      text: `LENGTH  ${snakeLength}`,
      targetY: boardHeight * 0.65,
      currentY: boardHeight + 160,
      alpha: 0,
      size: 9,
      color: THEME.hud.textDim,
      glitchTimer: 0,
      settled: false,
    },
  ];
}

export function updateDropDeath(state: DropDeathState): void {
  if (!state.active) return;

  state.phase += 1;
  state.flashAlpha *= 0.9;
  state.screenShake *= 0.92;
  state.shockwaveRadius += 6;
  state.shockwaveAlpha *= 0.94;

  for (const crack of state.crackLines) {
    crack.alpha *= 0.97;
  }

  for (const tile of state.tiles) {
    if (tile.delay > 0) {
      tile.delay -= 1;
      continue;
    }
    tile.fallen = true;
    tile.vy += GRAVITY;
    tile.y += tile.vy;
    tile.x += tile.vx;
    tile.vx *= 0.98;
    tile.rotation += tile.rotSpeed;
    tile.alpha *= 0.993;
  }

  const textStartPhase = 40;
  if (state.phase > textStartPhase) {
    for (let i = 0; i < state.texts.length; i++) {
      const t = state.texts[i];
      const textDelay = i * 15;
      if (state.phase < textStartPhase + textDelay) continue;

      const dist = t.targetY - t.currentY;
      t.currentY += dist * 0.08;
      t.alpha = Math.min(1, t.alpha + 0.03);

      if (Math.abs(dist) < 1) {
        t.settled = true;
      }

      t.glitchTimer += 1;
    }
  }
}

export function drawDropDeath(
  state: DropDeathState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number,
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

  if (state.flashAlpha > 0.01) {
    g.fillStyle(0xffffff, state.flashAlpha * 0.5);
    g.fillRect(0, 0, width, height);
  }

  if (state.shockwaveAlpha > 0.02) {
    g.lineStyle(3, THEME.snake.glow, state.shockwaveAlpha * 0.6);
    g.strokeCircle(
      state.crackLines[0]?.x1 ?? width / 2,
      state.crackLines[0]?.y1 ?? height / 2,
      state.shockwaveRadius
    );
    g.lineStyle(1.5, 0xffffff, state.shockwaveAlpha * 0.3);
    g.strokeCircle(
      state.crackLines[0]?.x1 ?? width / 2,
      state.crackLines[0]?.y1 ?? height / 2,
      state.shockwaveRadius * 0.8
    );
  }

  for (const crack of state.crackLines) {
    if (crack.alpha < 0.02) continue;
    g.lineStyle(2, 0xffffff, crack.alpha * 0.8);
    g.lineBetween(crack.x1, crack.y1, crack.x2, crack.y2);
    g.lineStyle(4, THEME.snake.glow, crack.alpha * 0.3);
    g.lineBetween(crack.x1, crack.y1, crack.x2, crack.y2);
  }

  for (const tile of state.tiles) {
    if (!tile.fallen || tile.alpha < 0.02 || tile.y > height + 50) continue;

    g.save();
    const cx = tile.x + tile.width / 2;
    const cy = tile.y + tile.height / 2;

    g.fillStyle(tile.color, tile.alpha * 0.8);
    const hw = tile.width / 2;
    const hh = tile.height / 2;
    const cos = Math.cos(tile.rotation);
    const sin = Math.sin(tile.rotation);

    const corners = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ];

    const rotated = corners.map(c => ({
      x: cx + c.x * cos - c.y * sin,
      y: cy + c.x * sin + c.y * cos,
    }));

    g.beginPath();
    g.moveTo(rotated[0].x, rotated[0].y);
    for (let i = 1; i < rotated.length; i++) {
      g.lineTo(rotated[i].x, rotated[i].y);
    }
    g.closePath();
    g.fillPath();

    g.lineStyle(1, 0x000000, tile.alpha * 0.5);
    g.beginPath();
    g.moveTo(rotated[0].x, rotated[0].y);
    for (let i = 1; i < rotated.length; i++) {
      g.lineTo(rotated[i].x, rotated[i].y);
    }
    g.closePath();
    g.strokePath();

    g.restore();
  }

  const fadeIn = Math.min(1, Math.max(0, (state.phase - 30) / 40));
  if (fadeIn > 0) {
    g.fillStyle(THEME.bg.deep, fadeIn * 0.75);
    g.fillRect(0, 0, width, height);
  }

  const centerX = width / 2;
  for (const t of state.texts) {
    if (t.alpha < 0.02) continue;

    const glitchActive = !t.settled && t.glitchTimer > 0 && Math.random() < 0.3;
    const offsetX = glitchActive ? (Math.random() - 0.5) * 8 : 0;
    const displayAlpha = glitchActive ? t.alpha * (0.5 + Math.random() * 0.5) : t.alpha;

    const textWidth = t.text.length * t.size * 0.7;
    const textX = centerX - textWidth / 2 + offsetX;

    if (t.color === THEME.snake.glow || t.color === THEME.food.glow) {
      const pulse = 0.6 + Math.sin(frameCount * 0.08) * 0.2;
      g.fillStyle(t.color, displayAlpha * 0.08 * pulse);
      g.fillRoundedRect(
        textX - 8, t.currentY - 4,
        textWidth + 16, t.size + 8, 4
      );
    }

    drawTextFn(g, t.text, textX, t.currentY, t.size, t.color, displayAlpha);

    if (glitchActive) {
      const glitchY = t.currentY + (Math.random() - 0.5) * 4;
      drawTextFn(g, t.text, textX + 3, glitchY, t.size, 0xffffff, displayAlpha * 0.2);
    }
  }

  if (state.phase > 80) {
    const scanAlpha = 0.03 + Math.sin(frameCount * 0.1) * 0.01;
    const scanY = (frameCount * 2) % height;
    g.fillStyle(THEME.snake.glow, scanAlpha);
    g.fillRect(0, scanY, width, 2);
  }
}

export function getDropDeathShake(state: DropDeathState): { x: number; y: number } {
  if (!state.active || state.screenShake < 0.5) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * state.screenShake,
    y: (Math.random() - 0.5) * state.screenShake,
  };
}
