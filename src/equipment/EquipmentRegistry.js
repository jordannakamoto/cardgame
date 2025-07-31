// Registry of all available equipment items
import { Equipment } from './Equipment.js';

export class EquipmentRegistry {
    static getAllEquipment() {
        return [
            // === DEFENSIVE EQUIPMENT ===
            
            // Armor - Damage Reduction
            new Equipment({
                id: 'iron_vest',
                name: 'Iron Vest',
                description: 'Reduce all damage by 2',
                slot: 'armor',
                rarity: 'common',
                icon: '🦺',
                price: 25,
                passiveStats: {
                    damageReduction: 2
                }
            }),
            
            new Equipment({
                id: 'mystic_barrier',
                name: 'Mystic Barrier',
                description: 'Reduce damage by 1. First hit each battle deals 0 damage.',
                slot: 'armor',
                rarity: 'rare',
                icon: '🛡️',
                price: 45,
                passiveStats: {
                    damageReduction: 1
                },
                triggeredEffects: [{
                    trigger: 'battleStart',
                    type: 'block',
                    value: 1,
                    condition: { firstTime: true }
                }]
            }),
            
            // Accessories - Utility Defense
            new Equipment({
                id: 'lucky_coin',
                name: 'Lucky Coin',
                description: '20% chance to dodge enemy attacks',
                slot: 'accessory',
                rarity: 'uncommon',
                icon: '🪙',
                price: 30,
                passiveStats: {
                    dodgeChance: 0.20
                }
            }),
            
            // === SUSTAIN EQUIPMENT ===
            
            new Equipment({
                id: 'healing_pendant',
                name: 'Healing Pendant',
                description: 'Heal 2 HP when playing a FLUSH',
                slot: 'accessory',
                rarity: 'common',
                icon: '🔮',
                price: 20,
                triggeredEffects: [{
                    trigger: 'handPlayed',
                    type: 'heal',
                    value: 2,
                    condition: { handType: 'Flush' }
                }]
            }),
            
            new Equipment({
                id: 'vampire_ring',
                name: 'Vampire Ring',
                description: 'Heal 1 HP for every 25 damage dealt',
                slot: 'accessory',
                rarity: 'rare',
                icon: '💍',
                price: 40,
                passiveStats: {
                    vampirism: 0.04 // 4% lifesteal = 1 HP per 25 damage
                }
            }),
            
            new Equipment({
                id: 'regeneration_charm',
                name: 'Regeneration Charm',
                description: 'Heal 1 HP at the start of each turn',
                slot: 'accessory',
                rarity: 'uncommon',
                icon: '💚',
                price: 35,
                triggeredEffects: [{
                    trigger: 'turnStart',
                    type: 'heal',
                    value: 1
                }]
            }),
            
            // === JOKER CARD MODIFIERS ===
            
            new Equipment({
                id: 'jokers_mask',
                name: 'Joker\'s Mask',
                description: 'Your Joker cards gain +3 damage',
                slot: 'accessory',
                rarity: 'rare',
                icon: '🎭',
                price: 50,
                specialProperties: {
                    jokerDamageBonus: 3
                }
            }),
            
            new Equipment({
                id: 'wild_card_emblem',
                name: 'Wild Card Emblem',
                description: 'Joker cards count as any suit for FLUSH hands',
                slot: 'accessory',
                rarity: 'legendary',
                icon: '🃏',
                price: 80,
                specialProperties: {
                    jokerWildSuit: true
                }
            }),
            
            new Equipment({
                id: 'tricksters_die',
                name: 'Trickster\'s Die',
                description: '30% chance for Joker effects to trigger twice',
                slot: 'accessory',
                rarity: 'rare',
                icon: '🎲',
                price: 55,
                specialProperties: {
                    jokerDoubleChance: 0.30
                }
            }),
            
            // === HERO ABILITY ENHANCERS ===
            
            new Equipment({
                id: 'amplifying_crystal',
                name: 'Amplifying Crystal',
                description: 'StarterHero: PAIR multiplier increased to 2.0x',
                slot: 'accessory',
                rarity: 'rare',
                icon: '💎',
                price: 45,
                requirements: {
                    heroType: 'starter_hero'
                },
                abilityModifiers: [{
                    abilityName: 'Pair Bonus',
                    type: 'multiplierIncrease',
                    value: 0.5 // Increases from 1.5x to 2.0x
                }]
            }),
            
            new Equipment({
                id: 'guardians_aegis',
                name: 'Guardian\'s Aegis',
                description: 'Guardian: Blocking also heals all allies for 1 HP',
                slot: 'armor',
                rarity: 'legendary',
                icon: '🛡️',
                price: 75,
                requirements: {
                    heroType: 'guardian'
                },
                passiveStats: {
                    damageReduction: 2
                },
                abilityModifiers: [{
                    abilityName: 'Guardian Block',
                    type: 'addEffect',
                    effect: {
                        type: 'healAllies',
                        value: 1
                    }
                }]
            }),
            
            new Equipment({
                id: 'lucky_streak_charm',
                name: 'Lucky Streak Charm',
                description: 'CardShark: Gold bonus also triggers on THREE OF A KIND',
                slot: 'accessory',
                rarity: 'uncommon',
                icon: '🍀',
                price: 35,
                requirements: {
                    heroType: 'card_shark'
                },
                abilityModifiers: [{
                    abilityName: 'Lucky Streak',
                    type: 'addTrigger',
                    trigger: 'THREE_OF_A_KIND'
                }]
            }),
            
            // === UTILITY EQUIPMENT ===
            
            new Equipment({
                id: 'merchants_purse',
                name: 'Merchant\'s Purse',
                description: '+15% gold from all sources',
                slot: 'accessory',
                rarity: 'uncommon',
                icon: '💰',
                price: 30,
                passiveStats: {
                    goldBonus: 0.15
                }
            }),
            
            new Equipment({
                id: 'card_sleeve',
                name: 'Card Sleeve',
                description: '+1 card in starting hand',
                slot: 'accessory',
                rarity: 'common',
                icon: '🂠',
                price: 25,
                specialProperties: {
                    bonusHandSize: 1
                }
            }),
            
            new Equipment({
                id: 'gamblers_dice',
                name: 'Gambler\'s Dice',
                description: '25% chance to redraw when discarding',
                slot: 'accessory',
                rarity: 'rare',
                icon: '🎲',
                price: 50,
                triggeredEffects: [{
                    trigger: 'cardDiscarded',
                    type: 'drawCard',
                    value: 1,
                    condition: { chance: 0.25 }
                }]
            })
        ];
    }
    
