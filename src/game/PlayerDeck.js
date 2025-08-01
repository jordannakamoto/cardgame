import Card from './Card.js';
import { SpecialAttackAnimations } from '../animations/SpecialAttackAnimations.js';

export default class PlayerDeck {
    constructor() {
        this.cards = [];
        this.starterDeck = [];
        this.loadDeck();
    }

    // Initialize the default starter deck
    initializeStarterDeck() {
        this.starterDeck = [];
        const suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        const values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };

        // Create a standard 52-card deck
        for (const suit of suits) {
            for (const rank of ranks) {
                const card = new Card(rank, suit, values[rank]);
                this.starterDeck.push(card);
            }
        }

        // Add the special Joker card with modifier
        const jokerCard = new Card('Joker', 'Wild', 15, 'LEGENDARY');
        jokerCard.addModifier({
            type: 'ALWAYS_IN_FIRST_HAND',
            name: 'First Hand Guarantee',
            description: 'This card is always drawn in the first hand of battle'
        });
        jokerCard.addModifier({
            type: 'DAMAGE_BONUS',
            name: 'Wildcard Power',
            description: 'Adds +5 damage when played',
            value: 5
        });
        
        // Set the joker's special attack animation
        jokerCard.setSpecialAttackAnimation(SpecialAttackAnimations.jokerSlashAttack);
        
