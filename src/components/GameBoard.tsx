import { useEffect, useRef, useCallback } from 'react';
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
  type: 'trail' | 'eat' | 'death' | 'rain' | 'orbit';
}

interface ScorePopup {
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
}

interface MatrixDrop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
  length: number;
  opacity: number;
}

const CELL_SIZE = 20;

// Enhanced neon color palette with plasma theme
const COLORS = {
  background: '#050508',
  gridLine: '#0a0a18',
  gridPulse: '#151528',
  snakeHead: '#00ffff',
  snakeTail: '#004d4d',
  snakeGlow: '#00ffff',
  snakeHighlight: '#88ffff',
  food: '#ff00ff',
  foodGlow: '#ff00ff',
  foodCore: '#ff88ff',
  gameOverOverlay: 'rgba(5, 5, 8, 0.9)',
  gameOverText: '#ff00ff',
  particleTrail: '#00ffff',
  particleEat: '#ff00ff',
  particleDeath: '#ff3333',
  matrixGreen: '#00ff41',
  electricBlue: '#00d4ff',
  plasmaCore: '#ffffff',
};

// Matrix-style characters
const MATRIX_CHARS = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ01234567890'.split('');

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const matrixDropsRef = useRef<MatrixDrop[]>([]);
  const prevSnakeLengthRef = useRef<number>(gameState.snake.length);
  const prevFoodPosRef = useRef<Position>({ ...gameState.food });
  const prevGameOverRef = useRef<boolean>(gameState.gameOver);
  const shakeRef = useRef<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });

  // Initialize matrix rain
  const initMatrixRain = useCallback((canvasWidth: number) => {
    if (matrixDropsRef.current.length === 0) {
      const columns = Math.floor(canvasWidth / 12);
      for (let i = 0; i < columns; i++) {
        matrixDropsRef.current.push({
          x: i * 12,
          y: Math.random() * -500,
          speed: Math.random() * 2 + 1,
          chars: Array(Math.floor(Math.random() * 15 + 5)).fill('').map(() =>
            MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]
          ),
          length: Math.floor(Math.random() * 15 + 5),
          opacity: Math.random() * 0.3 + 0.1,
        });
      }
    }
  }, []);

  // Get rainbow color based on position
  const getRainbowColor = useCallback((index: number, total: number, timestamp: number): string => {
    const hueShift = (timestamp / 20) % 360;
    const hue = (index / total) * 360 + hueShift;
    return `hsl(${hue % 360}, 100%, 60%)`;
  }, []);

  // Spawn particles for trail effect with rainbow colors
  const spawnTrailParticles = useCallback((x: number, y: number, timestamp: number) => {
    const count = 3;
    for (let i = 0; i < count; i++) {
      const hue = ((timestamp / 10) + i * 30) % 360;
      particlesRef.current.push({
        x: x + CELL_SIZE / 2 + (Math.random() - 0.5) * 10,
        y: y + CELL_SIZE / 2 + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        color: `hsl(${hue}, 100%, 60%)`,
        type: 'trail',
      });
    }
  }, []);

  // Spawn explosion particles when eating food - plasma burst
  const spawnEatParticles = useCallback((x: number, y: number) => {
    const count = 30;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 6 + 3;
      const hue = (i / count) * 360;
      particlesRef.current.push({
        x: x + CELL_SIZE / 2,
        y: y + CELL_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 6 + 4,
        color: `hsl(${hue}, 100%, 70%)`,
        type: 'eat',
      });
    }
    // Add stronger screen shake
    shakeRef.current.intensity = 12;
  }, []);

  // Spawn death explosion particles
  const spawnDeathParticles = useCallback((snake: Position[]) => {
    snake.forEach((segment, index) => {
      const delay = index * 50;
      setTimeout(() => {
        const count = 8;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const speed = Math.random() * 3 + 1;
          particlesRef.current.push({
            x: segment.x * CELL_SIZE + CELL_SIZE / 2,
            y: segment.y * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            size: Math.random() * 4 + 2,
            color: COLORS.particleDeath,
            type: 'death',
          });
        }
      }, delay);
    });
    shakeRef.current.intensity = 15;
  }, []);

  // Spawn score popup
  const spawnScorePopup = useCallback((x: number, y: number, value: number) => {
    scorePopupsRef.current.push({
      x: x + CELL_SIZE / 2,
      y: y + CELL_SIZE / 2,
      value,
      life: 1,
      maxLife: 1,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for food eaten (snake grew)
    if (gameState.snake.length > prevSnakeLengthRef.current) {
      spawnEatParticles(prevFoodPosRef.current.x * CELL_SIZE, prevFoodPosRef.current.y * CELL_SIZE);
      spawnScorePopup(prevFoodPosRef.current.x * CELL_SIZE, prevFoodPosRef.current.y * CELL_SIZE, 10);
    }
    prevSnakeLengthRef.current = gameState.snake.length;
    prevFoodPosRef.current = { ...gameState.food };

    // Check for game over (death)
    if (gameState.gameOver && !prevGameOverRef.current) {
      spawnDeathParticles(gameState.snake);
    }
    prevGameOverRef.current = gameState.gameOver;

    // Trail particles will be spawned in the render loop with timestamp

    const render = (timestamp: number) => {
      // Update screen shake
      if (shakeRef.current.intensity > 0) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.intensity *= 0.9;
        if (shakeRef.current.intensity < 0.5) {
          shakeRef.current.intensity = 0;
          shakeRef.current.x = 0;
          shakeRef.current.y = 0;
        }
      }

      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // Clear canvas with deep dark background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

      // Initialize matrix rain if needed
      initMatrixRain(canvas.width);

      // Draw matrix rain background effect
      ctx.font = '10px monospace';
      matrixDropsRef.current.forEach(drop => {
        drop.y += drop.speed;
        if (drop.y > canvas.height + drop.length * 12) {
          drop.y = -drop.length * 12;
          drop.speed = Math.random() * 2 + 1;
          drop.opacity = Math.random() * 0.3 + 0.1;
        }

        drop.chars.forEach((char, i) => {
          const charY = drop.y + i * 12;
          if (charY > 0 && charY < canvas.height) {
            const fadeRatio = i / drop.chars.length;
            const alpha = drop.opacity * (1 - fadeRatio * 0.8);
            ctx.fillStyle = i === 0
              ? `rgba(255, 255, 255, ${alpha + 0.3})`
              : `rgba(0, 255, 65, ${alpha})`;
            ctx.fillText(char, drop.x, charY);
          }
        });

        // Randomly change characters
        if (Math.random() < 0.02) {
          const idx = Math.floor(Math.random() * drop.chars.length);
          drop.chars[idx] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        }
      });

      // Draw hexagonal grid pattern
      const hexSize = CELL_SIZE / 2;
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 0.5;
      const gridPulse = Math.sin(timestamp / 1000) * 0.3 + 0.5;
      ctx.globalAlpha = gridPulse;

      for (let row = 0; row < gridSize + 2; row++) {
        for (let col = 0; col < gridSize + 2; col++) {
          const offsetX = (row % 2) * hexSize;
          const x = col * hexSize * 1.7 + offsetX - hexSize;
          const y = row * hexSize * 1.5 - hexSize;

          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i - Math.PI / 6;
            const hx = x + Math.cos(angle) * hexSize * 0.8;
            const hy = y + Math.sin(angle) * hexSize * 0.8;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // Spawn trail particles with timestamp
      if (gameState.snake.length > 0 && !gameState.gameOver) {
        const tail = gameState.snake[gameState.snake.length - 1];
        if (Math.random() < 0.5) { // Reduce frequency slightly
          spawnTrailParticles(tail.x * CELL_SIZE, tail.y * CELL_SIZE, timestamp);
        }
      }

      // Draw rainbow glow around snake head area
      if (gameState.snake.length > 0 && !gameState.gameOver) {
        const head = gameState.snake[0];
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
        const headHue = (timestamp / 15) % 360;

        const glowGradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, CELL_SIZE * 4);
        glowGradient.addColorStop(0, `hsla(${headHue}, 100%, 60%, 0.2)`);
        glowGradient.addColorStop(0.5, `hsla(${headHue + 60}, 100%, 50%, 0.1)`);
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= p.type === 'trail' ? 0.03 : 0.02;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.life <= 0) return false;

        const alpha = p.life;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        return true;
      });

      // Draw snake with rainbow spectrum and electric effects
      const snakeLength = gameState.snake.length;

      // Draw electric arcs between segments
      if (snakeLength > 1 && !gameState.gameOver) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < snakeLength; i++) {
          const segment = gameState.snake[i];
          const prevSegment = gameState.snake[i - 1];

          const x1 = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
          const y1 = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;
          const x2 = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const y2 = segment.y * CELL_SIZE + CELL_SIZE / 2;

          // Skip if segments are too far apart (wrap around)
          if (Math.abs(prevSegment.x - segment.x) <= 1 && Math.abs(prevSegment.y - segment.y) <= 1) {
            // Draw rainbow gradient connection
            const color = getRainbowColor(i, snakeLength, timestamp);
            const lineWidth = CELL_SIZE - 4 - (i / snakeLength) * 6;

            ctx.strokeStyle = color;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();

            // Draw electric arc effect
            if (Math.random() < 0.3) {
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1;
              ctx.shadowColor = COLORS.electricBlue;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 8;
              const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 8;
              ctx.moveTo(x1, y1);
              ctx.lineTo(midX, midY);
              ctx.lineTo(x2, y2);
              ctx.stroke();
            }
          }
        }
        ctx.shadowBlur = 0;
      }

      // Draw snake segments with rainbow effect
      gameState.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const progress = snakeLength > 1 ? index / (snakeLength - 1) : 0;

        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const size = CELL_SIZE - 2;
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;

        // Get rainbow color for this segment
        const rainbowColor = getRainbowColor(index, Math.max(snakeLength, 10), timestamp);

        // Glow effect with rainbow color
        const glowIntensity = isHead ? 25 : 15 - progress * 10;
        ctx.shadowColor = rainbowColor;
        ctx.shadowBlur = glowIntensity;

        if (isHead) {
          // Draw head with plasma effect
          const radius = 8;

          // Head gradient with animated colors
          const headHue = (timestamp / 15) % 360;
          const headGradient = ctx.createRadialGradient(
            centerX - 3, centerY - 3, 0,
            centerX, centerY, size / 2
          );
          headGradient.addColorStop(0, '#ffffff');
          headGradient.addColorStop(0.3, `hsl(${headHue}, 100%, 70%)`);
          headGradient.addColorStop(0.7, `hsl(${headHue + 30}, 100%, 50%)`);
          headGradient.addColorStop(1, `hsl(${headHue + 60}, 100%, 30%)`);

          ctx.fillStyle = headGradient;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size, radius);
          ctx.fill();

          // Draw energy corona around head
          ctx.strokeStyle = `hsla(${headHue}, 100%, 70%, 0.5)`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, size / 2 + 4 + Math.sin(timestamp / 100) * 2, 0, Math.PI * 2);
          ctx.stroke();

          // Reset shadow for eyes
          ctx.shadowBlur = 0;

          // Draw eyes based on snake direction
          const eyeSize = 4;
          const eyeOffset = 5;
          let eye1X = centerX - eyeOffset;
          let eye1Y = centerY - eyeOffset;
          let eye2X = centerX + eyeOffset;
          let eye2Y = centerY - eyeOffset;

          // Determine direction from head to next segment (if exists)
          if (gameState.snake.length > 1) {
            const next = gameState.snake[1];
            const dx = segment.x - next.x;
            const dy = segment.y - next.y;

            if (dx > 0 || (dx < -1)) { // Moving right (or wrapped)
              eye1X = centerX + 2; eye1Y = centerY - eyeOffset;
              eye2X = centerX + 2; eye2Y = centerY + eyeOffset;
            } else if (dx < 0 || (dx > 1)) { // Moving left (or wrapped)
              eye1X = centerX - 4; eye1Y = centerY - eyeOffset;
              eye2X = centerX - 4; eye2Y = centerY + eyeOffset;
            } else if (dy > 0 || (dy < -1)) { // Moving down (or wrapped)
              eye1X = centerX - eyeOffset; eye1Y = centerY + 2;
              eye2X = centerX + eyeOffset; eye2Y = centerY + 2;
            } else if (dy < 0 || (dy > 1)) { // Moving up (or wrapped)
              eye1X = centerX - eyeOffset; eye1Y = centerY - 4;
              eye2X = centerX + eyeOffset; eye2Y = centerY - 4;
            }
          }

          // Draw glowing eyes with animated blink occasionally
          const blinkCycle = Math.sin(timestamp / 2000);
          const eyeScale = blinkCycle > 0.95 ? 0.3 : 1;

          // Eyes with electric glow
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = COLORS.electricBlue;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(eye1X, eye1Y, eyeSize * eyeScale, eyeSize, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(eye2X, eye2Y, eyeSize * eyeScale, eyeSize, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pupils with slight movement
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#000000';
          const pupilOffset = Math.sin(timestamp / 300) * 0.5;
          ctx.beginPath();
          ctx.arc(eye1X + pupilOffset, eye1Y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eye2X + pupilOffset, eye2Y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw body segment with rainbow gradient
          const segmentGradient = ctx.createRadialGradient(
            centerX - 2, centerY - 2, 0,
            centerX, centerY, size / 2
          );
          segmentGradient.addColorStop(0, '#ffffff');
          segmentGradient.addColorStop(0.4, rainbowColor);
          segmentGradient.addColorStop(1, `hsla(${(index / snakeLength) * 360 + timestamp / 20}, 100%, 25%, 1)`);

          ctx.fillStyle = segmentGradient;
          const radius = 6;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size, radius);
          ctx.fill();

          // Add sparkle effect to some segments
          if (index % 3 === 0) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.sin(timestamp / 200 + index) * 0.3})`;
            ctx.beginPath();
            ctx.arc(centerX, centerY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw plasma energy orb food with dramatic effects
      const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
      const pulseScale = 1 + Math.sin(timestamp / 150) * 0.25;
      const foodRadius = (CELL_SIZE / 2 - 1) * pulseScale;

      // Animated plasma hue
      const plasmaHue = (timestamp / 10) % 360;

      // Outer plasma field rings - multiple layers
      for (let ring = 0; ring < 5; ring++) {
        const ringRadius = foodRadius + 8 + ring * 6 + Math.sin(timestamp / 200 + ring * 0.5) * 4;
        const ringHue = (plasmaHue + ring * 40) % 360;
        const ringAlpha = 0.4 - ring * 0.07;

        ctx.strokeStyle = `hsla(${ringHue}, 100%, 60%, ${ringAlpha})`;
        ctx.lineWidth = 2 - ring * 0.3;
        ctx.beginPath();
        const startAngle = timestamp / 300 + ring * Math.PI / 5;
        ctx.arc(foodX, foodY, ringRadius, startAngle, startAngle + Math.PI * 1.5);
        ctx.stroke();
      }

      // Energy tendrils reaching out
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const tendrilAngle = (timestamp / 400 + (Math.PI * 2 * i) / 6);
        const tendrilLength = 15 + Math.sin(timestamp / 150 + i * 2) * 8;
        const startX = foodX + Math.cos(tendrilAngle) * foodRadius;
        const startY = foodY + Math.sin(tendrilAngle) * foodRadius;
        const endX = foodX + Math.cos(tendrilAngle) * (foodRadius + tendrilLength);
        const endY = foodY + Math.sin(tendrilAngle) * (foodRadius + tendrilLength);

        const tendrilGradient = ctx.createLinearGradient(startX, startY, endX, endY);
        tendrilGradient.addColorStop(0, `hsla(${plasmaHue + i * 30}, 100%, 70%, 0.8)`);
        tendrilGradient.addColorStop(1, `hsla(${plasmaHue + i * 30}, 100%, 70%, 0)`);

        ctx.strokeStyle = tendrilGradient;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        // Add some waviness
        const midX = (startX + endX) / 2 + Math.sin(timestamp / 100 + i) * 4;
        const midY = (startY + endY) / 2 + Math.cos(timestamp / 100 + i) * 4;
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
      }

      // Outer plasma glow
      const glowRadius = foodRadius + 20 + Math.sin(timestamp / 100) * 5;
      const outerGlow = ctx.createRadialGradient(
        foodX, foodY, foodRadius * 0.5,
        foodX, foodY, glowRadius
      );
      outerGlow.addColorStop(0, `hsla(${plasmaHue}, 100%, 80%, 0.9)`);
      outerGlow.addColorStop(0.3, `hsla(${plasmaHue + 60}, 100%, 60%, 0.5)`);
      outerGlow.addColorStop(0.6, `hsla(${plasmaHue + 120}, 100%, 50%, 0.2)`);
      outerGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = outerGlow;
      ctx.beginPath();
      ctx.arc(foodX, foodY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Plasma core - animated color shifting
      const coreGradient = ctx.createRadialGradient(
        foodX - foodRadius * 0.2, foodY - foodRadius * 0.2, 0,
        foodX, foodY, foodRadius
      );
      coreGradient.addColorStop(0, COLORS.plasmaCore);
      coreGradient.addColorStop(0.3, `hsl(${plasmaHue}, 100%, 75%)`);
      coreGradient.addColorStop(0.6, `hsl(${plasmaHue + 60}, 100%, 55%)`);
      coreGradient.addColorStop(1, `hsl(${plasmaHue + 120}, 100%, 35%)`);

      ctx.shadowColor = `hsl(${plasmaHue}, 100%, 60%)`;
      ctx.shadowBlur = 30;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner energy swirl
      ctx.shadowBlur = 0;
      ctx.strokeStyle = `rgba(255, 255, 255, 0.6)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const swirlStart = timestamp / 200;
      ctx.arc(foodX, foodY, foodRadius * 0.5, swirlStart, swirlStart + Math.PI * 1.2);
      ctx.stroke();

      // Hot white core highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(foodX - foodRadius * 0.25, foodY - foodRadius * 0.25, foodRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Orbiting particles around food
      const orbitCount = 8;
      for (let i = 0; i < orbitCount; i++) {
        const orbitAngle = (timestamp / 300 + (Math.PI * 2 * i) / orbitCount);
        const orbitRadius = foodRadius + 12 + Math.sin(timestamp / 200 + i * 0.7) * 3;
        const particleX = foodX + Math.cos(orbitAngle) * orbitRadius;
        const particleY = foodY + Math.sin(orbitAngle) * orbitRadius;
        const particleHue = (plasmaHue + i * 45) % 360;
        const particleAlpha = 0.7 + Math.sin(timestamp / 80 + i) * 0.3;

        ctx.shadowColor = `hsl(${particleHue}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.fillStyle = `hsla(${particleHue}, 100%, 80%, ${particleAlpha})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Update and draw score popups with rainbow effect
      scorePopupsRef.current = scorePopupsRef.current.filter(popup => {
        popup.life -= 0.018;
        popup.y -= 2;

        if (popup.life <= 0) return false;

        const alpha = popup.life;
        const scale = 1 + (1 - popup.life) * 0.8;
        const popupHue = (timestamp / 5 + popup.x) % 360;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${18 * scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Rainbow glow effect for text
        ctx.shadowColor = `hsl(${popupHue}, 100%, 60%)`;
        ctx.shadowBlur = 15;
        ctx.fillStyle = `hsl(${popupHue}, 100%, 70%)`;
        ctx.fillText(`+${popup.value}`, popup.x, popup.y);

        // Add secondary text for glow
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = alpha * 0.7;
        ctx.fillText(`+${popup.value}`, popup.x, popup.y);

        ctx.restore();

        return true;
      });

      // Game over overlay with dramatic effects
      if (gameState.gameOver) {
        // Animated vignette with color
        const vignetteGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width / 1.2
        );
        const vignetteHue = (timestamp / 30) % 360;
        vignetteGradient.addColorStop(0, 'rgba(5, 5, 8, 0.6)');
        vignetteGradient.addColorStop(0.5, `hsla(${vignetteHue}, 50%, 10%, 0.8)`);
        vignetteGradient.addColorStop(1, 'rgba(5, 5, 8, 0.98)');
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scanline effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = 0; y < canvas.height; y += 4) {
          ctx.fillRect(0, y, canvas.width, 2);
        }

        // Glitchy game over text effect with animation
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = 'GAME OVER';
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;
        const gameOverHue = (timestamp / 10) % 360;

        // Animated glitch offset - more intense
        const glitchOffset = Math.sin(timestamp / 30) * 5 + Math.random() * (Math.sin(timestamp / 500) > 0.8 ? 8 : 0);

        // Multiple chromatic aberration layers
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = `hsl(${gameOverHue}, 100%, 60%)`;
        ctx.fillText(text, textX - 4 + glitchOffset, textY - 2);
        ctx.fillStyle = `hsl(${gameOverHue + 120}, 100%, 60%)`;
        ctx.fillText(text, textX + 4 - glitchOffset, textY + 2);
        ctx.fillStyle = `hsl(${gameOverHue + 240}, 100%, 60%)`;
        ctx.fillText(text, textX, textY - 3 + glitchOffset * 0.5);
        ctx.globalAlpha = 1;

        // Main text with pulsing rainbow glow
        const glowPulse = 20 + Math.sin(timestamp / 150) * 15;
        ctx.shadowColor = `hsl(${gameOverHue}, 100%, 60%)`;
        ctx.shadowBlur = glowPulse;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(text, textX, textY);

        // Subtitle with fade effect
        ctx.shadowColor = `hsl(${gameOverHue + 180}, 100%, 60%)`;
        ctx.shadowBlur = 8;
        ctx.font = 'bold 14px monospace';
        const subtitleAlpha = 0.6 + Math.sin(timestamp / 400) * 0.3;
        ctx.fillStyle = `rgba(255, 255, 255, ${subtitleAlpha})`;
        ctx.fillText('Press START to play again', textX, textY + 45);

        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Continue animation loop for effects
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gridSize, spawnTrailParticles, spawnEatParticles, spawnDeathParticles, spawnScorePopup]);

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
