import { UIConfig } from '../config/UIConfig.js';

export default class AbilityPanel {
    constructor(scene, heroManager, manaSystem) {
        this.scene = scene;
        this.heroManager = heroManager;
        this.manaSystem = manaSystem;
        
        // UI elements
        this.panelContainer = null;
        this.abilityButtons = [];
        this.selectedAbility = null;
        this.targetingMode = false;
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Get panel configuration
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        const panelConfig = UIConfig.panels.ability;
        const isRightSide = UIConfig.panels.position === 'right';
        
        // Calculate X position based on side preference
        const xPos = isRightSide ? 
            screenWidth - panelConfig.offsetX : 
            panelConfig.offsetX;
        
        this.panelContainer = this.scene.add.container(xPos, screenHeight / 2);
        this.panelContainer.setDepth(1000);
        this.panelContainer.setScrollFactor(0);
        
        // No background panel - abilities will be visible on their own
        // No title - cleaner look
        
        this.updateAbilityDisplay();
    }
    
    updateAbilityDisplay() {
        console.log('AbilityPanel: Updating ability display');
        
        // Clear existing buttons
        this.abilityButtons.forEach(button => button.destroy());
        this.abilityButtons = [];
        
        if (!this.heroManager) {
            console.log('AbilityPanel: No hero manager found');
            return;
        }
        
        // Get all active abilities from all heroes
        const allAbilities = [];
        const heroes = this.heroManager.getAllHeroes();
        console.log('AbilityPanel: Found', heroes.length, 'heroes');
        
        heroes.forEach(hero => {
            console.log('AbilityPanel: Checking hero', hero.name, 'for active abilities');
            if (hero.activeAbilities) {
                console.log('AbilityPanel: Hero has', hero.activeAbilities.length, 'active abilities');
                hero.activeAbilities.forEach(ability => {
                    allAbilities.push({ hero, ability });
                });
            } else {
                console.log('AbilityPanel: Hero has no activeAbilities property');
            }
        });
        
        console.log('AbilityPanel: Total abilities found:', allAbilities.length);
        
        // Create buttons for each ability
        allAbilities.forEach(async (abilityData, index) => {
            const yPos = -150 + (index * 100); // More spacing without title
            await this.createAbilityButton(abilityData.hero, abilityData.ability, 0, yPos, index);
        });
    }
    
    async createAbilityButton(hero, ability, x, y, index = 0) {
        const buttonContainer = this.scene.add.container(x, y);
        this.panelContainer.add(buttonContainer);
        
        // Modern button background with glassmorphic style
        const buttonBg = this.scene.add.graphics();
        buttonBg.fillStyle(0xffffff, 0.08); // Semi-transparent white
        buttonBg.fillRoundedRect(-140, -40, 280, 80, 12); // Rounded corners
        buttonBg.lineStyle(1, 0xffffff, 0.2); // Subtle white border
        buttonBg.strokeRoundedRect(-140, -40, 280, 80, 12);
        buttonContainer.add(buttonBg);
        
        
        // Ability name - centered text
        const nameText = this.scene.add.text(0, -15, ability.name, {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        nameText.setOrigin(0.5, 0.5);
        buttonContainer.add(nameText);
        
        // Mana cost - centered text
        const costText = this.scene.add.text(0, 12, ability.getManaCostString(), {
            fontSize: '22px',
            color: '#aaaaaa',
            fontFamily: 'Arial'
        });
        costText.setOrigin(0.5, 0.5);
        buttonContainer.add(costText);
        
        // Make button interactive with hit area
        const hitArea = this.scene.add.rectangle(0, 0, 280, 80, 0x000000, 0);
        hitArea.setInteractive();
        hitArea.on('pointerdown', () => {
            this.selectAbility(hero, ability, buttonContainer);
        });
        
        // Hover effects
        hitArea.on('pointerover', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xffffff, 0.12); // Slightly brighter on hover
            buttonBg.fillRoundedRect(-140, -40, 280, 80, 12);
            buttonBg.lineStyle(1, 0xffffff, 0.3);
            buttonBg.strokeRoundedRect(-140, -40, 280, 80, 12);
        });
        
        hitArea.on('pointerout', () => {
            buttonBg.clear();
            buttonBg.fillStyle(0xffffff, 0.08); // Back to normal
            buttonBg.fillRoundedRect(-140, -40, 280, 80, 12);
            buttonBg.lineStyle(1, 0xffffff, 0.2);
            buttonBg.strokeRoundedRect(-140, -40, 280, 80, 12);
        });
        
        buttonContainer.add(hitArea);
        
        // Store references
        const buttonData = {
            container: buttonContainer,
            background: buttonBg,
            hitArea: hitArea,
            costText: costText,
            hero: hero,
            ability: ability,
            destroy: () => buttonContainer.destroy()
        };
        
        this.abilityButtons.push(buttonData);
        this.updateButtonState(buttonData);
        
        return buttonData;
    }
    
