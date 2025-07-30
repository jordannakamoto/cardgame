export default class Card {
    constructor(rank, suit, value, rarity = 'COMMON', cardId = null) {
        this.rank = rank;
        this.suit = suit;
        this.value = value;
        this.faceUp = false;
        this.rarity = rarity;
        this.cardId = cardId || this.generateCardId();
        this.modifiers = [];
        this.damageBonus = 0;
        this.isSpecial = false;
        this.specialAttackAnimation = null; // Function to call for special attack effects
    }

    generateCardId() {
        return `${this.rank}_${this.suit}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    addModifier(modifier) {
        if (!this.hasModifier(modifier.type)) {
            this.modifiers.push(modifier);
            this.applyModifier(modifier);
        }
    }

    removeModifier(modifierType) {
        const index = this.modifiers.findIndex(mod => mod.type === modifierType);
        if (index !== -1) {
            const modifier = this.modifiers[index];
            this.unapplyModifier(modifier);
            this.modifiers.splice(index, 1);
        }
    }

    hasModifier(modifierType) {
        return this.modifiers.some(mod => mod.type === modifierType);
    }

    getModifier(modifierType) {
        return this.modifiers.find(mod => mod.type === modifierType);
    }

    applyModifier(modifier) {
        switch (modifier.type) {
            case 'DAMAGE_BONUS':
                this.damageBonus += modifier.value;
                break;
            case 'ALWAYS_IN_FIRST_HAND':
                this.isSpecial = true;
                break;
            case 'DRAW_EXTRA_CARD':
                // This will be handled by battle logic
                break;
            case 'CHAIN':
                this.isSpecial = true;
                this.chainData = modifier.data || {};
                break;
        }
    }

    unapplyModifier(modifier) {
        switch (modifier.type) {
            case 'DAMAGE_BONUS':
                this.damageBonus -= modifier.value;
                break;
            case 'ALWAYS_IN_FIRST_HAND':
                this.isSpecial = this.modifiers.some(mod => 
                    mod.type !== 'ALWAYS_IN_FIRST_HAND' && mod.makesSpecial
                );
                break;
            case 'CHAIN':
                this.chainData = null;
                this.isSpecial = this.modifiers.some(mod => 
                    mod.type !== 'CHAIN' && (mod.makesSpecial || mod.type === 'ALWAYS_IN_FIRST_HAND')
                );
                break;
        }
    }

    flip() {
        this.faceUp = !this.faceUp;
    }

    // Set special attack animation for this card
    setSpecialAttackAnimation(animationFunction) {
        this.specialAttackAnimation = animationFunction;
    }

    // Trigger special attack animation if available
    triggerSpecialAttack(scene, cardSprite, targets = null) {
        if (this.specialAttackAnimation && typeof this.specialAttackAnimation === 'function') {
            return this.specialAttackAnimation(scene, cardSprite, targets, this);
        }
        return Promise.resolve(); // Return resolved promise if no animation
    }

    // Check if card has special attack animation
    hasSpecialAttack() {
        return this.specialAttackAnimation !== null;
    }

    // Chain trait methods
    hasChain() {
        return this.hasModifier('CHAIN');
    }

    getChainData() {
        const chainModifier = this.getModifier('CHAIN');
        return chainModifier ? chainModifier.data : null;
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }

    getCardCode() {
        const rankCode = this.rank === '10' ? 'T' : this.rank[0];
        const suitCode = this.suit[0].toUpperCase();
        return `${rankCode}${suitCode}`;
    }

    // Serialization methods for persistence
    toJSON() {
        return {
            rank: this.rank,
            suit: this.suit,
            value: this.value,
            rarity: this.rarity,
            cardId: this.cardId,
            modifiers: this.modifiers,
            damageBonus: this.damageBonus,
            isSpecial: this.isSpecial,
            hasSpecialAttack: this.specialAttackAnimation !== null
        };
    }

    static fromJSON(data) {
        const card = new Card(data.rank, data.suit, data.value, data.rarity, data.cardId);
        card.damageBonus = data.damageBonus || 0;
        card.isSpecial = data.isSpecial || false;
        
        // Reapply modifiers
        if (data.modifiers) {
            data.modifiers.forEach(modifier => {
                card.addModifier(modifier);
            });
        }
        
        // Note: specialAttackAnimation function cannot be serialized, 
        // it needs to be reapplied by the system that creates the card
        
        return card;
    }
}