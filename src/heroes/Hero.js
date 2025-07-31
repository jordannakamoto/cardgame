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
        
        // Special animations for hero abilities
        this.specialAnimations = new Map();
        
        // Equipment system
        this.equipment = {
            armor: null,
            accessory: null
        };
        
        // Equipment-modified stats
        this.stats = {
            damageReduction: 0,
            dodgeChance: 0,
            vampirism: 0,
            goldBonus: 0
        };
        
        // Temporary stats (for one-time effects)
        this.tempStats = {};
        
        // Equipment handlers for event cleanup
        this.equipmentHandlers = new Map();
        
        // Equipment properties (for special effects)
        this.equipmentProperties = {};
    }
    
    // Initialize hero with event system
    initialize(eventBus) {
        this.eventBus = eventBus;
        // Clear existing abilities before setting up new ones
        this.abilities = [];
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
            console.log(`Hero ${this.name} subscribing to ${eventName}`);
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
        console.log(`=== ${this.name} onHandPlayed triggered ===`);
        console.log('Abilities count:', this.abilities.length);
        
        // Execute any abilities that should trigger when a hand is played
        const context = {
            targetEnemy: data.targetEnemy,
            selectedCards: data.selectedCards,
            enemyCount: data.enemyCount,
            hero: this
        };
        
        // Check each ability to see if it should execute
        this.abilities.forEach((ability, index) => {
            console.log(`Checking ability ${index}:`, ability.name || 'unnamed');
            if (ability.canActivate && ability.canActivate(data.pokerHand, context, this.state)) {
                console.log(`${this.name} ability ${ability.name} activating!`);
                // Execute the ability's effects (not just apply)
                ability.effects.forEach((effect, effectIndex) => {
                    console.log(`Executing effect ${effectIndex} for ${ability.name}`);
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
    
    // Set special animation for an ability
    setSpecialAnimation(abilityName, animationFunction) {
        this.specialAnimations.set(abilityName, animationFunction);
    }
    
    // Trigger special animation for an ability
    triggerSpecialAnimation(abilityName, scene, heroSprite, targets) {
        const animationFunction = this.specialAnimations.get(abilityName);
        if (animationFunction && typeof animationFunction === 'function') {
            return animationFunction(scene, heroSprite, targets, this);
        }
        return Promise.resolve();
    }
    
    // Check if hero has special animation for an ability
    hasSpecialAnimation(abilityName) {
        return this.specialAnimations.has(abilityName);
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
    
    // Take damage (with equipment effects)
    takeDamage(amount) {
        const previousHealth = this.currentHealth;
        let actualDamage = amount;
        
        // Check for temporary damage block
        if (this.tempStats.nextDamageBlocked) {
            this.tempStats.nextDamageBlocked = false;
            actualDamage = 0;
            
            // Show block effect
            this.publishMove('damageBlocked', {
                originalAmount: amount,
                hero: this
            });
        } else {
            // Apply dodge chance
            if (this.stats.dodgeChance > 0 && Math.random() < this.stats.dodgeChance) {
                actualDamage = 0;
                
                this.publishMove('damageDodged', {
                    originalAmount: amount,
                    hero: this
                });
            } else {
                // Apply damage reduction
                actualDamage = Math.max(1, amount - this.stats.damageReduction);
            }
        }
        
        this.currentHealth = Math.max(0, this.currentHealth - actualDamage);
        
        this.publishMove('damageTaken', {
            amount: actualDamage,
            originalAmount: amount,
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
    
    // Equipment management
    equipItem(equipment) {
        const slot = equipment.slot;
        
        if (!this.equipment.hasOwnProperty(slot)) {
            console.error(`Invalid equipment slot: ${slot}`);
            return false;
        }
        
        if (!equipment.canEquipTo(this)) {
            console.error(`Cannot equip ${equipment.name} to ${this.name}`);
            return false;
        }
        
        // Unequip existing item in slot
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }
        
        // Equip new item
        this.equipment[slot] = equipment;
        equipment.onEquip(this);
        
        this.publishMove('itemEquipped', {
            equipment: equipment,
            slot: slot
        });
        
        return true;
    }
    
    unequipItem(slot) {
        const equipment = this.equipment[slot];
        if (!equipment) return null;
        
        equipment.onUnequip(this);
        this.equipment[slot] = null;
        
        this.publishMove('itemUnequipped', {
            equipment: equipment,
            slot: slot
        });
        
        return equipment;
    }
    
    getEquippedItems() {
        return Object.values(this.equipment).filter(item => item !== null);
    }
    
    hasEquippedItem(slot) {
        return this.equipment[slot] !== null;
    }
    
    // Apply vampirism healing after dealing damage
    applyVampirism(damageDealt) {
        if (this.stats.vampirism > 0) {
            const healAmount = Math.floor(damageDealt * this.stats.vampirism);
            if (healAmount > 0) {
                this.heal(healAmount);
                
                this.publishMove('vampirismHealing', {
                    damageDealt: damageDealt,
                    healAmount: healAmount
                });
            }
        }
    }
    
    // Cleanup when hero is removed
    cleanup() {
        // Unequip all items
        Object.keys(this.equipment).forEach(slot => {
            if (this.equipment[slot]) {
                this.unequipItem(slot);
            }
        });
        
        if (this.eventBus) {
            console.log(`Hero ${this.name} cleaning up ${this.eventSubscriptions.length} event subscriptions`);
            console.log('Subscriptions to clean:', this.eventSubscriptions.map(s => s.eventName));
            
            // Unsubscribe from all events
            this.eventSubscriptions.forEach(({ eventName, callback }) => {
                console.log(`Removing ${this.name} from ${eventName}`);
                this.eventBus.off(eventName, callback);
            });
            this.eventSubscriptions = [];
            this.eventBus = null; // Clear the event bus reference
            console.log(`Hero ${this.name} cleanup complete`);
        }
    }
    
    // Save/Load
    save() {
        return {
            id: this.id,
            currentMana: this.currentMana,
            currentHealth: this.currentHealth,
            level: this.level,
            experience: this.experience,
            state: this.state,
            equipment: {
                armor: this.equipment.armor?.toJSON() || null,
                accessory: this.equipment.accessory?.toJSON() || null
            }
        };
    }
    
    load(data) {
        this.currentMana = data.currentMana || 0;
        this.currentHealth = data.currentHealth || this.maxHealth;
        this.level = data.level || 1;
        this.experience = data.experience || 0;
        this.state = data.state || {};
        
        // Load equipment (will need Equipment registry to recreate)
        if (data.equipment) {
            // Equipment loading will be handled by the system that calls this
            // since it needs access to the Equipment registry
        }
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