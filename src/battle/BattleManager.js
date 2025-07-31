import PokerHand, { HAND_RANKINGS } from '../game/PokerHand.js';
import Logger from '../logging/Logger.js';
import { packManager } from '../packs/PackManager.js';
import { ChainEffects } from '../effects/ChainEffects.js';
import Card from '../game/Card.js';
import { UIConfig } from '../config/UIConfig.js';

export default class BattleManager {
    constructor(scene) {
        this.scene = scene;
        this.enemies = [];
        this.selectedEnemyIndex = 0;
        this.playerHand = [];
        this.selectedCards = [];
        this.isPlayerTurn = true;
        this.battleWon = false;
        this.gameOverScreenShown = false;
        this.victoryScreenShown = false;
        this.victoryTimeoutId = null;
        this.victoryKeyHandler = null;
        this.victoryClickHandler = null;
        this.sortByRank = true; // true = by rank, false = by suit
        this.isFirstHandOfBattle = true; // Track if this is the first hand drawn
        
        // Discard system
        this.discardsRemaining = 1; // Default 1 discard per battle
        this.maxDiscards = 1;
        
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
        
        // Clean up any lingering victory screen handlers from previous battles
        this.cleanupVictoryHandlers();
        
        // Clean up any existing event listeners first - remove ALL enemyDied listeners
        this.scene.events.removeAllListeners('enemyDied');
        
        // Listen for enemy death events (once in constructor)
        console.log('BattleManager: Setting up enemyDied event listener');
        this.scene.events.on('enemyDied', this.onEnemyDied, this);
    }
    
    cleanupVictoryHandlers() {
        console.log('Cleaning up any existing victory handlers...');
        
        // Hide any visible victory/defeat overlays
        const victoryOverlay = document.getElementById('victory-overlay');
        const defeatOverlay = document.getElementById('defeat-overlay');
        
        if (victoryOverlay) {
            victoryOverlay.style.display = 'none';
            const victoryPanel = victoryOverlay.querySelector('.glass-panel');
            if (victoryPanel) {
                victoryPanel.classList.remove('show');
            }
        }
        
        if (defeatOverlay) {
            defeatOverlay.style.display = 'none';
            const defeatPanel = defeatOverlay.querySelector('.glass-panel');
            if (defeatPanel) {
                defeatPanel.classList.remove('show');
            }
        }
        
        // Clear any victory-related timeouts that might be pending
        // Since we can't track all timeout IDs, we'll clear a reasonable range
        for (let i = 1; i < 1000; i++) {
            clearTimeout(i);
        }
        
        console.log('Victory handlers cleanup complete');
    }
    
    addEnemy(enemy) {
        console.log('Adding enemy:', enemy.name, 'Health:', enemy.currentHealth, 'isAlive:', enemy.isAlive);
        this.enemies.push(enemy);
        
        // Set first enemy as default target
        if (this.enemies.length === 1) {
            this.selectEnemy(0);
        }
        
        console.log('Total enemies:', this.enemies.length, 'Alive enemies:', this.getAliveEnemies().length);
    }
    
