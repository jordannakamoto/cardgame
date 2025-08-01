# Equipment System Design Document

## Overview
The equipment system focuses on **survivability** and **ability modification** rather than direct damage increases. This design choice avoids complexity with the team-based damage calculation system while providing meaningful strategic choices.

## Core Principles
1. **Equipment does NOT directly modify damage calculations**
2. **Each hero can equip 2 items** (1 armor, 1 accessory)
3. **Equipment provides defensive stats, utility effects, or ability enhancements**
4. **Some equipment specifically modifies Joker cards or hero abilities**

## Equipment Slots

### Armor Slot
- Primary focus: **Damage reduction and defensive effects**
- Examples: Vests, barriers, shields
- Can provide flat damage reduction or special defensive triggers

### Accessory Slot  
- Primary focus: **Utility, sustain, and special effects**
- Examples: Rings, pendants, charms
- Can provide healing, dodge chance, or triggered abilities

## Equipment Categories

### 1. Defensive Equipment
Provides survivability through damage reduction or mitigation.

```javascript
{
    name: "Iron Vest",
    slot: "armor",
    rarity: "common",
    effects: {
        damageReduction: 2  // Reduce all incoming damage by 2
    }
}

{
    name: "Mystic Barrier",
    slot: "armor", 
    rarity: "rare",
    effects: {
        damageReduction: 1,
        firstHitNegate: true  // First hit each battle deals 0 damage
    }
}

{
    name: "Lucky Coin",
    slot: "accessory",
    rarity: "uncommon",
    effects: {
        dodgeChance: 0.20  // 20% chance to dodge attacks
    }
}
```

### 2. Sustain Equipment
Provides healing or health regeneration effects.

```javascript
{
    name: "Healing Pendant",
    slot: "accessory",
    rarity: "common",
    effects: {
        onHandPlayed: {
            trigger: "FLUSH",
            heal: 2  // Heal 2 HP when playing a FLUSH
        }
    }
}

{
    name: "Vampire Ring",
    slot: "accessory",
    rarity: "rare",
    effects: {
        vampirism: 0.04  // Heal 1 HP for every 25 damage dealt (4% lifesteal)
    }
}

{
    name: "Regeneration Charm",
    slot: "accessory",
    rarity: "uncommon",
    effects: {
        turnHeal: 1  // Heal 1 HP at the start of each turn
    }
}
```

### 3. Joker Card Modifiers
Equipment that specifically enhances or modifies Joker cards.

```javascript
{
    name: "Joker's Mask",
    slot: "accessory",
    rarity: "rare",
    effects: {
        jokerDamageBonus: 3  // Joker cards gain +3 damage
    }
}

{
    name: "Wild Card Emblem",
    slot: "accessory",
    rarity: "legendary",
    effects: {
        jokerWildSuit: true  // Joker cards count as any suit for FLUSH hands
    }
}

{
    name: "Trickster's Die",
    slot: "accessory",
    rarity: "rare",
    effects: {
        jokerDoubleChance: 0.30  // 30% chance for Joker effects to trigger twice
    }
}

{
    name: "Chaos Crown",
    slot: "accessory",
    rarity: "legendary",
    effects: {
        jokerChaos: true  // Joker cards trigger random special effects
    }
}
```

### 4. Hero Ability Enhancers
Equipment that modifies specific hero abilities.

```javascript
{
    name: "Amplifying Crystal",
    slot: "accessory",
    rarity: "rare",
    requirements: {
        heroType: "StarterHero"
    },
    effects: {
        abilityModifier: {
            pairMultiplier: 2.0  // Increases PAIR multiplier from 1.5x to 2.0x
        }
    }
}

{
    name: "Guardian's Aegis",
    slot: "armor",
    rarity: "legendary",
    requirements: {
        heroType: "Guardian"
    },
    effects: {
        damageReduction: 2,
        abilityModifier: {
            blockHealsAllies: 1  // When blocking, heal all allies for 1 HP
        }
    }
}

{
    name: "Lucky Streak Charm",
    slot: "accessory",
    rarity: "uncommon",
    requirements: {
        heroType: "CardShark"
    },
    effects: {
        abilityModifier: {
            additionalGoldTrigger: "THREE_OF_A_KIND"  // Gold bonus also triggers on 3-of-a-kind
        }
    }
}
```

### 5. Utility Equipment
Provides various utility effects that don't fit other categories.

