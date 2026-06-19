import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { useGameStore, SNAKE_SKINS } from '../../store/gameStore';

const WORLD_SIZE = 1000000;
const INITIAL_SPEED = 250;
const SNAKE_RADIUS = 16;
const AI_SNAKE_COUNT = 60;

class SnakeSegment {
    public sprite: Phaser.GameObjects.Graphics;
    
    constructor(scene: Scene, x: number, y: number, color: number, radius: number, isHead: boolean = false) {
        this.sprite = scene.add.graphics();
        this.sprite.fillStyle(color);
        this.sprite.fillCircle(0, 0, radius);
        if (isHead) {
            // Draw eyes
            this.sprite.fillStyle(0xFFFFFF);
            this.sprite.fillCircle(radius * 0.4, -radius * 0.4, radius * 0.25);
            this.sprite.fillCircle(radius * 0.4, radius * 0.4, radius * 0.25);
            this.sprite.fillStyle(0x000000);
            this.sprite.fillCircle(radius * 0.5, -radius * 0.4, radius * 0.1);
            this.sprite.fillCircle(radius * 0.5, radius * 0.4, radius * 0.1);
        }
        this.sprite.setPosition(x, y);
        this.sprite.setDepth(10);
    }

    destroy() {
        this.sprite.destroy();
    }
}

class Snake {
    public scene: Scene;
    public segments: SnakeSegment[] = [];
    public history: {x: number, y: number}[] = [];
    public x: number;
    public y: number;
    public angle: number = 0;
    public targetAngle: number = 0;
    public speed: number = INITIAL_SPEED;
    public color: number;
    public headColor: number;
    public radius: number = SNAKE_RADIUS;
    public isPlayer: boolean;
    public id: string;
    public isDead: boolean = false;
    public score: number = 0;

    constructor(scene: Scene, x: number, y: number, length: number, color: number, headColor: number, isPlayer: boolean) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.color = color;
        this.headColor = headColor;
        this.isPlayer = isPlayer;
        this.id = Math.random().toString(36).substring(2, 9);
        this.score = length * 10;

        for (let i = 0; i < length; i++) {
            this.addSegment(x - i * this.radius, y);
        }
        
        // initialize history
        for (let i = 0; i < length * 10; i++) {
            this.history.push({x, y});
        }
    }

    addSegment(x?: number, y?: number) {
        const posX = x !== undefined ? x : this.segments[this.segments.length - 1].sprite.x;
        const posY = y !== undefined ? y : this.segments[this.segments.length - 1].sprite.y;
        
        const isHead = this.segments.length === 0;
        const col = isHead ? this.headColor : this.color;
        
        const segment = new SnakeSegment(this.scene, posX, posY, col, this.radius, isHead);
        
        if (isHead) {
            this.segments.unshift(segment);
        } else {
            this.segments.push(segment);
            segment.sprite.setDepth(9 - this.segments.length * 0.01);
        }
    }

    grow(amount: number) {
        for (let i = 0; i < amount; i++) {
            this.addSegment();
        }
        this.score += amount * 10;
        this.radius = Math.min(SNAKE_RADIUS * 2, SNAKE_RADIUS + this.score * 0.005);
        this.segments.forEach((seg, index) => {
            seg.sprite.clear();
            const col = index === 0 ? this.headColor : this.color;
            seg.sprite.fillStyle(col);
            const r = index === 0 ? this.radius : this.radius * 0.95;
            seg.sprite.fillCircle(0, 0, r);
            if (index === 0) {
                seg.sprite.fillStyle(0xFFFFFF);
                seg.sprite.fillCircle(r * 0.4, -r * 0.4, r * 0.25);
                seg.sprite.fillCircle(r * 0.4, r * 0.4, r * 0.25);
                seg.sprite.fillStyle(0x000000);
                seg.sprite.fillCircle(r * 0.5, -r * 0.4, r * 0.1);
                seg.sprite.fillCircle(r * 0.5, r * 0.4, r * 0.1);
            }
        });
    }

    update(delta: number) {
        if (this.isDead) return;

        // Smooth rotation
        let diff = this.targetAngle - this.angle;
        // Normalize diff to -PI to PI
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        
        const rotationSpeed = 0.005 * delta;
        if (Math.abs(diff) < rotationSpeed) {
            this.angle = this.targetAngle;
        } else {
            this.angle += Math.sign(diff) * rotationSpeed;
        }

        // Move head
        const speedPerFrame = (this.speed * delta) / 1000;
        this.x += Math.cos(this.angle) * speedPerFrame;
        this.y += Math.sin(this.angle) * speedPerFrame;

        // World bounds check
        if (this.x < 0) this.x = 0;
        if (this.x > WORLD_SIZE) this.x = WORLD_SIZE;
        if (this.y < 0) this.y = 0;
        if (this.y > WORLD_SIZE) this.y = WORLD_SIZE;

        // Save history
        this.history.unshift({x: this.x, y: this.y});
        
        // Ensure history isn't too long
        const maxHistory = this.segments.length * 15;
        if (this.history.length > maxHistory) {
            this.history.length = maxHistory;
        }

        // Update segment positions
        const spacing = 10; // frames of history between segments
        for (let i = 0; i < this.segments.length; i++) {
            const historyIndex = Math.min(i * spacing, this.history.length - 1);
            const pos = this.history[historyIndex];
            if (pos) {
                this.segments[i].sprite.setPosition(pos.x, pos.y);
                if (i === 0) {
                    this.segments[i].sprite.setRotation(this.angle);
                }
            }
        }
    }

    destroy() {
        this.isDead = true;
        this.segments.forEach(seg => seg.destroy());
    }
}

