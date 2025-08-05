import AbilityPanel from '../ui/AbilityPanel.js';

export default class AbilityManager {
    constructor(scene, heroManager, manaSystem) {
        this.scene = scene;
        this.heroManager = heroManager;
        this.manaSystem = manaSystem;
        
        // Create the UI panel
        this.abilityPanel = new AbilityPanel(scene, heroManager, manaSystem);
        
        // Track targeting state
        this.isTargeting = false;
        this.selectedAbility = null;
        this.selectedHero = null;
    }
    
    // Public interface methods for battle integration
    
    /**
     * Check if the ability system is currently in targeting mode
     * @returns {boolean}
     */
    isInTargetingMode() {
        return this.abilityPanel.targetingMode;
    }
    
    /**
     * Handle enemy being clicked - returns true if targeting was handled
     * @param {Enemy} enemy - The enemy that was clicked
     * @returns {boolean} - True if the click was handled by ability targeting
     */
    handleEnemyClick(enemy) {
        if (this.isInTargetingMode()) {
            return this.abilityPanel.onEnemyTargeted(enemy);
        }
        return false;
    }
    
    /**
     * Cancel any active targeting mode
     */
    cancelTargeting() {
        if (this.abilityPanel) {
            this.abilityPanel.exitTargetingMode();
        }
    }
    
    /**
     * Update ability states (called when mana changes, turn ends, etc.)
     */
    updateAbilityStates() {
        if (this.abilityPanel) {
            this.abilityPanel.updateAllButtonStates();
        }
    }
    
    /**
     * Refresh the ability display (called when heroes change)
     */
    refreshAbilities() {
        if (this.abilityPanel) {
            this.abilityPanel.updateAbilityDisplay();
        }
    }
    
    /**
     * Process end of turn effects (cooldown reduction, etc.)
     */
    onTurnEnd() {
        if (!this.heroManager) return;
        
        // Reduce cooldowns on all active abilities
        this.heroManager.getAllHeroes().forEach(hero => {
            if (hero.activeAbilities) {
                hero.activeAbilities.forEach(ability => {
                    ability.reduceCooldown();
                });
            }
        });
        
        // Update UI to reflect cooldown changes
        this.updateAbilityStates();
    }
    
    /**
     * Process start of turn effects
     */
    onTurnStart() {
        // Update ability states for new turn
        this.updateAbilityStates();
    }
    
    /**
     * Get all available active abilities from the party
     * @returns {Array} Array of {hero, ability} objects
     */
    getAllActiveAbilities() {
        const abilities = [];
        if (this.heroManager) {
            this.heroManager.getAllHeroes().forEach(hero => {
                if (hero.activeAbilities) {
                    hero.activeAbilities.forEach(ability => {
                        abilities.push({ hero, ability });
                    });
                }
            });
        }
        return abilities;
    }
    
    /**
     * Check if any abilities can be cast with current mana
     * @returns {boolean}
     */
    hasUsableAbilities() {
        const abilities = this.getAllActiveAbilities();
        return abilities.some(({ ability }) => {
            const canCastResult = ability.canCast(this.manaSystem, this.getBattleContext());
            return canCastResult.canCast;
        });
    }
    
    /**
     * Get battle context for ability execution
     * @returns {Object}
     */
    getBattleContext() {
        return {
            scene: this.scene,
            battleManager: this.scene.battleManager,
            enemies: this.scene.battleManager?.enemies || [],
            heroes: this.heroManager?.getAllHeroes() || [],
            manaSystem: this.manaSystem
        };
    }
    
