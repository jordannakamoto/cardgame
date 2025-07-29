import Hero, { Ability, Trigger, Effect, RoundCountTrigger } from '../Hero.js';

// Trigger for conduit activation at round start
class RoundStartTrigger extends Trigger {
    constructor() {
        super({
            name: 'RoundStartTrigger',
            description: 'Triggers at the start of each round'
        });
    }
    
    check(pokerHand, context, heroState) {
        return context.isRoundStart === true;
    }
}

// Effect that offers gold spending for stat boost
class GoldSpendEffect extends Effect {
    constructor(goldCost, chipsBonus, multBonus) {
        super({
            name: 'GoldSpendEffect',
            description: `Spend $${goldCost} for +${chipsBonus} Chips and +${multBonus} Mult this round`
        });
        this.goldCost = goldCost;
        this.chipsBonus = chipsBonus;
        this.multBonus = multBonus;
    }
    
    execute(context, heroState, activeTriggers) {
        if (context.offerGoldSpend) {
            context.offerGoldSpend({
                cost: this.goldCost,
                chipsBonus: this.chipsBonus,
                multBonus: this.multBonus,
                onAccept: () => {
                    heroState.conduitActive = true;
                    
                    // Publish the move
                    if (context.hero && context.hero.publishMove) {
                        context.hero.publishMove('conduitActivated', {
                            goldSpent: this.goldCost,
                            chipsBonus: this.chipsBonus,
                            multBonus: this.multBonus,
                            roundNumber: context.roundNumber
                        });
                    }
                }
            });
        }
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        if (context.isRoundStart) {
            this.execute(context, heroState, activeTriggers);
        }
        return 1.0; // No direct damage multiplier
    }
}

// Effect that applies the stat bonuses when conduit is active
class ConduitBoostEffect extends Effect {
    constructor(chipsBonus, multBonus) {
        super({
            name: 'ConduitBoostEffect',
            description: `+${chipsBonus} Chips and +${multBonus} Mult when conduit is active`
        });
        this.chipsBonus = chipsBonus;
        this.multBonus = multBonus;
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        if (heroState.conduitActive) {
            // Apply bonuses to context
            if (context.applyBonus) {
                context.applyBonus({
                    chips: this.chipsBonus,
                    mult: this.multBonus
                });
            }
        }
        return 1.0; // Bonuses applied through context, not multiplier
    }
}

export default class Conduit extends Hero {
    constructor() {
        super({
            id: 'conduit',
            name: 'The Conduit',
            type: 'hybrid',
            portraitKey: 'conduit'
        });
    }
    
    setupAbilities() {
        // Ability 1: Offer gold spending at round start
        const goldSpendOffer = new Ability({
            name: 'Energy Channel',
            description: 'At round start, spend $5 to boost all hands this round',
            triggers: [
                new RoundStartTrigger()
            ],
            effects: [
                new GoldSpendEffect(5, 50, 5)
            ]
        });
        
        // Ability 2: Apply bonuses when active
        const conduitBoost = new Ability({
            name: 'Channeled Power',
            description: 'When active, all hands get +50 Chips and +5 Mult',
            triggers: [
                new AlwaysActiveTrigger()
            ],
            effects: [
                new ConduitBoostEffect(50, 5)
            ]
        });
        
        this.addAbility(goldSpendOffer);
        this.addAbility(conduitBoost);
    }
    
    onRoundStart(data) {
        // Reset conduit state and offer activation
        this.state.conduitActive = false;
        
        const context = {
            isRoundStart: true,
            roundNumber: data.roundNumber,
            hero: this,
            offerGoldSpend: data.offerGoldSpend
        };
        
        // Trigger the gold spend offer
        this.abilities[0].activate(context, this.state);
    }
    
    onHandPlayed(data) {
        // Apply conduit bonuses to played hands
        if (this.state.conduitActive) {
            const context = {
                hero: this,
                applyBonus: data.applyBonus
            };
            
            this.abilities[1].activate(context, this.state);
        }
    }
}

// Always-active trigger for applying bonuses
class AlwaysActiveTrigger extends Trigger {
    constructor() {
        super({
            name: 'AlwaysActiveTrigger',
            description: 'Always active'
        });
    }
    
    check(pokerHand, context, heroState) {
        return true;
    }
}