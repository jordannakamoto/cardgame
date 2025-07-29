import PokerHand, { HAND_RANKINGS } from '../game/PokerHand.js';
import Logger from '../logging/Logger.js';

export default class BattleManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.selectedEnemyIndex = 0;
        this.playerHand = [];
        this.selectedCards = [];
        this.isPlayerTurn = true;
        this.battleWon = false;
        this.sortByRank = true; // true = by rank, false = by suit
        
        // Damage multipliers for poker hands
        this.damageTable = {
            [HAND_RANKINGS.HIGH_CARD]: 3,
            [HAND_RANKINGS.ONE_PAIR]: 20,
            [HAND_RANKINGS.TWO_PAIR]: 35,
            [HAND_RANKINGS.THREE_OF_A_KIND]: 55,
            [HAND_RANKINGS.STRAIGHT]: 75,
            [HAND_RANKINGS.FLUSH]: 90,
            [HAND_RANKINGS.FULL_HOUSE]: 125,
            [HAND_RANKINGS.FOUR_OF_A_KIND]: 160,
            [HAND_RANKINGS.STRAIGHT_FLUSH]: 250,
            [HAND_RANKINGS.ROYAL_FLUSH]: 500
        };
        
        this.setupInputHandlers();
    }
    
    addEnemy(enemy) {
        this.enemies.push(enemy);
        
        // Set first enemy as default target
        if (this.enemies.length === 1) {
            this.selectEnemy(0);
        }
        
        // Listen for enemy death
        this.scene.events.on('enemyDied', this.onEnemyDied, this);
    }
    
    setupInputHandlers() {
        // Arrow key targeting
        this.scene.input.keyboard.on('keydown-LEFT', () => {
            this.cycleTarget(-1);
        });
        
        this.scene.input.keyboard.on('keydown-RIGHT', () => {
            this.cycleTarget(1);
        });
        
        // Enter to attack with selected cards
        this.scene.input.keyboard.on('keydown-ENTER', () => {
            this.attackSelectedEnemy();
        });
        
        // Space to get new hand (for testing)
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            this.drawNewHand(true); // Always animate manual hand draws
        });
        
        // Number keys 1-8 to select/deselect cards
        const keys = this.scene.input.keyboard.addKeys('ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT');
        
        keys.ONE.on('down', () => this.toggleCardSelection(0));
        keys.TWO.on('down', () => this.toggleCardSelection(1));
        keys.THREE.on('down', () => this.toggleCardSelection(2));
        keys.FOUR.on('down', () => this.toggleCardSelection(3));
        keys.FIVE.on('down', () => this.toggleCardSelection(4));
        keys.SIX.on('down', () => this.toggleCardSelection(5));
        keys.SEVEN.on('down', () => this.toggleCardSelection(6));
        keys.EIGHT.on('down', () => this.toggleCardSelection(7));
    }
    
    cycleTarget(direction) {
        if (!this.isPlayerTurn || this.getAliveEnemies().length === 0) return;
        
        const aliveEnemies = this.getAliveEnemies();
        const currentAliveIndex = aliveEnemies.findIndex(enemy => 
            enemy === this.enemies[this.selectedEnemyIndex]
        );
        
        let newIndex = (currentAliveIndex + direction + aliveEnemies.length) % aliveEnemies.length;
        const newEnemy = aliveEnemies[newIndex];
        const newEnemyIndex = this.enemies.indexOf(newEnemy);
        
        this.selectEnemy(newEnemyIndex);
    }
    
    selectEnemy(index) {
        // Clear previous selection and damage previews
        this.enemies.forEach(enemy => {
            enemy.setTargeted(false);
            enemy.hideDamagePreview();
        });
        
        // Select new enemy
        if (index >= 0 && index < this.enemies.length && this.enemies[index].isAlive) {
            this.selectedEnemyIndex = index;
            this.enemies[index].setTargeted(true);
            
            // Update damage preview for new target if cards are selected
            if (this.selectedCards.length > 0) {
                this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
            }
        }
    }
    
    setPlayerHand(cards) {
        this.playerHand = cards;
        this.sortHand();
        this.selectedCards = [];
        this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
    }
    
    sortHand() {
        if (this.sortByRank) {
            // Sort by rank descending (A, K, Q, J, 10, 9, 8, 7, 6, 5, 4, 3, 2)
            this.playerHand.sort((a, b) => b.value - a.value);
        } else {
            // Sort by suit (Spades, Hearts, Diamonds, Clubs) then by rank descending within each suit
            const suitOrder = { 'Spades': 0, 'Hearts': 1, 'Diamonds': 2, 'Clubs': 3 };
            this.playerHand.sort((a, b) => {
                if (suitOrder[a.suit] !== suitOrder[b.suit]) {
                    return suitOrder[a.suit] - suitOrder[b.suit];
                }
                return b.value - a.value; // Within same suit, rank descending
            });
        }
    }
    
    toggleSortMode() {
        this.sortByRank = !this.sortByRank;
        this.sortHand();
        this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
        this.scene.events.emit('sortModeChanged', this.sortByRank);
    }
    
    toggleCardSelection(cardIndex) {
        Logger.log('cardSelection', `Toggling card selection for card ${cardIndex + 1}`);
        if (!this.isPlayerTurn || cardIndex >= this.playerHand.length) {
            Logger.log('cardSelection', `Cannot select card: playerTurn=${this.isPlayerTurn}, cardIndex=${cardIndex}, handLength=${this.playerHand.length}`);
            return;
        }
        
        const selectedIndex = this.selectedCards.indexOf(cardIndex);
        
        if (selectedIndex === -1) {
            // Add card to selection if we have less than 5 selected (poker hand limit)
            if (this.selectedCards.length < 5) {
                this.selectedCards.push(cardIndex);
                this.selectedCards.sort((a, b) => a - b); // Keep sorted for display
                Logger.log('cardSelection', `Card ${cardIndex + 1} selected. Selected cards:`, this.selectedCards);
            } else {
                Logger.log('cardSelection', 'Cannot select more than 5 cards');
            }
        } else {
            // Remove card from selection
            this.selectedCards.splice(selectedIndex, 1);
            Logger.log('cardSelection', `Card ${cardIndex + 1} deselected. Selected cards:`, this.selectedCards);
        }
        
        this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
    }
    
    getSelectedCards() {
        return this.selectedCards.map(index => this.playerHand[index]);
    }
    
    attackSelectedEnemy() {
        if (!this.isPlayerTurn || this.selectedCards.length === 0) return;
        
        const targetEnemy = this.enemies[this.selectedEnemyIndex];
        if (!targetEnemy || !targetEnemy.isAlive) return;
        
        // Get the 5 selected cards
        const selectedCards = this.getSelectedCards();
        
        // Evaluate poker hand
        const pokerHand = new PokerHand(selectedCards);
        const damage = this.calculateDamage(pokerHand);
        
        // Emit handPlayed event for heroes
        this.scene.events.emit('handPlayed', {
            pokerHand: pokerHand,
            selectedCards: selectedCards,
            baseDamage: damage,
            targetEnemy: targetEnemy,
            enemyCount: this.enemies.filter(e => e.isAlive).length,
            hero: this.scene.heroManager?.getActiveHero(),
            applyBonus: this.applyHandBonus.bind(this)
        });
        
        // Apply hero multiplier if hero manager exists
        let finalDamage = damage;
        if (this.scene.heroManager) {
            finalDamage = this.scene.heroManager.calculateDamageWithHero(damage, pokerHand, {
                targetEnemy: targetEnemy,
                selectedCards: selectedCards,
                enemyCount: this.enemies.filter(e => e.isAlive).length
            });
            
            // Generate mana from played cards (disabled for now)
            // this.scene.heroManager.generateManaForActiveHero(selectedCards);
        }
        
        // Show hand result
        this.displayHandResult(pokerHand, finalDamage);
        
        // Deal damage
        targetEnemy.takeDamage(finalDamage);
        
        // Remove used cards from hand and clear selection
        this.removeSelectedCards();
        this.endPlayerTurn();
    }
    
    removeSelectedCards() {
        // Remove selected cards from hand (in reverse order to maintain indices)
        this.selectedCards.sort((a, b) => b - a);
        this.selectedCards.forEach(index => {
            this.playerHand.splice(index, 1);
        });
        
        // Clear damage previews when cards are removed
        this.enemies.forEach(enemy => enemy.hideDamagePreview());
        
        this.selectedCards = [];
        this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
    }
    
    calculateDamage(pokerHand) {
        const baseDamage = this.damageTable[pokerHand.handRank] || 5;
        
        // Scale damage based on the highest card values in the hand
        const cardValueBonus = this.calculateCardValueBonus(pokerHand);
        
        // Safeguard against NaN
        const totalDamage = baseDamage + cardValueBonus;
        if (isNaN(totalDamage)) {
            console.warn('NaN damage detected:', { baseDamage, cardValueBonus, pokerHand });
            return 5; // Fallback to minimum damage
        }
        
        return Math.floor(totalDamage);
    }
    
    calculateCardValueBonus(pokerHand) {
        // Use tie breakers which contain the most important card values for each hand type
        const tieBreakers = pokerHand.tieBreakers;
        if (!tieBreakers || tieBreakers.length === 0) return 0;
        
        // Filter out any invalid values (NaN, undefined, null)
        const validTieBreakers = tieBreakers.filter(value => 
            typeof value === 'number' && !isNaN(value) && value >= 2 && value <= 14
        );
        
        if (validTieBreakers.length === 0) return 0;
        
        // For high card hands, only use the highest card value
        if (pokerHand.handRank === 1) { // HIGH_CARD
            const highestCard = validTieBreakers[0]; // First tie breaker is highest card
            return Math.max(0, highestCard - 2) * 0.75;
        }
        
        // Primary value is the most important (pair value, three-of-a-kind value, etc.)
        const primaryValue = validTieBreakers[0];
        
        // Convert card value to bonus damage
        // Ace (14) gives +9 bonus, King (13) gives +8.25, etc.
        // 2 gives +0, 3 gives +0.75, etc.
        const primaryBonus = Math.max(0, primaryValue - 2) * 0.75;
        
        // Secondary values contribute less (for kickers in pairs, two pair, etc.)
        let secondaryBonus = 0;
        for (let i = 1; i < Math.min(validTieBreakers.length, 3); i++) {
            secondaryBonus += Math.max(0, validTieBreakers[i] - 2) * 0.25;
        }
        
        return primaryBonus + secondaryBonus;
    }
    
    displayHandResult(pokerHand, finalDamage) {
        // Create floating text showing the hand type and final damage
        const resultText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            150,
            `${pokerHand.handName}\n${finalDamage} damage!`,
            {
                fontSize: '24px',
                color: '#ffff00',
                fontFamily: 'Arial',
                align: 'center',
                fontStyle: 'bold'
            }
        );
        resultText.setOrigin(0.5);
        
        // Check if hero modified damage and animate portrait if so
        const baseDamage = this.calculateDamage(pokerHand);
        const heroModified = finalDamage !== baseDamage;
        
        if (heroModified) {
            // Animate the hero portrait when attack executes
            this.animateHeroAttackBonus();
        }
        
        // Animate the result
        this.scene.tweens.add({
            targets: resultText,
            y: resultText.y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => resultText.destroy()
        });
    }
    
    animateHeroAttackBonus() {
        if (this.scene.heroManager && this.scene.heroBonusText) {
            // Animate the portrait with a brief flash
            const heroes = this.scene.heroManager.getAllHeroes();
            const activeHero = this.scene.heroManager.getActiveHero();
            const activeIndex = heroes.indexOf(activeHero);
            
            const portraitContainers = this.scene.heroPortraitsContainer.list;
            if (portraitContainers[activeIndex]) {
                const portraitContainer = portraitContainers[activeIndex];
                
                // Subtle flash animation
                this.scene.tweens.add({
                    targets: portraitContainer,
                    scaleX: { from: 1.0, to: 1.08 },
                    scaleY: { from: 1.0, to: 1.08 },
                    duration: 150,
                    yoyo: true,
                    ease: 'Power2'
                });
                
                // Animate the bonus text
                this.scene.tweens.add({
                    targets: this.scene.heroBonusText,
                    scaleX: { from: 1.0, to: 1.6 },
                    scaleY: { from: 1.0, to: 1.6 },
                    alpha: { from: 1.0, to: 0.5 },
                    duration: 300,
                    yoyo: true,
                    ease: 'Power2'
                });
            }
        }
    }
    
    drawNewHand(animate = false) {
        if (!this.scene.cardManager) return;
        
        // Keep existing cards and only draw new ones to fill to 8
        const currentHandSize = this.playerHand.length;
        const cardsToDrawCount = 8 - currentHandSize;
        
        // Track which cards are new before adding them
        const newCards = [];
        for (let i = 0; i < cardsToDrawCount; i++) {
            const card = this.scene.cardManager.drawCard();
            if (card) {
                newCards.push(card);
                this.playerHand.push(card);
            }
        }
        
        // Sort the hand after drawing new cards
        this.sortHand();
        
        // Clear selection and update display
        this.selectedCards = [];
        
        // Use direct call for animation or event for normal updates
        if (animate) {
            // Pass the new cards for selective animation
            this.scene.updateHandDisplay(this.playerHand, this.selectedCards, true, newCards);
        } else {
            this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
        }
    }
    
    endPlayerTurn() {
        this.isPlayerTurn = false;
        
        // Emit round end event for heroes
        this.scene.events.emit('roundEnd', {
            roundNumber: this.roundNumber || 1,
            enemiesRemaining: this.enemies.filter(e => e.isAlive).length
        });
        
        // Simple AI turn - just wait and return to player
        this.scene.time.delayedCall(1000, () => {
            this.startPlayerTurn();
        });
    }
    
    startPlayerTurn() {
        this.isPlayerTurn = true;
        
        // Emit round start event for heroes
        this.scene.events.emit('roundStart', {
            roundNumber: this.roundNumber || 1,
            enemyCount: this.enemies.filter(e => e.isAlive).length,
            grantExtraResources: this.grantExtraResources.bind(this),
            offerGoldSpend: this.offerGoldSpend.bind(this)
        });
        
        // Only draw new hand if player has no cards
        if (this.playerHand.length === 0) {
            // Add a flag to track if this is the initial battle start
            const isInitialBattle = !this.hasDealtInitialHand;
            this.hasDealtInitialHand = true;
            this.drawNewHand(isInitialBattle);
        }
    }
    
    // Helper method for heroes to grant extra resources
    grantExtraResources(resources) {
        if (resources.hands) {
            this.handsRemaining = (this.handsRemaining || 5) + resources.hands;
        }
        if (resources.discards) {
            this.discardsRemaining = (this.discardsRemaining || 3) + resources.discards;
        }
        // Update UI to reflect changes
        this.scene.events.emit('resourcesChanged', this.handsRemaining, this.discardsRemaining);
    }
    
    // Helper method for heroes to offer gold spending
    offerGoldSpend(options) {
        // This would typically show a UI prompt
        // For now, we'll auto-accept if player has enough gold
        const playerGold = this.scene.inventory?.getResource('gold') || 0;
        if (playerGold >= options.cost) {
            // Deduct gold and activate effect
            this.scene.inventory?.addResource('gold', -options.cost);
            if (options.onAccept) {
                options.onAccept();
            }
            return true;
        }
        return false;
    }
    
    // Helper method for heroes to apply bonuses to hands
    applyHandBonus(bonuses) {
        // This would apply chips and mult bonuses to the current hand
        // For now, we'll track them in context for display
        this.currentHandBonuses = bonuses;
    }
    
    onEnemyDied(enemy) {
        // Clear damage preview from all enemies first
        this.enemies.forEach(e => e.hideDamagePreview());
        
        // Check if all enemies are dead
        if (this.getAliveEnemies().length === 0 && !this.battleWon) {
            this.battleWon = true;
            this.onBattleWon();
            return;
        }
        
        // If current target died, select next alive enemy
        if (enemy === this.enemies[this.selectedEnemyIndex]) {
            const aliveEnemies = this.getAliveEnemies();
            if (aliveEnemies.length > 0) {
                const nextTarget = aliveEnemies[0];
                const nextIndex = this.enemies.indexOf(nextTarget);
                this.selectEnemy(nextIndex);
                
                // Clear hand preview and hero activation indicator when target dies
                this.scene.events.emit('handChanged', this.playerHand, []);
            }
        }
    }
    
    onBattleWon() {
        // Calculate total gold earned this battle
        const totalGoldEarned = this.enemies.reduce((total, enemy) => total + enemy.goldReward, 0);
        
        // Semi-transparent background overlay (separate from container)
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height);
        overlay.setScrollFactor(0);
        
        // Create victory panel container
        const victoryContainer = this.scene.add.container(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY
        );
        victoryContainer.setScrollFactor(0);
        
        // Ornate victory panel background
        const panelWidth = 600;
        const panelHeight = 300;
        const panelBg = this.scene.add.graphics();
        
        // Gradient background
        panelBg.fillGradientStyle(0x2a1810, 0x2a1810, 0x1a0f08, 0x1a0f08, 1);
        panelBg.fillRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 20);
        
        // Golden border
        panelBg.lineStyle(6, 0xd4af37, 1.0);
        panelBg.strokeRoundedRect(-panelWidth/2, -panelHeight/2, panelWidth, panelHeight, 20);
        
        // Inner border
        panelBg.lineStyle(3, 0x8b4513, 0.8);
        panelBg.strokeRoundedRect(-panelWidth/2 + 8, -panelHeight/2 + 8, panelWidth - 16, panelHeight - 16, 15);
        
        // Victory text with golden styling
        const victoryText = this.scene.add.text(
            0,
            -60,
            'VICTORY!',
            {
                fontSize: '84px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 4
            }
        );
        victoryText.setOrigin(0.5);
        
        // Gold earned with coin symbol (starts at 0 for counting animation)
        const goldText = this.scene.add.text(
            0,
            20,
            `🪙 +0`,
            {
                fontSize: '48px',
                color: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 3
            }
        );
        goldText.setOrigin(0.5);
        
        // Count up animation for gold
        let currentGold = 0;
        const goldCountTween = this.scene.tweens.addCounter({
            from: 0,
            to: totalGoldEarned,
            duration: 1500,
            delay: 500, // Start after panel slides in
            ease: 'Power2',
            onUpdate: (tween) => {
                const value = Math.floor(tween.getValue());
                if (value !== currentGold) {
                    currentGold = value;
                    goldText.setText(`🪙 +${currentGold}`);
                    
                    // Add a little bounce effect when counting
                    goldText.setScale(1.1);
                    this.scene.tweens.add({
                        targets: goldText,
                        scaleX: 1.0,
                        scaleY: 1.0,
                        duration: 100,
                        ease: 'Back.out'
                    });
                }
            },
            onComplete: () => {
                // Final bounce when counting is done
                this.scene.tweens.add({
                    targets: goldText,
                    scaleX: 1.2,
                    scaleY: 1.2,
                    duration: 200,
                    yoyo: true,
                    ease: 'Back.out'
                });
            }
        });
        
        // Continue prompt
        const continueText = this.scene.add.text(
            0,
            80,
            'Press any key to continue...',
            {
                fontSize: '24px',
                color: '#cccccc',
                fontFamily: 'Arial',
                fontStyle: 'italic'
            }
        );
        continueText.setOrigin(0.5);
        
        // Add elements to container (overlay is separate)
        victoryContainer.add([panelBg, victoryText, goldText, continueText]);
        
        // Award the gold
        this.scene.events.emit('goldEarned', totalGoldEarned);
        
        // Entrance animation - slide in from top
        victoryContainer.y = -this.scene.cameras.main.height;
        this.scene.tweens.add({
            targets: victoryContainer,
            y: this.scene.cameras.main.centerY,
            duration: 800,
            ease: 'Back.out'
        });
        
        // Gentle pulsing animation for victory text
        this.scene.tweens.add({
            targets: victoryText,
            scaleX: { from: 1.0, to: 1.1 },
            scaleY: { from: 1.0, to: 1.1 },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Pulsing continue text
        this.scene.tweens.add({
            targets: continueText,
            alpha: { from: 1.0, to: 0.4 },
            duration: 1200,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // Transition to shop after delay or any key press
        const continueHandler = () => {
            console.log('Victory screen continuing to shop...');
            this.scene.scene.start('ShopScene', {
                gold: this.scene.inventory.getResource('gold'),
                inventory: this.scene.inventory,
                partyManager: this.scene.partyManager
            });
        };
        
        // Auto-continue after 5 seconds
        this.scene.time.delayedCall(5000, continueHandler);
        
        // Manual continue with any key
        this.scene.input.keyboard.once('keydown', continueHandler);
        
        // Manual continue with click on overlay
        overlay.setInteractive(new Phaser.Geom.Rectangle(0, 0, this.scene.cameras.main.width, this.scene.cameras.main.height), Phaser.Geom.Rectangle.Contains);
        overlay.once('pointerdown', continueHandler);
        
        console.log('Victory screen created with total gold:', totalGoldEarned);
    }
    
    getAliveEnemies() {
        return this.enemies.filter(enemy => enemy.isAlive);
    }
    
    getCurrentTarget() {
        return this.enemies[this.selectedEnemyIndex];
    }
    
    getPlayerHand() {
        return this.playerHand;
    }
}