        this.starterDeck.push(jokerCard);
        this.cards = [...this.starterDeck];
        console.log('Added joker card to deck. Total cards:', this.cards.length);
        console.log('Joker card:', jokerCard.toString());
        this.saveDeck();
    }

    // Add a card to the deck
    addCard(card) {
        if (card instanceof Card) {
            this.cards.push(card);
            this.saveDeck();
            return true;
        }
        return false;
    }

    // Remove a card from the deck by card ID
    removeCard(cardId) {
        const index = this.cards.findIndex(card => card.cardId === cardId);
        if (index !== -1) {
            const removedCard = this.cards.splice(index, 1)[0];
            this.saveDeck();
            return removedCard;
        }
        return null;
    }

    // Modify a card (add/remove modifiers)
    modifyCard(cardId, modifier, action = 'add') {
        const card = this.cards.find(card => card.cardId === cardId);
        if (card) {
            if (action === 'add') {
                card.addModifier(modifier);
            } else if (action === 'remove') {
                card.removeModifier(modifier.type);
            }
            this.saveDeck();
            return true;
        }
        return false;
    }

    // Get a copy of all cards
    getAllCards() {
        return [...this.cards];
    }

    // Get cards with specific modifiers
    getCardsWithModifier(modifierType) {
        return this.cards.filter(card => card.hasModifier(modifierType));
    }

    // Get deck size
    getDeckSize() {
        return this.cards.length;
    }

    // Draw cards for battle (includes special handling for modifiers)
    drawHand(handSize = 8, isFirstHand = false) {
        console.log('Drawing hand. handSize:', handSize, 'isFirstHand:', isFirstHand);
        console.log('Total cards in deck:', this.cards.length);
        
        // Only include special "first hand" cards if this is actually the first hand
        const specialCards = isFirstHand ? 
            this.cards.filter(card => card.hasModifier('ALWAYS_IN_FIRST_HAND')) : 
            [];
        const regularCards = this.cards.filter(card => !card.hasModifier('ALWAYS_IN_FIRST_HAND'));
        
        console.log('Special cards (jokers):', specialCards.length);
        if (specialCards.length > 0) {
            console.log('Joker cards found:', specialCards.map(c => c.toString()));
        }
        
        // Shuffle regular cards
        const shuffledRegular = this.shuffleArray([...regularCards]);
        
        // Create hand starting with special cards (if any)
        const hand = [...specialCards];
        
        // Fill remaining slots with regular cards
        const remainingSlots = Math.max(0, handSize - specialCards.length);
        const regularCardsForHand = shuffledRegular.slice(0, remainingSlots);
        hand.push(...regularCardsForHand);
        
        // If we have too many cards, prioritize special cards
        if (hand.length > handSize) {
            return hand.slice(0, handSize);
        }
        
        return hand;
    }

    // Draw a single card (for discards/replacements)
    drawSingleCard() {
        const regularCards = this.cards.filter(card => !card.hasModifier('ALWAYS_IN_FIRST_HAND'));
        
        if (regularCards.length === 0) {
            console.warn('No cards available to draw');
            return null;
        }
        
        // Pick a random card
        const randomIndex = Math.floor(Math.random() * regularCards.length);
        return regularCards[randomIndex];
    }
    
    // Shuffle array utility
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // Reset deck to starter deck
    resetToStarterDeck() {
        this.initializeStarterDeck();
    }

    // Save deck to localStorage
    saveDeck() {
        try {
            const deckData = {
                cards: this.cards.map(card => card.toJSON()),
                timestamp: Date.now()
            };
            localStorage.setItem('playerDeck', JSON.stringify(deckData));
        } catch (error) {
            console.warn('Failed to save deck to localStorage:', error);
        }
    }

    // Load deck from localStorage
    loadDeck() {
        try {
            const deckData = localStorage.getItem('playerDeck');
            if (deckData) {
                const parsed = JSON.parse(deckData);
                this.cards = parsed.cards.map(cardData => Card.fromJSON(cardData));
                
                // Reapply special animations to loaded cards
                this.reapplySpecialAnimations();
            } else {
                // No saved deck, initialize starter deck
                this.initializeStarterDeck();
            }
        } catch (error) {
            console.warn('Failed to load deck from localStorage, initializing starter deck:', error);
            this.initializeStarterDeck();
        }
    }
    
    // Reapply special animations to cards after loading from storage  
    reapplySpecialAnimations() {
        this.cards.forEach(card => {
            if (card.rank === 'Joker' && card.suit === 'Wild') {
                card.setSpecialAttackAnimation(SpecialAttackAnimations.jokerSlashAttack);
            }
            // Add more special animation assignments as needed
        });
    }
    
    // Apply hero-specific modifications to cards (called when heroes are added to party)
    applyHeroModifications(hero) {
        if (hero.onAddedToParty && typeof hero.onAddedToParty === 'function') {
            hero.onAddedToParty(this);
        }
    }
    
    // Get all joker cards in the deck
    getJokerCards() {
        return this.cards.filter(card => card.rank === 'Joker' && card.suit === 'Wild');
    }

    // Get deck statistics
    getDeckStats() {
        const stats = {
            totalCards: this.cards.length,
            cardsByRarity: {},
            cardsByModifier: {},
            specialCards: 0
        };

        // Count rarities
        const rarities = ['COMMON', 'UNCOMMON', 'RARE', 'LEGENDARY'];
        rarities.forEach(rarity => {
            stats.cardsByRarity[rarity] = this.cards.filter(card => card.rarity === rarity).length;
        });

        // Count modifiers
        this.cards.forEach(card => {
            if (card.isSpecial) {
                stats.specialCards++;
            }
            card.modifiers.forEach(modifier => {
                stats.cardsByModifier[modifier.type] = (stats.cardsByModifier[modifier.type] || 0) + 1;
            });
        });

        return stats;
    }

    // Find cards by criteria
    findCards(criteria) {
        return this.cards.filter(card => {
            if (criteria.rank && card.rank !== criteria.rank) return false;
            if (criteria.suit && card.suit !== criteria.suit) return false;
            if (criteria.rarity && card.rarity !== criteria.rarity) return false;
            if (criteria.hasModifier && !card.hasModifier(criteria.hasModifier)) return false;
            if (criteria.minValue && card.value < criteria.minValue) return false;
            if (criteria.maxValue && card.value > criteria.maxValue) return false;
            return true;
        });
    }

    // Export deck data (for backup/sharing)
    exportDeck() {
        return {
            cards: this.cards.map(card => card.toJSON()),
            stats: this.getDeckStats(),
            exportedAt: new Date().toISOString()
        };
    }

    // Import deck data (from backup/sharing)
    importDeck(deckData) {
        try {
            if (deckData.cards && Array.isArray(deckData.cards)) {
                this.cards = deckData.cards.map(cardData => Card.fromJSON(cardData));
                this.saveDeck();
                return true;
            }
        } catch (error) {
            console.error('Failed to import deck:', error);
        }
        return false;
    }
}