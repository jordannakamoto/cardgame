export default class HeroManager {
    constructor(scene) {
        this.scene = scene;
        this.heroes = [];
        this.activeHeroIndex = 0;
        this.maxPartySize = 3;
    }
    
    // Add hero to party
    addHero(hero) {
        if (this.heroes.length < this.maxPartySize) {
            // Initialize hero with event system
            hero.initialize(this.scene.events);
            this.heroes.push(hero);
            return true;
        }
        return false;
    }
    
    // Remove hero from party
    removeHero(heroId) {
        const index = this.heroes.findIndex(h => h.id === heroId);
        if (index !== -1) {
            const hero = this.heroes[index];
            // Cleanup hero event subscriptions
            hero.cleanup();
            this.heroes.splice(index, 1);
            if (this.activeHeroIndex >= this.heroes.length) {
                this.activeHeroIndex = Math.max(0, this.heroes.length - 1);
            }
            return true;
        }
        return false;
    }
    
    // Get current active hero
    getActiveHero() {
        return this.heroes[this.activeHeroIndex] || null;
    }
    
    // Switch active hero
    setActiveHero(index) {
        if (index >= 0 && index < this.heroes.length) {
            this.activeHeroIndex = index;
            this.scene.events.emit('activeHeroChanged', this.getActiveHero());
        }
    }
    
    // Calculate damage with hero multiplier
    calculateDamageWithHero(baseDamage, pokerHand, context = {}) {
        let totalMultiplier = 1.0;
        
        // Check all heroes in party for abilities that might activate
        this.heroes.forEach(hero => {
            const heroMultiplier = hero.calculateMultiplier(pokerHand, context);
            totalMultiplier *= heroMultiplier;
        });
        
        return Math.floor(baseDamage * totalMultiplier);
    }
    
    // Generate mana for active hero
    generateManaForActiveHero(cardsPlayed) {
        const hero = this.getActiveHero();
        if (!hero) return 0;
        
        const manaGained = hero.generateMana(cardsPlayed);
        this.scene.events.emit('manaChanged', hero.currentMana, hero.maxMana);
        return manaGained;
    }
    
    // Get all heroes
    getAllHeroes() {
        return [...this.heroes];
    }
    
    // Save/Load
    save() {
        return {
            heroes: this.heroes.map(h => h.save()),
            activeHeroIndex: this.activeHeroIndex
        };
    }
    
    load(data) {
        // Heroes would need to be reconstructed from saved data
        // This is a simplified version
        this.activeHeroIndex = data.activeHeroIndex || 0;
    }
}