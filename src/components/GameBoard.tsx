import { useEffect, useRef } from 'react';
import './GameBoard.css';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  gameOver: boolean;
}

interface GameBoardProps {
  gameState: GameState;
  gridSize: number;
}

const CELL_SIZE = 20;

// Enhanced color palette with electric neon colors
const COLORS = {
  bgDark: '#050510',
  bgMid: '#0a0a1a',
  bgLight: '#0f0f2a',
  gridLine: 'rgba(40, 80, 120, 0.15)',
  snakeHead: '#00ffaa',
  snakeHeadGlow: 'rgba(0, 255, 170, 0.8)',
  snakeBody: '#00dd88',
  snakeBodyGlow: 'rgba(0, 221, 136, 0.5)',
  snakeTail: '#00aa66',
  food: '#ff2266',
  foodGlow: 'rgba(255, 34, 102, 0.9)',
  foodCore: '#ff66aa',
  foodRing: '#ff0055',
  gameOverOverlay: 'rgba(5, 5, 16, 0.9)',
  gameOverText: '#ff2266',
  particle: '#00ffcc',
  star: 'rgba(100, 150, 255, 0.8)',
  // Electric effect colors
  electricCore: '#ffffff',
  electricInner: '#88ffff',
  electricOuter: '#00ccff',
  electricGlow: 'rgba(0, 200, 255, 0.6)',
};

// Particle system for trail effects
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

// Store particles and effects state
const particles: Particle[] = [];
let lastSnakeHead: Position | null = null;
let foodEatFlash = 0;
let lastScore = 0;
let gameOverTime = 0;
let stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
let starsInitialized = false;

// Electric arc effect state
interface ElectricArc {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  intensity: number;
}
const electricArcs: ElectricArc[] = [];
let powerSurgeIntensity = 0;

function initStars(width: number, height: number) {
  if (starsInitialized && stars.length > 0) return;
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
  starsInitialized = true;
}

