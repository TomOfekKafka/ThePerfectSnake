import { GameState } from '../types/types';
import './GameBoard.css';

interface GameBoardProps {
  gameState: GameState;
  gridSize: number;
}

export const GameBoard = ({ gameState, gridSize }: GameBoardProps) => {
  const getCellType = (x: number, y: number): string => {
    // Check if it's the snake head
    if (gameState.snake[0].x === x && gameState.snake[0].y === y) {
      return 'snake-head';
    }

    // Check if it's the snake body
    if (gameState.snake.slice(1).some(segment => segment.x === x && segment.y === y)) {
      return 'snake-body';
    }

    // Check if it's food
    if (gameState.food.x === x && gameState.food.y === y) {
      return 'food';
    }

    return 'empty';
  };

  return (
    <div
      className="game-board"
      style={{
        gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
        gridTemplateRows: `repeat(${gridSize}, 1fr)`,
      }}
    >
      {Array.from({ length: gridSize * gridSize }).map((_, index) => {
        const x = index % gridSize;
        const y = Math.floor(index / gridSize);
        const cellType = getCellType(x, y);

        return (
          <div
            key={`${x}-${y}`}
            className={`cell ${cellType}`}
          />
        );
      })}
    </div>
  );
};
