import Phaser from 'phaser';

export interface CodeFragment {
  x: number;
  y: number;
  vy: number;
  vx: number;
  text: string;
  alpha: number;
  size: number;
  isRed: boolean;
  glitchTimer: number;
  dissolveProgress: number;
  charOffsets: number[];
}

export interface DeleteBurst {
  x: number;
  y: number;
  life: number;
  chars: {
    char: string;
    angle: number;
    speed: number;
    dist: number;
    size: number;
    rotSpeed: number;
  }[];
}

export interface DeleteEffectState {
  fragments: CodeFragment[];
  bursts: DeleteBurst[];
  frameCount: number;
  scanLineY: number;
  globalGlitch: number;
}

type DrawLetterFn = (
  g: Phaser.GameObjects.Graphics,
  ch: string,
  x: number,
  y: number,
  size: number
) => void;

const CODE_SNIPPETS = [
  'delete', 'rm -rf', 'void 0', 'null',
  'DROP TABLE', 'SIGKILL', 'free',
  'exit 1', 'panic', 'segfault',
  'unlink', 'purge', 'destroy',
  'kill -9', 'format C', 'truncate',
  'dispose', 'gc', 'chmod 000',
];

const MAX_FRAGMENTS = 18;
const MAX_BURSTS = 4;
const SCAN_SPEED = 2.5;

export function createDeleteEffectState(): DeleteEffectState {
  return {
    fragments: [],
    bursts: [],
    frameCount: 0,
    scanLineY: 0,
    globalGlitch: 0,
  };
}

export function initDeleteEffect(
  state: DeleteEffectState,
  width: number
): void {
  state.fragments = [];
  for (let i = 0; i < MAX_FRAGMENTS; i++) {
    state.fragments.push(createFragment(width, -Math.random() * 400));
  }
}

function createFragment(width: number, startY: number): CodeFragment {
  const text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
  return {
    x: 10 + Math.random() * (width - 20),
    y: startY,
    vy: 0.4 + Math.random() * 0.8,
    vx: (Math.random() - 0.5) * 0.15,
    text,
    alpha: 0.12 + Math.random() * 0.16,
    size: 7 + Math.random() * 5,
    isRed: Math.random() < 0.5,
    glitchTimer: Math.random() * 200,
    dissolveProgress: 0,
    charOffsets: Array.from({ length: text.length }, () => 0),
  };
}

export function updateDeleteEffect(
  state: DeleteEffectState,
  width: number,
  height: number
): void {
  state.frameCount++;
  state.scanLineY = (state.scanLineY + SCAN_SPEED) % (height + 40);
  state.globalGlitch = Math.max(0, state.globalGlitch - 0.02);

  for (const frag of state.fragments) {
    frag.y += frag.vy;
    frag.x += frag.vx;
    frag.glitchTimer--;

    if (frag.glitchTimer <= 0) {
      frag.glitchTimer = 80 + Math.random() * 200;
      for (let i = 0; i < frag.charOffsets.length; i++) {
        frag.charOffsets[i] = (Math.random() - 0.5) * 3;
      }
    } else if (frag.glitchTimer > 5) {
      for (let i = 0; i < frag.charOffsets.length; i++) {
        frag.charOffsets[i] *= 0.9;
      }
    }

    const scanDist = Math.abs(frag.y - state.scanLineY);
    if (scanDist < 20) {
      frag.dissolveProgress = Math.min(1, frag.dissolveProgress + 0.05);
    }
  }

  state.fragments = state.fragments.filter((f) => {
    if (f.y > height + 20) return false;
    if (f.dissolveProgress >= 1) return false;
    return true;
  });

  while (state.fragments.length < MAX_FRAGMENTS) {
    state.fragments.push(createFragment(width, -10 - Math.random() * 60));
  }

  for (const burst of state.bursts) {
    burst.life -= 0.02;
    for (const c of burst.chars) {
      c.dist += c.speed;
      c.speed *= 0.97;
    }
  }
  state.bursts = state.bursts.filter((b) => b.life > 0);
}

