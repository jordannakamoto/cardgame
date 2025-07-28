export default class Hero {
    constructor(config) {
        this.id = config.id;
        this.name = config.name;
        this.type = config.type || 'damage'; // 'damage', 'support', 'hybrid'
        this.portraitKey = config.portraitKey || null;
        
        // Base multipliers
        this.baseMultiplier = config.baseMultiplier || 1.0;
        
        // Conditional multipliers (to be implemented by specific heroes)
        this.conditionalMultipliers = config.conditionalMultipliers || [];
        
        // Mana system
        this.currentMana = 0;
        this.maxMana = config.maxMana || 100;
        
        // Abilities (to be implemented later)
        this.abilities = config.abilities || [];
        
        // Stats
        this.level = 1;
        this.experience = 0;
    }
    
    // Calculate total multiplier for a given poker hand
    calculateMultiplier(pokerHand, context = {}) {
        let multiplier = this.baseMultiplier;
        
        // Apply conditional multipliers
        this.conditionalMultipliers.forEach(condition => {
            if (this.checkCondition(condition, pokerHand, context)) {
                multiplier *= condition.multiplier;
            }
        });
        
        return multiplier;
    }
    
    // Override in specific hero classes
    checkCondition(condition, pokerHand, context) {
        // Base implementation - override in subclasses
        return false;
    }
    
    // Mana generation from played cards
    generateMana(cardsPlayed) {
        // Base implementation: 1 mana per card
        const manaGained = cardsPlayed.length;
        this.currentMana = Math.min(this.currentMana + manaGained, this.maxMana);
        return manaGained;
    }
    
    // Check if ability can be used
    canUseAbility(abilityIndex) {
        const ability = this.abilities[abilityIndex];
        if (!ability) return false;
        
        return this.currentMana >= ability.manaCost;
    }
    
    // Use ability (to be implemented with ability system)
    useAbility(abilityIndex, context) {
        const ability = this.abilities[abilityIndex];
        if (!this.canUseAbility(abilityIndex)) return false;
        
        this.currentMana -= ability.manaCost;
        // Ability effects to be implemented
        return true;
    }
    
    // Save/Load
    save() {
        return {
            id: this.id,
            currentMana: this.currentMana,
            level: this.level,
            experience: this.experience
        };
    }
    
    load(data) {
        this.currentMana = data.currentMana || 0;
        this.level = data.level || 1;
        this.experience = data.experience || 0;
    }
}