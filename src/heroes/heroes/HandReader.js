import Hero, { Ability, Trigger, Effect } from '../Hero.js';

// Custom trigger for phantom ability usage
class PhantomUseTrigger extends Trigger {
    constructor() {
        super({
            name: 'PhantomUseTrigger',
            description: 'Manual activation (cannot be used on last hand)'
        });
    }
    
    check(pokerHand, context, heroState) {
        // This trigger only activates when manually called
        return context.phantomActivated === true && !context.isLastHand;
    }
}

// Custom effect that returns cards to hand
class ReturnCardsEffect extends Effect {
    constructor() {
        super({
            name: 'ReturnCardsEffect',
            description: 'Return played cards to hand instead of discarding'
        });
    }
    
    execute(context, heroState, activeTriggers) {
        if (context.selectedCards && context.returnCardsToHand) {
            // Mark cards to be returned to hand
            context.returnCardsToHand(context.selectedCards);
            heroState.phantomUsedThisRound = true;
            
            // Publish the move
            if (context.hero && context.hero.publishMove) {
                context.hero.publishMove('phantomActivated', {
                    cardsReturned: context.selectedCards.length,
                    roundNumber: context.roundNumber
                });
            }
        }
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        this.execute(context, heroState, activeTriggers);
        return 1.0; // No damage multiplier
    }
}

export default class Phantom extends Hero {
    constructor() {
        super({
            id: 'phantom',
            name: 'The Phantom',
            type: 'support',
            portraitKey: 'warrior2'
        });
    }
    
    setupAbilities() {
        const phantomAbility = new Ability({
            name: 'Phantom Return',
            description: 'Once per round, return played cards to hand (not on last hand)',
            triggers: [
                new PhantomUseTrigger()
            ],
            effects: [
                new ReturnCardsEffect()
            ]
        });
        
        this.addAbility(phantomAbility);
    }
    
    // Manual activation method
    canUsePhantom(context) {
        return !this.state.phantomUsedThisRound && !context.isLastHand;
    }
    
    usePhantom(context) {
        if (this.canUsePhantom(context)) {
            context.phantomActivated = true;
            return this.abilities[0].activate(context, this.state);
        }
        return false;
    }
    
    onRoundStart(data) {
        // Reset phantom usage each round
        this.state.phantomUsedThisRound = false;
    }
}