export class Game extends Scene {
    private player!: Snake | null;
    private aiSnakes: Snake[] = [];
    private coins: Phaser.GameObjects.Graphics[] = [];
    private coinsCollected: number = 0;
    
    private gameState: string = 'menu';
    private bgTile!: Phaser.GameObjects.TileSprite;
    private targetZoom: number = 1;

    private scoreText!: Phaser.GameObjects.Text;
    private coinsText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    create() {
        // Create world bounds large enough
        this.physics.world.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.setBounds(0, 0, WORLD_SIZE, WORLD_SIZE);
        this.cameras.main.setBackgroundColor('#121212');

        // Create grid texture
        const g = this.add.graphics();
        g.lineStyle(1, 0x2A2A2A, 1);
        g.strokeRect(0, 0, 100, 100);
        g.generateTexture('grid', 100, 100);
        g.destroy();

        // Infinite repeating background
        this.bgTile = this.add.tileSprite(0, 0, this.scale.width * 4, this.scale.height * 4, 'grid');
        this.bgTile.setDepth(0).setScrollFactor(0);

        // UI texts (fixed to camera)
        this.scoreText = this.add.text(24, 24, 'SCORE: 0', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#FFFFFF',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(100).setVisible(false);

        this.coinsText = this.add.text(24, 60, 'COINS: 0', {
            fontFamily: 'monospace',
            fontSize: '24px',
            color: '#FFE300',
            fontStyle: 'bold'
        }).setScrollFactor(0).setDepth(100).setVisible(false);

        EventBus.on('react-state-changed', (data: { gameState: string }) => {
            this.gameState = data.gameState;
            if (this.gameState === 'playing' && !this.player) {
                this.startGame();
            } else if (this.gameState === 'gameover') {
                this.clearGame();
            } else if (this.gameState === 'menu' || this.gameState === 'shop') {
                this.clearGame();
            }
        });

        // Add some random initial coins
        for (let i = 0; i < 200; i++) {
            this.spawnCoin(Phaser.Math.Between(0, WORLD_SIZE), Phaser.Math.Between(0, WORLD_SIZE), 1);
        }
    }

    startGame() {
        this.clearGame();
        
        // Get selected skin
        const storeState = useGameStore.getState();
        const skinId = storeState.selectedSkin;
        const skin = SNAKE_SKINS.find(s => s.id === skinId) || SNAKE_SKINS[0];

        this.coinsCollected = 0;

        // Create player
        this.player = new Snake(
            this, 
            WORLD_SIZE / 2, WORLD_SIZE / 2, 
            10, 
            skin.color, skin.headColor, 
            true
        );
        
        this.cameras.main.startFollow(this.player.segments[0].sprite, true, 0.1, 0.1);

        // Spawn AI Snakes
        for (let i = 0; i < AI_SNAKE_COUNT; i++) {
            this.spawnAISnake();
        }

        // Input
        this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
            if (!this.player || this.player.isDead) return;
            const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
            this.player.targetAngle = Phaser.Math.Angle.Between(
                this.player.x, this.player.y,
                worldPoint.x, worldPoint.y
            );
        });

