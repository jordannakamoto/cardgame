export default class Hero {
    constructor(config = {}) {
        this.id = config.id || 'unknown_hero';
        this.name = config.name || 'Unknown Hero';
        this.type = config.type || 'damage'; // 'damage', 'support', 'hybrid'
        this.portraitKey = config.portraitKey || null;
        
        // Event system reference (set when hero is added to battle)
        this.eventBus = null;
        
        // Hero state
        this.currentMana = 0;
        this.maxMana = config.maxMana || 100;
        this.currentHealth = config.currentHealth || config.maxHealth || 100;
        this.maxHealth = config.maxHealth || 100;
        this.level = 1;
        this.experience = 0;
        
        // Abilities - each hero defines their own
        this.abilities = [];
        
        // Event subscriptions - track what events this hero listens to
        this.eventSubscriptions = [];
        
        // Hero-specific state (e.g., tears, charges, etc.)
        this.state = {};
    }
    
    // Initialize hero with event system
    initialize(eventBus) {
        this.eventBus = eventBus;
        this.setupAbilities();
        this.subscribeToEvents();
    }
    
    // Override in subclasses to define abilities
    setupAbilities() {
        // Base implementation - no abilities
    }
    
    // Override in subclasses to subscribe to events
    subscribeToEvents() {
        // Base subscriptions that most heroes need
        this.subscribe('roundStart', this.onRoundStart.bind(this));
        this.subscribe('roundEnd', this.onRoundEnd.bind(this));
        this.subscribe('handPlayed', this.onHandPlayed.bind(this));
    }
    
    // Event subscription helper
    subscribe(eventName, callback) {
        if (this.eventBus) {
            this.eventBus.on(eventName, callback);
            this.eventSubscriptions.push({ eventName, callback });
        }
    }
    
    // Event publishing helper
    publishMove(moveType, moveData) {
        if (this.eventBus) {
            const move = {
                heroId: this.id,
                heroName: this.name,
                moveType,
                moveData,
                timestamp: Date.now()
            };
            this.eventBus.emit('heroMove', move);
            return move;
        }
        return null;
    }
    
    // Base event handlers - override in subclasses as needed
    onRoundStart(data) {
        // Override in subclasses
    }
    
    onRoundEnd(data) {
        // Override in subclasses  
    }
    
    onHandPlayed(data) {
        // Execute any abilities that should trigger when a hand is played
        const context = {
            targetEnemy: data.targetEnemy,
            selectedCards: data.selectedCards,
            enemyCount: data.enemyCount,
            hero: this
        };
        
        // Check each ability to see if it should execute
        this.abilities.forEach(ability => {
            if (ability.canActivate && ability.canActivate(data.pokerHand, context, this.state)) {
                // Execute the ability's effects (not just apply)
                ability.effects.forEach(effect => {
                    if (effect.execute) {
                        effect.execute(context, this.state, ability.triggers);
                    }
                });
            }
        });
        
        // Override in subclasses for additional behavior
    }
    
    // Calculate damage multiplier for a hand
    calculateMultiplier(pokerHand, context = {}) {
        let multiplier = 1.0;
        this.lastActivatedAbilities = []; // Track which abilities activated
        
        // Let each ability contribute to the multiplier
        this.abilities.forEach(ability => {
            if (ability.canActivate && ability.canActivate(pokerHand, context, this.state)) {
                const abilityMultiplier = ability.getMultiplier(pokerHand, context, this.state);
                multiplier *= abilityMultiplier;
                
                // Track that this ability activated
                this.lastActivatedAbilities.push(ability);
                
                // Publish the ability activation
                this.publishMove('abilityActivated', {
                    abilityName: ability.name,
                    multiplier: abilityMultiplier,
                    handType: pokerHand?.handType,
                    context: context
                });
            }
        });
        
        return multiplier;
    }
    
    // Check if any abilities activated in the last calculation
    hasActivatedAbilities() {
        return this.lastActivatedAbilities && this.lastActivatedAbilities.length > 0;
    }
    
    // Ability system
    addAbility(ability) {
        ability.hero = this; // Link ability to hero
        this.abilities.push(ability);
    }
    
    // Mana system
    generateMana(cardsPlayed) {
        const manaGained = cardsPlayed.length;
        this.currentMana = Math.min(this.currentMana + manaGained, this.maxMana);
        
        this.publishMove('manaGenerated', {
            amount: manaGained,
            currentMana: this.currentMana,
            maxMana: this.maxMana
        });
        
        return manaGained;
    }
    
    // Spend mana
    spendMana(amount) {
        if (this.currentMana >= amount) {
            this.currentMana -= amount;
            this.publishMove('manaSpent', {
                amount,
                currentMana: this.currentMana
            });
            return true;
        }
        return false;
    }
    
    // Take damage
    takeDamage(amount) {
        const previousHealth = this.currentHealth;
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        
        this.publishMove('damageTaken', {
            amount,
            previousHealth,
            currentHealth: this.currentHealth,
            isDead: this.currentHealth <= 0
        });
        
        return this.currentHealth <= 0; // Return true if hero died
    }
    
    // Heal
    heal(amount) {
        const previousHealth = this.currentHealth;
        this.currentHealth = Math.min(this.maxHealth, this.currentHealth + amount);
        
        this.publishMove('healed', {
            amount,
            previousHealth,
            currentHealth: this.currentHealth
        });
    }
    
    // Check if hero is alive
    isAlive() {
        return this.currentHealth > 0;
    }
    
    // Cleanup when hero is removed
    cleanup() {
        if (this.eventBus) {
            // Unsubscribe from all events
            this.eventSubscriptions.forEach(({ eventName, callback }) => {
                this.eventBus.off(eventName, callback);
            });
            this.eventSubscriptions = [];
        }
    }
    
    // Save/Load
    save() {
        return {
            id: this.id,
            currentMana: this.currentMana,
            level: this.level,
            experience: this.experience,
            state: this.state
        };
    }
    
    load(data) {
        this.currentMana = data.currentMana || 0;
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.state = data.state || {};
    }
}

