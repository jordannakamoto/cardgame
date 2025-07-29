import Hero, { Ability, Trigger, MultiplierEffect } from '../Hero.js';

// Custom trigger for face cards
class FaceCardTrigger extends Trigger {
    constructor() {
        super({
            name: 'FaceCardTrigger',
            description: 'Triggers when playing face cards (J, Q, K, A)'
        });
    }
    
    check(pokerHand, context, heroState) {
        if (!context.selectedCards) return false;
        return context.selectedCards.some(card => {
            const rank = card.rank;
            return rank === 'J' || rank === 'Q' || rank === 'K' || rank === 'A';
        });
    }
}

export default class PowerHitter extends Hero {
    constructor() {
        super({
            id: 'power_hitter',
            name: 'Power Hitter',
            type: 'damage',
            portraitKey: 'power_hitter'
        });
    }
    
    setupAbilities() {
        const faceCardPower = new Ability({
            name: 'Face Card Mastery',
            description: '+40% damage with face cards',
            triggers: [
                new FaceCardTrigger()
            ],
            effects: [
                new MultiplierEffect(1.4)
            ]
        });
        
        this.addAbility(faceCardPower);
    }
}