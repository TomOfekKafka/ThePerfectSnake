import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useSnakeGame } from './hooks/useSnakeGame';
import { GameBoard } from './components/GameBoard';
import PayPalButton from './components/PayPalButton';
import { DeploymentInfo } from './components/DeploymentInfo';
import { ParticleBackground } from './components/ParticleBackground';
import './App.css';
import { useEffect, useRef } from 'react';

function App() {
  const { gameState, resetGame, changeDirection, gridSize } = useSnakeGame();
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);

  // Touch/swipe handling
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
        // Horizontal swipe
        if (deltaX > 30) {
          changeDirection('RIGHT');
        } else if (deltaX < -30) {
          changeDirection('LEFT');
        }
      } else {
        // Vertical swipe
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
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
        currency: 'USD',
        intent: 'capture'
      }}
    >
      <ParticleBackground />
      <div className="app">
        <div className="game-container">
          <h1 className="game-title pulse glow">The Perfect Snake 🐍</h1>

          <div className="game-info">
            <div className="score bounce glow">Score: {gameState.score}</div>
            {!gameState.gameStarted && (
              <div className="message glow">
                <button className="start-button glow" onClick={resetGame}>
                  Start Game
                </button>
              </div>
            )}
            {gameState.gameOver && (
              <div className="message game-over glow">
                <div>Game Over!</div>
                <button className="start-button glow" onClick={resetGame}>
                  Play Again
                </button>
              </div>
            )}
          </div>

          <GameBoard gameState={gameState} gridSize={gridSize} />

          {/* Mobile controls */}
          <div className="mobile-controls">
            <div className="control-row">
              <button
                className="control-btn glow pulse"
                onClick={() => changeDirection('UP')}
                disabled={!gameState.gameStarted || gameState.gameOver}
              >
                ▲
              </button>
            </div>
            <div className="control-row">
              <button
                className="control-btn glow pulse"
                onClick={() => changeDirection('LEFT')}
                disabled={!gameState.gameStarted || gameState.gameOver}
              >
                ◀
              </button>
              <button
                className="control-btn glow pulse"
                onClick={() => changeDirection('DOWN')}
                disabled={!gameState.gameStarted || gameState.gameOver}
              >
                ▼
              </button>
              <button
                className="control-btn glow pulse"
                onClick={() => changeDirection('RIGHT')}
                disabled={!gameState.gameStarted || gameState.gameOver}
              >
                ▶
              </button>
            </div>
          </div>

          <div className="instructions">
            <p className="desktop-only">Use arrow keys or on-screen buttons to move</p>
            <p className="mobile-only">Swipe or use buttons to move</p>
            <p className="desktop-only">Press SPACE or click Start button</p>
          </div>

          <DeploymentInfo />
        </div>

        <aside className="payment-sidebar">
          <PayPalButton />
        </aside>
      </div>
    </PayPalScriptProvider>
  );
}

export default App;
