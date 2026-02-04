import { useEffect, useRef, useState, useCallback } from 'react';
import './GameBoard.css';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  gameOver: boolean;
}

interface GameBoardProps {
  gameState: GameState;
  gridSize: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'ambient' | 'explosion' | 'trail' | 'matrix' | 'lightning' | 'streak' | 'warp';
  char?: string;
  angle?: number;
  length?: number;
}

interface ScorePopup {
  x: number;
  y: number;
  value: number;
  life: number;
  scale: number;
}

interface PlasmaWave {
  phase: number;
  amplitude: number;
  frequency: number;
  speed: number;
  color: string;
  yOffset: number;
}

const CELL_SIZE = 20;

// Color palette - enhanced with dramatic neon colors
const COLORS = {
  bgDark: '#020208',
  bgLight: '#0a0a1a',
  gridLine: 'rgba(100, 200, 255, 0.04)',
  snakeHead: '#00ff88',
  snakeHeadGlow: 'rgba(0, 255, 136, 0.8)',
  snakeTail: '#ff00ff',
  snakeBody: '#00ddff',
  foodCore: '#ff2255',
  foodGlow: 'rgba(255, 51, 102, 0.9)',
  foodOuter: '#ff88aa',
  foodRing: '#ffaa00',
  eyeWhite: '#ffffff',
  eyePupil: '#001100',
  particleGreen: '#00ff88',
  particleCyan: '#00ddff',
  particleMagenta: '#ff3388',
  particleGold: '#ffdd00',
  neonPink: '#ff0080',
  neonBlue: '#00f0ff',
  neonPurple: '#8000ff',
  electricBlue: '#00ffff',
};

