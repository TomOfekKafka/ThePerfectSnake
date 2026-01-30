import { useSnakeGame } from './hooks/useSnakeGame';
import { GameBoard } from './components/GameBoard';
import './App.css';

function App() {
  const { gameState, gridSize } = useSnakeGame();

  return (
    <div className="app">
      <h1>The Perfect Snake</h1>

      <div className="game-info">
        <div className="score">Score: {gameState.score}</div>
        {!gameState.gameStarted && (
          <div className="message">Press SPACE to start</div>
        )}
        {gameState.gameOver && (
          <div className="message game-over">
            Game Over! Press SPACE to restart
          </div>
        )}
      </div>

      <GameBoard gameState={gameState} gridSize={gridSize} />

      <div className="instructions">
        <p>Use arrow keys to move</p>
        <p>Press SPACE to start/restart</p>
      </div>
    </div>
  );
}

export default App;