```javascript
{
    name: "Merchant's Purse",
    slot: "accessory",
    rarity: "uncommon",
    effects: {
        goldBonus: 0.15  // +15% gold from all sources
    }
}

{
    name: "Card Sleeve",
    slot: "accessory",
    rarity: "common",
    effects: {
        handSize: 1  // +1 card in starting hand
    }
}

{
    name: "Gambler's Dice",
    slot: "accessory",
    rarity: "rare",
    effects: {
        rerollChance: 0.25  // 25% chance to redraw a card when discarding
    }
}
```

## Implementation Details

### Equipment Class Structure
```javascript
class Equipment {
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.description = data.description;
        this.slot = data.slot; // 'armor' or 'accessory'
        this.rarity = data.rarity; // 'common', 'uncommon', 'rare', 'legendary'
        this.effects = data.effects;
        this.requirements = data.requirements || {};
        this.icon = data.icon; // Sprite path for inventory display
    }
    
    canEquipTo(hero) {
        // Check if hero meets requirements
        if (this.requirements.heroType && hero.type !== this.requirements.heroType) {
            return false;
        }
        return true;
    }
    
    onEquip(hero) {
        // Apply passive stats
        if (this.effects.damageReduction) {
            hero.modifyStat('damageReduction', this.effects.damageReduction);
        }
        
        if (this.effects.dodgeChance) {
            hero.modifyStat('dodgeChance', this.effects.dodgeChance);
        }
        
        // Register triggered effects
        if (this.effects.onHandPlayed) {
            hero.registerTriggeredEffect('handPlayed', this.handleHandPlayed.bind(this));
        }
        
        // Apply ability modifications
        if (this.effects.abilityModifier) {
            hero.applyAbilityModification(this.effects.abilityModifier);
        }
    }
    
    onUnequip(hero) {
        // Reverse all modifications
        // Implementation depends on hero system
    }
}
```

### Hero Equipment Integration
```javascript
class Hero {
    constructor() {
        this.equipment = {
            armor: null,
            accessory: null
        };
        this.stats = {
            damageReduction: 0,
            dodgeChance: 0,
            vampirism: 0
        };
        this.triggeredEffects = new Map();
    }
    
    equipItem(item) {
        const slot = item.slot;
        
        // Unequip existing item
        if (this.equipment[slot]) {
            this.unequipItem(slot);
        }
        
        // Equip new item
        if (item.canEquipTo(this)) {
            this.equipment[slot] = item;
            item.onEquip(this);
            return true;
        }
        
        return false;
    }
    
    takeDamage(amount) {
        // Check dodge
        if (Math.random() < this.stats.dodgeChance) {
            this.scene.showFloatingText(this.x, this.y, "DODGE!");
            return 0;
        }
        
        // Apply damage reduction
        const reducedDamage = Math.max(1, amount - this.stats.damageReduction);
        
        // Apply damage
        this.currentHP -= reducedDamage;
        
        return reducedDamage;
    }
}
```

## Rarity Distribution
- **Common**: 40% drop rate, basic stats
- **Uncommon**: 35% drop rate, improved stats or simple effects  
- **Rare**: 20% drop rate, powerful effects or hero-specific enhancements
- **Legendary**: 5% drop rate, game-changing effects

## Acquisition Methods
1. **Shop Purchase**: Equipment available in shops with rotating inventory
2. **Battle Rewards**: Random equipment drops after battles
3. **Pack Cards**: Special "Equipment Card" type that grants items
4. **Quest Rewards**: Specific equipment for completing objectives
5. **Crafting**: Combine lower-tier equipment (future feature)

## Balance Considerations
- Damage reduction capped at 5 total to prevent immortality
- Dodge chance capped at 50% to maintain challenge
- Healing effects balanced against enemy damage output
- Hero-specific equipment provides ~30-50% improvement to abilities
- Joker modifiers significant but not game-breaking

## Visual Design
- Equipment shows on hero portraits as small icons
- Rarity indicated by border color (gray/green/blue/orange)
- Equipped items glow softly on hero portrait
- Inventory shows detailed stats and effects on hover

## Future Expansion
- Set bonuses for wearing multiple pieces from same set
- Equipment upgrades using resources
- Cursed equipment with powerful effects but drawbacks
- Temporary equipment that lasts X battles
- Equipment that modifies specific card suits or ranks