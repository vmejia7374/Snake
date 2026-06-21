import { Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { useGameStore, SNAKE_SKINS } from '../../store/gameStore';

const WORLD_SIZE = 1000000;
const INITIAL_SPEED = 400;
const SNAKE_RADIUS = 16;
const AI_SNAKE_COUNT = 60;

class SnakeSegment {
    public sprite: Phaser.GameObjects.Image;
    
    constructor(scene: Scene, x: number, y: number, color: number, headColor: number, radius: number, isHead: boolean = false) {
        const textureKey = isHead ? `head_${headColor}` : `body_${color}`;
        this.sprite = scene.add.image(x, y, textureKey);
        this.sprite.setDepth(isHead ? 11 : 10); // Head above body
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
        
        const segment = new SnakeSegment(this.scene, posX, posY, this.color, this.headColor, this.radius, isHead);
        
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
        const scale = this.radius / SNAKE_RADIUS;
        this.segments.forEach((seg, index) => {
            seg.sprite.setScale(index === 0 ? scale : scale * 0.95);
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

        // Save history smoothly based on distance, not frames, for consistent spacing
        let lastPos = this.history[0] || { x: this.x, y: this.y };
        let distToLast = Phaser.Math.Distance.Between(this.x, this.y, lastPos.x, lastPos.y);
        
        // Interpolate to ensure history points are EXACTLY 2 pixels apart
        while (distToLast >= 2) {
            const fraction = 2 / distToLast;
            const interpX = Phaser.Math.Linear(lastPos.x, this.x, fraction);
            const interpY = Phaser.Math.Linear(lastPos.y, this.y, fraction);
            
            this.history.unshift({ x: interpX, y: interpY });
            
            lastPos = this.history[0];
            distToLast = Phaser.Math.Distance.Between(this.x, this.y, lastPos.x, lastPos.y);
        }
        if (this.history.length === 0) {
            this.history.unshift({x: this.x, y: this.y});
        }
        
        // Ensure history isn't too long
        const spacing = 2; // 2 pixels * 2 = 4 pixels between segments
        const maxHistory = this.segments.length * spacing + 10;
        if (this.history.length > maxHistory) {
            this.history.length = maxHistory;
        }

        // Update segment positions
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
    private coins: Phaser.GameObjects.Image[] = [];
    private coinsCollected: number = 0;
    
    private gameState: string = 'menu';
    private bgTile!: Phaser.GameObjects.TileSprite;
    private targetZoom: number = 1;

    private scoreText!: Phaser.GameObjects.Text;
    private coinsText!: Phaser.GameObjects.Text;

    constructor() {
        super('Game');
    }

    generateTextures() {
        if (this.textures.exists('coin')) return;

        const radius = SNAKE_RADIUS;
        
        SNAKE_SKINS.forEach(skin => {
            if (!this.textures.exists(`body_${skin.color}`)) {
                const gBody = this.add.graphics();
                gBody.lineStyle(3, 0x000000, 0.6);
                gBody.fillStyle(skin.color);
                gBody.fillCircle(radius + 4, radius + 4, radius);
                gBody.strokeCircle(radius + 4, radius + 4, radius);
                gBody.fillStyle(0xFFFFFF, 0.15);
                gBody.fillCircle(radius + 4, radius + 4, radius * 0.6);
                gBody.fillStyle(0x000000, 0.1);
                gBody.beginPath();
                gBody.arc(radius + 4, radius + 4, radius, 0, Math.PI, false);
                gBody.fillPath();
                gBody.generateTexture(`body_${skin.color}`, radius * 2 + 8, radius * 2 + 8);
                gBody.destroy();
            }

            if (!this.textures.exists(`head_${skin.headColor}`)) {
                const gHead = this.add.graphics();
                const cx = radius * 2;
                const cy = radius * 2;
                
                gHead.lineStyle(3, 0x000000, 0.6);
                gHead.fillStyle(skin.headColor);
                gHead.fillEllipse(cx + radius * 0.2, cy, radius * 2.4, radius * 2.2);
                gHead.strokeEllipse(cx + radius * 0.2, cy, radius * 2.4, radius * 2.2);
                
                gHead.lineStyle(1.5, 0x000000, 0.8);
                gHead.fillStyle(0xFFFFFF);
                gHead.fillCircle(cx + radius * 0.6, cy - radius * 0.6, radius * 0.4);
                gHead.strokeCircle(cx + radius * 0.6, cy - radius * 0.6, radius * 0.4);
                gHead.fillCircle(cx + radius * 0.6, cy + radius * 0.6, radius * 0.4);
                gHead.strokeCircle(cx + radius * 0.6, cy + radius * 0.6, radius * 0.4);
                
                gHead.fillStyle(0x000000);
                gHead.fillCircle(cx + radius * 0.7, cy - radius * 0.6, radius * 0.15);
                gHead.fillCircle(cx + radius * 0.7, cy + radius * 0.6, radius * 0.15);
                
                gHead.fillStyle(0xFF0000);
                gHead.beginPath();
                gHead.moveTo(cx + radius * 1.4, cy - radius * 0.1);
                gHead.lineTo(cx + radius * 1.8, cy - radius * 0.2);
                gHead.lineTo(cx + radius * 1.6, cy);
                gHead.lineTo(cx + radius * 1.8, cy + radius * 0.2);
                gHead.lineTo(cx + radius * 1.4, cy + radius * 0.1);
                gHead.fillPath();

                gHead.generateTexture(`head_${skin.headColor}`, radius * 4, radius * 4);
                gHead.destroy();
            }
        });

        const gCoin = this.add.graphics();
        gCoin.fillStyle(0xFFD700);
        gCoin.beginPath();
        gCoin.moveTo(12, 2);
        gCoin.lineTo(22, 12);
        gCoin.lineTo(12, 22);
        gCoin.lineTo(2, 12);
        gCoin.closePath();
        gCoin.fillPath();
        gCoin.fillStyle(0xFFC200);
        gCoin.beginPath();
        gCoin.moveTo(12, 6);
        gCoin.lineTo(18, 12);
        gCoin.lineTo(12, 18);
        gCoin.lineTo(6, 12);
        gCoin.closePath();
        gCoin.fillPath();
        gCoin.generateTexture('coin', 24, 24);
        gCoin.destroy();

        const colors = [0xFF3366, 0x33CCFF, 0x33FF66, 0xFF9933, 0xCC33FF, 0xFFFFFF];
        colors.forEach(color => {
            for (let shape = 0; shape < 3; shape++) {
                const key = `seed_${color}_${shape}`;
                if (!this.textures.exists(key)) {
                    const gSeed = this.add.graphics();
                    gSeed.fillStyle(color);
                    if (shape === 0) {
                        gSeed.fillCircle(8, 8, 7);
                        gSeed.fillStyle(0xFFFFFF, 0.5);
                        gSeed.fillCircle(6, 6, 2);
                    } else if (shape === 1) {
                        gSeed.fillRect(2, 2, 12, 12);
                    } else {
                        gSeed.beginPath();
                        gSeed.moveTo(8, 1);
                        gSeed.lineTo(15, 13);
                        gSeed.lineTo(1, 13);
                        gSeed.closePath();
                        gSeed.fillPath();
                    }
                    gSeed.generateTexture(key, 16, 16);
                    gSeed.destroy();
                }
            }
        });
    }

    create() {
        this.generateTextures();
        
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
            40, 
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
            Phaser.Math.Between(25, 60),
            randomSkin.color,
            randomSkin.headColor,
            false
        );
        this.aiSnakes.push(ai);
    }

    spawnCoin(x: number, y: number, value: number) {
        let sprite: Phaser.GameObjects.Image;
        if (value === 2) {
            sprite = this.add.image(x, y, 'coin');
        } else {
            const colors = [0xFF3366, 0x33CCFF, 0x33FF66, 0xFF9933, 0xCC33FF, 0xFFFFFF];
            const color = colors[Phaser.Math.Between(0, colors.length - 1)];
            const shape = Phaser.Math.Between(0, 2);
            sprite = this.add.image(x, y, `seed_${color}_${shape}`);
        }
        
        sprite.setDepth(5);
        (sprite as any).coinValue = value;
        
        // Spawn animation
        sprite.setScale(0);
        this.tweens.add({
            targets: sprite,
            scale: 1,
            duration: 200,
            ease: 'Back.easeOut'
        });

        this.coins.push(sprite);
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
        const newZoom = curZoom + (this.targetZoom - curZoom) * 0.1;
        this.cameras.main.setZoom(newZoom);

        // Keep UI fixed and unscaled
        if (this.scoreText && this.scoreText.active) {
            this.scoreText.setScale(1 / newZoom);
            this.scoreText.setPosition(24 / newZoom, 24 / newZoom);
        }
        if (this.coinsText && this.coinsText.active) {
            this.coinsText.setScale(1 / newZoom);
            this.coinsText.setPosition(24 / newZoom, 60 / newZoom);
        }

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

        // Check snake collision
        for (let i = 0; i < allSnakes.length; i++) {
            for (let j = 0; j < allSnakes.length; j++) {
                if (i === j) continue;
                
                const snakeA = allSnakes[i];
                const snakeB = allSnakes[j];
                
                if (snakeA.isDead || snakeB.isDead) continue;

                // Simple bounding box check first for optimization
                if (Math.abs(snakeA.x - snakeB.x) > 1000 && Math.abs(snakeA.y - snakeB.y) > 1000) {
                    continue; // Too far away to ever collide
                }

                // Check head to head using squared distance
                const headDistSq = Phaser.Math.Distance.BetweenPointsSquared(snakeA, snakeB);
                const headRadiiSq = Math.pow(snakeA.radius + snakeB.radius, 2);
                
                if (headDistSq < headRadiiSq) {
                    if (snakeA.score > snakeB.score) {
                        this.eatSnake(snakeA, snakeB); // B is smaller, B dies
                    } else if (snakeB.score > snakeA.score) {
                        this.eatSnake(snakeB, snakeA); // A is smaller, A dies
                    } else {
                        // Same size, bounce
                        snakeA.targetAngle += Math.PI;
                        snakeB.targetAngle += Math.PI;
                    }
                    continue; // Skip body check
                }

                // Check head A to body B (A crashes into B's body)
                let hitBody = false;
                const bodyRadiiSq = Math.pow(snakeA.radius + snakeB.radius * 0.8, 2);
                
                // Only check every 2nd segment to improve performance (still very reliable since segments overlap 87.5%)
                for (let k = 1; k < snakeB.segments.length; k += 2) { 
                    const segment = snakeB.segments[k];
                    
                    // Quick bounding box check
                    if (Math.abs(snakeA.x - segment.sprite.x) > 50 || Math.abs(snakeA.y - segment.sprite.y) > 50) {
                        continue;
                    }
                    
                    const distSq = Phaser.Math.Distance.BetweenPointsSquared(snakeA, segment.sprite);
                    if (distSq < bodyRadiiSq) {
                        // A hit B's body, A dies!
                        this.eatSnake(snakeB, snakeA);
                        hitBody = true;
                        break;
                    }
                }
                if (hitBody) continue;
            }
        }

        // Check coin collection for all snakes
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            let collected = false;

            for (const snake of allSnakes) {
                if (snake.isDead) continue;
                
                // Quick bounding box check
                if (Math.abs(snake.x - coin.x) > 50 || Math.abs(snake.y - coin.y) > 50) {
                    continue;
                }
                
                const distSq = Phaser.Math.Distance.BetweenPointsSquared(snake, coin);
                const collectRadiiSq = Math.pow(snake.radius + 8, 2);
                
                if (distSq < collectRadiiSq) {
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