        // Zoom with wheel
        this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number, deltaZ: number) => {
            if (!this.player || this.player.isDead) return;
            // Zoom out on scroll down (positive deltaY), zoom in on scroll up
            if (deltaY > 0) {
                this.targetZoom *= 0.9;
            } else if (deltaY < 0) {
                this.targetZoom *= 1.1;
            }
            this.targetZoom = Phaser.Math.Clamp(this.targetZoom, 0.2, 2.0);
        });

        this.scoreText.setVisible(true).setText('SCORE: ' + this.player.score);
        this.coinsText.setVisible(true).setText('COINS: 0');
    }

    getSpawnCenter() {
        if (this.player && !this.player.isDead) {
            return { x: this.player.x, y: this.player.y };
        }
        return { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2 };
    }

    spawnAISnake() {
        const center = this.getSpawnCenter();
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        // Spawn distance: not too close, not too far
        const dist = Phaser.Math.Between(1000, 3000);
        const spawnX = Phaser.Math.Clamp(center.x + Math.cos(angle) * dist, 0, WORLD_SIZE);
        const spawnY = Phaser.Math.Clamp(center.y + Math.sin(angle) * dist, 0, WORLD_SIZE);

        const randomSkin = SNAKE_SKINS[Phaser.Math.Between(0, SNAKE_SKINS.length - 1)];
        const ai = new Snake(
            this, spawnX, spawnY,
            Phaser.Math.Between(5, 25),
            randomSkin.color,
            randomSkin.headColor,
            false
        );
        this.aiSnakes.push(ai);
    }

    spawnCoin(x: number, y: number, value: number) {
        const coin = this.add.graphics();
        coin.fillStyle(0xFFD700);
        coin.beginPath();
        coin.moveTo(0, -8);
        coin.lineTo(8, 0);
        coin.lineTo(0, 8);
        coin.lineTo(-8, 0);
        coin.closePath();
        coin.fillPath();
        coin.fillStyle(0xFFC200);
        coin.beginPath();
        coin.moveTo(0, -5);
        coin.lineTo(5, 0);
        coin.lineTo(0, 5);
        coin.lineTo(-5, 0);
        coin.closePath();
        coin.fillPath();
        
        coin.setPosition(x, y);
        coin.setDepth(5);
        // Add arbitrary value to object to track coin worth
        (coin as any).coinValue = value;
        
        // Spawn animation
        coin.setScale(0);
        this.tweens.add({
            targets: coin,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });

        this.coins.push(coin);
    }

    clearGame() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
        this.aiSnakes.forEach(ai => ai.destroy());
        this.aiSnakes = [];
        this.coins.forEach(c => c.destroy());
        this.coins = [];
        this.scoreText.setVisible(false);
        this.coinsText.setVisible(false);
    }

    update(time: number, delta: number) {
        if (this.gameState !== 'playing') return;

        // Smooth zoom
        const curZoom = this.cameras.main.zoom;
        this.cameras.main.setZoom(curZoom + (this.targetZoom - curZoom) * 0.1);

        // Infinite background moving logic
        this.bgTile.tilePositionX = this.cameras.main.scrollX;
        this.bgTile.tilePositionY = this.cameras.main.scrollY;

        // Update player
        if (this.player && !this.player.isDead) {
            this.player.update(delta);
            this.scoreText.setText('SCORE: ' + this.player.score);
            this.coinsText.setText('COINS: ' + this.coinsCollected);
        }

        const center = this.getSpawnCenter();
        const maxDist = 5000;

        // Update AI
        for (let i = this.aiSnakes.length - 1; i >= 0; i--) {
            const ai = this.aiSnakes[i];
            
            // Cull distant snakes
            const distToPlayer = Phaser.Math.Distance.Between(ai.x, ai.y, center.x, center.y);
            if (distToPlayer > maxDist) {
                ai.destroy();
            }

            if (ai.isDead) {
                this.aiSnakes.splice(i, 1);
                this.spawnAISnake(); // respawn
                continue;
            }

            // Simple AI Logic: Move randomly, occasionally change direction
            if (Phaser.Math.Between(0, 100) < 2) {
                ai.targetAngle += Phaser.Math.FloatBetween(-1, 1);
            }

            ai.update(delta);
        }

        this.checkCollisions();
    }

    checkCollisions() {
        const allSnakes = this.player && !this.player.isDead ? [this.player, ...this.aiSnakes] : this.aiSnakes;

        // Check snake eating snake
        for (let i = 0; i < allSnakes.length; i++) {
            for (let j = 0; j < allSnakes.length; j++) {
                if (i === j) continue;
                
                const snakeA = allSnakes[i];
                const snakeB = allSnakes[j];
                
                if (snakeA.isDead || snakeB.isDead) continue;

                // Distance between head A and any body part of B
                const dist = Phaser.Math.Distance.Between(snakeA.x, snakeA.y, snakeB.x, snakeB.y);
                
                // Simplified collision: head to head check
                // Actually in requirements: if your head overlaps a weaker snake, you eat it.
                if (dist < snakeA.radius + snakeB.radius) {
                    if (snakeA.score > snakeB.score) {
                        this.eatSnake(snakeA, snakeB);
                    } else if (snakeB.score > snakeA.score) {
                        this.eatSnake(snakeB, snakeA);
                    } else {
                        // Same size, bounce
                        snakeA.targetAngle += Math.PI;
                        snakeB.targetAngle += Math.PI;
                    }
                }
            }
        }

        // Check coin collection for all snakes
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            let collected = false;

            for (const snake of allSnakes) {
                if (snake.isDead) continue;
                
                const dist = Phaser.Math.Distance.Between(snake.x, snake.y, coin.x, coin.y);
                if (dist < snake.radius + 8) {
                    // Collect
                    const val = (coin as any).coinValue || 1;
                    snake.grow(val);
                    if (snake.isPlayer) {
                        this.coinsCollected += val;
                    }
                    coin.destroy();
                    this.coins.splice(i, 1);
                    collected = true;
                    break;
                }
            }

            if (!collected && this.coins.length < 200 && Phaser.Math.Between(0, 100) < 1) {
                // Occasional random coin spawn elsewhere
            }

            // Cull distant coins
            const center = this.getSpawnCenter();
            if (Phaser.Math.Distance.Between(coin.x, coin.y, center.x, center.y) > 5000) {
                coin.destroy();
                this.coins.splice(i, 1);
            }
        }
        
        // Maintain coin count near player
        if (this.coins.length < 150) {
            const center = this.getSpawnCenter();
            const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
            const dist = Phaser.Math.Between(200, 2000);
            this.spawnCoin(center.x + Math.cos(angle) * dist, center.y + Math.sin(angle) * dist, 1);
        }
    }

    eatSnake(eater: Snake, eaten: Snake) {
        // Spawn coins along eaten snake
        eaten.segments.forEach((seg, index) => {
            if (index % 2 === 0) { // spawn coin every other segment to not overload
                this.spawnCoin(seg.sprite.x, seg.sprite.y, 2);
            }
        });
        
        eaten.destroy();
        eater.grow(2); // Eater gets a small immediate boost too

        if (eaten.isPlayer) {
            this.handleGameOver();
        }
    }

    handleGameOver() {
        this.gameState = 'gameover';
        const finalScore = this.player ? this.player.score : 0;
        EventBus.emit('game-over', { score: finalScore, coinsCollected: this.coinsCollected });
    }
}