import ModeManager, { GameModes } from '../managers/ModeManager.js';
import DebugSystem from '../debug/DebugSystem.js';

export class DebugMenu {
    constructor() {
        this.init();
    }

    init() {
        const battleBtn = document.getElementById('battle-mode');
        const campaignBtn = document.getElementById('campaign-mode');
        const shopBtn = document.getElementById('shop-mode');
        const eventBtn = document.getElementById('event-mode');
        const partyBtn = document.getElementById('party-mode');
        const presentationBtn = document.getElementById('presentation-mode');
        
        // Register debug menu elements with the debug system
        const debugMenuBar = document.querySelector('#debug-menu');
        if (debugMenuBar) {
            DebugSystem.registerDebugElement('debugMenuBar', debugMenuBar, {
                category: 'navigation',
                description: 'Main debug navigation bar'
            });
        }

        battleBtn.addEventListener('click', () => {
            this.setMode(GameModes.BATTLE);
            this.goToBattle();
        });
        campaignBtn.addEventListener('click', () => this.setMode(GameModes.CAMPAIGN));
        shopBtn.addEventListener('click', () => {
            this.setMode(GameModes.SHOP);
            this.goToShop();
        });
        eventBtn.addEventListener('click', () => this.setMode(GameModes.EVENT));
        partyBtn.addEventListener('click', () => this.setMode(GameModes.PARTY));
        
        // Presentation mode button
        presentationBtn.addEventListener('click', () => {
            const isPresentationMode = DebugSystem.togglePresentationMode();
            this.updatePresentationButton(isPresentationMode);
        });

        // Debug actions dropdown
        this.setupDebugActions();
    }

    setMode(mode) {
        ModeManager.setMode(mode);
        this.updateButtonStates(mode);
    }

    updateButtonStates(activeMode) {
        const buttons = document.querySelectorAll('.menu-button');
        buttons.forEach(btn => btn.classList.remove('active'));

        if (activeMode === GameModes.BATTLE) {
            document.getElementById('battle-mode').classList.add('active');
        } else if (activeMode === GameModes.CAMPAIGN) {
            document.getElementById('campaign-mode').classList.add('active');
        } else if (activeMode === GameModes.SHOP) {
            document.getElementById('shop-mode').classList.add('active');
        } else if (activeMode === GameModes.EVENT) {
            document.getElementById('event-mode').classList.add('active');
        } else if (activeMode === GameModes.PARTY) {
            document.getElementById('party-mode').classList.add('active');
        }
    }
    
    updatePresentationButton(isPresentationMode) {
        const presentationBtn = document.getElementById('presentation-mode');
        if (presentationBtn) {
            if (isPresentationMode) {
                presentationBtn.classList.add('presentation');
                presentationBtn.textContent = '🎥 Exit Presentation';
            } else {
                presentationBtn.classList.remove('presentation');
                presentationBtn.textContent = '🎥 Presentation Mode';
            }
        }
    }

    goToBattle() {
        // Get the game instance from the global scope
        const game = window.game;
        if (game && game.scene) {
            // Get current active scene
            const activeScenes = game.scene.getScenes(true);
            if (activeScenes.length > 0) {
                const currentScene = activeScenes[0];
                currentScene.scene.start('BattleScene');
            }
        } else {
            console.warn('Game instance not found. Make sure the game is running.');
        }
    }

    async goToShop() {
        // Get the game instance from the global scope or find it
        const game = window.game || document.game;
        if (game && game.scene) {
            try {
                // Import Inventory class
                const { default: Inventory } = await import('../inventory/Inventory.js');
                
                // Create debug inventory with some gold
                const debugInventory = new Inventory();
                debugInventory.addResource('gold', 150); // Give debug gold
                
                // Get current active scene
                const activeScenes = game.scene.getScenes(true);
                if (activeScenes.length > 0) {
                    const currentScene = activeScenes[0];
                    // Import PartyManager dynamically to avoid circular imports
                    Promise.all([
                        import('../party/PartyManager.js'),
                        import('../game/PlayerDeck.js')
                    ]).then(([partyModule, deckModule]) => {
                        const PartyManager = partyModule.default;
                        const PlayerDeck = deckModule.default;
                        const debugPartyManager = new PartyManager(currentScene);
                        const debugPlayerDeck = new PlayerDeck();
                        
                        currentScene.scene.start('ShopScene', {
                            gold: 150,
                            inventory: debugInventory,
                            partyManager: debugPartyManager,
                            playerDeck: debugPlayerDeck
                        });
                    });
                }
            } catch (error) {
                console.error('Failed to load shop:', error);
            }
        } else {
            console.warn('Game instance not found. Make sure the game is running.');
        }
    }

