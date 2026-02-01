import { useSnakeGame } from './hooks/useSnakeGame';
import { GameBoard } from './components/GameBoard';
import './App.css';
import { useEffect, useRef } from 'react';

function App() {
  const { gameState, resetGame, changeDirection, gridSize } = useSnakeGame();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Touch/swipe handling for mobile
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameState.gameStarted || gameState.gameOver) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;

      const deltaX = touchEndX - touchStartX.current;
      const deltaY = touchEndY - touchStartY.current;

      // Determine if swipe is more horizontal or vertical
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 30) {
          changeDirection('RIGHT');
        } else if (deltaX < -30) {
          changeDirection('LEFT');
        }
      } else {
        if (deltaY > 30) {
          changeDirection('DOWN');
        } else if (deltaY < -30) {
          changeDirection('UP');
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gameState.gameStarted, gameState.gameOver, changeDirection]);

  return (
    <div className="app">
      <div className="game-container">
        <h1>Snake Game</h1>

        <div className="score">Score: {gameState.score}</div>

        {!gameState.gameStarted && (
          <div className="message">
            <button className="start-button" onClick={resetGame}>
              Start Game
            </button>
          </div>
        )}

        {gameState.gameOver && (
          <div className="message game-over">
            <div>Game Over!</div>
            <button className="start-button" onClick={resetGame}>
              Play Again
            </button>
          </div>
        )}

        <GameBoard gameState={gameState} gridSize={gridSize} />

        {/* Mobile controls */}
        <div className="mobile-controls">
          <div className="control-row">
            <button
              className="control-btn"
              onClick={() => changeDirection('UP')}
              disabled={!gameState.gameStarted || gameState.gameOver}
            >
              ▲
            </button>
          </div>
          <div className="control-row">
            <button
              className="control-btn"
              onClick={() => changeDirection('LEFT')}
              disabled={!gameState.gameStarted || gameState.gameOver}
            >
              ◀
            </button>
            <button
              className="control-btn"
              onClick={() => changeDirection('DOWN')}
              disabled={!gameState.gameStarted || gameState.gameOver}
            >
              ▼
            </button>
            <button
              className="control-btn"
              onClick={() => changeDirection('RIGHT')}
              disabled={!gameState.gameStarted || gameState.gameOver}
            >
              ▶
            </button>
          </div>
        </div>

        <div className="instructions">
          <p>Desktop: Use arrow keys • Mobile: Swipe or use buttons</p>
        </div>
      </div>
    </div>
  );
}

export default App;
