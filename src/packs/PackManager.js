import Pack from './Pack.js';

export class PackManager {
    constructor() {
        this.availablePacks = new Map();
        this.initializeBasicPacks();
    }

    initializeBasicPacks() {
        // Basic pack
        const basicPack = new Pack({
            id: 'basic_pack',
            name: 'Basic Card Pack',
            description: 'Contains 5 random cards with guaranteed rarities',
            artKey: 'pack_basic1',
            price: 25,
            rarity: 'common',
            cardCount: 5,
            guaranteedRarities: {
                common: 3,
                uncommon: 1,
                rare: 1
            }
        });

        // Premium pack (more expensive, better odds)
        const premiumPack = new Pack({
            id: 'premium_pack',
            name: 'Premium Card Pack',
            description: 'Contains 5 cards with better rarity chances',
            artKey: 'pack_basic1', // Can use same art for now
            price: 50,
            rarity: 'uncommon',
            cardCount: 5,
            guaranteedRarities: {
                common: 2,
                uncommon: 2,
                rare: 1
            }
        });

        // Legendary pack (rare shop appearance)
        const legendaryPack = new Pack({
            id: 'legendary_pack',
            name: 'Legendary Card Pack',
            description: 'Contains 3 high-rarity cards',
            artKey: 'pack_basic1',
            price: 100,
            rarity: 'legendary',
            cardCount: 3,
            guaranteedRarities: {
                rare: 1,
                legendary: 2
            }
        });

        this.availablePacks.set('basic_pack', basicPack);
        this.availablePacks.set('premium_pack', premiumPack);
        this.availablePacks.set('legendary_pack', legendaryPack);
    }

    getPack(packId) {
        return this.availablePacks.get(packId);
    }

    getAllPacks() {
        return Array.from(this.availablePacks.values());
    }

    getRandomPacksForShop(count = 2) {
        const packs = this.getAllPacks();
        const shopPacks = [];

        // Weight the selection (basic packs more common)
        const weights = {
            'basic_pack': 60,
            'premium_pack': 30,
            'legendary_pack': 10
        };

        for (let i = 0; i < count; i++) {
            const totalWeight = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
            let random = Math.random() * totalWeight;
            
            for (const [packId, weight] of Object.entries(weights)) {
                random -= weight;
                if (random <= 0) {
                    const pack = this.getPack(packId);
                    if (pack) {
                        shopPacks.push(pack);
                    }
                    break;
                }
            }
        }

        return shopPacks;
    }

    // Create a pack as a battle reward
    createBattleRewardPack() {
        // Battle rewards are usually basic packs, occasionally premium
        const roll = Math.random();
        if (roll < 0.8) {
            return this.getPack('basic_pack');
        } else {
            return this.getPack('premium_pack');
        }
    }
}

// Global instance
export const packManager = new PackManager();
export default PackManager;