import Hero, { Ability, HandTypeTrigger, MultiplierEffect } from '../Hero.js';

export default class StarterHero extends Hero {
    constructor() {
        super({
            id: 'starter_hero',
            name: 'Starter Hero',
            type: 'damage',
            maxHealth: 100,
            maxMana: 50,
            portraitKey: 'warrior2'
        });
    }

    setupAbilities() {
        // Create pair bonus ability using component system
        const pairBonus = new Ability({
            name: 'Pair Master',
            description: '+50% damage with pairs',
            triggers: [
                new HandTypeTrigger(['One Pair'])
            ],
            effects: [
                new MultiplierEffect(1.5)
            ]
        });

        this.addAbility(pairBonus);
    }
    
    // Called when hero is added to party - applies their unique card modifications
    onAddedToParty(playerDeck) {
        // Find all joker cards in the deck and give them chain trait
        if (playerDeck && playerDeck.cards) {
            playerDeck.cards.forEach(card => {
                if (card.rank === 'Joker' && card.suit === 'Wild') {
                    this.applyChainTraitToJoker(card);
                }
            });
        } else if (playerDeck && playerDeck.getJokerCards) {
            // Alternative method if PlayerDeck has helper method
            const jokerCards = playerDeck.getJokerCards();
            jokerCards.forEach(card => {
                this.applyChainTraitToJoker(card);
            });
        }
    }
    
    applyChainTraitToJoker(jokerCard) {
        // Add chain modifier to joker card
        const chainModifier = {
            type: 'CHAIN',
            data: {
                heroId: this.id,
                maxChainLinks: 3, // Can chain up to 3 additional hands
                damageMultiplier: 1.0 // Each additional hand adds 100% of its damage
            }
        };
        
        jokerCard.addModifier(chainModifier);
        console.log(`Applied chain trait to ${jokerCard.toString()} from ${this.name}`);
    }
}
