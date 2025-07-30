import Phaser from 'phaser';
import GameScene from './scenes/GameScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import BattleScene from './scenes/BattleScene.js';
import ShopScene from './scenes/ShopScene.js';
import PackOpeningScene from './scenes/PackOpeningScene.js';
import { DebugMenu } from './ui/DebugMenu.js';
import { ContextMenu } from './ui/ContextMenu.js';
import { StickyNote } from './ui/StickyNote.js';

const config = {
    type: Phaser.AUTO,
    width: 2560,
    height: 1440,
    backgroundColor: '#2d2d2d',
    parent: 'game-container',
    scene: [PreloadScene, GameScene, BattleScene, ShopScene, PackOpeningScene],
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

// Make game globally accessible for debug menu
window.game = game;

// Initialize UI systems
new DebugMenu();
new ContextMenu();

// Initialize sticky note system
window.StickyNoteManager = { StickyNote };

// Focus on game canvas when page loads
window.addEventListener('load', () => {
    // Wait a bit for Phaser to fully initialize
    setTimeout(() => {
        const canvas = game.canvas;
        if (canvas) {
            canvas.tabIndex = 1; // Make it focusable
            canvas.focus();
            console.log('Game canvas focused');
        }
    }, 100);
});

// Also focus when clicking on the game container (but not on UI elements)
document.getElementById('game-container').addEventListener('click', (e) => {
    if (e.target.tagName === 'CANVAS') {
        game.canvas.focus();
    }
});

export default game;
