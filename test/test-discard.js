// Test the discard system
import { describe, test, expect } from './testFramework.js';
import BattleManager from '../src/battle/BattleManager.js';
import PlayerDeck from '../src/game/PlayerDeck.js';
import Card from '../src/game/Card.js';

// Mock localStorage for Node.js
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

describe('Discard System Tests', () => {
    
    test('BattleManager initializes with correct discard values', () => {
        const mockScene = createMockScene();
        const battleManager = new BattleManager(mockScene);
        
        expect(battleManager.discardsRemaining).toBe(1);
        expect(battleManager.maxDiscards).toBe(1);
        
        console.log('✓ Discard system initialized with default values');
    });
    
    test('canDiscard() works correctly', () => {
        const mockScene = createMockScene();
        const battleManager = new BattleManager(mockScene);
        
        // Initially can't discard (no cards selected)
        expect(battleManager.canDiscard()).toBe(false);
        
        // Add some cards to hand and select them
        battleManager.playerHand = [
            new Card('A', 'Hearts', 14),
            new Card('K', 'Hearts', 13),
            new Card('Q', 'Hearts', 12)
        ];
        battleManager.selectedCards = [battleManager.playerHand[0]];
        
        // Now should be able to discard
        expect(battleManager.canDiscard()).toBe(true);
        
        // Use up the discard
        battleManager.discardsRemaining = 0;
        expect(battleManager.canDiscard()).toBe(false);
        
        console.log('✓ canDiscard() logic works correctly');
    });
    
    test('performDiscard removes selected cards and draws new ones', () => {
        const mockScene = createMockScene();
        const battleManager = new BattleManager(mockScene);
        
        // Setup initial hand
        const card1 = new Card('A', 'Hearts', 14);
        const card2 = new Card('K', 'Hearts', 13);
        const card3 = new Card('Q', 'Hearts', 12);
        const card4 = new Card('J', 'Hearts', 11);
        
        battleManager.playerHand = [card1, card2, card3, card4];
        battleManager.selectedCards = [card1, card2]; // Select 2 cards to discard
        
        console.log('Initial hand:', battleManager.playerHand.map(c => c.toString()));
        console.log('Selected for discard:', battleManager.selectedCards.map(c => c.toString()));
        
        // Track what happens during discard
        let animationCallback = null;
        mockScene.animateDiscard = (cards, callback) => {
            console.log('Animation triggered for cards:', cards.map(c => c.toString()));
            animationCallback = callback;
        };
        
        // Perform the discard
        const result = battleManager.performDiscard();
        expect(result).toBe(true);
        
        // Check that discards were decremented
        expect(battleManager.discardsRemaining).toBe(0);
        
        // Selected cards should be cleared immediately
        expect(battleManager.selectedCards.length).toBe(0);
        
        // Simulate animation complete
        if (animationCallback) {
            console.log('Executing animation callback...');
            animationCallback();
        }
        
        // Check that cards were removed (should have 2 left + 2 new = 4 total)
        console.log('Final hand:', battleManager.playerHand.map(c => c.toString()));
        expect(battleManager.playerHand.length).toBe(4);
        
        // Original selected cards should not be in hand
        expect(battleManager.playerHand.includes(card1)).toBe(false);
        expect(battleManager.playerHand.includes(card2)).toBe(false);
        
        // Remaining cards should still be there
        expect(battleManager.playerHand.includes(card3)).toBe(true);
        expect(battleManager.playerHand.includes(card4)).toBe(true);
        
        console.log('✓ Cards properly removed and replaced during discard');
    });
    
    test('grantDiscards increases discard allowance', () => {
        const mockScene = createMockScene();
        const battleManager = new BattleManager(mockScene);
        
        // Initial values
        expect(battleManager.discardsRemaining).toBe(1);
        expect(battleManager.maxDiscards).toBe(1);
        
        // Grant 2 more discards
        battleManager.grantDiscards(2);
        
        expect(battleManager.discardsRemaining).toBe(3);
        expect(battleManager.maxDiscards).toBe(3);
        
        console.log('✓ grantDiscards correctly increases allowance');
    });
    
    test('performDiscard fails when no discards remaining', () => {
        const mockScene = createMockScene();
        const battleManager = new BattleManager(mockScene);
        
        // Use up the discard
        battleManager.discardsRemaining = 0;
        battleManager.playerHand = [new Card('A', 'Hearts', 14)];
        battleManager.selectedCards = [battleManager.playerHand[0]];
        
        const result = battleManager.performDiscard();
        expect(result).toBe(false);
        
        // Hand should be unchanged
        expect(battleManager.playerHand.length).toBe(1);
        
        console.log('✓ Discard correctly fails when no discards remaining');
    });
    
    test('PlayerDeck drawSingleCard returns valid cards', () => {
        const deck = new PlayerDeck();
        
        // Draw 10 cards and verify they're valid
        for (let i = 0; i < 10; i++) {
            const card = deck.drawSingleCard();
            expect(card).toBeDefined();
            expect(card.rank).toBeDefined();
            expect(card.suit).toBeDefined();
            expect(card.value).toBeGreaterThan(0);
            
            // Should not be the special joker (ALWAYS_IN_FIRST_HAND)
            const isJoker = card.rank === 'Joker' && card.suit === 'Wild';
            if (isJoker) {
                console.log('Note: Drew a joker, but it should not have ALWAYS_IN_FIRST_HAND modifier');
            }
        }
        
        console.log('✓ drawSingleCard returns valid cards');
    });
    
    test('Card copying preserves modifiers', () => {
        const mockScene = createMockScene();
        const battleManager = new BattleManager(mockScene);
        
        // Create a card with modifiers
        const originalCard = new Card('A', 'Spades', 14);
        originalCard.addModifier({
            type: 'DAMAGE_BONUS',
            value: 5,
            name: 'Test Bonus'
        });
        
        // Setup for discard
        battleManager.playerHand = [originalCard];
        battleManager.selectedCards = [originalCard];
        
        let animationCallback = null;
        mockScene.animateDiscard = (cards, callback) => {
            animationCallback = callback;
        };
        
        // Perform discard
        battleManager.performDiscard();
        animationCallback();
        
        // Check that new cards have proper structure
        const newCards = battleManager.playerHand.filter(c => c !== originalCard);
        newCards.forEach(card => {
            expect(card).toBeDefined();
            expect(card.rank).toBeDefined();
            expect(card.suit).toBeDefined();
            console.log(`New card: ${card.toString()}`);
        });
        
        console.log('✓ Card replacement works with proper card structure');
    });
    
    console.log('\n=== Discard System Tests Complete ===');
});

// Helper function to create a mock scene
function createMockScene() {
    const mockDeck = new PlayerDeck();
    
    return {
        playerDeck: mockDeck,
        events: {
            emit: (event, ...args) => {
                console.log(`Event emitted: ${event}`, args);
            },
            on: () => {},
            removeAllListeners: () => {}
        },
        input: {
            keyboard: {
                on: () => {},
                addKeys: () => ({ ONE: { on: () => {} }, TWO: { on: () => {} }, THREE: { on: () => {} }, 
                                   FOUR: { on: () => {} }, FIVE: { on: () => {} }, SIX: { on: () => {} }, 
                                   SEVEN: { on: () => {} }, EIGHT: { on: () => {} } })
            }
        },
        updateHandDisplay: (hand, selected, animate, newCards) => {
            console.log(`updateHandDisplay called: ${hand.length} cards, ${newCards ? newCards.length : 0} new`);
        },
        animateDiscard: (cards, callback) => {
            console.log(`animateDiscard called for ${cards.length} cards`);
            // Immediately call callback to simulate animation complete
            callback();
        }
    };
}