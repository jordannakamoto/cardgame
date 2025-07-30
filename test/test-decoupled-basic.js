// Basic test for decoupled chain system
import { describe, test, expect } from './testFramework.js';
import Card from '../src/game/Card.js';
import { cardTraitRegistry, BuiltInTraits } from '../src/game/CardTraitRegistry.js';
import StarterHero from '../src/heroes/heroes/StarterHero.js';

// Mock localStorage for Node.js
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

describe('Decoupled Chain System - Basic Tests', () => {
    
    test('Chain trait registry works', () => {
        // Reset registry
        cardTraitRegistry.traitProviders.clear();
        cardTraitRegistry.globalTraits.clear();
        
        // Re-register built-in traits
        Object.entries(BuiltInTraits).forEach(([type, implementation]) => {
            cardTraitRegistry.registerGlobalTrait(type, implementation);
        });
        
        // Create hero and initialize (should auto-register traits)
        const starterHero = new StarterHero();
        starterHero.initialize({ emit: () => {}, on: () => {} }); // Mock event bus
        
        // Check trait registration
        const traitProviders = Array.from(cardTraitRegistry.traitProviders.keys());
        console.log('Registered trait providers:', traitProviders);
        
        expect(traitProviders.length).toBeGreaterThan(0);
        console.log('✓ Chain trait provider registered');
    });
    
    test('Chain traits apply to joker cards', () => {
        // Reset registry
        cardTraitRegistry.traitProviders.clear();
        cardTraitRegistry.globalTraits.clear();
        
        // Re-register built-in traits
        Object.entries(BuiltInTraits).forEach(([type, implementation]) => {
            cardTraitRegistry.registerGlobalTrait(type, implementation);
        });
        
        // Create test cards
        const jokerCard = new Card('Joker', 'Wild', 15, 'LEGENDARY');
        const regularCard = new Card('A', 'Hearts', 14);
        const testCards = [jokerCard, regularCard];
        
        // Create hero and initialize
        const starterHero = new StarterHero();
        starterHero.initialize({ emit: () => {}, on: () => {} }); // Mock event bus
        
        // Apply traits
        cardTraitRegistry.applyTraitsToCards(testCards, [starterHero.id]);
        
        // Check if joker has chain trait
        const chainModifier = jokerCard.modifiers.find(m => m.type === 'CHAIN');
        if (chainModifier) {
            console.log('✓ Chain trait applied to joker card');
            console.log('Chain data:', chainModifier.data);
        } else {
            console.log('❌ Chain trait not found on joker');
            console.log('Joker modifiers:', jokerCard.modifiers);
        }
        
        // Check regular card doesn't have chain
        const regularChain = regularCard.modifiers.find(m => m.type === 'CHAIN');
        if (!regularChain) {
            console.log('✓ Regular card does not have chain trait');
        }
        
        expect(chainModifier).toBeDefined();
    });
    
    test('Battle initialization works', () => {
        // Reset registry
        cardTraitRegistry.traitProviders.clear();
        cardTraitRegistry.globalTraits.clear();
        
        // Re-register built-in traits
        Object.entries(BuiltInTraits).forEach(([type, implementation]) => {
            cardTraitRegistry.registerGlobalTrait(type, implementation);
        });
        
        // Create test setup
        const jokerCard = new Card('Joker', 'Wild', 15, 'LEGENDARY');
        const testCards = [jokerCard];
        const starterHero = new StarterHero();
        starterHero.initialize({ emit: () => {}, on: () => {} }); // Mock event bus
        
        // Initialize for battle
        cardTraitRegistry.initializeForBattle(testCards, [starterHero]);
        
        // Check results
        const chainModifier = jokerCard.modifiers.find(m => m.type === 'CHAIN');
        expect(chainModifier).toBeDefined();
        
        console.log('✓ Battle initialization applies traits correctly');
    });
    
    console.log('\n=== Decoupled Chain System Basic Tests Complete ===');
});