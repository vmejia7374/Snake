import { useGameStore } from '../store/gameStore';
import { Play, ShoppingCart } from 'lucide-react';

export function Home() {
  const { setGameState, coins } = useGameStore();

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
      <div className="bg-[#121212] border-2 border-[#39FF14] p-10 max-w-md w-full shadow-[0_0_50px_rgba(57,255,20,0.2)] flex flex-col items-center">
        
        <h1 className="text-6xl font-bold uppercase tracking-widest text-[#39FF14] mb-2 text-center drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]">
          SNAKE
        </h1>
        <div className="text-[#FFE300] font-mono text-xl mb-12 flex items-center gap-2">
          Coins: <span className="font-bold">{coins}</span>
        </div>

        <div className="w-full flex flex-col gap-4">
          <button
            onClick={() => setGameState('playing')}
            className="w-full py-4 bg-[#39FF14] text-black font-bold uppercase tracking-widest text-xl rounded-full flex items-center justify-center gap-3 transition-transform hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_rgba(57,255,20,0.5)]"
          >
            <Play size={24} fill="currentColor" />
            Get Started
          </button>
          
          <button
            onClick={() => setGameState('shop')}
            className="w-full py-4 bg-transparent border-2 border-[#555] text-white font-bold uppercase tracking-widest text-xl rounded-full flex items-center justify-center gap-3 transition-colors hover:border-[#FFE300] hover:text-[#FFE300] active:scale-95"
          >
            <ShoppingCart size={24} />
            Shop
          </button>
        </div>
      </div>
    </div>
  );
}
