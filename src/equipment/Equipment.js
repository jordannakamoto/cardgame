// Equipment system with focus on survivability and ability enhancement
export class Equipment {
    constructor(data) {
        this.id = data.id || `equip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.name = data.name;
        this.description = data.description;
        this.slot = data.slot; // 'armor' or 'accessory'
        this.rarity = data.rarity || 'common'; // 'common', 'uncommon', 'rare', 'legendary'
        this.icon = data.icon; // sprite path or emoji
        this.price = data.price || 10;
        
        // Requirements for equipping
        this.requirements = data.requirements || {};
        
        // Passive stats that are always active
        this.passiveStats = data.passiveStats || {};
        
        // Effects that trigger on specific events
        this.triggeredEffects = data.triggeredEffects || [];
        
        // Modifications to hero abilities
        this.abilityModifiers = data.abilityModifiers || [];
        
        // Special properties (for joker cards, etc)
        this.specialProperties = data.specialProperties || {};
        
        // Reference to equipped hero
        this.equippedHero = null;
    }
    
    // Check if a hero can equip this item
    canEquipTo(hero) {
        // Check hero type requirement
        if (this.requirements.heroType && hero.id !== this.requirements.heroType) {
            return false;
        }
        
        // Check level requirement
        if (this.requirements.minLevel && hero.level < this.requirements.minLevel) {
            return false;
        }
        
        return true;
    }
    
    // Called when equipment is equipped to a hero
    onEquip(hero) {
        this.equippedHero = hero;
        
        // Apply passive stats
        this.applyPassiveStats(hero);
        
        // Register triggered effects
        this.registerTriggeredEffects(hero);
        
        // Apply ability modifiers
        this.applyAbilityModifiers(hero);
        
        // Apply special properties
        this.applySpecialProperties(hero);
    }
    
    // Called when equipment is unequipped
    onUnequip(hero) {
        // Remove passive stats
        this.removePassiveStats(hero);
        
        // Unregister triggered effects
        this.unregisterTriggeredEffects(hero);
        
        // Remove ability modifiers
        this.removeAbilityModifiers(hero);
        
        // Remove special properties
        this.removeSpecialProperties(hero);
        
        this.equippedHero = null;
    }
    
    // Apply passive stats to hero
    applyPassiveStats(hero) {
        if (this.passiveStats.damageReduction) {
            hero.stats.damageReduction = (hero.stats.damageReduction || 0) + this.passiveStats.damageReduction;
        }
        
        if (this.passiveStats.dodgeChance) {
            hero.stats.dodgeChance = (hero.stats.dodgeChance || 0) + this.passiveStats.dodgeChance;
        }
        
        if (this.passiveStats.vampirism) {
            hero.stats.vampirism = (hero.stats.vampirism || 0) + this.passiveStats.vampirism;
        }
        
        if (this.passiveStats.maxHealth) {
            const healthIncrease = this.passiveStats.maxHealth;
            hero.maxHealth += healthIncrease;
            hero.currentHealth += healthIncrease; // Also increase current health
        }
        
        if (this.passiveStats.goldBonus) {
            hero.stats.goldBonus = (hero.stats.goldBonus || 0) + this.passiveStats.goldBonus;
        }
    }
    
    // Remove passive stats from hero
    removePassiveStats(hero) {
        if (this.passiveStats.damageReduction) {
            hero.stats.damageReduction -= this.passiveStats.damageReduction;
        }
        
        if (this.passiveStats.dodgeChance) {
            hero.stats.dodgeChance -= this.passiveStats.dodgeChance;
        }
        
        if (this.passiveStats.vampirism) {
            hero.stats.vampirism -= this.passiveStats.vampirism;
        }
        
        if (this.passiveStats.maxHealth) {
            hero.maxHealth -= this.passiveStats.maxHealth;
            hero.currentHealth = Math.min(hero.currentHealth, hero.maxHealth);
        }
        
        if (this.passiveStats.goldBonus) {
            hero.stats.goldBonus -= this.passiveStats.goldBonus;
        }
    }
    
    // Register effects that trigger on events
    registerTriggeredEffects(hero) {
        this.triggeredEffects.forEach(effect => {
            const handler = this.createEffectHandler(effect, hero);
            
            // Store handler reference for later removal
            if (!hero.equipmentHandlers) {
                hero.equipmentHandlers = new Map();
            }
            if (!hero.equipmentHandlers.has(this.id)) {
                hero.equipmentHandlers.set(this.id, []);
            }
            hero.equipmentHandlers.get(this.id).push({
                event: effect.trigger,
                handler: handler
            });
            
            // Subscribe to event
            if (hero.eventBus) {
                hero.eventBus.on(effect.trigger, handler);
            }
        });
    }
    
    // Unregister triggered effects
    unregisterTriggeredEffects(hero) {
        if (hero.equipmentHandlers && hero.equipmentHandlers.has(this.id)) {
            const handlers = hero.equipmentHandlers.get(this.id);
            handlers.forEach(({ event, handler }) => {
                if (hero.eventBus) {
                    hero.eventBus.off(event, handler);
                }
            });
            hero.equipmentHandlers.delete(this.id);
        }
    }
    
    // Create a handler function for a triggered effect
    createEffectHandler(effect, hero) {
        return (data) => {
            // Check if effect conditions are met
            if (!this.checkEffectConditions(effect, data, hero)) {
                return;
            }
            
            // Execute the effect
            switch (effect.type) {
                case 'heal':
                    hero.heal(effect.value);
                    break;
                    
                case 'block':
                    // Negate next damage
                    if (!hero.tempStats) hero.tempStats = {};
                    hero.tempStats.nextDamageBlocked = true;
                    break;
                    
                case 'manaGain':
                    hero.currentMana = Math.min(hero.currentMana + effect.value, hero.maxMana);
                    break;
                    
                case 'drawCard':
                    // Emit event to draw cards
                    if (hero.eventBus) {
                        hero.eventBus.emit('drawExtraCard', { count: effect.value });
                    }
                    break;
                    
                case 'goldBonus':
                    // Apply gold multiplier for this event
                    if (data.gold) {
                        data.gold = Math.floor(data.gold * effect.value);
                    }
                    break;
            }
            
            // Show visual feedback
            if (hero.eventBus) {
                hero.eventBus.emit('equipmentEffectTriggered', {
                    equipment: this,
                    effect: effect,
                    hero: hero
                });
            }
        };
    }
    
    // Check if effect conditions are met
    checkEffectConditions(effect, data, hero) {
        // Check hand type condition
        if (effect.condition?.handType && data.pokerHand) {
            if (effect.condition.handType !== data.pokerHand.handName) {
                return false;
            }
        }
        
        // Check chance-based effects
        if (effect.condition?.chance) {
            if (Math.random() > effect.condition.chance) {
                return false;
            }
        }
        
        // Check health threshold
        if (effect.condition?.healthBelow) {
            const healthPercent = hero.currentHealth / hero.maxHealth;
            if (healthPercent > effect.condition.healthBelow) {
                return false;
            }
        }
        
        return true;
    }
    
    // Apply modifications to hero abilities
    applyAbilityModifiers(hero) {
        this.abilityModifiers.forEach(modifier => {
            // Find the ability to modify
            const ability = hero.abilities.find(a => a.name === modifier.abilityName);
            if (!ability) return;
            
            // Store original values for restoration
            if (!ability.originalValues) {
                ability.originalValues = {};
            }
            
            // Apply the modification
            switch (modifier.type) {
                case 'multiplierIncrease':
                    // Increase damage multiplier
                    ability.effects.forEach(effect => {
                        if (effect.multiplier) {
                            ability.originalValues.multiplier = effect.multiplier;
                            effect.multiplier += modifier.value;
                        }
                    });
                    break;
                    
                case 'addTrigger':
                    // Add additional trigger condition
                    if (!ability.originalTriggers) {
                        ability.originalTriggers = [...ability.triggers];
                    }
                    ability.triggers.push(modifier.trigger);
                    break;
                    
                case 'cooldownReduction':
                    // Reduce ability cooldown
                    if (ability.cooldown) {
                        ability.originalValues.cooldown = ability.cooldown;
                        ability.cooldown = Math.max(1, ability.cooldown - modifier.value);
                    }
                    break;
            }
        });
    }
    
    // Remove ability modifications
    removeAbilityModifiers(hero) {
        this.abilityModifiers.forEach(modifier => {
            const ability = hero.abilities.find(a => a.name === modifier.abilityName);
            if (!ability) return;
            
            // Restore original values
            if (ability.originalValues) {
                Object.entries(ability.originalValues).forEach(([key, value]) => {
                    ability[key] = value;
                });
            }
            
            // Restore original triggers
            if (ability.originalTriggers) {
                ability.triggers = ability.originalTriggers;
                delete ability.originalTriggers;
            }
        });
    }
    
    // Apply special properties (mainly for joker cards)
    applySpecialProperties(hero) {
        if (!hero.equipmentProperties) {
            hero.equipmentProperties = {};
        }
        
        Object.entries(this.specialProperties).forEach(([key, value]) => {
            hero.equipmentProperties[key] = value;
        });
    }
    
    // Remove special properties
    removeSpecialProperties(hero) {
        if (hero.equipmentProperties) {
            Object.keys(this.specialProperties).forEach(key => {
                delete hero.equipmentProperties[key];
            });
        }
    }
    
    // Get rarity color
    getRarityColor() {
        switch (this.rarity) {
            case 'common': return 0x9e9e9e;
            case 'uncommon': return 0x4caf50;
            case 'rare': return 0x2196f3;
            case 'legendary': return 0xff9800;
            default: return 0x9e9e9e;
        }
    }
    
    // Serialize for saving
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            slot: this.slot,
            rarity: this.rarity,
            icon: this.icon,
            price: this.price,
            requirements: this.requirements,
            passiveStats: this.passiveStats,
            triggeredEffects: this.triggeredEffects,
            abilityModifiers: this.abilityModifiers,
            specialProperties: this.specialProperties
        };
    }
    
    // Create from saved data
    static fromJSON(data) {
        return new Equipment(data);
    }
}