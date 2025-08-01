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
        // Create panel container on left side
        const screenHeight = this.scene.cameras.main.height;
        this.panelContainer = this.scene.add.container(120, screenHeight / 2);
        this.panelContainer.setDepth(1000);
        this.panelContainer.setScrollFactor(0);
        
        // Background panel
        const panelWidth = 200;
        const panelHeight = 400;
        const panelBg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.7);
        panelBg.setStrokeStyle(2, 0x444444);
        this.panelContainer.add(panelBg);
        
        // Title
        const titleText = this.scene.add.text(0, -180, 'ABILITIES', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        titleText.setOrigin(0.5);
        this.panelContainer.add(titleText);
        
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
        allAbilities.forEach((abilityData, index) => {
            const yPos = -120 + (index * 80);
            this.createAbilityButton(abilityData.hero, abilityData.ability, 0, yPos);
        });
    }
    
    createAbilityButton(hero, ability, x, y) {
        const buttonContainer = this.scene.add.container(x, y);
        this.panelContainer.add(buttonContainer);
        
        // Button background
        const buttonBg = this.scene.add.rectangle(0, 0, 180, 60, 0x333333);
        buttonBg.setStrokeStyle(2, 0x666666);
        buttonContainer.add(buttonBg);
        
        // Ability icon
        const icon = ability.createIcon(this.scene, -60, 0);
        buttonContainer.add(icon);
        
        // Ability name
        const nameText = this.scene.add.text(-20, -10, ability.name, {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        nameText.setOrigin(0, 0.5);
        buttonContainer.add(nameText);
        
        // Mana cost
        const costText = this.scene.add.text(-20, 8, ability.getManaCostString(), {
            fontSize: '14px',
            color: '#aaaaaa',
            fontFamily: 'Arial'
        });
        costText.setOrigin(0, 0.5);
        buttonContainer.add(costText);
        
        // Make button interactive
        buttonBg.setInteractive();
        buttonBg.on('pointerdown', () => {
            this.selectAbility(hero, ability, buttonContainer);
        });
        
        // Store references
        const buttonData = {
            container: buttonContainer,
            background: buttonBg,
            icon: icon,
            nameText: nameText,
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
            buttonData.background.setFillStyle(0x333333);
            buttonData.background.setStrokeStyle(2, 0x666666);
        } else {
            // Ability cannot be cast - transparent
            buttonData.container.setAlpha(0.4);
            buttonData.background.setFillStyle(0x222222);
            buttonData.background.setStrokeStyle(2, 0x444444);
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
            btn.background.setStrokeStyle(2, isSelected ? 0x00ff00 : 0x666666);
        });
    }
    
    enterTargetingMode() {
        this.targetingMode = true;
        
        // Change cursor or show targeting UI
        this.scene.input.setDefaultCursor('crosshair');
        
        // Show targeting instructions
        const instructionText = this.scene.add.text(
            this.scene.cameras.main.width / 2,
            50,
            'Click on target to cast ability, or press ESC to cancel',
            {
                fontSize: '20px',
                color: '#ffff00',
                fontFamily: 'Arial',
                backgroundColor: '#000000',
                padding: { x: 10, y: 5 }
            }
        );
        instructionText.setOrigin(0.5);
        instructionText.setScrollFactor(0);
        instructionText.setDepth(2000);
        this.targetingInstruction = instructionText;
        
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
            btn.background.setStrokeStyle(2, 0x666666);
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