    setupDebugActions() {
        // Auto win battle
        document.getElementById('auto-win-battle').addEventListener('click', () => {
            this.autoWinBattle();
        });

        // Add gold
        document.getElementById('add-gold').addEventListener('click', () => {
            this.addGold(1000);
        });

        // Heal all
        document.getElementById('heal-all').addEventListener('click', () => {
            this.healAll();
        });

        // Max mana all
        document.getElementById('max-mana').addEventListener('click', () => {
            this.maxManaAll();
        });

        // Kill all enemies
        document.getElementById('kill-all-enemies').addEventListener('click', () => {
            this.killAllEnemies();
        });

        // Draw new hand
        document.getElementById('new-hand').addEventListener('click', () => {
            this.drawNewHand();
        });
    }

    getCurrentBattleScene() {
        const game = window.game;
        if (game && game.scene) {
            const activeScenes = game.scene.getScenes(true);
            const battleScene = activeScenes.find(scene => scene.scene.key === 'BattleScene');
            return battleScene;
        }
        return null;
    }

    autoWinBattle() {
        const battleScene = this.getCurrentBattleScene();
        if (battleScene && battleScene.battleManager) {
            console.log('Auto-winning battle...');
            
            // Kill all enemies instantly
            battleScene.battleManager.enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    enemy.currentHealth = 0;
                    enemy.die();
                }
            });
            
            console.log('Battle auto-won!');
        } else {
            console.warn('No active battle scene found');
        }
    }

    addGold(amount) {
        const battleScene = this.getCurrentBattleScene();
        if (battleScene && battleScene.inventory) {
            battleScene.inventory.addResource('gold', amount);
            console.log(`Added ${amount} gold`);
            
            // Update display if it exists
            if (battleScene.updateGoldDisplay) {
                battleScene.updateGoldDisplay();
            }
        } else {
            console.warn('No active battle scene or inventory found');
        }
    }

    healAll() {
        const battleScene = this.getCurrentBattleScene();
        if (battleScene && battleScene.heroManager) {
            const heroes = battleScene.heroManager.getAllHeroes();
            heroes.forEach(hero => {
                if (hero.heal) {
                    hero.heal(hero.maxHealth);
                } else if (hero.currentHealth !== undefined && hero.maxHealth !== undefined) {
                    hero.currentHealth = hero.maxHealth;
                }
            });
            console.log('All heroes healed to full health');
        } else {
            console.warn('No active battle scene or hero manager found');
        }
    }

    maxManaAll() {
        const battleScene = this.getCurrentBattleScene();
        if (battleScene && battleScene.heroManager) {
            const heroes = battleScene.heroManager.getAllHeroes();
            heroes.forEach(hero => {
                if (hero.currentMana !== undefined && hero.maxMana !== undefined) {
                    hero.currentMana = hero.maxMana;
                }
            });
            
            // Update mana display
            const activeHero = battleScene.heroManager.getActiveHero();
            if (activeHero && battleScene.updateManaDisplay) {
                battleScene.updateManaDisplay(activeHero.currentMana, activeHero.maxMana);
            }
            
            console.log('All heroes restored to max mana');
        } else {
            console.warn('No active battle scene or hero manager found');
        }
    }

    killAllEnemies() {
        const battleScene = this.getCurrentBattleScene();
        if (battleScene && battleScene.battleManager) {
            console.log('Killing all enemies...');
            
            battleScene.battleManager.enemies.forEach(enemy => {
                if (enemy.isAlive) {
                    enemy.currentHealth = 0;
                    enemy.die();
                }
            });
            
            console.log('All enemies killed!');
        } else {
            console.warn('No active battle scene found');
        }
    }

    drawNewHand() {
        const battleScene = this.getCurrentBattleScene();
        if (battleScene && battleScene.battleManager) {
            battleScene.battleManager.drawNewHand();
            console.log('Drew new hand');
        } else {
            console.warn('No active battle scene found');
        }
    }
}