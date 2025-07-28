import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import BattleScene from './scenes/BattleScene.js';
import { DebugMenu } from './ui/DebugMenu.js';

const config = {
    type: Phaser.AUTO,
    width: 2560,
    height: 1440,
    backgroundColor: '#2d2d2d',
    parent: 'game-container',
    scene: [PreloadScene, GameScene, BattleScene],
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: true
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        min: {
            width: 640,
            height: 360
        },
        max: {
            width: 1920,
            height: 1080
        }
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: false
        }
    }
};

const game = new Phaser.Game(config);
new DebugMenu();

export default game;
