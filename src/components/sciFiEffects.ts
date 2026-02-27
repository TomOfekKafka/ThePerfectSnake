import Phaser from 'phaser';

export interface ScanPulse {
  y: number;
  speed: number;
  alpha: number;
  width: number;
}

export interface ShieldRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: number;
}

export interface HoloGlitch {
  y: number;
  width: number;
  offset: number;
  life: number;
}

export interface DataStream {
  x: number;
  y: number;
  speed: number;
  chars: number[];
  alpha: number;
  length: number;
}

export interface SciFiState {
  scanPulses: ScanPulse[];
  shieldRings: ShieldRing[];
  holoGlitches: HoloGlitch[];
  dataStreams: DataStream[];
  frameCount: number;
  gridPhase: number;
  scanlineOffset: number;
}

const MAX_SCAN_PULSES = 2;
const MAX_SHIELD_RINGS = 5;
const MAX_HOLO_GLITCHES = 4;
const NUM_DATA_STREAMS = 12;
const SCAN_PULSE_CHANCE = 0.012;

const SCI_FI_COLORS = {
  gridPrimary: 0x00ccff,
  gridSecondary: 0x0066aa,
  gridNode: 0x00ffff,
  scanBeam: 0x00ffcc,
  shield: 0x00aaff,
  shieldBright: 0x88ddff,
  holoGreen: 0x00ff88,
  dataStream: 0x00ff66,
  warnRed: 0xff3344,
  energyPurple: 0x8844ff,
};

export function createSciFiState(): SciFiState {
  return {
    scanPulses: [],
    shieldRings: [],
    holoGlitches: [],
    dataStreams: [],
    frameCount: 0,
    gridPhase: 0,
    scanlineOffset: 0,
  };
}

export function initDataStreams(state: SciFiState, width: number, height: number): void {
  state.dataStreams = [];
  for (let i = 0; i < NUM_DATA_STREAMS; i++) {
    state.dataStreams.push({
      x: Math.random() * width,
      y: Math.random() * height,
      speed: 0.3 + Math.random() * 0.8,
      chars: Array.from({ length: 4 + Math.floor(Math.random() * 6) }, () => Math.floor(Math.random() * 16)),
      alpha: 0.08 + Math.random() * 0.12,
      length: 4 + Math.floor(Math.random() * 6),
    });
  }
}

export function spawnShieldRing(state: SciFiState, x: number, y: number): void {
  if (state.shieldRings.length >= MAX_SHIELD_RINGS) {
    state.shieldRings.shift();
  }
  state.shieldRings.push({
    x, y,
    radius: 4,
    maxRadius: 50 + Math.random() * 20,
    life: 1,
    color: Math.random() > 0.5 ? SCI_FI_COLORS.shield : SCI_FI_COLORS.energyPurple,
  });
}

export function updateSciFi(state: SciFiState, width: number, height: number): void {
  state.frameCount++;
  state.gridPhase += 0.02;
  state.scanlineOffset = (state.scanlineOffset + 0.5) % 4;

  if (state.scanPulses.length < MAX_SCAN_PULSES && Math.random() < SCAN_PULSE_CHANCE) {
    state.scanPulses.push({
      y: -5,
      speed: 1.2 + Math.random() * 0.8,
      alpha: 0.25 + Math.random() * 0.15,
      width: width,
    });
  }

  for (let i = state.scanPulses.length - 1; i >= 0; i--) {
    const p = state.scanPulses[i];
    p.y += p.speed;
    p.alpha *= 0.995;
    if (p.y > height + 10) {
      state.scanPulses.splice(i, 1);
    }
  }

  for (let i = state.shieldRings.length - 1; i >= 0; i--) {
    const r = state.shieldRings[i];
    r.radius += (r.maxRadius - r.radius) * 0.12;
    r.life -= 0.03;
    if (r.life <= 0) {
      state.shieldRings.splice(i, 1);
    }
  }

  if (state.holoGlitches.length < MAX_HOLO_GLITCHES && Math.random() < 0.01) {
    state.holoGlitches.push({
      y: Math.random() * height,
      width: 20 + Math.random() * 60,
      offset: (Math.random() - 0.5) * 6,
      life: 0.3 + Math.random() * 0.4,
    });
  }

  for (let i = state.holoGlitches.length - 1; i >= 0; i--) {
    state.holoGlitches[i].life -= 0.04;
    if (state.holoGlitches[i].life <= 0) {
      state.holoGlitches.splice(i, 1);
    }
  }

  for (const ds of state.dataStreams) {
    ds.y += ds.speed;
    if (ds.y > height + ds.length * 8) {
      ds.y = -ds.length * 8;
      ds.x = Math.random() * width;
      ds.chars = ds.chars.map(() => Math.floor(Math.random() * 16));
    }
  }
}

