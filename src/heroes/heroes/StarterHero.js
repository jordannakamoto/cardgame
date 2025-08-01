import Hero, { Ability, HandTypeTrigger, MultiplierEffect } from '../Hero.js';
import { cardTraitRegistry } from '../../game/CardTraitRegistry.js';
import ManaStrike from '../../abilities/ManaStrike.js';

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
        
        // Initialize active abilities array
        this.activeAbilities = [];
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
        
        // Clear and add active abilities
        this.activeAbilities = [];
        this.activeAbilities.push(new ManaStrike());
        
        console.log(`${this.name} setupAbilities: ${this.activeAbilities.length} active abilities`);
        
        // Register chain trait for joker cards
        this.registerCardTraits();
    }
    
    registerCardTraits() {
        const chainTraitDefinitions = [
            {
                criteria: { rank: 'Joker', suit: 'Wild' },
                trait: {
                    type: 'CHAIN',
                    data: {
                        heroId: this.id,
                        maxChainLinks: 3,
                        damageMultiplier: 1.0
                    }
                }
            }
        ];
        
        cardTraitRegistry.registerTraitProvider(this.id, chainTraitDefinitions);
        console.log(`Registered chain trait for jokers from ${this.name}`);
    }
    
    // Called when hero is added to party - no longer needed for card traits
    onAddedToParty(playerDeck) {
        // Trait registration now handled in setupAbilities()
        // Card trait application happens during battle initialization
        console.log(`${this.name} added to party - traits will be applied during battle`);
    }
}
