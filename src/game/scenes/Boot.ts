import { Scene } from 'phaser';

export class Boot extends Scene {
    constructor() {
        super('Boot');
    }

    create() {
        // Initialize loading of assets if any. Since we are using generated graphics, we just start the game.
        // We will pause the game scene immediately and wait for the React state to become 'playing'
        this.scene.start('Game');
    }
}