export function drawSciFiGrid(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  width: number,
  height: number,
  cellSize: number,
  gridSize: number
): void {
  const pulse = Math.sin(state.gridPhase) * 0.5 + 0.5;
  const baseAlpha = 0.06 + pulse * 0.04;

  for (let i = 0; i <= gridSize; i++) {
    const pos = i * cellSize;
    const lineAlpha = i % 5 === 0 ? baseAlpha * 2.5 : baseAlpha;
    g.lineStyle(i % 5 === 0 ? 1.5 : 0.5, SCI_FI_COLORS.gridSecondary, lineAlpha);
    g.lineBetween(pos, 0, pos, height);
    g.lineBetween(0, pos, width, pos);
  }

  const nodeAlpha = 0.15 + pulse * 0.1;
  for (let i = 0; i <= gridSize; i += 5) {
    for (let j = 0; j <= gridSize; j += 5) {
      const nx = i * cellSize;
      const ny = j * cellSize;
      g.fillStyle(SCI_FI_COLORS.gridNode, nodeAlpha);
      g.fillCircle(nx, ny, 1.5);
      g.fillStyle(SCI_FI_COLORS.gridNode, nodeAlpha * 0.4);
      g.fillCircle(nx, ny, 3);
    }
  }
}

export function drawScanPulses(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  width: number
): void {
  for (const p of state.scanPulses) {
    g.fillStyle(SCI_FI_COLORS.scanBeam, p.alpha * 0.3);
    g.fillRect(0, p.y - 8, width, 16);
    g.fillStyle(SCI_FI_COLORS.scanBeam, p.alpha * 0.7);
    g.fillRect(0, p.y - 2, width, 4);
    g.fillStyle(0xffffff, p.alpha * 0.4);
    g.fillRect(0, p.y - 0.5, width, 1);
  }
}

export function drawShieldRings(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState
): void {
  for (const r of state.shieldRings) {
    const alpha = r.life * 0.6;
    const hexPoints = 6;

    g.lineStyle(2, r.color, alpha * 0.3);
    g.strokeCircle(r.x, r.y, r.radius * 1.1);

    g.lineStyle(1.5, r.color, alpha * 0.8);
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < hexPoints; i++) {
      const angle = (i / hexPoints) * Math.PI * 2 + state.frameCount * 0.03;
      points.push({
        x: r.x + Math.cos(angle) * r.radius,
        y: r.y + Math.sin(angle) * r.radius,
      });
    }
    for (let i = 0; i < hexPoints; i++) {
      const next = (i + 1) % hexPoints;
      g.lineBetween(points[i].x, points[i].y, points[next].x, points[next].y);
    }

    g.fillStyle(r.color, alpha * 0.08);
    g.fillCircle(r.x, r.y, r.radius);
  }
}

export function drawDataStreams(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  drawDigit: (g: Phaser.GameObjects.Graphics, digit: number, cx: number, cy: number, size: number, color: number, alpha: number) => void
): void {
  for (const ds of state.dataStreams) {
    for (let i = 0; i < ds.chars.length; i++) {
      const cy = ds.y + i * 8;
      const charAlpha = ds.alpha * (1 - i / ds.chars.length);
      if (charAlpha <= 0.01) continue;
      const digit = ds.chars[i] % 10;
      drawDigit(g, digit, ds.x, cy, 3, SCI_FI_COLORS.dataStream, charAlpha);
    }
  }
}

export function drawScanlines(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  width: number,
  height: number
): void {
  const spacing = 4;
  const alpha = 0.03;
  for (let y = state.scanlineOffset; y < height; y += spacing) {
    g.fillStyle(0x000000, alpha);
    g.fillRect(0, y, width, 1);
  }
}

export function drawHoloGlitches(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  width: number
): void {
  for (const gl of state.holoGlitches) {
    const alpha = gl.life * 0.15;
    g.fillStyle(SCI_FI_COLORS.holoGreen, alpha);
    g.fillRect(gl.offset, gl.y, gl.width, 2);
    g.fillStyle(SCI_FI_COLORS.warnRed, alpha * 0.5);
    g.fillRect(gl.offset + 2, gl.y + 1, gl.width * 0.6, 1);
  }
}

export function drawHoloFood(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  foodX: number,
  foodY: number,
  cellSize: number
): void {
  const time = state.frameCount;
  const r = cellSize * 0.42;
  const pulse = Math.sin(time * 0.08) * 0.2 + 0.8;

  g.fillStyle(SCI_FI_COLORS.shield, 0.08 * pulse);
  g.fillCircle(foodX, foodY, r * 2.2);

  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const ringR = r * (0.8 + i * 0.5);
    const rotation = time * 0.02 * (i % 2 === 0 ? 1 : -1);
    const ringAlpha = (0.2 - i * 0.05) * pulse;
    g.lineStyle(0.8, SCI_FI_COLORS.gridNode, ringAlpha);

    const segments = 24;
    for (let s = 0; s < segments; s++) {
      if (s % 3 === 0) continue;
      const a1 = (s / segments) * Math.PI * 2 + rotation;
      const a2 = ((s + 1) / segments) * Math.PI * 2 + rotation;
      g.lineBetween(
        foodX + Math.cos(a1) * ringR,
        foodY + Math.sin(a1) * ringR,
        foodX + Math.cos(a2) * ringR,
        foodY + Math.sin(a2) * ringR
      );
    }
  }

  const triAngle = time * 0.04;
  const triR = r * 0.6;
  g.lineStyle(1, SCI_FI_COLORS.gridPrimary, 0.3 * pulse);
  for (let i = 0; i < 3; i++) {
    const a1 = triAngle + (i / 3) * Math.PI * 2;
    const a2 = triAngle + ((i + 1) / 3) * Math.PI * 2;
    g.lineBetween(
      foodX + Math.cos(a1) * triR,
      foodY + Math.sin(a1) * triR,
      foodX + Math.cos(a2) * triR,
      foodY + Math.sin(a2) * triR
    );
  }
}

