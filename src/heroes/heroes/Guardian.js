import Hero, { Ability, Trigger, Effect, HandTypeTrigger, StateTrigger, MultiplierEffect, StateModifyEffect } from '../Hero.js';

// Guardian redesigned for survivability within our mechanics
export default class Guardian extends Hero {
    constructor() {
        super({
            id: 'guardian',
            name: 'The Guardian',
            type: 'support',
            maxHealth: 150,
            portraitKey: 'guardian1'
        });
    }

    setupAbilities() {
        // Ability 1: Build armor with defensive hands
        const armorBuilding = new Ability({
            name: 'Defensive Stance',
            description: 'Gain 1 Armor when playing High Card or Pairs',
            type: 'defensive',
            triggers: [
                new DefensiveHandTrigger()
            ],
            effects: [
                new ArmorBuildEffect()
            ]
        });

        // Ability 2: Use armor for bonus damage when finishing low-health enemies
        const armorStrike = new Ability({
            name: 'Finishing Blow',
            description: '+20% damage per Armor when targeting enemies below 30% health',
            type: 'damage',
            triggers: [
                new LowEnemyHealthTrigger()
            ],
            effects: [
                new ArmorDamageEffect()
            ]
        });

        this.addAbility(armorBuilding);
        this.addAbility(armorStrike);
    }

    onRoundStart(data) {
        // Initialize armor if not set
        if (this.state.armor === undefined) {
            this.state.armor = 0;
        }

        // Publish current armor status
        this.publishMove('roundStartStatus', {
            currentArmor: this.state.armor,
            roundNumber: data.roundNumber
        });
    }

    // Helper method to get current armor
    getArmorCount() {
        return this.state.armor || 0;
    }
}

// Trigger for low enemy health (defensive situations)
class LowEnemyHealthTrigger extends Trigger {
    constructor() {
        super({
            name: 'LowEnemyHealthTrigger',
            description: 'Triggers when any enemy has 30% health or less'
        });
    }

    check(pokerHand, context, heroState) {
        if (!context.targetEnemy) return false;
        const healthPercentage = context.targetEnemy.currentHealth / context.targetEnemy.maxHealth;
        return healthPercentage <= 0.3;
    }
}

// Trigger for defensive hands (pairs and high cards - easier to get)
class DefensiveHandTrigger extends Trigger {
    constructor() {
        super({
            name: 'DefensiveHandTrigger',
            description: 'Triggers on defensive hands (High Card, Pairs)'
        });
    }

    check(pokerHand, context, heroState) {
        if (!pokerHand) return false;
        return pokerHand.handName === 'High Card' || pokerHand.handName === 'Pair';
    }
}

// Effect that builds up armor stacks
class ArmorBuildEffect extends Effect {
    constructor() {
        super({
            name: 'ArmorBuildEffect',
            description: 'Gain 1 Armor stack'
        });
    }

    execute(context, heroState, activeTriggers) {
        heroState.armor = (heroState.armor || 0) + 1;

        // Publish the move
        if (context.hero && context.hero.publishMove) {
            context.hero.publishMove('armorGained', {
                armorGained: 1,
                totalArmor: heroState.armor
            });
        }
    }

    apply(pokerHand, context, heroState, activeTriggers) {
        // Don't execute during preview - only return multiplier
        // The actual armor building happens when the hand is played via execute()
        return 1.0; // No direct damage multiplier
    }
}

// Effect that provides damage bonus based on armor
class ArmorDamageEffect extends Effect {
    constructor() {
        super({
            name: 'ArmorDamageEffect',
            description: '+20% damage per Armor stack when finishing enemies'
        });
    }

    apply(pokerHand, context, heroState, activeTriggers) {
        const armor = heroState.armor || 0;
        if (armor > 0) {
            const multiplier = 1 + (armor * 0.2);

            // Publish the activation
            if (context.hero && context.hero.publishMove) {
                context.hero.publishMove('armorDamageBonus', {
                    armorUsed: armor,
                    damageMultiplier: multiplier
                });
            }

            return multiplier;
        }
        return 1.0;
    }
}
