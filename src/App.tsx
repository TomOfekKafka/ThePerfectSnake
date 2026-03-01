import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { useSnakeGame } from './hooks/useSnakeGame';
import { GameBoard } from './components/GameBoard';
import PayPalButton from './components/PayPalButton';
import './App.css';

function App() {
  const { gameState, gridSize } = useSnakeGame();

  return (
    <PayPalScriptProvider
      options={{
        clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || '',
        currency: 'USD',
        intent: 'capture'
      }}
    >
      <div className="app">
        <div className="game-container">
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

        <aside className="payment-sidebar">
          <PayPalButton />
        </aside>
      </div>
    </PayPalScriptProvider>
  );
}

export default App;
