import Phaser from 'phaser';
import { EnemyTypes } from '../battle/EnemyTypes.js';

export default class PreloadScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PreloadScene' });
    }

    preload() {
        this.load.setBaseURL('assets');
        
        // Dynamically load enemy art from EnemyTypes
        Object.values(EnemyTypes).forEach(enemyType => {
            if (enemyType.artPath) {
                const textureKey = `enemy_${enemyType.name.toLowerCase()}`;
                const artPath = enemyType.artPath.replace('assets/', ''); // Remove 'assets/' since setBaseURL handles it
                this.load.image(textureKey, artPath);
            }
        });
        
        // Load hero portraits
        this.load.image('warrior2', 'heroes/warrior2.png');
        this.load.image('mage1', 'heroes/mage1.png');
        this.load.image('mage2', 'heroes/mage2.png');
        this.load.image('guardian1', 'heroes/guardian1.png');
        this.load.image('jackpot1', 'heroes/jackpot1.png');
        
        // Load battle backdrop
        this.load.image('battle-backdrop', 'battle/backdrop.png');
        
        this.createLoadingBar();
    }

    createLoadingBar() {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: 'Loading...',
            style: {
                font: '20px monospace',
                fill: '#ffffff'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
        });
    }

    create() {
        this.scene.start('GameScene');
    }
}