    /**
     * Handle keyboard shortcuts for abilities (QWERTYUIOP keys for quick cast)
     * @param {string} hotkey - The hotkey pressed (Q, W, E, R, T, Y, U, I, O, P)
     */
    handleAbilityHotkey(hotkey) {
        const hotkeyMap = ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'];
        const abilityIndex = hotkeyMap.indexOf(hotkey.toUpperCase());
        
        if (abilityIndex === -1) {
            console.log(`Invalid hotkey: ${hotkey}`);
            return;
        }
        
        const abilities = this.getAllActiveAbilities();
        if (abilityIndex >= 0 && abilityIndex < abilities.length) {
            const { hero, ability } = abilities[abilityIndex];
            
            const canCastResult = ability.canCast(this.manaSystem, this.getBattleContext());
            if (canCastResult.canCast) {
                console.log(`Casting ${ability.name} with hotkey ${hotkey}`);
                // Start targeting for this ability
                this.abilityPanel.selectAbility(hero, ability, null);
            } else {
                console.log(`Cannot cast ${ability.name}: ${canCastResult.reason}`);
                // Show brief feedback to player
                this.showHotkeyFeedback(ability, canCastResult.reason);
            }
        } else if (abilityIndex < abilities.length) {
            // Valid hotkey but no ability at that index
            console.log(`No ability assigned to hotkey ${hotkey}`);
        }
    }

    /**
     * Show brief feedback when hotkey cannot be used
     * @param {ActiveAbility} ability - The ability that couldn't be cast
     * @param {string} reason - Why it couldn't be cast
     */
    showHotkeyFeedback(ability, reason) {
        const feedbackText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2 - 100,
            `${ability.name}: ${reason}`,
            {
                fontSize: '24px',
                color: '#ff6b6b',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 8, y: 4 },
                align: 'center'
            }
        );
        feedbackText.setOrigin(0.5);
        feedbackText.setScrollFactor(0);
        feedbackText.setDepth(2000);
        
        // Fade out after short delay
        this.scene.tweens.add({
            targets: feedbackText,
            alpha: 0,
            y: feedbackText.y - 30,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => feedbackText.destroy()
        });
    }
    
    /**
     * Show ability tooltip/info
     * @param {number} abilityIndex - Index of ability to show info for
     */
    showAbilityInfo(abilityIndex) {
        const abilities = this.getAllActiveAbilities();
        if (abilityIndex >= 0 && abilityIndex < abilities.length) {
            const { ability } = abilities[abilityIndex];
            
            // Create info display
            const infoText = this.scene.add.text(
                this.scene.cameras.main.width / 2,
                100,
                `${ability.name}\n${ability.description}\nCost: ${ability.getManaCostString()}`,
                {
                    fontSize: '18px',
                    color: '#ffffff',
                    fontFamily: 'Arial',
                    backgroundColor: '#000000',
                    padding: { x: 10, y: 8 },
                    align: 'center'
                }
            );
            infoText.setOrigin(0.5);
            infoText.setScrollFactor(0);
            infoText.setDepth(2000);
            
            // Auto-remove after delay
            this.scene.time.delayedCall(3000, () => {
                if (infoText) infoText.destroy();
            });
        }
    }
    
    /**
     * Execute selected ability on current target (Enter key)
     */
    executeSelectedAbilityOnCurrentTarget() {
        if (!this.isInTargetingMode()) {
            return false;
        }
        
        // Get current target from battle manager
        const battleManager = this.scene.battleManager;
        if (!battleManager || !battleManager.getCurrentTarget) {
            console.log('No battle manager or getCurrentTarget method');
            return false;
        }
        
        const currentTarget = battleManager.getCurrentTarget();
        if (!currentTarget || !currentTarget.isAlive) {
            console.log('No valid current target for ability execution');
            return false;
        }
        
        // Execute ability on current target
        return this.abilityPanel.onEnemyTargeted(currentTarget);
    }

    /**
     * Enable/disable the ability panel
     * @param {boolean} enabled
     */
    setEnabled(enabled) {
        if (this.abilityPanel && this.abilityPanel.panelContainer) {
            this.abilityPanel.panelContainer.setVisible(enabled);
            this.abilityPanel.panelContainer.setActive(enabled);
        }
    }
    
    /**
     * Clean up the ability manager
     */
    destroy() {
        if (this.abilityPanel) {
            this.abilityPanel.destroy();
            this.abilityPanel = null;
        }
        
        this.scene = null;
        this.heroManager = null;
        this.manaSystem = null;
    }
}