// Component-based Ability system
export class Ability {
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
        this.hero = null; // Set when added to hero
        this.type = config.type || 'damage'; // 'damage', 'defensive', 'utility', 'resource'
        
        // Component-based system
        this.triggers = config.triggers || []; // Array of trigger components
        this.effects = config.effects || [];   // Array of effect components
    }
    
    // Check if any trigger activates
    canActivate(pokerHand, context, heroState) {
        return this.triggers.some(trigger => 
            trigger.check(pokerHand, context, heroState)
        );
    }
    
    // Get combined effect from all active effects
    getMultiplier(pokerHand, context, heroState) {
        let multiplier = 1.0;
        
        // Check which triggers activate
        const activeTriggers = this.triggers.filter(trigger =>
            trigger.check(pokerHand, context, heroState)
        );
        
        if (activeTriggers.length > 0) {
            // Apply all effects
            this.effects.forEach(effect => {
                multiplier *= effect.apply(pokerHand, context, heroState, activeTriggers);
            });
        }
        
        return multiplier;
    }
    
    // Execute active ability effects
    activate(context, heroState) {
        const activeTriggers = this.triggers.filter(trigger =>
            trigger.check(null, context, heroState)
        );
        
        if (activeTriggers.length > 0) {
            this.effects.forEach(effect => {
                if (effect.execute) {
                    effect.execute(context, heroState, activeTriggers);
                }
            });
            return true;
        }
        return false;
    }
}

// Base Trigger component
export class Trigger {
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
    }
    
    // Override in subclasses
    check(pokerHand, context, heroState) {
        return false;
    }
}

// Base Effect component  
export class Effect {
    constructor(config) {
        this.name = config.name;
        this.description = config.description;
    }
    
    // Override in subclasses - return multiplier
    apply(pokerHand, context, heroState, activeTriggers) {
        return 1.0;
    }
    
    // Override in subclasses - for active effects
    execute(context, heroState, activeTriggers) {
        // Base implementation does nothing
    }
}

// Common Triggers
export class HandTypeTrigger extends Trigger {
    constructor(handTypes) {
        super({
            name: 'HandTypeTrigger',
            description: `Triggers on: ${handTypes.join(', ')}`
        });
        this.handTypes = Array.isArray(handTypes) ? handTypes : [handTypes];
    }
    
