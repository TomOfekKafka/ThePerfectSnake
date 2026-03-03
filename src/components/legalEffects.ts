import Phaser from 'phaser';
import { LegalEntityType } from '../game/types';

interface LegalPaper {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  size: number;
}

interface LegalProclamation {
  text: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  scale: number;
  color: number;
}

export interface LegalEffectsState {
  papers: LegalPaper[];
  proclamations: LegalProclamation[];
  nextProclamationIndex: number;
}

const MAX_PAPERS = 40;
const MAX_PROCLAMATIONS = 3;
const PROCLAMATION_LIFETIME = 90;
const PROCLAMATION_FLOAT_SPEED = 0.6;

const PROCLAMATIONS = [
  'OBJECTION!',
  'SUSTAINED!',
  'OVERRULED!',
  'ORDER!',
  'GUILTY!',
  'CASE CLOSED!',
  'SUBPOENA!',
  'SERVED!',
  'APPEAL!',
  'NO CONTEST!',
  'HABEAS CORPUS!',
  'VERDICT!',
  'MISTRIAL!',
  'CONTEMPT!',
];

const ENTITY_COLORS: Record<LegalEntityType, number> = {
  LAWYER: 0x4488cc,
  JUDGE: 0xcc8844,
  CORP: 0x44cc88,
};

const ENTITY_ACCENT: Record<LegalEntityType, number> = {
  LAWYER: 0x88bbee,
  JUDGE: 0xeebb77,
  CORP: 0x88eebb,
};

export function createLegalEffectsState(): LegalEffectsState {
  return {
    papers: [],
    proclamations: [],
    nextProclamationIndex: 0,
  };
}

export function spawnLegalBurst(
  state: LegalEffectsState,
  x: number,
  y: number,
  entityType: LegalEntityType
): void {
  const count = 8 + Math.floor(Math.random() * 5);
  for (let i = 0; i < count; i++) {
    if (state.papers.length >= MAX_PAPERS) {
      state.papers.shift();
    }
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 1.5 + Math.random() * 2.5;
    state.papers.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      life: 1.0,
      size: 3 + Math.random() * 4,
    });
  }

  if (state.proclamations.length >= MAX_PROCLAMATIONS) {
    state.proclamations.shift();
  }
  const text = PROCLAMATIONS[state.nextProclamationIndex % PROCLAMATIONS.length];
  state.nextProclamationIndex++;

  state.proclamations.push({
    text,
    x,
    y: y - 15,
    startY: y - 15,
    age: 0,
    maxAge: PROCLAMATION_LIFETIME,
    scale: 1.0,
    color: ENTITY_COLORS[entityType],
  });
}

export function updateLegalEffects(state: LegalEffectsState): void {
  for (let i = state.papers.length - 1; i >= 0; i--) {
    const p = state.papers[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.vx *= 0.98;
    p.rotation += p.rotationSpeed;
    p.life -= 0.018;
    if (p.life <= 0) {
      state.papers.splice(i, 1);
    }
  }

  for (const proc of state.proclamations) {
    proc.age++;
    proc.y = proc.startY - proc.age * PROCLAMATION_FLOAT_SPEED;
  }
  state.proclamations = state.proclamations.filter(p => p.age < p.maxAge);
}

function proclamationAlpha(proc: LegalProclamation): number {
  const fadeIn = 8;
  const fadeOutStart = proc.maxAge * 0.7;
  if (proc.age < fadeIn) return proc.age / fadeIn;
  if (proc.age > fadeOutStart) return 1 - (proc.age - fadeOutStart) / (proc.maxAge - fadeOutStart);
  return 1;
}

export function drawLegalEntities(
  g: Phaser.GameObjects.Graphics,
  entities: { position: { x: number; y: number }; entityType: LegalEntityType }[],
  cellSize: number,
  frameCount: number
): void {
  for (const entity of entities) {
    const cx = entity.position.x * cellSize + cellSize / 2;
    const cy = entity.position.y * cellSize + cellSize / 2;
    const bob = Math.sin(frameCount * 0.08 + cx) * 1.5;
    const color = ENTITY_COLORS[entity.entityType];
    const accent = ENTITY_ACCENT[entity.entityType];
    const pulse = 0.7 + Math.sin(frameCount * 0.1 + cy) * 0.3;

    g.fillStyle(color, 0.15 * pulse);
    g.fillCircle(cx, cy + bob, cellSize * 0.8);

    const s = cellSize * 0.35;

    if (entity.entityType === 'JUDGE') {
      drawJudge(g, cx, cy + bob, s, color, accent, frameCount);
    } else if (entity.entityType === 'LAWYER') {
      drawLawyer(g, cx, cy + bob, s, color, accent, frameCount);
    } else {
      drawCorp(g, cx, cy + bob, s, color, accent, frameCount);
    }
  }
}

function drawJudge(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  s: number,
  color: number,
  accent: number,
  frameCount: number
): void {
  g.fillStyle(color, 0.9);
  g.fillRect(cx - s, cy - s * 0.3, s * 2, s * 1.3);

  g.fillStyle(accent, 0.9);
  g.fillCircle(cx, cy - s * 0.6, s * 0.5);

  g.fillStyle(0x222222, 0.8);
  g.fillRect(cx - s * 0.8, cy - s * 1.1, s * 1.6, s * 0.3);

  const gavelAngle = Math.sin(frameCount * 0.15) * 0.4;
  const gavelX = cx + s * 1.2;
  const gavelY = cy - s * 0.2;
  g.lineStyle(2, accent, 0.8);
  g.beginPath();
  g.moveTo(gavelX, gavelY);
  g.lineTo(
    gavelX + Math.cos(gavelAngle) * s * 0.8,
    gavelY + Math.sin(gavelAngle) * s * 0.8
  );
  g.strokePath();
  g.fillStyle(accent, 0.9);
  g.fillRect(
    gavelX + Math.cos(gavelAngle) * s * 0.7 - s * 0.2,
    gavelY + Math.sin(gavelAngle) * s * 0.7 - s * 0.15,
    s * 0.4,
    s * 0.3
  );
}

function drawLawyer(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  s: number,
  color: number,
  accent: number,
  _frameCount: number
): void {
  g.fillStyle(0x333344, 0.9);
  g.fillRect(cx - s, cy - s * 0.3, s * 2, s * 1.3);

  g.fillStyle(accent, 0.9);
  g.fillCircle(cx, cy - s * 0.6, s * 0.45);

  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - s * 0.2, cy - s * 0.1, s * 0.4, s * 0.6);

  g.fillStyle(color, 0.9);
  g.fillRect(cx + s * 0.5, cy + s * 0.2, s * 0.8, s * 0.6);
  g.fillRect(cx + s * 0.5, cy + s * 0.2, s * 0.8, s * 0.15);
  g.fillStyle(accent, 0.7);
  g.fillRect(cx + s * 0.55, cy + s * 0.4, s * 0.7, s * 0.08);
  g.fillRect(cx + s * 0.55, cy + s * 0.55, s * 0.5, s * 0.08);
}

