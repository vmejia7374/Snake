import { Boot } from './scenes/Boot';
import { Game } from './scenes/Game';
import Phaser from 'phaser';

export const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: window.innerWidth,
    height: window.innerHeight,
    scene: [Boot, Game],
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0, x: 0 } // Top-down game, no gravity
        }
    },
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    backgroundColor: '#121212'
};

export function startGame(parent: string) {
    return new Phaser.Game({ ...config, parent });
}