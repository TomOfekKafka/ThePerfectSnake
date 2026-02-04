import { useSnakeGame } from './game';
import { GameBoard } from './components/GameBoard';
import './App.css';

function App() {
  const { gameState, resetGame, changeDirection, gridSize, isEmbedded } = useSnakeGame();

  // When embedded, render only the game board (platform handles UI)
  if (isEmbedded) {
    return (
      <div className="app">
        <div className="game-container">
          <GameBoard gameState={gameState} gridSize={gridSize} gameOver={gameState.gameOver} />
        </div>
      </div>
    );
  }

  // Standalone mode: full UI
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

        <GameBoard gameState={gameState} gridSize={gridSize} gameOver={gameState.gameOver} />

        <MobileControls
          onDirection={changeDirection}
          disabled={!gameState.gameStarted || gameState.gameOver}
        />

        <div className="instructions">
          <p>Desktop: Use arrow keys • Mobile: Swipe or use buttons</p>
        </div>
      </div>
    </div>
  );
}

interface MobileControlsProps {
  onDirection: (dir: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => void;
  disabled: boolean;
}

function MobileControls({ onDirection, disabled }: MobileControlsProps) {
  return (
    <div className="mobile-controls">
      <div className="control-row">
        <button
          className="control-btn"
          onClick={() => onDirection('UP')}
          disabled={disabled}
        >
          ▲
        </button>
      </div>
      <div className="control-row">
        <button
          className="control-btn"
          onClick={() => onDirection('LEFT')}
          disabled={disabled}
        >
          ◀
        </button>
        <button
          className="control-btn"
          onClick={() => onDirection('DOWN')}
          disabled={disabled}
        >
          ▼
        </button>
        <button
          className="control-btn"
          onClick={() => onDirection('RIGHT')}
          disabled={disabled}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default App;
