import { useEffect, useRef } from 'react';
import type { Position } from '../game/types';
import { CELL_SIZE } from '../game/constants';
import './GameBoard.css';

interface GameBoardState {
  snake: Position[];
  food: Position;
}

interface GameBoardProps {
  gameState: GameBoardState;
  gridSize: number;
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    render(ctx, gameState, canvas.width, canvas.height);
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

function render(
  ctx: CanvasRenderingContext2D,
  state: GameBoardState,
  width: number,
  height: number
) {
  // Clear canvas
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Draw snake
  ctx.fillStyle = '#000000';
  for (const segment of state.snake) {
    ctx.fillRect(
      segment.x * CELL_SIZE,
      segment.y * CELL_SIZE,
      CELL_SIZE - 1,
      CELL_SIZE - 1
    );
  }

  // Draw food
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(
    state.food.x * CELL_SIZE,
    state.food.y * CELL_SIZE,
    CELL_SIZE - 1,
    CELL_SIZE - 1
  );
}
