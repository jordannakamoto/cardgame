// Import all hero classes
import StarterHero from './heroes/StarterHero.js';
import Analyst from './heroes/CardShark.js'; // CardShark.js now contains Analyst
import PowerHitter from './heroes/PowerHitter.js';
import Phantom from './heroes/HandReader.js'; // HandReader.js now contains Phantom
import Guardian from './heroes/Guardian.js'; // LuckyCharm.js now contains Guardian
import Conduit from './heroes/Conduit.js';

export const HeroClasses = {
    'starter_hero': StarterHero,
    'analyst': Analyst,
    'power_hitter': PowerHitter,
    'phantom': Phantom,
    'guardian': Guardian,
    'conduit': Conduit
};

export const HeroShopData = [
    {
        id: 'analyst',
        name: 'The Analyst',
        price: 4,
        type: 'damage',
        rarity: 'common',
        description: 'First Spades hand applies Tears. Strong hands consume Tears for bonus damage'
    },
    {
        id: 'power_hitter',
        name: 'Power Hitter',
        price: 5,
        type: 'damage',
        rarity: 'uncommon',
        description: 'Bonus damage when playing face cards'
    },
    {
        id: 'phantom',
        name: 'The Phantom',
        price: 6,
        type: 'support',
        rarity: 'rare',
        description: 'Once per round, return played cards to hand (not on last hand)'
    },
    {
        id: 'guardian',
        name: 'The Guardian',
        price: 7,
        type: 'support',
        rarity: 'epic',
        description: 'Build Armor with weak hands. Bonus damage per Armor when finishing enemies'
    },
    {
        id: 'conduit',
        name: 'The Conduit',
        price: 8,
        type: 'hybrid',
        rarity: 'legendary',
        description: 'Pay $5 at round start for +50 Chips and +5 Mult on all hands'
    }
];

export function createHero(heroId) {
    const HeroClass = HeroClasses[heroId];
    if (!HeroClass) {
        throw new Error(`Hero class not found: ${heroId}`);
    }
    return new HeroClass();
}

export function getHeroShopData(heroId) {
    return HeroShopData.find(hero => hero.id === heroId) || null;
}

export function getAllHeroShopData() {
    return [...HeroShopData];
}
