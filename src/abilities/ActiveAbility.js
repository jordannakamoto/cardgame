export default class ActiveAbility {
    constructor(config) {
        this.name = config.name || 'Unknown Ability';
        this.description = config.description || '';
        this.manaCosts = config.manaCosts || {}; // { '♥': 1, '♠': 2, etc. }
        this.cooldown = config.cooldown || 0;
        this.targetType = config.targetType || 'enemy'; // 'enemy', 'ally', 'self', 'area'
        this.iconPath = config.iconPath || null;
        
        // Runtime state
        this.currentCooldown = 0;
        this.isActive = false;
    }
    
    // Check if ability can be cast (mana costs, cooldown, etc.)
    canCast(manaSystem, battleContext) {
        // Check cooldown
        if (this.currentCooldown > 0) {
            return { canCast: false, reason: `On cooldown: ${this.currentCooldown} turns` };
        }
        
        // Check mana costs
        if (!manaSystem.canAfford(this.manaCosts)) {
            const missingMana = [];
            for (const [suit, cost] of Object.entries(this.manaCosts)) {
                const current = manaSystem.getMana(suit);
                if (current < cost) {
                    missingMana.push(`${cost - current} ${suit}`);
                }
            }
            return { canCast: false, reason: `Need: ${missingMana.join(', ')}` };
        }
        
        return { canCast: true };
    }
    
    // Execute the ability - override in subclasses
    async execute(target, battleContext) {
        throw new Error('ActiveAbility.execute() must be implemented by subclass');
    }
    
    // Start cooldown after ability use
    startCooldown() {
        this.currentCooldown = this.cooldown;
    }
    
    // Reduce cooldown by 1 (called at end of turn)
    reduceCooldown() {
        if (this.currentCooldown > 0) {
            this.currentCooldown--;
        }
    }
    
    // Get formatted mana cost string for UI
    getManaCostString() {
        const costs = [];
        for (const [suit, cost] of Object.entries(this.manaCosts)) {
            costs.push(`${cost}${suit}`);
        }
        return costs.join(' ');
    }
    
    // Create visual representation for UI
    createIcon(scene, x, y) {
        // Default icon - can be overridden
        const icon = scene.add.circle(x, y, 25, 0x444444);
        icon.setStrokeStyle(2, 0x888888);
        return icon;
    }
}