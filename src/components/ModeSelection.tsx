import { useGameStore } from '../store/gameStore';
import { Play, Users, ArrowLeft } from 'lucide-react';

export function ModeSelection() {
  const { setGameState } = useGameStore();

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
      <button 
        onClick={() => setGameState('menu')}
        className="absolute top-8 left-8 text-white/70 hover:text-white flex items-center gap-2 transition-colors"
      >
        <ArrowLeft size={24} />
        Back to Menu
      </button>

      <h1 className="text-5xl font-bold uppercase tracking-widest text-[#39FF14] mb-12 text-center drop-shadow-[0_0_10px_rgba(57,255,20,0.8)]">
        SELECT MODE
      </h1>

      <div className="flex flex-col md:flex-row gap-8 max-w-4xl w-full">
        {/* Single Player */}
        <div 
          onClick={() => setGameState('playing')}
          className="flex-1 bg-[#1A1A1A] border-2 border-[#39FF14] rounded-2xl p-8 cursor-pointer group hover:bg-[#252525] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(57,255,20,0.3)] flex flex-col items-center text-center"
        >
          <div className="w-32 h-32 mb-6 bg-[#222] rounded-full border-4 border-[#39FF14] flex items-center justify-center relative overflow-hidden">
            {/* Simple one snake illustration using CSS */}
            <div className="w-16 h-4 bg-[#39FF14] rounded-full absolute" />
            <div className="w-6 h-6 bg-[#FFE300] rounded-full absolute right-[1.5rem]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 flex items-center gap-3">
            <Play size={28} className="text-[#39FF14]" />
            SINGLE MODE
          </h2>
          <p className="text-gray-400">
            Play against intelligent AI snakes. Grow your snake, collect coins, and dominate the arena!
          </p>
        </div>

        {/* Multiplayer */}
        <div 
          onClick={() => alert("Multiplayer Mode is coming soon!")}
          className="flex-1 bg-[#1A1A1A] border-2 border-[#555] rounded-2xl p-8 cursor-pointer group hover:border-[#FFE300] hover:bg-[#252525] transition-all hover:scale-105 flex flex-col items-center text-center relative overflow-hidden"
        >
          <div className="absolute top-4 right-4 bg-[#FFE300] text-black text-xs font-bold px-3 py-1 rounded-full uppercase">
            Coming Soon
          </div>
          
          <div className="w-32 h-32 mb-6 bg-[#222] rounded-full border-4 border-[#555] group-hover:border-[#FFE300] flex items-center justify-center relative overflow-hidden transition-colors">
            {/* Several snakes fighting illustration */}
            <div className="w-12 h-4 bg-[#39FF14] rounded-full absolute top-1/3 left-1/4 -rotate-45" />
            <div className="w-12 h-4 bg-[#FF4081] rounded-full absolute top-1/2 right-1/4 rotate-45" />
            <div className="w-12 h-4 bg-[#2196F3] rounded-full absolute bottom-1/4 left-1/3 rotate-12" />
          </div>
          <h2 className="text-3xl font-bold text-gray-300 group-hover:text-white mb-4 flex items-center gap-3 transition-colors">
            <Users size={28} className="text-[#555] group-hover:text-[#FFE300] transition-colors" />
            MULTIPLAYER
          </h2>
          <p className="text-gray-500 group-hover:text-gray-400 transition-colors">
            Battle against real players worldwide in the ultimate snake showdown.
          </p>
        </div>
      </div>
    </div>
  );
}