    check(pokerHand, context, heroState) {
        if (!pokerHand) return false;
        // Check against handName (string) - this is what PokerHand actually uses
        return this.handTypes.includes(pokerHand.handName);
    }
}

export class CardCountTrigger extends Trigger {
    constructor(minCards, maxCards = Infinity) {
        super({
            name: 'CardCountTrigger',
            description: `Triggers with ${minCards}${maxCards !== Infinity ? `-${maxCards}` : '+'} cards`
        });
        this.minCards = minCards;
        this.maxCards = maxCards;
    }
    
    check(pokerHand, context, heroState) {
        const cardCount = context.selectedCards?.length || 0;
        return cardCount >= this.minCards && cardCount <= this.maxCards;
    }
}

export class SuitTrigger extends Trigger {
    constructor(suits) {
        super({
            name: 'SuitTrigger',
            description: `Triggers with: ${suits.join(', ')}`
        });
        this.suits = Array.isArray(suits) ? suits : [suits];
    }
    
    check(pokerHand, context, heroState) {
        if (!context.selectedCards) return false;
        return context.selectedCards.some(card => 
            this.suits.includes(card.suit)
        );
    }
}

export class RoundCountTrigger extends Trigger {
    constructor(frequency = 1) {
        super({
            name: 'RoundCountTrigger',
            description: `Triggers every ${frequency} round(s)`
        });
        this.frequency = frequency;
    }
    
    check(pokerHand, context, heroState) {
        const roundNumber = context.roundNumber || 1;
        return roundNumber % this.frequency === 0;
    }
}

export class StateTrigger extends Trigger {
    constructor(stateKey, expectedValue, comparison = 'equals') {
        super({
            name: 'StateTrigger',
            description: `Triggers when ${stateKey} ${comparison} ${expectedValue}`
        });
        this.stateKey = stateKey;
        this.expectedValue = expectedValue;
        this.comparison = comparison;
    }
    
    check(pokerHand, context, heroState) {
        const actualValue = heroState[this.stateKey];
        
        switch (this.comparison) {
            case 'equals': return actualValue === this.expectedValue;
            case 'greater': return actualValue > this.expectedValue;
            case 'less': return actualValue < this.expectedValue;
            case 'greaterEqual': return actualValue >= this.expectedValue;
            case 'lessEqual': return actualValue <= this.expectedValue;
            default: return false;
        }
    }
}

// Common Effects
export class MultiplierEffect extends Effect {
    constructor(multiplier) {
        super({
            name: 'MultiplierEffect',
            description: `${Math.round((multiplier - 1) * 100)}% damage bonus`
        });
        this.multiplier = multiplier;
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        return this.multiplier;
    }
}

export class StateModifyEffect extends Effect {
    constructor(stateKey, operation, value) {
        super({
            name: 'StateModifyEffect',
            description: `${operation} ${stateKey} by ${value}`
        });
        this.stateKey = stateKey;
        this.operation = operation; // 'set', 'add', 'subtract', 'multiply'
        this.value = value;
    }
    
    execute(context, heroState, activeTriggers) {
        const currentValue = heroState[this.stateKey] || 0;
        
        switch (this.operation) {
            case 'set':
                heroState[this.stateKey] = this.value;
                break;
            case 'add':
                heroState[this.stateKey] = currentValue + this.value;
                break;
            case 'subtract':
                heroState[this.stateKey] = currentValue - this.value;
                break;
            case 'multiply':
                heroState[this.stateKey] = currentValue * this.value;
                break;
        }
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        // Execute the state change
        this.execute(context, heroState, activeTriggers);
        return 1.0; // No multiplier change, just state modification
    }
}

export class ConditionalMultiplierEffect extends Effect {
    constructor(stateKey, multiplierPerUnit) {
        super({
            name: 'ConditionalMultiplierEffect',
            description: `+${Math.round((multiplierPerUnit - 1) * 100)}% per ${stateKey}`
        });
        this.stateKey = stateKey;
        this.multiplierPerUnit = multiplierPerUnit;
    }
    
    apply(pokerHand, context, heroState, activeTriggers) {
        const units = heroState[this.stateKey] || 0;
        return Math.pow(this.multiplierPerUnit, units);
    }
}