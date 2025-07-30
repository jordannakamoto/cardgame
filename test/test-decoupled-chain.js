// Test the decoupled chain system for persistence across battles
import { describe, test as it, expect } from './testFramework.js';
import Card from '../src/game/Card.js';
import PlayerDeck from '../src/game/PlayerDeck.js';
import { cardTraitRegistry, BuiltInTraits } from '../src/game/CardTraitRegistry.js';
import StarterHero from '../src/heroes/heroes/StarterHero.js';

describe('Decoupled Chain System', () => {
    let playerDeck;
    let starterHero;
    let mockBattleScene;
    
    function setupTest() {
        // Reset the trait registry
        cardTraitRegistry.traitProviders.clear();
        cardTraitRegistry.globalTraits.clear();
        cardTraitRegistry.activeTraits.clear();
        
        // Re-register built-in traits
        Object.entries(BuiltInTraits).forEach(([type, implementation]) => {
            cardTraitRegistry.registerGlobalTrait(type, implementation);
        });
        
        // Create test objects
        playerDeck = new PlayerDeck();
        starterHero = new StarterHero();
        
        // Mock battle scene
        mockBattleScene = {
            partyManager: {
                getAllHeroes: () => [starterHero]
            }
        };
        
        console.log('Test setup completed');
    }
    
    it('should register chain trait provider when hero is created', () => {
        setupTest();
        
        // Hero should auto-register traits during setupAbilities
        const traitProviders = Array.from(cardTraitRegistry.traitProviders.keys());
        expect(traitProviders).toContain('starter_hero');
        
        const starterTraits = cardTraitRegistry.traitProviders.get('starter_hero');
        expect(starterTraits).toBeDefined();
        expect(starterTraits.length).toBe(1);
        expect(starterTraits[0].criteria.rank).toBe('Joker');
        expect(starterTraits[0].trait.type).toBe('CHAIN');
        
        console.log('✓ Chain trait provider registered correctly');
    });
    
    it('should apply chain traits to joker cards during battle initialization', () => {
        setupTest();
        
        // Get all cards from deck (should include joker)
        const allCards = playerDeck.getAllCards();
        const jokerCards = allCards.filter(card => card.rank === 'Joker' && card.suit === 'Wild');
        
        expect(jokerCards.length).toBe(1);
        console.log('Found joker card:', jokerCards[0].toString());
        
        // Initially joker should not have chain trait
        expect(jokerCards[0].hasChain()).toBeFalsy();
        
        // Simulate battle initialization
        cardTraitRegistry.initializeForBattle(allCards, [starterHero]);
        
        // Now joker should have chain trait
        expect(jokerCards[0].hasChain()).toBeTruthy();
        const chainData = jokerCards[0].getChainData();
        expect(chainData.heroId).toBe('starter_hero');
        expect(chainData.maxChainLinks).toBe(3);
        
        console.log('✓ Chain trait applied during battle initialization');
    });
    
    it('should persist chain traits across multiple battle initializations', () => {
        setupTest();
        
        const allCards = playerDeck.getAllCards();
        const jokerCard = allCards.find(card => card.rank === 'Joker' && card.suit === 'Wild');
        
        // First battle initialization
        cardTraitRegistry.initializeForBattle(allCards, [starterHero]);
        expect(jokerCard.hasChain()).toBeTruthy();
        const firstChainData = jokerCard.getChainData();
        
        // Second battle initialization (simulating new battle)
        cardTraitRegistry.initializeForBattle(allCards, [starterHero]);
        expect(jokerCard.hasChain()).toBeTruthy();
        const secondChainData = jokerCard.getChainData();
        
        // Chain data should be identical
        expect(secondChainData.heroId).toBe(firstChainData.heroId);
        expect(secondChainData.maxChainLinks).toBe(firstChainData.maxChainLinks);
        
        console.log('✓ Chain traits persist across multiple battle initializations');
    });
    
    it('should handle trait application when hero is not in party', () => {
        setupTest();
        
        const allCards = playerDeck.getAllCards();
        const jokerCard = allCards.find(card => card.rank === 'Joker' && card.suit === 'Wild');
        
        // Initialize battle with no heroes
        cardTraitRegistry.initializeForBattle(allCards, []);
        
        // Joker should not have chain trait
        expect(jokerCard.hasChain()).toBeFalsy();
        
        console.log('✓ No traits applied when hero not in party');
    });
    
    it('should clean up dynamic traits properly', () => {
        setupTest();
        
        const allCards = playerDeck.getAllCards();
        const jokerCard = allCards.find(card => card.rank === 'Joker' && card.suit === 'Wild');
        
        // Add some modifiers manually
        jokerCard.addModifier({
            type: 'TEST_STATIC',
            _dynamic: false
        });
        jokerCard.addModifier({
            type: 'TEST_DYNAMIC',
            _dynamic: true
        });
        
        expect(jokerCard.modifiers.length).toBe(4); // 2 default + 2 test modifiers
        
        // Clear dynamic traits
        cardTraitRegistry.clearDynamicTraits(jokerCard);
        
        // Should only have static modifiers left
        const staticModifiers = jokerCard.modifiers.filter(m => !m._dynamic);
        const dynamicModifiers = jokerCard.modifiers.filter(m => m._dynamic);
        
        expect(staticModifiers.length).toBe(3); // 2 default + 1 static test
        expect(dynamicModifiers.length).toBe(0);
        
        console.log('✓ Dynamic traits cleaned up properly');
    });
    
    it('should support multiple trait providers simultaneously', () => {
        setupTest();
        
        // Register a second trait provider
        const secondTraitDefinitions = [
            {
                criteria: { rank: 'A' },
                trait: {
                    type: 'POWER',
                    data: { bonus: 5 }
                }
            }
        ];
        
        cardTraitRegistry.registerTraitProvider('test_provider', secondTraitDefinitions);
        
        // Create a test hero
        const testHero = { id: 'test_provider' };
        
        const allCards = playerDeck.getAllCards();
        
        // Initialize with both heroes
        cardTraitRegistry.initializeForBattle(allCards, [starterHero, testHero]);
        
        // Check joker has chain trait
        const jokerCard = allCards.find(card => card.rank === 'Joker' && card.suit === 'Wild');
        expect(jokerCard.hasChain()).toBeTruthy();
        
        // Check aces have power trait
        const aceCards = allCards.filter(card => card.rank === 'A');
        aceCards.forEach(ace => {
            const powerModifier = ace.modifiers.find(m => m.type === 'POWER');
            expect(powerModifier).toBeDefined();
            expect(powerModifier.data.bonus).toBe(5);
        });
        
        console.log('✓ Multiple trait providers work simultaneously');
    });
    
    it('should track active trait types correctly', () => {
        setupTest();
        
        const allCards = playerDeck.getAllCards();
        
        // Before initialization
        expect(cardTraitRegistry.getActiveTraitTypes()).toEqual([]);
        expect(cardTraitRegistry.isTraitActive('CHAIN')).toBeFalsy();
        
        // After initialization with starter hero
        cardTraitRegistry.initializeForBattle(allCards, [starterHero]);
        
        expect(cardTraitRegistry.isTraitActive('CHAIN')).toBeTruthy();
        expect(cardTraitRegistry.getActiveTraitTypes()).toContain('CHAIN');
        
        console.log('✓ Active trait types tracked correctly');
    });
    
    it('should handle card criteria matching correctly', () => {
        setupTest();
        
        const testCard1 = new Card('K', 'Hearts', 13);
        const testCard2 = new Card('Joker', 'Wild', 15, 'LEGENDARY');
        
        // Test rank criteria
        expect(cardTraitRegistry.cardMatchesCriteria(testCard1, { rank: 'K' })).toBeTruthy();
        expect(cardTraitRegistry.cardMatchesCriteria(testCard1, { rank: 'Q' })).toBeFalsy();
        
        // Test suit criteria
        expect(cardTraitRegistry.cardMatchesCriteria(testCard1, { suit: 'Hearts' })).toBeTruthy();
        expect(cardTraitRegistry.cardMatchesCriteria(testCard1, { suit: 'Spades' })).toBeFalsy();
        
        // Test rarity criteria
        expect(cardTraitRegistry.cardMatchesCriteria(testCard2, { rarity: 'LEGENDARY' })).toBeTruthy();
        expect(cardTraitRegistry.cardMatchesCriteria(testCard1, { rarity: 'LEGENDARY' })).toBeFalsy();
        
        // Test custom criteria
        const customCriteria = {
            custom: (card) => card.value > 10
        };
        expect(cardTraitRegistry.cardMatchesCriteria(testCard1, customCriteria)).toBeTruthy();
        expect(cardTraitRegistry.cardMatchesCriteria(new Card('2', 'Hearts', 2), customCriteria)).toBeFalsy();
        
        console.log('✓ Card criteria matching works correctly');
    });
    
    console.log('\n=== Decoupled Chain System Test Complete ===');
});