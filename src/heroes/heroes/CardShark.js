import Hero, { Ability, Trigger, Effect, SuitTrigger, HandTypeTrigger, StateModifyEffect, ConditionalMultiplierEffect } from '../Hero.js';

// Custom trigger for first spades of the round
class FirstSpadesTrigger extends Trigger {
    constructor() {
        super({
            name: 'FirstSpadesTrigger',
            description: 'Triggers on first Spades hand each round'
        });
    }
    
    check(pokerHand, context, heroState) {
        if (heroState.hasPlayedSpadesThisRound) return false;
        if (!context.selectedCards) return false;
        return context.selectedCards.some(card => card.suit === 'Spades');
    }
}

// Custom effect that applies tears to enemies
class ApplyTearsEffect extends Effect {
    constructor() {
        super({
            name: 'ApplyTearsEffect',
            description: 'Apply 1 Tear to all enemies'
        });
    }
    
    execute(context, heroState, activeTriggers) {
        const enemyCount = context.enemyCount || 1;
        heroState.tears = (heroState.tears || 0) + enemyCount;
        heroState.hasPlayedSpadesThisRound = true;
        
        // Publish the move
        if (context.hero && context.hero.publishMove) {
            context.hero.publishMove('tearsApplied', {
                tearsApplied: enemyCount,
                totalTears: heroState.tears
            });
        }
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        this.execute(context, heroState, activeTriggers);
        return 1.0; // No damage multiplier for tear application
    }
}

export default class Analyst extends Hero {
    constructor() {
        super({
            id: 'analyst',
            name: 'The Analyst',
            type: 'damage',
            maxHealth: 80,
            portraitKey: 'mage2'
        });
    }
    
    setupAbilities() {
        // Ability 1: Apply tears with first spades hand
        const tearApplication = new Ability({
            name: 'Tear Analysis',
            description: 'First Spades hand each round applies 1 Tear to all enemies',
            type: 'utility',
            triggers: [
                new FirstSpadesTrigger()
            ],
            effects: [
                new ApplyTearsEffect()
            ]
        });
        
        // Ability 2: Consume tears for damage bonus
        const tearConsumption = new Ability({
            name: 'Exploit Weakness',
            description: 'Three of a Kind or better consumes all Tears for +15 Mult each',
            type: 'damage',
            triggers: [
                new HandTypeTrigger(['Three of a Kind', 'Straight', 'Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush'])
            ],
            effects: [
                new ConditionalMultiplierEffect('tears', 1.15),
                new StateModifyEffect('tears', 'set', 0) // Consume all tears after use
            ]
        });
        
        this.addAbility(tearApplication);
        this.addAbility(tearConsumption);
    }
    
    onRoundStart(data) {
        // Reset spades tracking each round
        this.state.hasPlayedSpadesThisRound = false;
    }
}