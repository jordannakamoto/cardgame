import Party from './Party.js';

export default class PartyManager {
    constructor(scene) {
        this.scene = scene;
        this.party = new Party();
        this.availableHeroes = []; // Heroes owned but not in party
        this.ownedHeroes = []; // All heroes owned by player
        this.combatHeroes = []; // Heroes currently in combat (subset of party)
    }

    // Add hero to party (from available heroes)
    addHeroToParty(heroId) {
        console.log('addHeroToParty called with heroId:', heroId);
        console.log('Available heroes before:', this.availableHeroes.map(h => h.name || h.id));
        
        const hero = this.getAvailableHero(heroId);
        if (!hero) {
            console.error('Hero not found in available heroes:', heroId);
            throw new Error('Hero not found in available heroes');
        }

        if (!this.party.hasSpace()) {
            console.error('Party is full, cannot add hero');
            throw new Error('Party is full');
        }

        // Remove from available and add to party
        this.availableHeroes = this.availableHeroes.filter(h => h.id !== heroId);
        this.party.addHero(hero);
        
        console.log('Hero added to party successfully:', hero.name || hero.id);
        console.log('Party size after add:', this.party.getSize());
        console.log('Available heroes after:', this.availableHeroes.map(h => h.name || h.id));

        this.emitPartyChanged();
        return true;
    }

    // Remove hero from party (move to available heroes)
    removeHeroFromParty(heroId) {
        const hero = this.party.getHeroById(heroId);
        if (!hero) {
            return false;
        }

        this.party.removeHero(heroId);
        this.availableHeroes.push(hero);

        this.emitPartyChanged();
        return true;
    }

    // Purchase new hero (adds to available heroes)
    purchaseHero(hero) {
        console.log('purchaseHero called with hero:', hero.name || hero.id);
        
        // Check for duplicates
        if (this.ownsHero(hero.id)) {
            throw new Error('Hero already owned');
        }

        this.availableHeroes.push(hero);
        this.ownedHeroes.push(hero);
        
        console.log('Hero added to availableHeroes and ownedHeroes');
        console.log('Party has space?', this.party.hasSpace());
        console.log('Party size before auto-add:', this.party.getSize());
        
        // Auto-add to party if there's space
        if (this.party.hasSpace()) {
            console.log('Auto-adding hero to party...');
            this.addHeroToParty(hero.id);
        } else {
            console.log('Party is full, hero stays in available heroes');
        }

        this.emitPartyChanged();
        return true;
    }

    // Check if player owns a hero (in party or available)
    ownsHero(heroId) {
        return this.party.hasHero(heroId) || 
               this.availableHeroes.some(h => h.id === heroId);
    }

    // Get available hero by ID
    getAvailableHero(heroId) {
        return this.availableHeroes.find(h => h.id === heroId) || null;
    }

    // Get all available heroes (not in party)
    getAvailableHeroes() {
        return [...this.availableHeroes];
    }

    // Get party instance
    getParty() {
        return this.party;
    }

    // Party convenience methods
    getActiveHero() {
        return this.party.getActiveHero();
    }

    getAllHeroes() {
        return this.party.getAllHeroes();
    }

    setActiveHero(index) {
        const result = this.party.setActiveHero(index);
        if (result) {
            this.emitPartyChanged();
        }
        return result;
    }

    // Calculate damage with active hero
    calculateDamageWithHero(baseDamage, pokerHand, context = {}) {
        const activeHero = this.getActiveHero();
        if (!activeHero) {
            return baseDamage;
        }

        const multiplier = activeHero.calculateMultiplier(pokerHand, context);
        return Math.floor(baseDamage * multiplier);
    }

    // Generate mana for active hero
    generateManaForActiveHero(cardsPlayed) {
        const activeHero = this.getActiveHero();
        if (activeHero) {
            const manaGained = activeHero.generateMana(cardsPlayed);
            this.emitManaChanged(activeHero.currentMana, activeHero.maxMana);
            return manaGained;
        }
        return 0;
    }

    // Emit events
    emitPartyChanged() {
        if (this.scene && this.scene.events) {
            this.scene.events.emit('partyChanged', this.party);
            this.scene.events.emit('activeHeroChanged', this.getActiveHero());
        }
    }

    emitManaChanged(current, max) {
        if (this.scene && this.scene.events) {
            this.scene.events.emit('manaChanged', current, max);
        }
    }

    // Get party statistics
    getPartyStats() {
        return {
            ...this.party.getStats(),
            availableHeroes: this.availableHeroes.length,
            totalOwnedHeroes: this.party.getSize() + this.availableHeroes.length
        };
    }

    // Save/Load functionality
    save() {
        return {
            party: this.party.save(),
            availableHeroes: this.availableHeroes.map(hero => hero.save())
        };
    }

    load(data, heroClasses) {
        // Load party
        if (data.party) {
            this.party.load(data.party, heroClasses);
        }

        // Load available heroes
        this.availableHeroes = [];
        if (data.availableHeroes && heroClasses) {
            data.availableHeroes.forEach(heroData => {
                const HeroClass = heroClasses[heroData.id];
                if (HeroClass) {
                    const hero = new HeroClass();
                    hero.load(heroData);
                    this.availableHeroes.push(hero);
                }
            });
        }
    }
}