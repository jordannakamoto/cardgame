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
}
