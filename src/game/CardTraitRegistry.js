// Central registry for card traits and their effects
// Decoupled from specific heroes or battle scenes
import { ChainEffects } from '../effects/ChainEffects.js';

export class CardTraitRegistry {
    constructor() {
        this.traitProviders = new Map(); // hero/item/ability -> trait definitions
        this.globalTraits = new Map(); // trait type -> trait implementation
        this.activeTraits = new Set(); // currently active traits in battle
    }
    
    // Register a trait provider (hero, item, ability, etc.)
    registerTraitProvider(providerId, traitDefinitions) {
        console.log(`Registering trait provider: ${providerId}`, traitDefinitions);
        this.traitProviders.set(providerId, traitDefinitions);
    }
    
    // Remove a trait provider
    unregisterTraitProvider(providerId) {
        this.traitProviders.delete(providerId);
    }
    
    // Register a global trait implementation
    registerGlobalTrait(traitType, traitImplementation) {
        console.log(`Registering global trait: ${traitType}`);
        this.globalTraits.set(traitType, traitImplementation);
    }
    
    // Apply traits to cards based on active providers
    applyTraitsToCards(cards, activeProviderIds = []) {
        console.log(`Applying traits to ${cards.length} cards from providers:`, activeProviderIds);
        
        // Clear existing traits that might be stale
        cards.forEach(card => this.clearDynamicTraits(card));
        
        // Apply traits from active providers
        for (const providerId of activeProviderIds) {
            const traitDefinitions = this.traitProviders.get(providerId);
            if (traitDefinitions) {
                this.applyTraitDefinitions(cards, traitDefinitions, providerId);
            }
        }
    }
    
    // Apply specific trait definitions to matching cards
    applyTraitDefinitions(cards, traitDefinitions, providerId) {
        for (const traitDef of traitDefinitions) {
            const matchingCards = cards.filter(card => this.cardMatchesCriteria(card, traitDef.criteria));
            
            for (const card of matchingCards) {
                console.log(`Applying ${traitDef.trait.type} trait to ${card.toString()} from ${providerId}`);
                card.addModifier({
                    ...traitDef.trait,
                    _dynamic: true, // Mark as dynamic for cleanup
                    _provider: providerId
                });
            }
        }
    }
    
    // Check if card matches trait criteria
    cardMatchesCriteria(card, criteria) {
        if (criteria.rank && card.rank !== criteria.rank) return false;
        if (criteria.suit && card.suit !== criteria.suit) return false;
        if (criteria.rarity && card.rarity !== criteria.rarity) return false;
        if (criteria.hasModifier && !card.hasModifier(criteria.hasModifier)) return false;
        if (criteria.custom && !criteria.custom(card)) return false;
        return true;
    }
    
    // Clear dynamic traits from a card
    clearDynamicTraits(card) {
        if (card.modifiers) {
            card.modifiers = card.modifiers.filter(modifier => !modifier._dynamic);
        }
    }
    
    // Get all active trait types
    getActiveTraitTypes() {
        return Array.from(this.activeTraits);
    }
    
    // Check if a trait is currently active
    isTraitActive(traitType) {
        return this.activeTraits.has(traitType);
    }
    
    // Set active traits for battle
    setActiveTraits(traitTypes) {
        this.activeTraits.clear();
        traitTypes.forEach(type => this.activeTraits.add(type));
    }
    
    // Initialize traits for a battle session
    initializeForBattle(cards, heroes, items = []) {
        console.log('Initializing card traits for battle');
        
        // Collect all active trait providers
        const activeProviders = [
            ...heroes.map(hero => hero.id),
            ...items.map(item => item.id)
        ];
        
        // Apply traits to all cards
        this.applyTraitsToCards(cards, activeProviders);
        
        // Collect active trait types
        const activeTraitTypes = new Set();
        cards.forEach(card => {
            if (card.modifiers) {
                card.modifiers.forEach(modifier => {
                    if (modifier.type && this.globalTraits.has(modifier.type)) {
                        activeTraitTypes.add(modifier.type);
                    }
                });
            }
        });
        
        this.setActiveTraits(Array.from(activeTraitTypes));
        console.log('Active trait types for battle:', this.getActiveTraitTypes());
    }
}

// Global instance
export const cardTraitRegistry = new CardTraitRegistry();

// Built-in trait definitions
export const BuiltInTraits = {
    // Chain trait implementation
    CHAIN: {
        type: 'CHAIN',
        name: 'Chain Attack',
        description: 'Breaks hand into sequential attacks',
        
        // Trait behavior implementation
        executeEffect: (scene, chainCard, allHands, totalDamage, targetEnemy) => {
            return ChainEffects.executeChainAttack(scene, chainCard, allHands, totalDamage, targetEnemy);
        },
        
        // Visual effect for selection
        createSelectionEffect: (scene, chainCard) => {
            return ChainEffects.createChainTextEffect(scene, chainCard);
        }
    }
};

// Register built-in traits
Object.entries(BuiltInTraits).forEach(([type, implementation]) => {
    cardTraitRegistry.registerGlobalTrait(type, implementation);
});