function drawCorp(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  s: number,
  color: number,
  accent: number,
  frameCount: number
): void {
  g.fillStyle(color, 0.9);
  g.fillRect(cx - s * 0.8, cy - s * 0.8, s * 1.6, s * 1.6);

  g.fillStyle(accent, 0.9);
  g.fillRect(cx - s * 0.6, cy - s * 0.6, s * 1.2, s * 0.15);
  g.fillRect(cx - s * 0.6, cy - s * 0.6, s * 0.15, s * 1.2);
  g.fillRect(cx + s * 0.45, cy - s * 0.6, s * 0.15, s * 1.2);
  g.fillRect(cx - s * 0.6, cy + s * 0.45, s * 1.2, s * 0.15);

  const spin = frameCount * 0.03;
  const innerS = s * 0.3;
  g.fillStyle(accent, 0.6);
  g.fillRect(
    cx + Math.cos(spin) * innerS - s * 0.1,
    cy + Math.sin(spin) * innerS - s * 0.1,
    s * 0.2,
    s * 0.2
  );
}

export function drawLegalPapers(
  g: Phaser.GameObjects.Graphics,
  state: LegalEffectsState
): void {
  for (const paper of state.papers) {
    const alpha = paper.life * 0.9;
    const wobble = Math.sin(paper.rotation) * paper.size * 0.3;

    g.fillStyle(0xffeedd, alpha * 0.4);
    g.fillRect(
      paper.x - paper.size - 1,
      paper.y - paper.size * 0.7 - 1 + wobble,
      paper.size * 2 + 2,
      paper.size * 1.4 + 2
    );

    g.fillStyle(0xfffff5, alpha);
    g.fillRect(
      paper.x - paper.size,
      paper.y - paper.size * 0.7 + wobble,
      paper.size * 2,
      paper.size * 1.4
    );

    g.fillStyle(0x666666, alpha * 0.4);
    const lineH = paper.size * 0.12;
    for (let i = 0; i < 3; i++) {
      const ly = paper.y - paper.size * 0.3 + i * paper.size * 0.35 + wobble;
      g.fillRect(paper.x - paper.size * 0.7, ly, paper.size * 1.4, lineH);
    }
  }
}

export function drawLegalProclamations(
  g: Phaser.GameObjects.Graphics,
  state: LegalEffectsState,
  drawLetter: (
    g: Phaser.GameObjects.Graphics,
    letter: string,
    x: number,
    y: number,
    size: number
  ) => void
): void {
  for (const proc of state.proclamations) {
    const alpha = proclamationAlpha(proc);
    if (alpha <= 0) continue;

    const size = 9;
    const charWidth = size * 0.7;
    const textWidth = proc.text.length * charWidth;
    const tx = proc.x - textWidth / 2;

    const shake = proc.age < 15 ? (Math.random() - 0.5) * (15 - proc.age) * 0.3 : 0;

    g.fillStyle(0x000000, alpha * 0.5);
    g.fillRect(tx - 6 + shake, proc.y - size / 2 - 4, textWidth + 12, size + 8);

    g.fillStyle(proc.color, alpha * 0.3);
    g.fillRect(tx - 5 + shake, proc.y - size / 2 - 3, textWidth + 10, size + 6);

    g.fillStyle(0xffffff, alpha);
    for (let i = 0; i < proc.text.length; i++) {
      drawLetter(g, proc.text[i], tx + i * charWidth + shake, proc.y, size);
    }
  }
}
