import { useGameStore, SNAKE_SKINS } from '../store/gameStore';
import { ArrowLeft, Coins, Check, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

export function Shop() {
  const { coins, ownedSkins, selectedSkin, buySkin, selectSkin, setGameState } = useGameStore();

  const handleSkinAction = (skin: typeof SNAKE_SKINS[0]) => {
    if (ownedSkins.includes(skin.id)) {
      selectSkin(skin.id);
    } else {
      buySkin(skin.id, skin.cost);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#121212] text-white flex flex-col z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 bg-[#1a1a1a] border-b border-[#333]">
        <button 
          onClick={() => setGameState('menu')}
          className="flex items-center gap-2 text-white hover:text-[#39FF14] transition-colors"
        >
          <ArrowLeft size={24} />
          <span className="text-xl font-bold uppercase tracking-wider">Back</span>
        </button>
        <div className="flex items-center gap-2 text-[#FFE300]">
          <Coins size={24} />
          <span className="text-2xl font-mono font-bold">{coins}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-4xl font-bold uppercase tracking-widest mb-8 text-center text-[#39FF14]">Skin Shop</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {SNAKE_SKINS.map((skin) => {
            const isOwned = ownedSkins.includes(skin.id);
            const isSelected = selectedSkin === skin.id;
            const canAfford = coins >= skin.cost;

            return (
              <div 
                key={skin.id}
                className={cn(
                  "flex flex-col bg-[#2A2A2A] border transition-all duration-200 transform hover:scale-[1.02]",
                  isSelected ? "border-[#39FF14] shadow-[0_0_15px_rgba(57,255,20,0.3)]" : "border-[#444]",
                  !isOwned && "opacity-80 hover:opacity-100"
                )}
              >
                {/* Visual Preview */}
                <div className="h-40 flex items-center justify-center bg-[#1a1a1a] border-b border-[#444] relative overflow-hidden">
                  <div className="flex items-center -space-x-7 flex-row-reverse">
                    {/* Head */}
                    <div 
                      className="w-10 h-10 rounded-[40%] z-20 relative border-2 border-black/80 shadow-[2px_0_4px_rgba(0,0,0,0.3)]" 
                      style={{ backgroundColor: `#${skin.headColor.toString(16).padStart(6, '0')}` }}
                    >
                      {/* Eyes */}
                      <div className="absolute top-2 left-1.5 w-3 h-3 bg-white rounded-full border border-black/80"><div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full" /></div>
                      <div className="absolute top-2 right-1.5 w-3 h-3 bg-white rounded-full border border-black/80"><div className="absolute top-1 right-1 w-1.5 h-1.5 bg-black rounded-full" /></div>
                      {/* Tongue */}
                      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-1 bg-red-600 z-[-1]" />
                    </div>
                    {/* Body segments */}
                    {[1, 2, 3].map(i => (
                      <div 
                        key={i} 
                        className="w-8 h-8 rounded-full border-2 border-black/80 relative"
                        style={{ 
                          backgroundColor: `#${skin.color.toString(16).padStart(6, '0')}`,
                          zIndex: 15 - i
                        }}
                      >
                        {/* Shiny scale highlight */}
                        <div className="absolute inset-1 rounded-full bg-white/15" />
                        <div className="absolute inset-0 rounded-full bg-black/10 shadow-inner" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold uppercase">{skin.name}</h3>
                    {!isOwned && (
                      <div className={cn("flex items-center gap-1 font-mono font-bold", canAfford ? "text-[#FFE300]" : "text-red-500")}>
                        <Coins size={16} />
                        {skin.cost}
                      </div>
                    )}
                  </div>

                  <div className="mt-auto">
                    <button
                      onClick={() => handleSkinAction(skin)}
                      disabled={!isOwned && !canAfford}
                      className={cn(
                        "w-full py-3 px-4 rounded-full font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform active:scale-95",
                        isSelected && "bg-[#39FF14] text-black",
                        isOwned && !isSelected && "bg-[#444] text-white hover:bg-[#555]",
                        !isOwned && canAfford && "bg-[#FFE300] text-black hover:bg-[#FFD700]",
                        !isOwned && !canAfford && "bg-[#333] text-[#777] cursor-not-allowed"
                      )}
                    >
                      {isSelected && <><Check size={18} /> Equipped</>}
                      {isOwned && !isSelected && "Equip"}
                      {!isOwned && canAfford && "Purchase"}
                      {!isOwned && !canAfford && <><Lock size={18} /> Too Expensive</>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