// Matrix-style characters
const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノ';

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const prevFoodRef = useRef<Position | null>(null);
  const gameOverFrameRef = useRef(0);
  const prevGameOverRef = useRef(false);
  const screenShakeRef = useRef({ x: 0, y: 0, intensity: 0 });
  const lightningRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const prevSnakeHeadRef = useRef<Position | null>(null);
  const warpIntensityRef = useRef(0);
  const plasmaWavesRef = useRef<PlasmaWave[]>([]);
  const plasmaTimeRef = useRef(0);

  // Create explosion particles at a position
  const createExplosion = useCallback((x: number, y: number, count: number, colors: string[]) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'explosion',
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // Create energy streak particles behind snake
  const createStreaks = useCallback((x: number, y: number, dx: number, dy: number) => {
    const streakParticles: Particle[] = [];
    const colors = [COLORS.neonBlue, COLORS.neonPurple, COLORS.electricBlue, COLORS.particleCyan];

    // Create multiple streaks at different offsets
    for (let i = 0; i < 4; i++) {
      const offsetX = (Math.random() - 0.5) * 8;
      const offsetY = (Math.random() - 0.5) * 8;
      const angle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.4;
      const speed = 1.5 + Math.random() * 2;

      streakParticles.push({
        x: x + offsetX,
        y: y + offsetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'streak',
        angle: angle,
        length: 15 + Math.random() * 20,
      });
    }

    // Occasional warp burst particles
    if (Math.random() > 0.7) {
      for (let i = 0; i < 3; i++) {
        const warpAngle = Math.atan2(-dy, -dx) + (Math.random() - 0.5) * 0.8;
        streakParticles.push({
          x: x,
          y: y,
          vx: Math.cos(warpAngle) * 4,
          vy: Math.sin(warpAngle) * 4,
          life: 1,
          maxLife: 1,
          size: 1 + Math.random() * 2,
          color: '#ffffff',
          type: 'warp',
          length: 30 + Math.random() * 20,
          angle: warpAngle,
        });
      }
    }

    particlesRef.current = [...particlesRef.current, ...streakParticles];
  }, []);

  // Create score popup animation
  const createScorePopup = useCallback((x: number, y: number, value: number) => {
    scorePopupsRef.current.push({
      x,
      y,
      value,
      life: 1,
      scale: 0,
    });
  }, []);

  // Create lightning effect at position
  const createLightning = useCallback((x: number, y: number) => {
    lightningRef.current = { x, y, time: 15 };
    // Add electric particles
    const electricParticles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = 4 + Math.random() * 4;
      electricParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 2 + Math.random() * 2,
        color: COLORS.electricBlue,
        type: 'lightning',
      });
    }
    particlesRef.current = [...particlesRef.current, ...electricParticles];
  }, []);

  // Initialize plasma waves
  useEffect(() => {
    const waves: PlasmaWave[] = [];
    const waveColors = [
      'rgba(0, 255, 200, 0.15)',    // Cyan-green aurora
      'rgba(128, 0, 255, 0.12)',    // Purple aurora
      'rgba(255, 0, 128, 0.10)',    // Magenta aurora
      'rgba(0, 200, 255, 0.13)',    // Electric blue
      'rgba(0, 255, 100, 0.11)',    // Neon green
    ];

    for (let i = 0; i < 5; i++) {
      waves.push({
        phase: (i / 5) * Math.PI * 2,
        amplitude: 30 + i * 15,
        frequency: 0.008 + i * 0.003,
        speed: 0.02 + (i % 2) * 0.015,
        color: waveColors[i],
        yOffset: (i / 5) * (gridSize * CELL_SIZE),
      });
    }
    plasmaWavesRef.current = waves;
  }, [gridSize]);

  // Initialize ambient and matrix particles
  useEffect(() => {
    const width = gridSize * CELL_SIZE;
    const height = gridSize * CELL_SIZE;
    const particles: Particle[] = [];

    // Ambient floating particles
    for (let i = 0; i < 20; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: Math.random(),
        maxLife: 1,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? COLORS.particleCyan : COLORS.particleGreen,
        type: 'ambient',
      });
    }

    // Matrix-style falling characters
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 1 + Math.random() * 2,
        life: Math.random(),
        maxLife: 1,
        size: 8 + Math.random() * 4,
        color: COLORS.particleGreen,
        type: 'matrix',
        char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
      });
    }

    particlesRef.current = particles;
  }, [gridSize]);

  // Detect food eaten and create explosion with lightning and score popup
  useEffect(() => {
    if (prevFoodRef.current &&
        (prevFoodRef.current.x !== gameState.food.x || prevFoodRef.current.y !== gameState.food.y)) {
      // Food position changed = food was eaten at the old position
      const foodX = prevFoodRef.current.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = prevFoodRef.current.y * CELL_SIZE + CELL_SIZE / 2;
      createExplosion(foodX, foodY, 20, [COLORS.particleMagenta, COLORS.particleGold, COLORS.foodOuter, COLORS.neonPink]);
      createLightning(foodX, foodY);
      createScorePopup(foodX, foodY, 10);
      // Boost warp intensity when eating food
      warpIntensityRef.current = Math.min(warpIntensityRef.current + 0.5, 1);
    }
    prevFoodRef.current = { ...gameState.food };
  }, [gameState.food, createExplosion, createLightning, createScorePopup]);

  // Track snake movement for streak effects
  useEffect(() => {
    const head = gameState.snake[0];
    if (!head) return;

    if (prevSnakeHeadRef.current) {
      const dx = head.x - prevSnakeHeadRef.current.x;
      const dy = head.y - prevSnakeHeadRef.current.y;

      // Handle wrapping
      const normalizedDx = dx > 1 ? -1 : dx < -1 ? 1 : dx;
      const normalizedDy = dy > 1 ? -1 : dy < -1 ? 1 : dy;

      // Only create streaks if snake moved
      if (normalizedDx !== 0 || normalizedDy !== 0) {
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
        createStreaks(headX, headY, normalizedDx, normalizedDy);
      }
    }

    prevSnakeHeadRef.current = { ...head };
  }, [gameState.snake, createStreaks]);

  // Detect game over and create death explosion with screen shake
  useEffect(() => {
    if (gameState.gameOver && !prevGameOverRef.current) {
      gameOverFrameRef.current = 0;
      screenShakeRef.current.intensity = 15;
      const head = gameState.snake[0];
      if (head) {
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
        createExplosion(headX, headY, 32, [COLORS.particleMagenta, '#ff0000', '#ff6600', COLORS.neonPink]);
      }
    }
    prevGameOverRef.current = gameState.gameOver;
  }, [gameState.gameOver, gameState.snake, createExplosion]);

  // Animation loop for pulsing effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((f) => (f + 1) % 360);
      if (gameState.gameOver) {
        gameOverFrameRef.current = Math.min(gameOverFrameRef.current + 1, 60);
      }
      // Update screen shake
      if (screenShakeRef.current.intensity > 0) {
        screenShakeRef.current.x = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.y = (Math.random() - 0.5) * screenShakeRef.current.intensity;
        screenShakeRef.current.intensity *= 0.9;
        if (screenShakeRef.current.intensity < 0.5) {
          screenShakeRef.current = { x: 0, y: 0, intensity: 0 };
        }
      }
      // Update lightning timer
      if (lightningRef.current) {
        lightningRef.current.time--;
        if (lightningRef.current.time <= 0) {
          lightningRef.current = null;
        }
      }
      // Update score popups
      scorePopupsRef.current = scorePopupsRef.current
        .map((popup) => ({
          ...popup,
          life: popup.life - 0.025,
          y: popup.y - 1.5,
          scale: Math.min(popup.scale + 0.15, 1),
        }))
        .filter((popup) => popup.life > 0);
      // Decay warp intensity
      warpIntensityRef.current *= 0.97;
      // Update plasma time
      plasmaTimeRef.current += 1;
    }, 33); // ~30fps for smoother animations
    return () => clearInterval(interval);
  }, [gameState.gameOver]);

  // Update particles
  useEffect(() => {
    const width = gridSize * CELL_SIZE;
    const height = gridSize * CELL_SIZE;

    particlesRef.current = particlesRef.current
      .map((p) => {
        if (p.type === 'ambient') {
          // Ambient particles drift and wrap around
          let newX = p.x + p.vx;
          let newY = p.y + p.vy;
          if (newX < 0) newX = width;
          if (newX > width) newX = 0;
          if (newY < 0) newY = height;
          if (newY > height) newY = 0;
          return {
            ...p,
            x: newX,
            y: newY,
            life: (Math.sin(animationFrame * 0.05 + p.x * 0.01) + 1) / 2,
          };
        } else if (p.type === 'matrix') {
          // Matrix characters fall down and wrap
          let newY = p.y + p.vy;
          if (newY > height) {
            newY = -10;
            return {
              ...p,
              x: Math.random() * width,
              y: newY,
              char: MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)],
              life: Math.random() * 0.5 + 0.5,
            };
          }
          return {
            ...p,
            y: newY,
            life: (Math.sin(animationFrame * 0.03 + p.x * 0.02) + 1) / 2 * 0.6 + 0.2,
          };
        } else if (p.type === 'lightning') {
          // Lightning particles move fast and fade quickly
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.85,
            vy: p.vy * 0.85,
            life: p.life - 0.08,
            size: p.size * 0.95,
          };
        } else if (p.type === 'streak') {
          // Energy streak particles trail behind and fade
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.92,
            vy: p.vy * 0.92,
            life: p.life - 0.04,
            length: (p.length || 20) * 0.95,
          };
        } else if (p.type === 'warp') {
          // Warp particles stretch and fade quickly
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.88,
            vy: p.vy * 0.88,
            life: p.life - 0.06,
            length: (p.length || 30) * 0.98,
          };
        } else {
          // Explosion particles decay
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.95,
            vy: p.vy * 0.95,
            life: p.life - 0.03,
            size: p.size * 0.97,
          };
        }
      })
      .filter((p) => p.life > 0 || p.type === 'matrix');
  }, [animationFrame, gridSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Apply screen shake
    ctx.save();
    ctx.translate(screenShakeRef.current.x, screenShakeRef.current.y);

    // Get snake head position for dynamic lighting
    const headX = gameState.snake[0]?.x * CELL_SIZE + CELL_SIZE / 2 || width / 2;
    const headY = gameState.snake[0]?.y * CELL_SIZE + CELL_SIZE / 2 || height / 2;

    // Draw gradient background with dynamic lighting based on snake position
    const bgGradient = ctx.createRadialGradient(
      headX, headY, 0,
      headX, headY, width * 0.8
    );
    bgGradient.addColorStop(0, '#0a0a20');
    bgGradient.addColorStop(0.3, COLORS.bgLight);
    bgGradient.addColorStop(1, COLORS.bgDark);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(-10, -10, width + 20, height + 20);

    // Draw plasma/aurora wave effect
    const plasmaTime = plasmaTimeRef.current;
    const snakeHeadForPlasma = gameState.snake[0];
    const snakeInfluenceX = snakeHeadForPlasma ? snakeHeadForPlasma.x * CELL_SIZE : width / 2;
    const snakeInfluenceY = snakeHeadForPlasma ? snakeHeadForPlasma.y * CELL_SIZE : height / 2;

    plasmaWavesRef.current.forEach((wave, waveIndex) => {
      ctx.beginPath();

      const baseY = wave.yOffset + Math.sin(plasmaTime * wave.speed * 0.5) * 20;

      // Start from off-screen left
      ctx.moveTo(-10, baseY);

      // Draw flowing wave with multiple sine components
      for (let x = 0; x <= width + 10; x += 4) {
        // Distance from snake head influences wave distortion
        const distFromSnake = Math.sqrt(
          Math.pow(x - snakeInfluenceX, 2) + Math.pow(baseY - snakeInfluenceY, 2)
        );
        const snakeDistortion = Math.max(0, 1 - distFromSnake / 200) * 25;

        // Combine multiple wave functions for organic movement
        const y1 = Math.sin(x * wave.frequency + plasmaTime * wave.speed + wave.phase) * wave.amplitude;
        const y2 = Math.sin(x * wave.frequency * 0.5 + plasmaTime * wave.speed * 1.3) * (wave.amplitude * 0.5);
        const y3 = Math.sin(x * wave.frequency * 2 + plasmaTime * wave.speed * 0.7 + waveIndex) * (wave.amplitude * 0.3);

        // Add snake influence ripple
        const snakeRipple = snakeDistortion * Math.sin(distFromSnake * 0.05 - plasmaTime * 0.1);

        const y = baseY + y1 + y2 + y3 + snakeRipple;
        ctx.lineTo(x, y);
      }

      // Complete the shape to fill below the wave
      ctx.lineTo(width + 10, height + 10);
      ctx.lineTo(-10, height + 10);
      ctx.closePath();

      // Create vertical gradient for aurora effect
      const waveGradient = ctx.createLinearGradient(0, baseY - wave.amplitude * 2, 0, baseY + wave.amplitude * 3);
      const baseColor = wave.color;

      // Intensify color near snake
      const snakeNearness = Math.max(0, 1 - Math.abs(snakeInfluenceY - baseY) / 150);
      const intensityBoost = 1 + snakeNearness * 0.5 + warpIntensityRef.current * 0.3;

      waveGradient.addColorStop(0, 'transparent');
      waveGradient.addColorStop(0.3, baseColor.replace(/[\d.]+\)$/, `${parseFloat(baseColor.match(/[\d.]+\)$/)?.[0] || '0.1') * intensityBoost})`));
      waveGradient.addColorStop(0.6, baseColor.replace(/[\d.]+\)$/, `${parseFloat(baseColor.match(/[\d.]+\)$/)?.[0] || '0.1') * intensityBoost * 0.6})`));
      waveGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = waveGradient;
      ctx.fill();

      // Add glow line at the wave crest
      ctx.beginPath();
      ctx.moveTo(-10, baseY);
      for (let x = 0; x <= width + 10; x += 4) {
        const distFromSnake = Math.sqrt(
          Math.pow(x - snakeInfluenceX, 2) + Math.pow(baseY - snakeInfluenceY, 2)
        );
        const snakeDistortion = Math.max(0, 1 - distFromSnake / 200) * 25;

        const y1 = Math.sin(x * wave.frequency + plasmaTime * wave.speed + wave.phase) * wave.amplitude;
        const y2 = Math.sin(x * wave.frequency * 0.5 + plasmaTime * wave.speed * 1.3) * (wave.amplitude * 0.5);
        const y3 = Math.sin(x * wave.frequency * 2 + plasmaTime * wave.speed * 0.7 + waveIndex) * (wave.amplitude * 0.3);
        const snakeRipple = snakeDistortion * Math.sin(distFromSnake * 0.05 - plasmaTime * 0.1);

        const y = baseY + y1 + y2 + y3 + snakeRipple;
        ctx.lineTo(x, y);
      }

      // Brighter line color
      const lineAlpha = 0.3 * intensityBoost;
      ctx.strokeStyle = baseColor.replace(/[\d.]+\)$/, `${lineAlpha})`);
      ctx.lineWidth = 2;
      ctx.shadowColor = baseColor.replace(/[\d.]+\)$/, '0.8)');
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Add subtle animated scanlines for retro effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    // Draw matrix falling characters (behind grid)
    ctx.font = 'bold 10px monospace';
    particlesRef.current.forEach((p) => {
      if (p.type === 'matrix' && p.char) {
        ctx.globalAlpha = p.life * 0.15;
        ctx.fillStyle = COLORS.particleGreen;
        ctx.fillText(p.char, p.x, p.y);
        // Glow effect
        ctx.shadowColor = COLORS.particleGreen;
        ctx.shadowBlur = 8;
        ctx.fillText(p.char, p.x, p.y);
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    });

    // Draw animated grid with pulsing effect
    const gridPulse = (Math.sin(animationFrame * 0.02) + 1) / 2 * 0.03 + 0.02;
    ctx.strokeStyle = `rgba(100, 200, 255, ${gridPulse})`;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw pulsing neon border
    const borderPulse = (Math.sin(animationFrame * 0.08) + 1) / 2;
    const borderColors = [COLORS.neonPink, COLORS.neonBlue, COLORS.neonPurple, COLORS.particleGreen];
    const currentBorderColor = borderColors[Math.floor(animationFrame / 90) % borderColors.length];
    ctx.strokeStyle = currentBorderColor;
    ctx.lineWidth = 2 + borderPulse;
    ctx.globalAlpha = 0.5 + borderPulse * 0.3;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    ctx.globalAlpha = 1;

    // Draw ambient particles (behind everything)
    particlesRef.current.forEach((p) => {
      if (p.type === 'ambient') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${p.life * 0.4})`).replace('rgb', 'rgba');
        ctx.fill();
      }
    });

    // Draw energy streak and warp particles (behind snake)
    particlesRef.current.forEach((p) => {
      if (p.type === 'streak' || p.type === 'warp') {
        const angle = p.angle || 0;
        const length = (p.length || 20) * p.life;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);

        // Create gradient for streak
        const streakGradient = ctx.createLinearGradient(0, 0, -length, 0);

        if (p.type === 'warp') {
          // Warp particles are bright white/cyan
          streakGradient.addColorStop(0, `rgba(255, 255, 255, ${p.life * 0.9})`);
          streakGradient.addColorStop(0.3, `rgba(0, 240, 255, ${p.life * 0.6})`);
          streakGradient.addColorStop(1, 'transparent');
          ctx.lineWidth = p.size * 0.8;
        } else {
          // Energy streaks with color
          streakGradient.addColorStop(0, p.color.replace(')', `, ${p.life * 0.8})`).replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (_m, r, g, b) =>
            `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`
          ));
          streakGradient.addColorStop(0.4, p.color.replace(')', `, ${p.life * 0.4})`).replace('#', 'rgba(').replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i, (_m, r, g, b) =>
            `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`
          ));
          streakGradient.addColorStop(1, 'transparent');
          ctx.lineWidth = p.size;
        }

        ctx.strokeStyle = streakGradient;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-length, 0);
        ctx.stroke();

        // Add glow effect
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.type === 'warp' ? 15 : 8;
        ctx.stroke();
        ctx.shadowBlur = 0;

        ctx.restore();
      }
    });

    // Draw hyperdrive warp effect overlay when intensity is high
    if (warpIntensityRef.current > 0.1) {
      const warpAlpha = warpIntensityRef.current * 0.15;
      const head = gameState.snake[0];
      if (head) {
        const hx = head.x * CELL_SIZE + CELL_SIZE / 2;
        const hy = head.y * CELL_SIZE + CELL_SIZE / 2;

        // Radial speed lines emanating from center
        ctx.save();
        ctx.translate(hx, hy);

        for (let i = 0; i < 16; i++) {
          const lineAngle = (i / 16) * Math.PI * 2 + animationFrame * 0.02;
          const innerR = 30 + Math.sin(animationFrame * 0.1 + i) * 10;
          const outerR = 80 + warpIntensityRef.current * 60;

          const gradient = ctx.createLinearGradient(
            Math.cos(lineAngle) * innerR,
            Math.sin(lineAngle) * innerR,
            Math.cos(lineAngle) * outerR,
            Math.sin(lineAngle) * outerR
          );
          gradient.addColorStop(0, 'transparent');
          gradient.addColorStop(0.3, `rgba(0, 200, 255, ${warpAlpha})`);
          gradient.addColorStop(0.7, `rgba(100, 100, 255, ${warpAlpha * 0.5})`);
          gradient.addColorStop(1, 'transparent');

          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(Math.cos(lineAngle) * innerR, Math.sin(lineAngle) * innerR);
          ctx.lineTo(Math.cos(lineAngle) * outerR, Math.sin(lineAngle) * outerR);
          ctx.stroke();
        }

        ctx.restore();
      }
    }

    // Pulsing animation values
    const pulse = (Math.sin(animationFrame * 0.1) + 1) / 2;
    const fastPulse = (Math.sin(animationFrame * 0.2) + 1) / 2;

    // Draw food with enhanced glow effect
    const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodRadius = (CELL_SIZE / 2 - 2) * (0.9 + pulse * 0.1);

    // Large outer glow
    const outerGlowSize = 25 + pulse * 10;
    const outerGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, outerGlowSize);
    outerGlow.addColorStop(0, 'rgba(255, 51, 102, 0.4)');
    outerGlow.addColorStop(0.4, 'rgba(255, 51, 102, 0.15)');
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(foodX, foodY, outerGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // Rotating orbital rings around food
    ctx.save();
    ctx.translate(foodX, foodY);
    for (let ring = 0; ring < 3; ring++) {
      const ringAngle = animationFrame * 0.03 * (ring % 2 === 0 ? 1 : -1) + (ring * Math.PI / 3);
      const ringRadius = foodRadius + 6 + ring * 4;
      const ringAlpha = 0.4 - ring * 0.1;

      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadius, ringRadius * 0.3, ringAngle, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 170, 0, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Add orbiting dots on rings
      const dotAngle = animationFrame * 0.08 * (ring % 2 === 0 ? 1 : -1);
      const dotX = Math.cos(dotAngle) * ringRadius;
      const dotY = Math.sin(dotAngle) * ringRadius * 0.3;
      const rotatedX = dotX * Math.cos(ringAngle) - dotY * Math.sin(ringAngle);
      const rotatedY = dotX * Math.sin(ringAngle) + dotY * Math.cos(ringAngle);
      ctx.beginPath();
      ctx.arc(rotatedX, rotatedY, 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.particleGold;
      ctx.fill();
    }
    ctx.restore();

    // Food body with enhanced gradient
    const foodBodyGradient = ctx.createRadialGradient(
      foodX - 2, foodY - 2, 0,
      foodX, foodY, foodRadius
    );
    foodBodyGradient.addColorStop(0, '#ffffff');
    foodBodyGradient.addColorStop(0.2, COLORS.foodOuter);
    foodBodyGradient.addColorStop(0.6, COLORS.foodCore);
    foodBodyGradient.addColorStop(1, '#aa0033');
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = foodBodyGradient;
    ctx.fill();

    // Food inner glow
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 0.6, 0, Math.PI * 2);
    const innerGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, foodRadius * 0.6);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.fill();

    // Food highlight sparkle
    ctx.beginPath();
    ctx.arc(foodX - 3, foodY - 3, foodRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + fastPulse * 0.3})`;
    ctx.fill();

    // Draw snake trail effect (glowing path behind snake)
    const snakeLength = gameState.snake.length;
    if (snakeLength > 1) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      for (let i = snakeLength - 1; i >= 1; i--) {
        const segment = gameState.snake[i];
        const prevSegment = gameState.snake[i - 1];
        const x1 = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const y1 = segment.y * CELL_SIZE + CELL_SIZE / 2;
        const x2 = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
        const y2 = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;

        // Only draw if segments are adjacent (not wrapped)
        const dist = Math.abs(segment.x - prevSegment.x) + Math.abs(segment.y - prevSegment.y);
        if (dist === 1) {
          const trailGradient = ctx.createLinearGradient(x1, y1, x2, y2);
          const alpha = 0.2 * (1 - i / snakeLength);
          trailGradient.addColorStop(0, `rgba(0, 221, 255, ${alpha})`);
          trailGradient.addColorStop(1, `rgba(0, 255, 136, ${alpha * 1.5})`);
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = 8 * (1 - i / snakeLength * 0.5);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Draw snake segments
    gameState.snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const y = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const isHead = index === 0;

      // Calculate segment size (head is bigger, tail tapers)
      const progress = index / Math.max(snakeLength - 1, 1);
      const baseRadius = isHead ? CELL_SIZE / 2 - 1 : CELL_SIZE / 2 - 2;
      const radius = baseRadius * (isHead ? 1 : (1 - progress * 0.4));

      // Enhanced glow effect for head
      if (isHead) {
        // Outer pulsing glow
        const glowPulse = (Math.sin(animationFrame * 0.15) + 1) / 2;
        const glowRadius = radius + 12 + glowPulse * 6;
        const headOuterGlow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        headOuterGlow.addColorStop(0, 'rgba(0, 255, 136, 0.5)');
        headOuterGlow.addColorStop(0.5, 'rgba(0, 255, 136, 0.15)');
        headOuterGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headOuterGlow;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright glow
        const headGlow = ctx.createRadialGradient(x, y, 0, x, y, radius + 4);
        headGlow.addColorStop(0, COLORS.snakeHeadGlow);
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body segment glow with rainbow wave
      if (!isHead && index < snakeLength - 1) {
        // Rainbow wave effect - hue shifts based on position and time
        const waveHue = (index * 30 + animationFrame * 2) % 360;
        const bodyGlowAlpha = 0.4 * (1 - progress);
        const bodyGlow = ctx.createRadialGradient(x, y, 0, x, y, radius + 4);
        bodyGlow.addColorStop(0, `hsla(${waveHue}, 100%, 60%, ${bodyGlowAlpha})`);
        bodyGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bodyGlow;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Segment gradient with rainbow wave effect
      const segmentGradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, 0,
        x, y, radius
      );

      if (isHead) {
        segmentGradient.addColorStop(0, '#aaffdd');
        segmentGradient.addColorStop(0.3, '#66ffbb');
        segmentGradient.addColorStop(0.7, COLORS.snakeHead);
        segmentGradient.addColorStop(1, '#00aa55');
      } else {
        // Rainbow wave effect - each segment gets a different hue that shifts over time
        const waveHue = (index * 25 + animationFrame * 2) % 360;
        const saturation = 100;
        const lightness = 55 - progress * 10;
        const highlightL = Math.min(lightness + 25, 85);
        segmentGradient.addColorStop(0, `hsl(${waveHue}, ${saturation}%, ${highlightL}%)`);
        segmentGradient.addColorStop(0.5, `hsl(${waveHue}, ${saturation}%, ${lightness}%)`);
        segmentGradient.addColorStop(1, `hsl(${(waveHue + 20) % 360}, ${saturation}%, ${lightness - 15}%)`);
      }

      // Draw segment with slight border
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = segmentGradient;
      ctx.fill();

      // Segment highlight
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${isHead ? 0.4 : 0.2 * (1 - progress)})`;
      ctx.fill();

      // Draw eyes on head
      if (isHead) {
        // Determine eye position based on direction
        const nextSegment = gameState.snake[1];
        let dx = 0, dy = 0;
        if (nextSegment) {
          dx = segment.x - nextSegment.x;
          dy = segment.y - nextSegment.y;
          // Handle wrapping
          if (dx > 1) dx = -1;
          if (dx < -1) dx = 1;
          if (dy > 1) dy = -1;
          if (dy < -1) dy = 1;
        } else {
          dx = 1; // Default facing right
        }

        const eyeOffset = radius * 0.4;
        const eyeRadius = radius * 0.28;
        const pupilRadius = eyeRadius * 0.55;

        // Position eyes perpendicular to direction
        let eye1X, eye1Y, eye2X, eye2Y;
        if (dx !== 0) {
          // Moving horizontally
          eye1X = x + dx * eyeOffset * 0.5;
          eye1Y = y - eyeOffset;
          eye2X = x + dx * eyeOffset * 0.5;
          eye2Y = y + eyeOffset;
        } else {
          // Moving vertically
          eye1X = x - eyeOffset;
          eye1Y = y + dy * eyeOffset * 0.5;
          eye2X = x + eyeOffset;
          eye2Y = y + dy * eyeOffset * 0.5;
        }

        // Draw eyes with glow
        [{ ex: eye1X, ey: eye1Y }, { ex: eye2X, ey: eye2Y }].forEach(({ ex, ey }) => {
          // Eye glow
          ctx.beginPath();
          ctx.arc(ex, ey, eyeRadius + 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();

          // Eye white
          const eyeGradient = ctx.createRadialGradient(ex - 1, ey - 1, 0, ex, ey, eyeRadius);
          eyeGradient.addColorStop(0, '#ffffff');
          eyeGradient.addColorStop(1, '#dddddd');
          ctx.beginPath();
          ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = eyeGradient;
          ctx.fill();

          // Pupil (offset toward direction)
          ctx.beginPath();
          ctx.arc(ex + dx * pupilRadius * 0.4, ey + dy * pupilRadius * 0.4, pupilRadius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.eyePupil;
          ctx.fill();

          // Eye highlight
          ctx.beginPath();
          ctx.arc(ex - pupilRadius * 0.3, ey - pupilRadius * 0.3, pupilRadius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
        });
      }
    });

    // Draw lightning effect
    if (lightningRef.current && lightningRef.current.time > 0) {
      const lx = lightningRef.current.x;
      const ly = lightningRef.current.y;
      const intensity = lightningRef.current.time / 15;

      // Screen flash
      ctx.globalAlpha = intensity * 0.3;
      ctx.fillStyle = COLORS.electricBlue;
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      // Draw lightning bolts
      ctx.strokeStyle = COLORS.electricBlue;
      ctx.lineWidth = 2;
      ctx.shadowColor = COLORS.electricBlue;
      ctx.shadowBlur = 20;

      for (let bolt = 0; bolt < 6; bolt++) {
        const angle = (bolt / 6) * Math.PI * 2;
        let bx = lx;
        let by = ly;
        ctx.beginPath();
        ctx.moveTo(bx, by);

        for (let seg = 0; seg < 5; seg++) {
          const dist = 15 + Math.random() * 20;
          bx += Math.cos(angle + (Math.random() - 0.5) * 0.8) * dist;
          by += Math.sin(angle + (Math.random() - 0.5) * 0.8) * dist;
          ctx.lineTo(bx, by);
        }

        ctx.globalAlpha = intensity;
        ctx.stroke();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Draw explosion and lightning particles (on top of snake)
    particlesRef.current.forEach((p) => {
      if (p.type === 'explosion' || p.type === 'lightning') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(0.5, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.life;

        // Add glow for lightning particles
        if (p.type === 'lightning') {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 10;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
      }
    });

    // Draw score popups
    scorePopupsRef.current.forEach((popup) => {
      const easeOut = 1 - Math.pow(1 - popup.scale, 3);
      const bounceScale = easeOut * (1 + Math.sin(popup.life * Math.PI * 3) * 0.1 * popup.life);

      ctx.save();
      ctx.translate(popup.x, popup.y);
      ctx.scale(bounceScale, bounceScale);

      // Text glow
      ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Outer glow layers
      ctx.shadowColor = COLORS.particleGold;
      ctx.shadowBlur = 20;
      ctx.fillStyle = `rgba(255, 221, 0, ${popup.life})`;
      ctx.fillText(`+${popup.value}`, 0, 0);

      // Inner bright text
      ctx.shadowBlur = 10;
      ctx.fillStyle = `rgba(255, 255, 255, ${popup.life})`;
      ctx.fillText(`+${popup.value}`, 0, 0);

      ctx.shadowBlur = 0;
      ctx.restore();
    });

    // Game over overlay effect with dramatic animation
    if (gameState.gameOver) {
      const deathProgress = Math.min(gameOverFrameRef.current / 30, 1);
      const easeOut = 1 - Math.pow(1 - deathProgress, 3);

      // Expanding shockwave from death point
      const deathHead = gameState.snake[0];
      if (deathHead && deathProgress < 1) {
        const shockX = deathHead.x * CELL_SIZE + CELL_SIZE / 2;
        const shockY = deathHead.y * CELL_SIZE + CELL_SIZE / 2;
        const shockRadius = easeOut * width * 0.8;
        const shockGradient = ctx.createRadialGradient(
          shockX, shockY, shockRadius * 0.8,
          shockX, shockY, shockRadius
        );
        shockGradient.addColorStop(0, 'transparent');
        shockGradient.addColorStop(0.5, `rgba(255, 50, 50, ${0.4 * (1 - deathProgress)})`);
        shockGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = shockGradient;
        ctx.beginPath();
        ctx.arc(shockX, shockY, shockRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Darkening overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * easeOut})`;
      ctx.fillRect(0, 0, width, height);

      // Intense red vignette
      const vignetteGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.7
      );
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(0.5, `rgba(80, 0, 0, ${0.3 * easeOut})`);
      vignetteGradient.addColorStop(1, `rgba(150, 0, 0, ${0.5 * easeOut})`);
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);

      // Chromatic aberration effect (color fringing)
      if (deathProgress > 0.3) {
        const aberrationAmount = (deathProgress - 0.3) * 3;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 0, 0, ${0.05 * aberrationAmount})`;
        ctx.fillRect(2, 0, width, height);
        ctx.fillStyle = `rgba(0, 255, 255, ${0.05 * aberrationAmount})`;
        ctx.fillRect(-2, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Subtle noise overlay
      if (deathProgress > 0.5) {
        const noiseAlpha = 0.03 * (deathProgress - 0.5) * 2;
        for (let i = 0; i < 50; i++) {
          const nx = Math.random() * width;
          const ny = Math.random() * height;
          ctx.fillStyle = `rgba(255, 255, 255, ${noiseAlpha * Math.random()})`;
          ctx.fillRect(nx, ny, 2, 2);
        }
      }
    }

    // Restore from screen shake transform
    ctx.restore();
  }, [gameState, gridSize, animationFrame]);

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
