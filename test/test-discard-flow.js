// Test the complete discard flow
import PlayerDeck from '../src/game/PlayerDeck.js';
import Card from '../src/game/Card.js';

// Mock localStorage
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

console.log('=== Complete Discard Flow Test ===\n');

// Simulate the exact flow that happens in the game
class MockBattleManager {
    constructor() {
        this.playerHand = [];
        this.selectedCards = [];
        this.discardsRemaining = 1;
        this.playerDeck = new PlayerDeck();
    }
    
    setupHand() {
        // Create initial 8-card hand
        this.playerHand = [
            new Card('A', 'Hearts', 14),
            new Card('K', 'Hearts', 13),
            new Card('Q', 'Hearts', 12),
            new Card('J', 'Hearts', 11),
            new Card('10', 'Hearts', 10),
            new Card('9', 'Hearts', 9),
            new Card('8', 'Hearts', 8),
            new Card('7', 'Hearts', 7)
        ];
        
        console.log('Initial hand:');
        this.playerHand.forEach((card, i) => console.log(`  ${i + 1}. ${card.toString()}`));
    }
    
    selectCards(indices) {
        this.selectedCards = indices.map(i => this.playerHand[i]);
        console.log('\nSelected cards:', this.selectedCards.map(c => c.toString()).join(', '));
    }
    
    performDiscard() {
        console.log('\n--- Performing Discard ---');
        
        if (this.discardsRemaining <= 0 || this.selectedCards.length === 0) {
            console.log('Cannot discard!');
            return false;
        }
        
        // Store cards to discard
        const cardsToDiscard = [...this.selectedCards];
        const cardsToAdd = cardsToDiscard.length;
        this.selectedCards = [];
        
        console.log('Cards to discard:', cardsToDiscard.map(c => c.toString()));
        console.log('Hand size before removal:', this.playerHand.length);
        
        // Remove cards by finding them by properties
        cardsToDiscard.forEach(card => {
            const index = this.playerHand.findIndex(handCard => 
                handCard.rank === card.rank && handCard.suit === card.suit
            );
            if (index > -1) {
                const removed = this.playerHand.splice(index, 1)[0];
                console.log(`  Removed: ${removed.toString()} at index ${index}`);
            } else {
                console.log(`  ERROR: Could not find ${card.toString()}`);
            }
        });
        
        console.log('Hand size after removal:', this.playerHand.length);
        console.log('Remaining cards:', this.playerHand.map(c => c.toString()).join(', '));
        
        // Draw new cards
        console.log('\nDrawing new cards:');
        const newCards = [];
        for (let i = 0; i < cardsToAdd; i++) {
            const newCard = this.playerDeck.drawSingleCard();
            if (newCard) {
                const cardCopy = new Card(newCard.rank, newCard.suit, newCard.value, newCard.rarity);
                newCards.push(cardCopy);
                this.playerHand.push(cardCopy);
                console.log(`  Drew: ${cardCopy.toString()}`);
            }
        }
        
        this.discardsRemaining--;
        
        console.log('\nFinal hand:');
        this.playerHand.forEach((card, i) => console.log(`  ${i + 1}. ${card.toString()}`));
        console.log('Discards remaining:', this.discardsRemaining);
        
        return true;
    }
}

// Run the test
const manager = new MockBattleManager();
manager.setupHand();
manager.selectCards([0, 1, 2]); // Select A, K, Q of Hearts
manager.performDiscard();

console.log('\n--- Second Discard Test (should fail) ---');
manager.selectCards([0, 1]); // Try to select more cards
const result = manager.performDiscard();
console.log('Second discard result:', result);

console.log('\n=== Test Complete ===');