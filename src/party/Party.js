export default class Party {
    constructor() {
        this.heroes = [];
        this.maxSize = 3; // Maximum party size
        this.activeHeroIndex = 0;
    }

    // Add hero to party
    addHero(hero, playerDeck = null) {
        if (this.heroes.length >= this.maxSize) {
            throw new Error(`Party is full. Maximum size: ${this.maxSize}`);
        }
        
        // Check for duplicate heroes
        if (this.heroes.some(h => h.id === hero.id)) {
            throw new Error('Hero already in party');
        }
        
        this.heroes.push(hero);
        
        // Set as active hero if it's the first one
        if (this.heroes.length === 1) {
            this.activeHeroIndex = 0;
        }
        
        // Call hero's onAddedToParty method if it exists
        if (hero.onAddedToParty && typeof hero.onAddedToParty === 'function' && playerDeck) {
            hero.onAddedToParty(playerDeck);
        }
        
        return true;
    }

    // Remove hero from party
    removeHero(heroId) {
        const index = this.heroes.findIndex(h => h.id === heroId);
        if (index === -1) {
            return false;
        }
        
        this.heroes.splice(index, 1);
        
        // Adjust active hero index if necessary
        if (this.activeHeroIndex >= this.heroes.length) {
            this.activeHeroIndex = Math.max(0, this.heroes.length - 1);
        }
        
        return true;
    }

    // Get active hero
    getActiveHero() {
        return this.heroes[this.activeHeroIndex] || null;
    }

    // Set active hero by index
    setActiveHero(index) {
        if (index >= 0 && index < this.heroes.length) {
            this.activeHeroIndex = index;
            return true;
        }
        return false;
    }

    // Set active hero by hero object
    setActiveHeroById(heroId) {
        const index = this.heroes.findIndex(h => h.id === heroId);
        if (index !== -1) {
            this.activeHeroIndex = index;
            return true;
        }
        return false;
    }

    // Get all heroes
    getAllHeroes() {
        return [...this.heroes]; // Return copy to prevent external modification
    }

    // Check if party has space
    hasSpace() {
        return this.heroes.length < this.maxSize;
    }

    // Get party size
    getSize() {
        return this.heroes.length;
    }

    // Get max party size
    getMaxSize() {
        return this.maxSize;
    }

    // Check if hero is in party
    hasHero(heroId) {
        return this.heroes.some(h => h.id === heroId);
    }

    // Get hero by ID
    getHeroById(heroId) {
        return this.heroes.find(h => h.id === heroId) || null;
    }

    // Reorder heroes in party
    reorderHero(fromIndex, toIndex) {
        if (fromIndex < 0 || fromIndex >= this.heroes.length ||
            toIndex < 0 || toIndex >= this.heroes.length) {
            return false;
        }
        
        const hero = this.heroes.splice(fromIndex, 1)[0];
        this.heroes.splice(toIndex, 0, hero);
        
        // Update active hero index if it was affected
        if (this.activeHeroIndex === fromIndex) {
            this.activeHeroIndex = toIndex;
        } else if (fromIndex < this.activeHeroIndex && toIndex >= this.activeHeroIndex) {
            this.activeHeroIndex--;
        } else if (fromIndex > this.activeHeroIndex && toIndex <= this.activeHeroIndex) {
            this.activeHeroIndex++;
        }
        
        return true;
    }

    // Save party state
    save() {
        return {
            heroes: this.heroes.map(hero => hero.save()),
            activeHeroIndex: this.activeHeroIndex,
            maxSize: this.maxSize
        };
    }

    // Load party state
    load(data, heroClasses) {
        this.heroes = [];
        this.activeHeroIndex = data.activeHeroIndex || 0;
        this.maxSize = data.maxSize || 3;
        
        if (data.heroes && heroClasses) {
            data.heroes.forEach(heroData => {
                const HeroClass = heroClasses[heroData.id];
                if (HeroClass) {
                    const hero = new HeroClass();
                    hero.load(heroData);
                    this.heroes.push(hero);
                }
            });
        }
    }

    // Get party statistics
    getStats() {
        return {
            totalLevel: this.heroes.reduce((sum, hero) => sum + hero.level, 0),
            averageLevel: this.heroes.length > 0 ? 
                Math.round(this.heroes.reduce((sum, hero) => sum + hero.level, 0) / this.heroes.length) : 0,
            totalMana: this.heroes.reduce((sum, hero) => sum + hero.currentMana, 0),
            maxMana: this.heroes.reduce((sum, hero) => sum + hero.maxMana, 0),
            partySize: this.heroes.length,
            maxSize: this.maxSize
        };
    }
}