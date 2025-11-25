import { EntityManager } from './EntityManager.js';
import { Renderer } from './Renderer.js';
import { TypingEngine } from './TypingEngine.js';
import { SoundManager } from './SoundManager.js';

export class Game {
    constructor() {
        this.entityManager = new EntityManager();
        this.renderer = new Renderer();
        this.typingEngine = new TypingEngine(this);
        this.soundManager = new SoundManager();

        this.state = 'ready'; // ready, playing, gameover
        this.lastTime = 0;
        this.score = 0;
        this.lives = 3;
        this.currentTargetId = null;
        this.currentStageIndex = 0;
        this.stageConfig = null;
        this.stageKills = 0;

        this.gameWidth = 800;
        this.gameHeight = 600;
    }

    async start() {
        this.score = 0;
        this.lives = 3;
        this.currentStageIndex = 1;
        this.renderer.hideOverlay();

        await this.loadStage(this.currentStageIndex);
        this.startGameLoop();
    }

    async loadStage(stageIndex) {
        try {
            const response = await fetch(`data/stage${stageIndex}.json`);
            if (!response.ok) throw new Error('Stage not found');
            const config = await response.json();

            this.stageConfig = config;
            this.entityManager.setConfig(config);
            this.entityManager.zombies = [];
            this.currentTargetId = null;
            this.stageKills = 0;

            this.renderer.updateHUD(this.score, this.lives, this.stageConfig.title);
            this.state = 'playing';

            console.log(`Starting ${config.title}`);
        } catch (e) {
            console.error(e);
            this.gameClear();
        }
    }

    startGameLoop() {
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    restart() {
        this.start();
    }

    loop(time) {
        if (this.state !== 'playing') return;

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        // Update Entities
        const reachedZombies = this.entityManager.update(deltaTime, this.gameWidth, this.gameHeight);

        // Handle Damage
        if (reachedZombies.length > 0) {
            this.lives -= reachedZombies.length;
            this.renderer.updateHUD(this.score, this.lives, this.stageConfig?.title);

            // Check Game Over
            if (this.lives <= 0) {
                this.gameOver();
                return;
            }

            // If current target reached player, unlock
            if (reachedZombies.find(z => z.id === this.currentTargetId)) {
                this.currentTargetId = null;
            }
        }

        // Spawn Logic
        this.entityManager.spawnTimer += deltaTime;
        if (this.entityManager.spawnTimer > this.stageConfig.spawnInterval) {
            const spawned = this.entityManager.spawnZombie(this.gameWidth, this.gameHeight);
            if (spawned) this.soundManager.playSpawn();
            this.entityManager.spawnTimer = 0;
        }

        // Render
        this.renderer.renderZombies(this.entityManager.zombies, this.currentTargetId);

        requestAnimationFrame((time) => this.loop(time));
    }

    onZombieKilled(id) {
        this.entityManager.removeZombie(id);
        this.currentTargetId = null;
        this.score += 100;
        this.stageKills++;
        this.renderer.updateHUD(this.score, this.lives, this.stageConfig?.title);

        this.checkStageClear();
    }

    checkStageClear() {
        if (this.stageKills >= this.stageConfig.clearCondition.kills) {
            this.currentStageIndex++;
            this.loadStage(this.currentStageIndex);
        }
    }

    onHit(id) {
        this.soundManager.playShoot();
        this.renderer.triggerHitEffect(id);
    }

    onMiss() {
        this.soundManager.playMiss();
        console.log("Miss!");
    }

    gameOver() {
        this.state = 'gameover';
        this.renderer.showOverlay('Game Over', `Score: ${this.score} - Press Enter to Restart`);
    }

    gameClear() {
        this.state = 'gameover'; // Re-use gameover state for now but with different message
        this.renderer.showOverlay('All Stages Cleared!', `Final Score: ${this.score} - Press Enter to Restart`);
    }
}
