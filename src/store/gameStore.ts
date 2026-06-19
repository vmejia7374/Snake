import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const SNAKE_SKINS = [
  { id: 'default', name: 'Classic Green', color: 0x4CAF50, headColor: 0x388E3C, cost: 0 },
  { id: 'fire', name: 'Fire Snake', color: 0xFF5722, headColor: 0xD84315, cost: 100 },
  { id: 'ocean', name: 'Ocean Blue', color: 0x2196F3, headColor: 0x1565C0, cost: 150 },
  { id: 'royal', name: 'Royal Purple', color: 0x9C27B0, headColor: 0x6A1B9A, cost: 200 },
  { id: 'golden', name: 'Golden Snake', color: 0xFFD700, headColor: 0xFFA000, cost: 300 },
  { id: 'neon', name: 'Neon Pink', color: 0xFF4081, headColor: 0xC51162, cost: 250 },
];

type GameState = 'menu' | 'playing' | 'gameover' | 'shop';

interface GameStore {
  gameState: GameState;
  coins: number;
  ownedSkins: string[];
  selectedSkin: string;
  score: number;
  setGameState: (state: GameState) => void;
  addCoins: (amount: number) => void;
  buySkin: (skinId: string, cost: number) => boolean;
  selectSkin: (skinId: string) => void;
  setScore: (score: number) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: 'menu',
      coins: 0,
      ownedSkins: ['default'],
      selectedSkin: 'default',
      score: 0,
      setGameState: (gameState) => set({ gameState }),
      addCoins: (amount) => set((state) => ({ coins: state.coins + amount })),
      buySkin: (skinId, cost) => {
        const state = get();
        if (state.coins >= cost && !state.ownedSkins.includes(skinId)) {
          set({ 
            coins: state.coins - cost,
            ownedSkins: [...state.ownedSkins, skinId]
          });
          return true;
        }
        return false;
      },
      selectSkin: (skinId) => {
        const state = get();
        if (state.ownedSkins.includes(skinId)) {
          set({ selectedSkin: skinId });
        }
      },
      setScore: (score) => set({ score }),
    }),
    {
      name: 'snake-game-storage',
      partialize: (state) => ({ 
        coins: state.coins, 
        ownedSkins: state.ownedSkins, 
        selectedSkin: state.selectedSkin 
      }),
    }
  )
);