function updateStars(height: number) {
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = Math.random() * height;
    }
    star.brightness = 0.3 + Math.sin(performance.now() * 0.002 + star.x) * 0.2;
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // Create animated gradient background
  const gradientShift = Math.sin(time * 0.0005) * 0.1;
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.8
  );
  gradient.addColorStop(0, COLORS.bgLight);
  gradient.addColorStop(0.5 + gradientShift, COLORS.bgMid);
  gradient.addColorStop(1, COLORS.bgDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Initialize and update stars
  initStars(width, height);
  updateStars(height);

  // Draw animated stars
  for (const star of stars) {
    const twinkle = star.brightness + Math.sin(time * 0.003 + star.x * star.y) * 0.2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 180, 255, ${twinkle})`;
    ctx.fill();
  }

  // Draw subtle animated grid
  const gridPulse = 0.1 + Math.sin(time * 0.001) * 0.05;
  ctx.strokeStyle = `rgba(40, 80, 120, ${gridPulse})`;
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function spawnParticles(x: number, y: number, count: number, hueBase: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push({
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: Math.random() * 3 + 2,
      hue: hueBase + Math.random() * 30 - 15,
    });
  }
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= 0.02;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    const alpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
    ctx.fill();
  }
}

// Generate lightning bolt path between two points
function generateLightningPath(
  x1: number, y1: number,
  x2: number, y2: number,
  segments: number = 8,
  displacement: number = 15
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const baseX = x1 + (x2 - x1) * t;
    const baseY = y1 + (y2 - y1) * t;

    // Add random displacement perpendicular to the line
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const perpX = -dy / len;
    const perpY = dx / len;

    const offset = (Math.random() - 0.5) * displacement * (1 - Math.abs(t - 0.5) * 2);
    points.push({
      x: baseX + perpX * offset,
      y: baseY + perpY * offset
    });
  }

  points.push({ x: x2, y: y2 });
  return points;
}

// Spawn electric arcs between snake segments
function spawnElectricArc(x1: number, y1: number, x2: number, y2: number, intensity: number = 1) {
  const points = generateLightningPath(x1, y1, x2, y2, 6, 12 * intensity);
  electricArcs.push({
    points,
    life: 1,
    maxLife: 1,
    intensity
  });
}

// Draw electric arcs with glow effect
function drawElectricArcs(ctx: CanvasRenderingContext2D) {
  for (let i = electricArcs.length - 1; i >= 0; i--) {
    const arc = electricArcs[i];
    arc.life -= 0.08;

    if (arc.life <= 0) {
      electricArcs.splice(i, 1);
      continue;
    }

    const alpha = arc.life * arc.intensity;
    const { points } = arc;

    if (points.length < 2) continue;

    // Draw outer glow (thick, transparent)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.strokeStyle = `rgba(0, 200, 255, ${alpha * 0.3})`;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Draw middle glow
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.strokeStyle = `rgba(100, 220, 255, ${alpha * 0.6})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Draw core (bright white)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

// Draw electric aura around a point
function drawElectricAura(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  intensity: number = 1
) {
  const numBolts = 6;
  const baseAngle = time * 0.005;

  for (let i = 0; i < numBolts; i++) {
    const angle = baseAngle + (i * Math.PI * 2) / numBolts;
    const wobble = Math.sin(time * 0.02 + i * 1.5) * 0.3;
    const boltLength = radius * (0.8 + Math.sin(time * 0.015 + i * 2) * 0.4) * intensity;

    const startX = centerX + Math.cos(angle + wobble) * radius * 0.5;
    const startY = centerY + Math.sin(angle + wobble) * radius * 0.5;
    const endX = centerX + Math.cos(angle + wobble) * (radius * 0.5 + boltLength);
    const endY = centerY + Math.sin(angle + wobble) * (radius * 0.5 + boltLength);

    // Generate mini lightning path
    const points = generateLightningPath(startX, startY, endX, endY, 4, 6);

    // Draw the mini bolt
    const alpha = 0.4 + Math.sin(time * 0.03 + i) * 0.3;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.strokeStyle = `rgba(100, 220, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

// Draw power surge effect (screen-wide electric pulse)
function drawPowerSurge(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number, time: number) {
  if (intensity <= 0) return;

  // Electric pulse rings expanding from center
  const numRings = 3;
  for (let ring = 0; ring < numRings; ring++) {
    const ringProgress = ((time * 0.003 + ring * 0.3) % 1);
    const ringRadius = ringProgress * Math.max(width, height) * 0.8;
    const ringAlpha = intensity * (1 - ringProgress) * 0.3;

    ctx.beginPath();
    ctx.arc(width / 2, height / 2, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(100, 220, 255, ${ringAlpha})`;
    ctx.lineWidth = 3 * (1 - ringProgress);
    ctx.stroke();
  }

  // Random electric branches from edges
  if (Math.random() < intensity * 0.3) {
    const side = Math.floor(Math.random() * 4);
    let startX: number, startY: number, endX: number, endY: number;

    switch (side) {
      case 0: // Top
        startX = Math.random() * width;
        startY = 0;
        endX = startX + (Math.random() - 0.5) * 100;
        endY = Math.random() * height * 0.4;
        break;
      case 1: // Bottom
        startX = Math.random() * width;
        startY = height;
        endX = startX + (Math.random() - 0.5) * 100;
        endY = height - Math.random() * height * 0.4;
        break;
      case 2: // Left
        startX = 0;
        startY = Math.random() * height;
        endX = Math.random() * width * 0.4;
        endY = startY + (Math.random() - 0.5) * 100;
        break;
      default: // Right
        startX = width;
        startY = Math.random() * height;
        endX = width - Math.random() * width * 0.4;
        endY = startY + (Math.random() - 0.5) * 100;
    }

    spawnElectricArc(startX, startY, endX, endY, intensity * 0.7);
  }

  // Screen flash
  const flashAlpha = intensity * 0.1;
  ctx.fillStyle = `rgba(150, 230, 255, ${flashAlpha})`;
  ctx.fillRect(0, 0, width, height);
}

function getDirectionAngle(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): number {
  switch (direction) {
    case 'UP': return -Math.PI / 2;
    case 'DOWN': return Math.PI / 2;
    case 'LEFT': return Math.PI;
    case 'RIGHT': return 0;
  }
}

function drawSnakeHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  time: number,
  electricIntensity: number = 1
) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  const radius = (CELL_SIZE - 2) / 2;
  const angle = getDirectionAngle(direction);

  // Draw electric aura around the head
  drawElectricAura(ctx, centerX, centerY, radius + 15, time, electricIntensity);

  // Animated glow effect (enhanced with electric blue tint)
  const glowPulse = 12 + Math.sin(time * 0.01) * 3;
  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius + glowPulse);
  glow.addColorStop(0, COLORS.snakeHeadGlow);
  glow.addColorStop(0.3, 'rgba(0, 255, 200, 0.4)');
  glow.addColorStop(0.6, 'rgba(0, 200, 255, 0.2)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(centerX - radius - glowPulse, centerY - radius - glowPulse,
               (radius + glowPulse) * 2, (radius + glowPulse) * 2);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Draw head shape (slightly elongated)
  ctx.beginPath();
  ctx.ellipse(2, 0, radius + 2, radius - 1, 0, 0, Math.PI * 2);

  // Gradient fill
  const headGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
  headGradient.addColorStop(0, '#aaffdd');
  headGradient.addColorStop(0.3, COLORS.snakeHead);
  headGradient.addColorStop(1, '#008855');
  ctx.fillStyle = headGradient;
  ctx.fill();

  // Draw tongue (animated)
  const tongueWave = Math.sin(time * 0.02) * 2;
  ctx.strokeStyle = '#ff4466';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(radius + 6, tongueWave);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(radius + 6, tongueWave);
  ctx.lineTo(radius + 10, tongueWave - 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(radius + 6, tongueWave);
  ctx.lineTo(radius + 10, tongueWave + 3);
  ctx.stroke();

  // Draw eyes
  const eyeOffsetX = 2;
  const eyeOffsetY = 5;

  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, -eyeOffsetY, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils (look in movement direction)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eyeOffsetX + 1.5, -eyeOffsetY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX + 1.5, eyeOffsetY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(eyeOffsetX, -eyeOffsetY - 1, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX, eyeOffsetY - 1, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSnakeBody(
  ctx: CanvasRenderingContext2D,
  segments: Position[],
  time: number
) {
  if (segments.length < 2) return;

  // Spawn electric arcs between segments periodically
  if (Math.random() < 0.15 && segments.length > 2) {
    const arcIndex = Math.floor(Math.random() * (segments.length - 1)) + 1;
    const seg1 = segments[arcIndex - 1];
    const seg2 = segments[arcIndex];
    const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
    const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
    const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
    const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;
    spawnElectricArc(x1, y1, x2, y2, 0.8);
  }

  // Draw connected body segments with electric gradient effect
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = segments[i - 1];
    const progress = i / segments.length;

    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
    const prevCenterX = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
    const prevCenterY = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;

    // Calculate radius (tapers toward tail)
    const baseRadius = (CELL_SIZE - 4) / 2;
    const taperFactor = 1 - progress * 0.4;
    const radius = baseRadius * taperFactor;

    // Electric-enhanced hue (cyan to green gradient with electric blue pulses)
    const electricPulse = Math.sin(time * 0.015 + i * 0.8) * 0.5 + 0.5;
    const baseHue = 160 + progress * 40; // Green to cyan
    const hue = baseHue + electricPulse * 20; // Add blue shift when pulsing
    const saturation = 85 - progress * 15 + electricPulse * 15;
    const lightness = 55 - progress * 10 + electricPulse * 10;

    // Draw electric glow (enhanced)
    const glowRadius = radius + 8 - progress * 4 + electricPulse * 4;
    const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, glowRadius);
    glow.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.7)`);
    glow.addColorStop(0.5, `hsla(190, 100%, 60%, ${0.3 * electricPulse})`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2);

    // Draw connector between segments (if close enough)
    const dx = centerX - prevCenterX;
    const dy = centerY - prevCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CELL_SIZE * 1.5) {
      const prevRadius = baseRadius * (1 - (i - 1) / segments.length * 0.4);

      // Draw electric core connector
      ctx.beginPath();
      ctx.lineWidth = Math.min(radius, prevRadius) * 1.8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.moveTo(prevCenterX, prevCenterY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();

      // Draw thin electric line through center
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `rgba(200, 255, 255, ${0.3 + electricPulse * 0.4})`;
      ctx.moveTo(prevCenterX, prevCenterY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();
    }

    // Draw segment circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    // Electric gradient fill
    const segGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    segGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 35}%)`);
    segGradient.addColorStop(0.3, `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`);
    segGradient.addColorStop(0.7, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    segGradient.addColorStop(1, `hsl(${hue}, ${saturation - 10}%, ${lightness - 15}%)`);

    ctx.fillStyle = segGradient;
    ctx.fill();

    // Add electric shine
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(200, 255, 255, ${0.4 + electricPulse * 0.3})`;
    ctx.fill();

    // Small electric dot on each segment
    if (electricPulse > 0.7) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${(electricPulse - 0.7) * 3})`;
      ctx.fill();
    }
  }
}