    updateButtonState(buttonData) {
        const canCastResult = buttonData.ability.canCast(this.manaSystem, this.getBattleContext());
        
        if (canCastResult.canCast) {
            // Ability can be cast - full opacity
            buttonData.container.setAlpha(1.0);
            buttonData.background.clear();
            buttonData.background.fillStyle(0xffffff, 0.08);
            buttonData.background.fillRoundedRect(-140, -40, 280, 80, 12);
            buttonData.background.lineStyle(1, 0xffffff, 0.2);
            buttonData.background.strokeRoundedRect(-140, -40, 280, 80, 12);
        } else {
            // Ability cannot be cast - very transparent
            buttonData.container.setAlpha(0.3);
            buttonData.background.clear();
            buttonData.background.fillStyle(0xffffff, 0.04);
            buttonData.background.fillRoundedRect(-140, -40, 280, 80, 12);
            buttonData.background.lineStyle(1, 0xffffff, 0.1);
            buttonData.background.strokeRoundedRect(-140, -40, 280, 80, 12);
        }
    }
    
    selectAbility(hero, ability, buttonContainer) {
        const canCastResult = ability.canCast(this.manaSystem, this.getBattleContext());
        
        if (!canCastResult.canCast) {
            // Show why ability can't be cast
            if (buttonContainer) {
                this.showTooltip(canCastResult.reason, buttonContainer);
            }
            return;
        }
        
        // Select the ability and enter targeting mode
        this.selectedAbility = { hero, ability };
        this.enterTargetingMode();
        
        // Highlight selected button
        this.abilityButtons.forEach(btn => {
            const isSelected = buttonContainer && btn.container === buttonContainer;
            // Redraw background with highlight
            btn.background.clear();
            btn.background.fillStyle(0xffffff, 0.08);
            btn.background.fillRoundedRect(-140, -40, 280, 80, 12);
            btn.background.lineStyle(2, isSelected ? 0x00ff00 : 0xffffff, isSelected ? 0.5 : 0.2);
            btn.background.strokeRoundedRect(-140, -40, 280, 80, 12);
        });
    }
    
    enterTargetingMode() {
        this.targetingMode = true;
        
        // Change cursor or show targeting UI
        this.scene.input.setDefaultCursor('crosshair');
        
        // Targeting instructions removed for cleaner interface
        // ESC still works to cancel targeting
        
        // Set up targeting event listeners
        this.setupTargetingListeners();
    }
    
    setupTargetingListeners() {
        // ESC to cancel targeting
        const escKey = this.scene.input.keyboard.addKey('ESC');
        escKey.once('down', () => {
            this.exitTargetingMode();
        });
        
        // Right click to cancel targeting
        this.scene.input.once('pointerdown', (pointer) => {
            if (pointer.rightButtonDown()) {
                this.exitTargetingMode();
            }
        });
    }
    
    exitTargetingMode() {
        this.targetingMode = false;
        this.selectedAbility = null;
        
        // Reset cursor
        this.scene.input.setDefaultCursor('default');
        
        // Remove targeting instruction
        if (this.targetingInstruction) {
            this.targetingInstruction.destroy();
            this.targetingInstruction = null;
        }
        
        // Reset button highlights
        this.abilityButtons.forEach(btn => {
            btn.background.clear();
            btn.background.fillStyle(0xffffff, 0.08);
            btn.background.fillRoundedRect(-140, -40, 280, 80, 12);
            btn.background.lineStyle(1, 0xffffff, 0.2);
            btn.background.strokeRoundedRect(-140, -40, 280, 80, 12);
        });
    }
    
    // Called when an enemy is clicked during targeting mode
    onEnemyTargeted(enemy) {
        if (!this.targetingMode || !this.selectedAbility) return false;
        
        const { hero, ability } = this.selectedAbility;
        
        // Execute the ability
        this.executeAbility(hero, ability, enemy);
        this.exitTargetingMode();
        
        return true; // Indicate that targeting was handled
    }
    
    async executeAbility(hero, ability, target) {
        try {
            // Spend mana
            for (const [suit, cost] of Object.entries(ability.manaCosts)) {
                this.manaSystem.spendMana(suit, cost);
            }
            
            // Execute ability
            await ability.execute(target, this.getBattleContext());
            
            // Start cooldown
            ability.startCooldown();
            
            // Update UI
            this.updateAllButtonStates();
            
        } catch (error) {
            console.error('Error executing ability:', error);
        }
    }
    
    updateAllButtonStates() {
        this.abilityButtons.forEach(buttonData => {
            this.updateButtonState(buttonData);
        });
    }
    
    getBattleContext() {
        return {
            scene: this.scene,
            battleManager: this.scene.battleManager,
            enemies: this.scene.battleManager?.enemies || [],
            heroes: this.heroManager?.getAllHeroes() || []
        };
    }
    
    showTooltip(message, targetContainer) {
        // Simple tooltip implementation
        const tooltip = this.scene.add.text(100, 0, message, {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial',
            backgroundColor: '#000000',
            padding: { x: 5, y: 3 }
        });
        tooltip.setOrigin(0, 0.5);
        targetContainer.add(tooltip);
        
        // Remove tooltip after delay
        this.scene.time.delayedCall(2000, () => {
            if (tooltip) tooltip.destroy();
        });
    }
    
    setupEventListeners() {
        // Listen for mana changes to update button states
        this.scene.events.on('manaChanged', () => {
            this.updateAllButtonStates();
        });
        
        // Listen for hero changes to update ability display
        this.scene.events.on('heroChanged', () => {
            this.updateAbilityDisplay();
        });
    }
    
    
    
    destroy() {
        this.exitTargetingMode();
        
        if (this.panelContainer) {
            this.panelContainer.destroy();
        }
        
        // Clean up event listeners
        this.scene.events.off('manaChanged');
        this.scene.events.off('heroChanged');
    }
}