    setupInputHandlers() {
        // Arrow key targeting
        this.scene.input.keyboard.on('keydown-LEFT', () => {
            this.cycleTarget(-1);
        });
        
        this.scene.input.keyboard.on('keydown-RIGHT', () => {
            this.cycleTarget(1);
        });
        
        // Enter to attack with selected cards (doesn't end turn)
        this.scene.input.keyboard.on('keydown-ENTER', () => {
            this.attackSelectedEnemy();
        });
        
        // Space to end turn (triggers enemy attacks)
        this.scene.input.keyboard.on('keydown-SPACE', () => {
            if (this.isPlayerTurn) {
                this.endPlayerTurn();
            }
        });
        
        // D key to discard selected cards
        this.scene.input.keyboard.on('keydown-D', () => {
            if (this.isPlayerTurn) {
                this.performDiscard();
            }
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
        console.log('=== toggleCardSelection called ===');
        console.log('Card index:', cardIndex, 'Hand length:', this.playerHand.length);
        console.log('Is player turn:', this.isPlayerTurn);
        console.log('Call stack:', new Error().stack);
        
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
        
        console.log('Emitting handChanged event with', this.selectedCards.length, 'selected cards');
        this.scene.events.emit('handChanged', this.playerHand, this.selectedCards);
    }
    
    getSelectedCards() {
        return this.selectedCards.map(index => this.playerHand[index]);
    }
    
    attackSelectedEnemy() {
        if (!this.isPlayerTurn || this.selectedCards.length === 0) return;
        
        const targetEnemy = this.enemies[this.selectedEnemyIndex];
        if (!targetEnemy || !targetEnemy.isAlive) return;
        
        // Get the selected cards
        const selectedCards = this.getSelectedCards();
        
        // Check if any selected card has chain trait
        const chainCard = selectedCards.find(card => card.hasChain());
        
        if (chainCard) {
            // Handle chain attack
            this.executeChainAttack(chainCard, selectedCards, targetEnemy);
        } else {
            // Handle normal attack
            this.executeNormalAttack(selectedCards, targetEnemy);
        }
    }
    
    async executeChainAttack(chainCard, selectedCards, targetEnemy) {
        console.log('Executing chain attack with', chainCard.toString());
        
        // Store reference to chain card in container for visual effects
        const chainCardIndex = this.selectedCards[selectedCards.indexOf(chainCard)];
        if (this.scene.cardContainers && this.scene.cardContainers[chainCardIndex]) {
            this.scene.cardContainers[chainCardIndex].chainCard = chainCard;
        }
        
        const chainData = chainCard.getChainData();
        const maxChainLinks = chainData.maxChainLinks || 3;
        
        // Break down the selected cards into individual chain links
        const chainHands = this.createChainLinks(selectedCards, targetEnemy);
        
        // Get additional hands from remaining cards if we have room
        const remainingCards = this.playerHand.filter((card, index) => !this.selectedCards.includes(index));
        const additionalHands = this.findChainableHands(remainingCards, Math.max(0, maxChainLinks - chainHands.length));
        
        // Combine all chain links
        const allHands = [
            ...chainHands,
            ...additionalHands.map(handData => ({
                handName: handData.hand.handName,
                damage: this.calculateDamageWithHero(handData.hand, targetEnemy, handData.cards),
                cards: handData.cards,
                isPrimary: false
            }))
        ];
        
        const totalDamage = allHands.reduce((sum, hand) => sum + hand.damage, 0);
        
        console.log(`Chain attack: ${allHands.length} links, ${totalDamage} total damage`);
        console.log('Chain links:', allHands.map(h => `${h.handName} (${h.damage})`).join(', '));
        
        // Show chain result
        this.displayChainResult(chainCard, allHands, totalDamage);
        
        // Execute dramatic chain attack with visual effects
        const chainEffectResult = await ChainEffects.executeChainAttack(
            this.scene, 
            chainCard, 
            allHands, 
            totalDamage, 
            targetEnemy
        );
        
        // Clean up chain text effects before removing cards
        this.cleanupChainEffects();
        
        // Remove all used cards from hand
        this.removeSelectedCards();
        additionalHands.forEach(handData => {
            this.removeCardsFromHand(handData.cards);
        });
        
        // Clean up chain effect after battle turn
        this.scene.time.delayedCall(3000, () => {
            if (chainEffectResult && chainEffectResult.cleanup) {
                chainEffectResult.cleanup();
            }
        });
    }
    
    // Break down selected cards into individual chain links
    createChainLinks(selectedCards, targetEnemy) {
        const chainLinks = [];
        const remainingCards = [...selectedCards];
        
        // Remove the chain card from consideration for individual links
        const chainCardIndex = remainingCards.findIndex(card => card.hasChain && card.hasChain());
        let chainCard = null;
        if (chainCardIndex !== -1) {
            chainCard = remainingCards.splice(chainCardIndex, 1)[0];
        }
        
        // Always break down into individual chain links for dramatic effect
        // Only keep cards together if they form a very strong poker hand (three of a kind or better)
        if (remainingCards.length >= 3) {
            const fullHand = new PokerHand([...remainingCards]);
            console.log(`Chain debug: ${remainingCards.length} cards, hand type: ${fullHand.handType}`);
            
            if (fullHand.handType === 'THREE_OF_A_KIND' || 
                fullHand.handType === 'STRAIGHT' || 
                fullHand.handType === 'FLUSH' || 
                fullHand.handType === 'FULL_HOUSE' || 
                fullHand.handType === 'FOUR_OF_A_KIND' || 
                fullHand.handType === 'STRAIGHT_FLUSH' || 
                fullHand.handType === 'ROYAL_FLUSH') {
                // Only for very strong hands - keep together
                console.log('Chain: Keeping strong hand together');
                chainLinks.push({
                    handName: fullHand.handName,
                    damage: this.calculateDamageWithHero(fullHand, targetEnemy, remainingCards),
                    cards: remainingCards,
                    isPrimary: true
                });
                
                // Add chain card as separate final link
                if (chainCard) {
                    const chainCardHand = new PokerHand([chainCard]);
                    const chainDamage = this.calculateDamageWithHero(chainCardHand, targetEnemy, [chainCard]);
                    
                    chainLinks.push({
                        handName: `★ Wild Chain`,
                        damage: chainDamage,
                        cards: [chainCard],
                        isPrimary: false
                    });
                }
                
                return chainLinks;
            }
        }
        
        // Break down into individual card hits
        remainingCards.forEach((card, index) => {
            const cardAsHand = new PokerHand([card]);
            const damage = this.calculateDamageWithHero(cardAsHand, targetEnemy, [card]);
            
            chainLinks.push({
                handName: `${card.rank} of ${card.suit}`,
                damage: damage,
                cards: [card],
                isPrimary: index === 0
            });
        });
        
        // Add chain card as final link if it exists
        if (chainCard) {
            const chainCardHand = new PokerHand([chainCard]);
            const chainDamage = this.calculateDamageWithHero(chainCardHand, targetEnemy, [chainCard]);
            
            chainLinks.push({
                handName: `★ Wild Chain`,
                damage: chainDamage,
                cards: [chainCard],
                isPrimary: false
            });
        }
        
        return chainLinks;
    }
    
    executeNormalAttack(selectedCards, targetEnemy) {
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
        
        // Check for special attack animations and trigger them
        const hasSpecialAttacks = selectedCards.some(card => card.hasSpecialAttack());
        
        this.triggerSpecialAttacks(selectedCards, targetEnemy).then(() => {
            // Deal damage after animations complete
            targetEnemy.takeDamage(finalDamage, { isSpecialAttack: hasSpecialAttacks });
            
            // Apply vampirism healing to all heroes
            if (this.scene.heroManager) {
                this.scene.heroManager.getAllHeroes().forEach(hero => {
                    if (hero.isAlive()) {
                        hero.applyVampirism(finalDamage);
                    }
                });
            }
            
            // Remove used cards from hand and clear selection
            this.removeSelectedCards();
        });
    }
    
    // Helper method to calculate damage with hero multipliers
    calculateDamageWithHero(pokerHand, targetEnemy, selectedCards) {
        const baseDamage = this.calculateDamage(pokerHand);
        
        if (this.scene.heroManager) {
            return this.scene.heroManager.calculateDamageWithHero(baseDamage, pokerHand, {
                targetEnemy: targetEnemy,
                selectedCards: selectedCards,
                enemyCount: this.enemies.filter(e => e.isAlive).length
            });
        }
        
        return baseDamage;
    }
    
    // Find additional hands that can be chained from remaining cards
    findChainableHands(remainingCards, maxLinks) {
        const chainableHands = [];
        const usedCardIndices = new Set();
        
        // Sort remaining cards by value for better hand finding
        const sortedCards = remainingCards.map((card, index) => ({ card, originalIndex: index }))
            .sort((a, b) => b.card.value - a.card.value);
        
        for (let linkCount = 0; linkCount < maxLinks && sortedCards.length >= 1; linkCount++) {
            // Try to find the best hand from remaining unused cards
            const availableCards = sortedCards.filter(cardData => !usedCardIndices.has(cardData.originalIndex));
            
            if (availableCards.length === 0) break;
            
            // Try different hand sizes (1-5 cards)
            let bestHand = null;
            let bestHandCards = null;
            let bestHandValue = 0;
            
            for (let handSize = Math.min(5, availableCards.length); handSize >= 1; handSize--) {
                // Try combinations of handSize cards
                const combinations = this.getCombinations(availableCards, handSize);
                
                for (const combination of combinations) {
                    const cards = combination.map(cardData => cardData.card);
                    const hand = new PokerHand(cards);
                    const handValue = HAND_RANKINGS[hand.handType] || 0;
                    
                    if (handValue > bestHandValue || (handValue === bestHandValue && handSize > bestHandCards?.length)) {
                        bestHand = hand;
                        bestHandCards = combination;
                        bestHandValue = handValue;
                    }
                }
            }
            
            if (bestHand && bestHandCards) {
                chainableHands.push({
                    hand: bestHand,
                    cards: bestHandCards.map(cardData => cardData.card)
                });
                
                // Mark these cards as used
                bestHandCards.forEach(cardData => usedCardIndices.add(cardData.originalIndex));
            } else {
                break; // No more valid hands can be formed
            }
        }
        
        return chainableHands;
    }
    
    // Get all combinations of specified size from array
    getCombinations(array, size) {
        if (size === 1) return array.map(item => [item]);
        if (size > array.length) return [];
        
        const combinations = [];
        for (let i = 0; i <= array.length - size; i++) {
            const head = array[i];
            const tailCombinations = this.getCombinations(array.slice(i + 1), size - 1);
            tailCombinations.forEach(tail => combinations.push([head, ...tail]));
        }
        return combinations;
    }
    
    // Remove specific cards from hand
    removeCardsFromHand(cardsToRemove) {
        cardsToRemove.forEach(cardToRemove => {
            const index = this.playerHand.findIndex(card => 
                card.rank === cardToRemove.rank && 
                card.suit === cardToRemove.suit &&
                card.cardId === cardToRemove.cardId
            );
            if (index !== -1) {
                this.playerHand.splice(index, 1);
            }
        });
        
        // Update hand display
        this.scene.events.emit('handChanged', this.playerHand, []);
    }
    
    // Display chain result
    displayChainResult(chainCard, allHands, totalDamage) {
        const chainText = `${chainCard.rank} Chain: ${allHands.length} Links`;
        const damageText = `Total: ${totalDamage} damage`;
        
        console.log(chainText);
        console.log('Chain hands:', allHands.map(h => `${h.handName} (${h.damage})`).join(', '));
        
        // You could add UI display here similar to displayHandResult
    }
    
    // Clean up chain text effects from card containers
    cleanupChainEffects() {
        if (this.scene.cardContainers) {
            this.scene.cardContainers.forEach(cardContainer => {
                if (cardContainer && cardContainer.chainTextEffect) {
                    cardContainer.chainTextEffect.cleanup();
                    cardContainer.chainTextEffect = null;
                }
            });
        }
    }
    
    // Trigger special attack animations for cards that have them
    async triggerSpecialAttacks(cards, targetEnemy) {
        const specialAttackPromises = [];
        
        // Iterate through selected card indices to get the correct card containers
        for (let i = 0; i < this.selectedCards.length; i++) {
            const cardIndex = this.selectedCards[i];
            const card = cards[i]; // cards parameter contains the actual selected cards
            
            if (card.hasSpecialAttack()) {
                // Get the card sprite from the scene for animation using the original hand index
                const cardSprite = this.getCardSprite(cardIndex);
                
                if (cardSprite) {
                    // For now, single target - but could be extended for AOE
                    const animationPromise = card.triggerSpecialAttack(this.scene, cardSprite, targetEnemy);
                    specialAttackPromises.push(animationPromise);
                }
            }
        }
        
        // Wait for all special attack animations to complete
        await Promise.all(specialAttackPromises);
    }
    
    // Helper method to get card sprite by index
    getCardSprite(cardIndex) {
        // Get the card container from the scene
        if (this.scene.cardContainers && this.scene.cardContainers[cardIndex]) {
            return this.scene.cardContainers[cardIndex];
        }
        return null;
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
        
        // Add card modifier bonuses
        const modifierBonus = this.calculateModifierBonus(pokerHand.cards);
        
        // Safeguard against NaN
        const totalDamage = baseDamage + cardValueBonus + modifierBonus;
        if (isNaN(totalDamage)) {
            console.warn('NaN damage detected:', { baseDamage, cardValueBonus, modifierBonus, pokerHand });
            return 5; // Fallback to minimum damage
        }
        
        return Math.floor(totalDamage);
    }

    calculateModifierBonus(cards) {
        let bonus = 0;
        
        cards.forEach(card => {
            // Add damage bonus from card modifiers
            if (card.damageBonus) {
                bonus += card.damageBonus;
            }
            
            // Handle special modifier effects
            card.modifiers.forEach(modifier => {
                switch (modifier.type) {
                    case 'DRAW_EXTRA_CARD':
                        // This will be handled elsewhere but could add small bonus
                        break;
                    // Add more modifier types as needed
                }
            });
        });
        
        return bonus;
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
        if (!this.scene.playerDeck) return;
        
        // Draw a fresh hand from the player deck (includes special card handling)
        this.playerHand = this.scene.playerDeck.drawHand(8, this.isFirstHandOfBattle);
        
        // After drawing the first hand, set flag to false
        if (this.isFirstHandOfBattle) {
            this.isFirstHandOfBattle = false;
        }
        
        // Sort the hand after drawing new cards  
        this.sortHand();
        
        // Clear selection and update display
        this.selectedCards = [];
        
        // Use direct call for animation or event for normal updates
        if (animate) {
            // Animate all cards since we drew a fresh hand
            this.scene.updateHandDisplay(this.playerHand, this.selectedCards, true, this.playerHand);
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
        
        // Start enemy turn
        this.startEnemyTurn();
    }
    
    startEnemyTurn() {
        console.log('Starting enemy turn...');
        const aliveEnemies = this.getAliveEnemies();
        
        if (aliveEnemies.length === 0) {
            // No enemies left, return to player turn
            this.startPlayerTurn();
            return;
        }
        
        // Each alive enemy attacks in sequence
        this.processEnemyAttacks(aliveEnemies, 0);
    }
    
    processEnemyAttacks(enemies, enemyIndex) {
        if (enemyIndex >= enemies.length) {
            // All enemies have attacked, return to player turn
            this.scene.time.delayedCall(800, () => {
                this.startPlayerTurn();
            });
            return;
        }
        
        const enemy = enemies[enemyIndex];
        if (!enemy.isAlive) {
            // Skip dead enemies
            this.processEnemyAttacks(enemies, enemyIndex + 1);
            return;
        }
        
        // Enemy performs attack
        this.performEnemyAttack(enemy, () => {
            // After this enemy's attack, move to next enemy
            this.scene.time.delayedCall(600, () => {
                this.processEnemyAttacks(enemies, enemyIndex + 1);
            });
        });
    }
    
    performEnemyAttack(enemy, onComplete) {
        console.log(`${enemy.name} is attacking!`);
        
        // Calculate enemy damage (simple for now)
        const damage = this.calculateEnemyDamage(enemy);
        
        // Choose target hero (random for now, could be smarter later)
        const aliveHeroes = this.getAliveHeroes();
        if (aliveHeroes.length === 0) {
            // No heroes left - game over
            console.log('All heroes defeated!');
            this.onGameOver();
            return;
        }
        
        const targetHero = aliveHeroes[Math.floor(Math.random() * aliveHeroes.length)];
        
        // Show attack animation and damage
        this.showEnemyAttackEffect(enemy, targetHero, damage, () => {
            // Apply damage to hero (with equipment effects)
            const actualDamage = targetHero.takeDamage(damage);
            
            // Check if hero died from damage
            if (!targetHero.isAlive()) {
                this.handleHeroDeath(targetHero);
            }
            
            // Update hero display
            this.scene.updateHeroPortraits();
            
            // Check for game over after hero takes damage
            if (this.getAliveHeroes().length === 0) {
                console.log('Last hero defeated! Game Over!');
                this.onGameOver();
                return;
            }
            
            onComplete();
        });
    }
    
    calculateEnemyDamage(enemy) {
        // Simple damage calculation based on enemy type
        let baseDamage = 15; // Default damage
        
        if (enemy.name === 'Goblin') baseDamage = 12;
        else if (enemy.name === 'Orc') baseDamage = 18;
        else if (enemy.name === 'Troll') baseDamage = 25;
        
        // Add some randomness (±3 damage)
        const variance = Math.floor(Math.random() * 7) - 3;
        return Math.max(1, baseDamage + variance);
    }
    
    showEnemyAttackEffect(enemy, targetHero, damage, onComplete) {
        // Visual attack effect - enemy briefly grows and shows damage text
        const originalScale = enemy.sprite ? (enemy.sprite.scaleX || 1) : 1;
        
        if (enemy.sprite) {
            // Enemy attack animation - brief grow
            this.scene.tweens.add({
                targets: enemy.sprite,
                scaleX: originalScale * 1.15,
                scaleY: originalScale * 1.15,
                duration: 200,
                yoyo: true,
                ease: 'Power2'
            });
        }
        
        // Show damage text on hero
        const heroIndex = this.scene.heroManager.getAllHeroes().indexOf(targetHero);
        const portraitContainers = this.scene.heroPortraitsContainer.list;
        
        if (portraitContainers[heroIndex]) {
            const portraitContainer = portraitContainers[heroIndex];
            const worldPos = portraitContainer.getWorldTransformMatrix();
            
            const damageText = this.scene.add.text(
                this.scene.heroPortraitsContainer.x + portraitContainer.x,
                this.scene.heroPortraitsContainer.y + portraitContainer.y - 50,
                `-${damage}`,
                {
                    fontSize: '36px',
                    color: '#ff4444',
                    fontFamily: 'Arial',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 2
                }
            );
            damageText.setOrigin(0.5);
            damageText.setScrollFactor(0);
            
            // Animate damage text
            this.scene.tweens.add({
                targets: damageText,
                y: damageText.y - 60,
                alpha: 0,
                duration: 1200,
                ease: 'Power2',
                onComplete: () => damageText.destroy()
            });
            
            // Flash the hero portrait red
            if (portraitContainers[heroIndex]) {
                const portrait = portraitContainers[heroIndex];
                // Find the actual image within the container
                const portraitImage = portrait.list.find(child => child.texture);
                if (portraitImage) {
                    this.scene.tweens.add({
                        targets: portraitImage,
                        tint: 0xff4444,
                        duration: 150,
                        yoyo: true,
                        onComplete: () => {
                            portraitImage.clearTint();
                        }
                    });
                }
            }
        }
        
        // Complete after animation
        this.scene.time.delayedCall(800, onComplete);
    }
    
    getAliveHeroes() {
        if (!this.scene.heroManager) return [];
        return this.scene.heroManager.getAllHeroes().filter(hero => hero.currentHealth > 0);
    }
    
    startPlayerTurn() {
        // Don't start player turn if there are no enemies (battle not properly initialized)
        if (this.enemies.length === 0) {
            console.log('Cannot start player turn: no enemies loaded yet');
            return;
        }
        
        this.isPlayerTurn = true;
        console.log('Starting player turn with', this.enemies.length, 'enemies,', this.getAliveEnemies().length, 'alive');
        
        // Emit round start event for heroes
        this.scene.events.emit('roundStart', {
            roundNumber: this.roundNumber || 1,
            enemyCount: this.enemies.filter(e => e.isAlive).length,
            grantExtraResources: this.grantExtraResources.bind(this),
            offerGoldSpend: this.offerGoldSpend.bind(this)
        });
        
        // Always draw cards to fill hand back to 8 at start of turn
        if (this.playerHand.length < 8) {
            // Always animate when drawing cards at start of turn
            this.drawNewHand(true);
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
        console.log('=== onEnemyDied called ===');
        console.log('Enemy died:', enemy.name, 'Alive enemies remaining:', this.getAliveEnemies().length);
        console.log('All enemies status:', this.enemies.map(e => ({ name: e.name, isAlive: e.isAlive, health: e.currentHealth })));
        console.log('Call stack:', new Error().stack);
        
        // Clear damage preview from all enemies first
        this.enemies.forEach(e => e.hideDamagePreview());
        
        // Check if all enemies are dead (but only if we actually have enemies)
        const aliveEnemies = this.getAliveEnemies();
        console.log('Victory check: total enemies =', this.enemies.length, 'alive enemies =', aliveEnemies.length, 'battleWon =', this.battleWon);
        
        if (this.enemies.length > 0 && aliveEnemies.length === 0 && !this.battleWon) {
            console.log('All enemies defeated! Showing victory screen...');
            console.log('Enemy states:', this.enemies.map(e => ({name: e.name, isAlive: e.isAlive, health: e.currentHealth})));
            console.log('About to call onBattleWon()');
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
        console.log('=== onBattleWon() called ===');
        console.log('Victory screen shown flag:', this.victoryScreenShown);
        console.log('Call stack:', new Error().stack);
        
        // Prevent multiple victory screens
        if (this.victoryScreenShown) {
            console.log('Victory screen already shown, ignoring duplicate call');
            return;
        }
        this.victoryScreenShown = true;
        
        // Disable player input during victory screen
        this.isPlayerTurn = false;
        
        // Calculate total gold earned this battle
        const totalGoldEarned = this.enemies.reduce((total, enemy) => total + enemy.goldReward, 0);
        
        // Check debug configuration for victory screen
        if (!UIConfig.debug.showVictoryScreen) {
            console.log('Victory screen disabled by debug config, proceeding directly to shop...');
            // Award gold directly (as the normal victory screen does)
            this.scene.inventory.addResource('gold', totalGoldEarned);
            
            // Proceed to shop scene after a brief delay (same as normal flow)
            this.scene.time.delayedCall(500, () => {
                this.scene.scene.start('ShopScene', {
                    gold: this.scene.inventory.getResource('gold'),
                    inventory: this.scene.inventory,
                    heroManager: this.scene.heroManager
                });
            });
            return;
        }
        
        // Show CSS glassmorphism victory overlay
        const victoryOverlay = document.getElementById('victory-overlay');
        const victoryGoldElement = document.getElementById('victory-gold');
        const victoryPanel = victoryOverlay.querySelector('.glass-panel');
        
        // Position overlay to match canvas bounds
        this.positionOverlayToCanvas(victoryOverlay);
        
        // Show overlay
        victoryOverlay.style.display = 'block';
        
        // Animate panel in
        setTimeout(() => {
            victoryPanel.classList.add('show');
        }, 100);
        
        // Animate gold counting
        let currentGold = 0;
        const goldInterval = setInterval(() => {
            currentGold += Math.ceil(totalGoldEarned / 30); // Count up over ~1 second
            if (currentGold >= totalGoldEarned) {
                currentGold = totalGoldEarned;
                clearInterval(goldInterval);
            }
            victoryGoldElement.textContent = `+ ${currentGold} gold`;
        }, 40);
        
        // Award the gold
        this.scene.events.emit('goldEarned', totalGoldEarned);
        
        // Sometimes award a pack as bonus reward (20% chance)
        const packReward = Math.random() < 0.2;
        if (packReward) {
            this.awardPackReward();
        }
        
        // Clean up any existing victory handlers first
        if (this.victoryTimeoutId) {
            clearTimeout(this.victoryTimeoutId);
        }
        if (this.victoryKeyHandler) {
            document.removeEventListener('keydown', this.victoryKeyHandler);
        }
        if (this.victoryClickHandler) {
            const oldOverlay = document.getElementById('victory-overlay');
            if (oldOverlay) {
                oldOverlay.removeEventListener('click', this.victoryClickHandler);
            }
        }
        
        // Transition to shop after delay or any key press
        const continueHandler = () => {
            console.log('Victory screen continuing to shop...');
            // Hide overlay
            victoryOverlay.style.display = 'none';
            victoryPanel.classList.remove('show');
            // Clear event listeners
            document.removeEventListener('keydown', continueHandler);
            victoryOverlay.removeEventListener('click', continueHandler);
            
            // Clear our stored handlers
            this.victoryTimeoutId = null;
            this.victoryKeyHandler = null;
            this.victoryClickHandler = null;
            
            this.scene.scene.start('ShopScene', {
                gold: this.scene.inventory.getResource('gold'),
                inventory: this.scene.inventory,
                partyManager: this.scene.partyManager,
                heroManager: this.scene.heroManager,
                playerDeck: this.scene.playerDeck
            });
        };
        
        // Store handlers for cleanup
        this.victoryKeyHandler = continueHandler;
        this.victoryClickHandler = continueHandler;
        
        // Longer auto-continue delay to prevent immediate transition
        this.victoryTimeoutId = setTimeout(continueHandler, 8000);
        
        // Delay manual continue to allow victory screen to fully appear
        setTimeout(() => {
            // Manual continue with any key (after delay)
            document.addEventListener('keydown', continueHandler, { once: true });
            
            // Manual continue with click on overlay (after delay)
            victoryOverlay.addEventListener('click', continueHandler, { once: true });
        }, 1500);
        
        console.log('Victory screen created with total gold:', totalGoldEarned);
    }
    
    awardPackReward() {
        console.log('Awarding pack reward!');
        
        // Get a battle reward pack
        const rewardPack = packManager.createBattleRewardPack();
        
        // Show pack reward notification
        const screenWidth = this.scene.cameras.main.width;
        const packText = this.scene.add.text(
            screenWidth / 2,
            this.scene.cameras.main.height / 2 + 100,
            `Bonus Pack Reward!\n${rewardPack.name}`,
            {
                fontSize: '32px',
                color: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        packText.setOrigin(0.5);
        
        // Animate pack reward text
        this.scene.tweens.add({
            targets: packText,
            y: packText.y - 60,
            alpha: 0,
            duration: 3000,
            ease: 'Power2',
            onComplete: () => packText.destroy()
        });
        
        // Launch pack opening scene after a short delay
        this.scene.time.delayedCall(2000, () => {
            this.scene.scene.launch('PackOpeningScene', {
                pack: rewardPack,
                inventory: this.scene.inventory,
                playerDeck: this.scene.playerDeck,
                onComplete: (revealedCards) => {
                    console.log('Battle reward pack opened! Revealed cards:', revealedCards);
                }
            });
        });
    }
    
    onGameOver() {
        // Prevent multiple game over screens
        if (this.gameOverScreenShown) {
            console.log('Game over screen already shown, ignoring duplicate call');
            return;
        }
        this.gameOverScreenShown = true;
        
        // Disable player input during game over screen
        this.isPlayerTurn = false;
        
        // Show CSS glassmorphism defeat overlay
        const defeatOverlay = document.getElementById('defeat-overlay');
        const defeatPanel = defeatOverlay.querySelector('.glass-panel');
        
        // Position overlay to match canvas bounds
        this.positionOverlayToCanvas(defeatOverlay);
        
        // Show overlay
        defeatOverlay.style.display = 'block';
        
        // Animate panel in
        setTimeout(() => {
            defeatPanel.classList.add('show');
        }, 100);
        
        // Restart game after delay or any key press
        const restartHandler = () => {
            console.log('Game over screen restarting battle...');
            // Hide overlay
            defeatOverlay.style.display = 'none';
            defeatPanel.classList.remove('show');
            // Clear event listeners
            document.removeEventListener('keydown', restartHandler);
            defeatOverlay.removeEventListener('click', restartHandler);
            this.scene.scene.start('BattleScene');
        };
        
        // Auto-restart delay
        setTimeout(restartHandler, 10000);
        
        // Delay manual restart to allow game over screen to fully appear
        setTimeout(() => {
            // Manual restart with any key (after delay)
            document.addEventListener('keydown', restartHandler, { once: true });
            
            // Manual restart with click on overlay (after delay)
            defeatOverlay.addEventListener('click', restartHandler, { once: true });
        }, 1500);
        
        console.log('Game over screen created');
    }
    
    positionOverlayToCanvas(overlay) {
        // Get the actual canvas element
        const canvas = this.scene.game.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        
        // Position overlay to exactly match the canvas bounds with slight inset to avoid blur bleeding
        overlay.style.position = 'fixed';
        overlay.style.top = `${canvasRect.top + 2}px`;
        overlay.style.left = `${canvasRect.left + 2}px`;
        overlay.style.width = `${canvasRect.width - 4}px`;
        overlay.style.height = `${canvasRect.height - 4}px`;
        overlay.style.borderRadius = '6px'; // Slightly smaller to match inset
        overlay.style.overflow = 'hidden'; // Contain blur effect
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
    
    // Discard system methods
    canDiscard() {
        return this.discardsRemaining > 0 && this.selectedCards.length > 0;
    }
    
    performDiscard() {
        if (!this.canDiscard()) {
            console.log('Cannot discard: no discards remaining or no cards selected');
            return false;
        }
        
        console.log(`[DISCARD] Starting discard process...`);
        console.log(`[DISCARD] Selected card indices (${this.selectedCards.length}):`, this.selectedCards);
        console.log(`[DISCARD] Current hand size: ${this.playerHand.length}`);
        
        // Convert indices to actual card objects
        const cardsToDiscard = this.selectedCards.map(index => this.playerHand[index]).filter(card => card);
        const cardsToAdd = cardsToDiscard.length;
        
        console.log(`[DISCARD] Cards to discard:`, cardsToDiscard.map(c => c.toString()));
        
        // Clear selection
        this.selectedCards = [];
        
        console.log(`[DISCARD] Will discard ${cardsToAdd} cards`);
        
        // Use up one discard immediately (before animation)
        this.discardsRemaining--;
        this.scene.events.emit('discardsChanged', this.discardsRemaining, this.maxDiscards);
        
        // Animate discard before removing cards
        console.log(`[DISCARD] Starting animation...`);
        this.scene.animateDiscard(cardsToDiscard, () => {
            console.log('Animation complete, removing cards from hand');
            console.log('Hand before removal:', this.playerHand.length);
            
            // After animation, remove cards from hand
            cardsToDiscard.forEach(card => {
                // Find card by properties, not reference
                const index = this.playerHand.findIndex(handCard => 
                    handCard.rank === card.rank && handCard.suit === card.suit
                );
                if (index > -1) {
                    this.playerHand.splice(index, 1);
                    console.log(`Removed card: ${card.toString()}`);
                } else {
                    console.warn(`Could not find card to remove: ${card.toString()}`);
                }
            });
            
            console.log('Hand after removal:', this.playerHand.length);
            
            // Draw new cards from deck to replace discarded ones
            if (this.scene.playerDeck) {
                console.log(`[DISCARD] Drawing ${cardsToAdd} new cards...`);
                const newCards = [];
                for (let i = 0; i < cardsToAdd; i++) {
                    // Draw a single card
                    const newCard = this.scene.playerDeck.drawSingleCard();
                    if (newCard) {
                        // Create a new instance of the card to avoid duplicates
                        const cardCopy = new Card(newCard.rank, newCard.suit, newCard.value, newCard.rarity);
                        
                        // Copy any modifiers
                        if (newCard.modifiers) {
                            newCard.modifiers.forEach(mod => {
                                cardCopy.addModifier({ ...mod });
                            });
                        }
                        
                        newCards.push(cardCopy);
                        this.playerHand.push(cardCopy);
                        console.log(`[DISCARD] Drew: ${cardCopy.toString()}`);
                    } else {
                        console.warn(`[DISCARD] Failed to draw card ${i + 1}`);
                    }
                }
                
                console.log(`[DISCARD] Final hand size: ${this.playerHand.length}`);
                console.log(`[DISCARD] New cards: ${newCards.map(c => c.toString()).join(', ')}`);
                
                // Sort the hand after adding new cards
                this.sortHand();
                
                // Update display with new cards
                console.log(`[DISCARD] Updating hand display...`);
                this.scene.updateHandDisplay(this.playerHand, this.selectedCards, true, newCards);
            } else {
                console.error(`[DISCARD] No playerDeck available!`);
            }
        });
        
        console.log(`[DISCARD] Process initiated. Remaining discards: ${this.discardsRemaining}`);
        return true;
    }
    
    // Method for effects/items to grant additional discards
    grantDiscards(amount) {
        this.discardsRemaining += amount;
        this.maxDiscards += amount;
        this.scene.events.emit('discardsChanged', this.discardsRemaining, this.maxDiscards);
    }
    
    // Handle hero death
    handleHeroDeath(hero) {
        console.log(`Hero ${hero.name} has died!`);
        
        // Show death effect
        if (this.scene.events) {
            this.scene.events.emit('heroDied', {
                hero: hero,
                timestamp: Date.now()
            });
        }
        
        // Check if all heroes are dead (game over condition)
        if (this.scene.heroManager) {
            const aliveHeroes = this.scene.heroManager.getAllHeroes().filter(h => h.isAlive());
            if (aliveHeroes.length === 0) {
                this.handleGameOver();
            }
        }
    }
    
    // Handle game over
    handleGameOver() {
        console.log('Game Over - All heroes died!');
        
        // Show game over screen
        this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            'GAME OVER',
            {
                fontSize: '72px',
                color: '#ff0000',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(2000);
        
        // Restart button
        const restartButton = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY + 100,
            'Click to Restart',
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        ).setOrigin(0.5).setDepth(2000);
        
        restartButton.setInteractive({ useHandCursor: true });
        restartButton.on('pointerdown', () => {
            this.scene.scene.restart();
        });
    }
}