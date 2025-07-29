import Hero, { Ability, HandTypeTrigger, MultiplierEffect } from '../Hero.js';

export default class StarterHero extends Hero {
    constructor() {
        super({
            id: 'starter_hero',
            name: 'Apprentice',
            type: 'damage',
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
                new HandTypeTrigger(['ONE_PAIR'])
            ],
            effects: [
                new MultiplierEffect(1.5)
            ]
        });
        
        this.addAbility(pairBonus);
    }
}