export function drawSnakeEnergyField(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  snake: { x: number; y: number }[],
  cellSize: number
): void {
  if (snake.length === 0) return;
  const time = state.frameCount;
  const head = snake[0];
  const hx = head.x * cellSize + cellSize / 2;
  const hy = head.y * cellSize + cellSize / 2;

  const shieldPulse = Math.sin(time * 0.06) * 0.15 + 0.25;
  const shieldR = cellSize * 0.75;

  g.lineStyle(1.2, SCI_FI_COLORS.shield, shieldPulse * 0.6);
  g.strokeCircle(hx, hy, shieldR);
  g.lineStyle(0.5, SCI_FI_COLORS.shieldBright, shieldPulse * 0.3);
  g.strokeCircle(hx, hy, shieldR + 3);

  const arcCount = 4;
  for (let i = 0; i < arcCount; i++) {
    const arcAngle = time * 0.03 + (i / arcCount) * Math.PI * 2;
    const arcR = shieldR * 0.9;
    const arcLen = Math.PI * 0.35;
    const arcAlpha = shieldPulse * 0.5;
    g.lineStyle(1.5, SCI_FI_COLORS.gridNode, arcAlpha);
    const steps = 8;
    for (let s = 0; s < steps; s++) {
      const a1 = arcAngle + (s / steps) * arcLen;
      const a2 = arcAngle + ((s + 1) / steps) * arcLen;
      g.lineBetween(
        hx + Math.cos(a1) * arcR,
        hy + Math.sin(a1) * arcR,
        hx + Math.cos(a2) * arcR,
        hy + Math.sin(a2) * arcR
      );
    }
  }

  for (let i = 1; i < Math.min(snake.length, 6); i++) {
    const seg = snake[i];
    const sx = seg.x * cellSize + cellSize / 2;
    const sy = seg.y * cellSize + cellSize / 2;
    const prevSeg = snake[i - 1];
    const px = prevSeg.x * cellSize + cellSize / 2;
    const py = prevSeg.y * cellSize + cellSize / 2;

    const linkAlpha = 0.12 * (1 - i / 6);
    const flicker = Math.sin(time * 0.1 + i * 1.5) * 0.05;
    g.lineStyle(0.8, SCI_FI_COLORS.gridPrimary, linkAlpha + flicker);
    g.lineBetween(px, py, sx, sy);
  }
}

export function drawCornerHUD(
  g: Phaser.GameObjects.Graphics,
  state: SciFiState,
  width: number,
  height: number
): void {
  const bracketLen = 15;
  const bracketInset = 6;
  const alpha = 0.2 + Math.sin(state.frameCount * 0.02) * 0.08;
  const color = SCI_FI_COLORS.gridPrimary;

  g.lineStyle(1, color, alpha);
  g.lineBetween(bracketInset, bracketInset, bracketInset + bracketLen, bracketInset);
  g.lineBetween(bracketInset, bracketInset, bracketInset, bracketInset + bracketLen);

  g.lineBetween(width - bracketInset, bracketInset, width - bracketInset - bracketLen, bracketInset);
  g.lineBetween(width - bracketInset, bracketInset, width - bracketInset, bracketInset + bracketLen);

  g.lineBetween(bracketInset, height - bracketInset, bracketInset + bracketLen, height - bracketInset);
  g.lineBetween(bracketInset, height - bracketInset, bracketInset, height - bracketInset - bracketLen);

  g.lineBetween(width - bracketInset, height - bracketInset, width - bracketInset - bracketLen, height - bracketInset);
  g.lineBetween(width - bracketInset, height - bracketInset, width - bracketInset, height - bracketInset - bracketLen);

  const tickLen = 4;
  const tickAlpha = alpha * 0.5;
  g.lineStyle(0.5, color, tickAlpha);
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    g.lineBetween(bracketInset, bracketInset + t * (height - 2 * bracketInset), bracketInset + tickLen, bracketInset + t * (height - 2 * bracketInset));
    g.lineBetween(width - bracketInset, bracketInset + t * (height - 2 * bracketInset), width - bracketInset - tickLen, bracketInset + t * (height - 2 * bracketInset));
  }
  for (let i = 1; i < 4; i++) {
    const t = i / 4;
    g.lineBetween(bracketInset + t * (width - 2 * bracketInset), bracketInset, bracketInset + t * (width - 2 * bracketInset), bracketInset + tickLen);
    g.lineBetween(bracketInset + t * (width - 2 * bracketInset), height - bracketInset, bracketInset + t * (width - 2 * bracketInset), height - bracketInset - tickLen);
  }
}
