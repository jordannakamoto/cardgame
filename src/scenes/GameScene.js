import Phaser from 'phaser';
import CardManager from '../game/CardManager.js';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        this.cardManager = new CardManager(this);
        
        const titleText = this.add.text(
            this.cameras.main.centerX,
            120,
            'Phaser Card Game Engine',
            {
                fontSize: '64px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        titleText.setOrigin(0.5);
        
        this.cardManager.createDeck();
        this.cardManager.displayCards();
        
        // Start battle mode by default
        this.scene.start('BattleScene');
    }

    update() {
        
    }
}