function drawFood(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;

  // Multi-layer pulsing effect
  const pulse1 = Math.sin(time * 0.006) * 0.15 + 0.85;
  const pulse2 = Math.sin(time * 0.004 + 1) * 0.1 + 0.9;
  const radius = ((CELL_SIZE - 2) / 2) * pulse1;

  // Outer glow rings (multiple layers)
  for (let ring = 3; ring >= 1; ring--) {
    const ringSize = 12 + ring * 8 + Math.sin(time * 0.005 + ring) * 4;
    const ringAlpha = 0.3 - ring * 0.08;
    const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ringSize);
    outerGlow.addColorStop(0, `rgba(255, 34, 102, ${ringAlpha})`);
    outerGlow.addColorStop(0.6, `rgba(255, 0, 85, ${ringAlpha * 0.5})`);
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Orbiting particles
  const orbitRadius = radius + 10;
  for (let i = 0; i < 6; i++) {
    const angle = time * 0.003 + (i * Math.PI * 2) / 6;
    const orbitX = centerX + Math.cos(angle) * orbitRadius;
    const orbitY = centerY + Math.sin(angle) * orbitRadius * pulse2;
    const particleSize = 2 + Math.sin(time * 0.01 + i * 2) * 1;

    ctx.beginPath();
    ctx.arc(orbitX, orbitY, particleSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 150, 200, ${0.6 + Math.sin(time * 0.008 + i) * 0.4})`;
    ctx.fill();
  }

  // Main food body with enhanced gradient
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  const foodGradient = ctx.createRadialGradient(
    centerX - radius * 0.4, centerY - radius * 0.4, 0,
    centerX, centerY, radius
  );
  foodGradient.addColorStop(0, '#ffffff');
  foodGradient.addColorStop(0.2, '#ffaacc');
  foodGradient.addColorStop(0.5, COLORS.foodCore);
  foodGradient.addColorStop(1, COLORS.food);

  ctx.fillStyle = foodGradient;
  ctx.fill();

  // Inner shine
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();

  // Sparkle cross effect
  const sparkleSize = 4 + Math.sin(time * 0.015) * 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - sparkleSize);
  ctx.lineTo(centerX, centerY + sparkleSize);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - sparkleSize, centerY);
  ctx.lineTo(centerX + sparkleSize, centerY);
  ctx.stroke();
}

function drawFoodEatFlash(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  if (intensity <= 0) return;

  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
  gradient.addColorStop(0, `rgba(255, 100, 150, ${intensity * 0.3})`);
  gradient.addColorStop(0.5, `rgba(255, 50, 100, ${intensity * 0.15})`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawGameOver(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, startTime: number) {
  const elapsed = time - startTime;
  const fadeIn = Math.min(elapsed / 500, 1);

  // Animated dark overlay
  ctx.fillStyle = `rgba(5, 5, 16, ${0.85 * fadeIn})`;
  ctx.fillRect(0, 0, width, height);

  // Screen shake effect (early)
  const shakeIntensity = Math.max(0, 1 - elapsed / 300) * 3;
  const shakeX = Math.sin(elapsed * 0.5) * shakeIntensity;
  const shakeY = Math.cos(elapsed * 0.7) * shakeIntensity;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Pulsing glow behind text
  const glowPulse = 30 + Math.sin(time * 0.005) * 10;

  // Game over text with animated effects
  ctx.shadowColor = COLORS.gameOverText;
  ctx.shadowBlur = glowPulse;
  ctx.fillStyle = COLORS.gameOverText;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Scale animation
  const scale = 1 + Math.sin(time * 0.003) * 0.05;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale * fadeIn, scale * fadeIn);
  ctx.fillText('GAME OVER', 0, 0);
  ctx.restore();

  // Subtitle
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '16px Arial';
  const subtitleAlpha = Math.min((elapsed - 300) / 500, 1);
  if (subtitleAlpha > 0) {
    ctx.globalAlpha = subtitleAlpha * fadeIn;
    ctx.fillText('Press any key to restart', width / 2, height / 2 + 40);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const time = performance.now();
      const width = canvas.width;
      const height = canvas.height;

      // Detect food eaten (score increased)
      if (scoreRef.current !== lastScore) {
        const head = gameState.snake[0];
        if (head) {
          spawnParticles(head.x, head.y, 15, 340); // Pink particles
          spawnParticles(head.x, head.y, 10, 190); // Electric cyan particles

          // Spawn electric arcs radiating from head
          const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
          const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
          for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2 + Math.random() * 0.5;
            const dist = 40 + Math.random() * 30;
            spawnElectricArc(
              headX, headY,
              headX + Math.cos(angle) * dist,
              headY + Math.sin(angle) * dist,
              1.2
            );
          }
        }
        foodEatFlash = 1;
        powerSurgeIntensity = 1;
        lastScore = scoreRef.current;
      }

      // Spawn trail particles from snake head movement
      const currentHead = gameState.snake[0];
      if (currentHead && lastSnakeHead &&
          (currentHead.x !== lastSnakeHead.x || currentHead.y !== lastSnakeHead.y)) {
        spawnParticles(lastSnakeHead.x, lastSnakeHead.y, 3, 160); // Green particles
      }
      lastSnakeHead = currentHead ? { ...currentHead } : null;

      // Update food eat flash
      if (foodEatFlash > 0) {
        foodEatFlash -= 0.05;
      }

      // Update power surge intensity
      if (powerSurgeIntensity > 0) {
        powerSurgeIntensity -= 0.03;
      }

      // Track game over timing
      if (gameState.gameOver && gameOverTime === 0) {
        gameOverTime = time;
      } else if (!gameState.gameOver) {
        gameOverTime = 0;
      }

      // Draw background with grid and stars
      drawBackground(ctx, width, height, time);

      // Draw power surge effect (behind everything)
      drawPowerSurge(ctx, width, height, powerSurgeIntensity, time);

      // Draw food eat flash effect
      drawFoodEatFlash(ctx, width, height, foodEatFlash);

      // Draw and update particles
      updateAndDrawParticles(ctx);

      // Draw electric arcs
      drawElectricArcs(ctx);

      // Draw food with animation
      drawFood(ctx, gameState.food.x, gameState.food.y, time);

      // Draw snake body (all segments except head)
      drawSnakeBody(ctx, gameState.snake, time);

      // Draw snake head on top with electric intensity based on recent food eating
      if (gameState.snake.length > 0) {
        const head = gameState.snake[0];
        const electricBoost = 1 + powerSurgeIntensity * 0.5;
        drawSnakeHead(ctx, head.x, head.y, gameState.direction, time, electricBoost);
      }

      // Draw game over overlay if needed
      if (gameState.gameOver) {
        drawGameOver(ctx, width, height, time, gameOverTime);
      }

      animationRef.current = time;
      animationId = requestAnimationFrame(render);
    };

    // Reset score tracking when game restarts
    scoreRef.current = 0;
    lastScore = 0;

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, gridSize]);

  // Track score changes
  useEffect(() => {
    // Access score through the extended gameState if available
    const extendedState = gameState as GameState & { score?: number };
    if (extendedState.score !== undefined) {
      scoreRef.current = extendedState.score;
    }
  }, [gameState]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={gridSize * CELL_SIZE}
        height={gridSize * CELL_SIZE}
      />
    </div>
  );
}
