import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    create() {
        // Immediately transition to battle scene
        this.scene.start('BattleScene');
    }
}