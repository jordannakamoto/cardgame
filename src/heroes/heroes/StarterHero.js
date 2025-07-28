import Hero from '../Hero.js';

export default class StarterHero extends Hero {
    constructor() {
        super({
            id: 'starter_hero',
            name: 'Apprentice',
            type: 'damage',
            baseMultiplier: 1.0,
            maxMana: 50,
            portraitKey: 'warrior2',
            conditionalMultipliers: [
                {
                    name: 'Pair Bonus',
                    description: 'Pairs deal 50% more damage',
                    multiplier: 1.5,
                    condition: 'pair'
                }
            ],
            abilities: [
                {
                    name: 'Focus',
                    description: 'Next hand deals double damage',
                    manaCost: 20,
                    cooldown: 0
                }
            ]
        });
    }
    
    checkCondition(condition, pokerHand, context) {
        switch(condition.condition) {
            case 'pair':
                // Check if the hand is exactly a pair (rank 2)
                return pokerHand.handRank === 2;
            default:
                return false;
        }
    }
}