    // Get equipment by ID
    static getEquipmentById(id) {
        return this.getAllEquipment().find(eq => eq.id === id);
    }
    
    // Get equipment by slot
    static getEquipmentBySlot(slot) {
        return this.getAllEquipment().filter(eq => eq.slot === slot);
    }
    
    // Get equipment by rarity
    static getEquipmentByRarity(rarity) {
        return this.getAllEquipment().filter(eq => eq.rarity === rarity);
    }
    
    // Get shop selection of equipment
    static getShopEquipment(count = 4) {
        const allEquipment = this.getAllEquipment();
        
        // Weighted selection by rarity
        const weights = {
            'common': 0.45,
            'uncommon': 0.35,
            'rare': 0.15,
            'legendary': 0.05
        };
        
        const shopItems = [];
        while (shopItems.length < count && shopItems.length < allEquipment.length) {
            const randomValue = Math.random();
            let cumulativeWeight = 0;
            let selectedRarity = 'common';
            
            for (const [rarity, weight] of Object.entries(weights)) {
                cumulativeWeight += weight;
                if (randomValue <= cumulativeWeight) {
                    selectedRarity = rarity;
                    break;
                }
            }
            
            const rarityItems = allEquipment.filter(eq => eq.rarity === selectedRarity);
            if (rarityItems.length > 0) {
                const randomItem = rarityItems[Math.floor(Math.random() * rarityItems.length)];
                if (!shopItems.find(item => item.id === randomItem.id)) {
                    shopItems.push(randomItem);
                }
            }
        }
        
        return shopItems;
    }
    
    // Create equipment from shop item format
    static createFromShopItem(shopItem) {
        // Convert old shop format to new equipment format
        if (shopItem.type === 'equipment') {
            return new Equipment({
                id: `legacy_${Date.now()}`,
                name: shopItem.name,
                description: shopItem.description,
                slot: 'accessory', // Default to accessory
                rarity: shopItem.rarity || 'common',
                icon: '⚙️',
                price: shopItem.price,
                passiveStats: this.convertLegacyEffect(shopItem.effect)
            });
        }
        return null;
    }
    
    // Convert legacy effects to new format
    static convertLegacyEffect(effect) {
        switch (effect?.type) {
            case 'damage_boost':
                return { damageBonus: effect.value };
            case 'pair_bonus':
                return { pairBonus: effect.value };
            case 'gold_multiplier':
                return { goldBonus: effect.value - 1 }; // Convert multiplier to bonus
            default:
                return {};
        }
    }
}