export function spawnDeleteBurst(
  state: DeleteEffectState,
  x: number,
  y: number
): void {
  const word = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
  const chars = word.split('').filter((c) => c !== ' ').map((char) => ({
    char,
    angle: Math.random() * Math.PI * 2,
    speed: 1 + Math.random() * 3,
    dist: 0,
    size: 8 + Math.random() * 4,
    rotSpeed: (Math.random() - 0.5) * 0.15,
  }));

  state.bursts.push({ x, y, life: 1, chars });
  if (state.bursts.length > MAX_BURSTS) {
    state.bursts.shift();
  }
  state.globalGlitch = 0.5;
}

export function drawDeleteEffect(
  g: Phaser.GameObjects.Graphics,
  state: DeleteEffectState,
  width: number,
  height: number,
  drawLetter: DrawLetterFn
): void {
  drawScanLine(g, state, width);
  drawFragments(g, state, drawLetter);
  drawBursts(g, state, drawLetter);
  drawDeleteOverlay(g, state, width, height);
}

function drawScanLine(
  g: Phaser.GameObjects.Graphics,
  state: DeleteEffectState,
  width: number
): void {
  const y = state.scanLineY;
  g.fillStyle(0xff2244, 0.06 + state.globalGlitch * 0.08);
  g.fillRect(0, y - 1, width, 2);
  g.fillStyle(0xff2244, 0.02);
  g.fillRect(0, y - 8, width, 16);
}

function drawFragments(
  g: Phaser.GameObjects.Graphics,
  state: DeleteEffectState,
  drawLetter: DrawLetterFn
): void {
  for (const frag of state.fragments) {
    const dissolve = frag.dissolveProgress;
    const baseAlpha = frag.alpha * (1 - dissolve * 0.8);
    if (baseAlpha < 0.01) continue;

    const color = frag.isRed ? 0xff3344 : 0x44ff88;

    g.fillStyle(color, baseAlpha * 0.3);
    const textWidth = frag.text.length * frag.size * 0.6;
    g.fillRect(
      frag.x - 2,
      frag.y - frag.size * 0.5 - 1,
      textWidth + 4,
      frag.size + 2
    );

    let cx = frag.x;
    for (let i = 0; i < frag.text.length; i++) {
      const ch = frag.text[i];
      const offsetY = frag.charOffsets[i] || 0;
      if (dissolve > 0 && Math.random() < dissolve * 0.5) {
        cx += frag.size * 0.6;
        continue;
      }
      g.fillStyle(color, baseAlpha);
      drawLetter(g, ch, cx + frag.size * 0.3, frag.y + offsetY, frag.size * 0.8);
      cx += frag.size * 0.6;
    }
  }
}

function drawBursts(
  g: Phaser.GameObjects.Graphics,
  state: DeleteEffectState,
  drawLetter: DrawLetterFn
): void {
  for (const burst of state.bursts) {
    const burstAlpha = Math.max(0, burst.life) * 0.7;
    const color = burst.life > 0.5 ? 0xff4466 : 0xff8844;
    g.fillStyle(color, burstAlpha);
    for (const c of burst.chars) {
      const bx = burst.x + Math.cos(c.angle) * c.dist;
      const by = burst.y + Math.sin(c.angle) * c.dist;
      drawLetter(g, c.char, bx, by, c.size);
    }
  }
}

function drawDeleteOverlay(
  g: Phaser.GameObjects.Graphics,
  state: DeleteEffectState,
  width: number,
  height: number
): void {
  if (state.globalGlitch <= 0) return;

  const intensity = state.globalGlitch;
  const sliceCount = 3 + Math.floor(intensity * 5);
  for (let i = 0; i < sliceCount; i++) {
    const sliceY = Math.random() * height;
    const sliceH = 1 + Math.random() * 3;
    const offsetX = (Math.random() - 0.5) * intensity * 8;
    g.fillStyle(0xff2244, intensity * 0.06);
    g.fillRect(offsetX, sliceY, width, sliceH);
  }
}
