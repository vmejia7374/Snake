import React, { useEffect, useRef } from 'react';
import { useGameStore } from './store/gameStore';
import { Home } from './components/Home';
import { ModeSelection } from './components/ModeSelection';
import { Shop } from './components/Shop';
import { GameOver } from './components/GameOver';
import { EventBus } from './game/EventBus';
import Phaser from 'phaser';
import { startGame } from './game/main';

const App: React.FC = () => {
  const { gameState, setGameState, addCoins, setScore } = useGameStore();
  const gameRef = useRef<Phaser.Game | null>(null);
  const initialized = useRef(false);

  // Setup Phaser Game
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    gameRef.current = startGame('game-container');

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
      initialized.current = false;
    };
  }, []);

  // Sync game state to Phaser
  useEffect(() => {
    EventBus.emit('react-state-changed', { gameState });
  }, [gameState]);

  // Listen to Phaser events
  useEffect(() => {
    const handleGameOver = (data: { score: number, coinsCollected: number }) => {
      setScore(data.score);
      addCoins(data.coinsCollected);
      setGameState('gameover');
    };

    EventBus.on('game-over', handleGameOver);

    return () => {
      EventBus.off('game-over', handleGameOver);
    };
  }, [addCoins, setGameState, setScore]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#121212] select-none text-white">
      {/* Phaser Canvas Container */}
      <div id="game-container" className="absolute inset-0 w-full h-full" />

      {/* React UI Overlays */}
      {gameState === 'menu' && <Home />}
      {gameState === 'mode_selection' && <ModeSelection />}
      {gameState === 'shop' && <Shop />}
      {gameState === 'gameover' && <GameOver />}
    </div>
  );
};

export default App;
