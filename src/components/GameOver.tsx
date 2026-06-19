import { useGameStore } from '../store/gameStore';
import { RotateCcw, Home as HomeIcon } from 'lucide-react';

export function GameOver() {
  const { setGameState, score, coins } = useGameStore();

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-[#121212] border-2 border-red-500 p-10 max-w-md w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] flex flex-col items-center">
        
        <h2 className="text-5xl font-bold uppercase tracking-widest text-red-500 mb-8 text-center drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">
          GAME OVER
        </h2>
        
        <div className="w-full bg-[#1a1a1a] p-6 mb-8 border border-[#333]">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-400 uppercase tracking-wider font-bold">Score</span>
            <span className="text-3xl font-mono text-white">{score}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400 uppercase tracking-wider font-bold">Total Coins</span>
            <span className="text-3xl font-mono text-[#FFE300]">{coins}</span>
          </div>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-4 bg-[#39FF14] text-black font-bold uppercase tracking-widest text-xl rounded-full flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]"
          >
            <RotateCcw size={24} />
            Play Again
          </button>
          
          <button
            onClick={() => setGameState('menu')}
            className="w-full py-4 bg-transparent border-2 border-[#555] text-white font-bold uppercase tracking-widest text-xl rounded-full flex items-center justify-center gap-3 transition-colors hover:border-white active:scale-95"
          >
            <HomeIcon size={24} />
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
