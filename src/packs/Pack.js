export default class Pack {
    constructor(config = {}) {
        this.id = config.id || 'basic_pack';
        this.name = config.name || 'Basic Pack';
        this.description = config.description || 'Contains random cards';
        this.artKey = config.artKey || 'pack_basic1';
        this.price = config.price || 25;
        this.rarity = config.rarity || 'common';
        
        // Pack contents configuration
        this.cardCount = config.cardCount || 5;
        this.guaranteedRarities = config.guaranteedRarities || { common: 3, uncommon: 1, rare: 1 };
        this.possibleCards = config.possibleCards || [];
    }
    
    // Open the pack and return random cards
    open() {
        const cards = [];
        const rarityPool = { ...this.guaranteedRarities };
        
        // Generate cards based on guaranteed rarities
        for (const [rarity, count] of Object.entries(rarityPool)) {
            for (let i = 0; i < count; i++) {
                const card = this.generateRandomCard(rarity);
                if (card) {
                    cards.push(card);
                }
            }
        }
        
        // Fill remaining slots with random cards
        while (cards.length < this.cardCount) {
            const card = this.generateRandomCard();
            if (card) {
                cards.push(card);
            }
        }
        
        return cards;
    }
    
    generateRandomCard(targetRarity = null) {
        // For now, generate basic playing cards with different rarities
        // This can be expanded to include special cards, abilities, etc.
        
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        
        const suit = suits[Math.floor(Math.random() * suits.length)];
        const rank = ranks[Math.floor(Math.random() * ranks.length)];
        
        // Assign rarity based on card value or random if not specified
        let rarity = targetRarity;
        if (!rarity) {
            const rarityRoll = Math.random();
            if (rarityRoll < 0.6) rarity = 'common';
            else if (rarityRoll < 0.85) rarity = 'uncommon';
            else if (rarityRoll < 0.95) rarity = 'rare';
            else rarity = 'legendary';
        }
        
        // Create card object
        return {
            id: `${rank.toLowerCase()}_${suit.toLowerCase()}`,
            name: `${rank} of ${suit}`,
            rank,
            suit,
            rarity,
            type: 'playing_card',
            // Special properties based on rarity
            special: this.generateSpecialProperties(rarity, rank, suit)
        };
    }
    
    generateSpecialProperties(rarity, rank, suit) {
        const special = {};
        
        switch (rarity) {
            case 'uncommon':
                // 10% damage bonus
                special.damageBonus = 0.1;
                special.description = '+10% damage';
                break;
            case 'rare':
                // 25% damage bonus
                special.damageBonus = 0.25;
                special.description = '+25% damage';
                break;
            case 'legendary':
                // 50% damage bonus + special effect
                special.damageBonus = 0.5;
                special.effect = 'draw_card_on_play';
                special.description = '+50% damage, draw a card when played';
                break;
        }
        
        return special;
    }
    
    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return 0x9e9e9e;
            case 'uncommon': return 0x4caf50;
            case 'rare': return 0x2196f3;
            case 'legendary': return 0xff9800;
            case 'mythic': return 0x9c27b0;
            default: return 0x9e9e9e;
        }
    }
}