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
            this.drawNewHand();
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
        // Clear previous selection
        this.enemies.forEach(enemy => enemy.setTargeted(false));
        
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
        this.selectedCards = [];
        this.scene.events.emit('handChanged', cards, this.selectedCards);
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
        
        // Apply hero multiplier if hero manager exists
        let finalDamage = damage;
        if (this.scene.heroManager) {
            finalDamage = this.scene.heroManager.calculateDamageWithHero(damage, pokerHand, {
                targetEnemy: targetEnemy,
                selectedCards: selectedCards
            });
            
            // Generate mana from played cards
            this.scene.heroManager.generateManaForActiveHero(selectedCards);
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
    
    drawNewHand() {
        if (!this.scene.cardManager) return;
        
        // Keep existing cards and only draw new ones to fill to 8
        const currentHandSize = this.playerHand.length;
        const cardsToDrawCount = 8 - currentHandSize;
        
        for (let i = 0; i < cardsToDrawCount; i++) {
            const card = this.scene.cardManager.drawCard();
            if (card) this.playerHand.push(card);
        }
        
        // Clear selection and update display
        this.selectedCards = [];
        this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
    }
    
    endPlayerTurn() {
        this.isPlayerTurn = false;
        
        // Simple AI turn - just wait and return to player
        this.scene.time.delayedCall(1000, () => {
            this.startPlayerTurn();
        });
    }
    
    startPlayerTurn() {
        this.isPlayerTurn = true;
        // Only draw new hand if player has no cards
        if (this.playerHand.length === 0) {
            this.drawNewHand();
        }
    }
    
    onEnemyDied(enemy) {
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
            }
        }
    }
    
    onBattleWon() {
        // Calculate total gold earned this battle
        const totalGoldEarned = this.enemies.reduce((total, enemy) => total + enemy.goldReward, 0);
        
        const victoryText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY - 40,
            'VICTORY!',
            {
                fontSize: '96px',
                color: '#00ff00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        victoryText.setOrigin(0.5);
        
        // Show total gold earned
        const goldText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 40,
            `+${totalGoldEarned} gold earned!`,
            {
                fontSize: '48px',
                color: '#ffdd00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        goldText.setOrigin(0.5);
        
        // Award the gold
        this.scene.events.emit('goldEarned', totalGoldEarned);
        
        // Celebrate animation
        this.scene.tweens.add({
            targets: victoryText,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
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