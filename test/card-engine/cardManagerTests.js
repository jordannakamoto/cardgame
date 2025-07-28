import CardManager from '../../src/game/CardManager.js';
import { describe, test, expect, logTestDetails } from '../testFramework.js';

// Mock scene object for CardManager
const createMockScene = () => ({
    add: {
        graphics: () => ({
            x: 0,
            y: 0,
            fillStyle: () => {},
            fillRoundedRect: () => {},
            lineStyle: () => {},
            strokeRoundedRect: () => {},
            setInteractive: () => {},
            on: () => {}
        }),
        text: () => ({
            setOrigin: () => {}
        })
    },
    cameras: {
        main: {
            width: 1280,
            height: 720
        }
    }
});

describe('Card Manager System', () => {
    
    describe('Deck Creation', () => {
        test('creates standard 52-card deck', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            const deck = cardManager.createDeck();
            
            const suits = new Set(deck.map(card => card.suit));
            const ranks = new Set(deck.map(card => card.rank));
            
            logTestDetails('Standard Deck Creation', {
                'Total Cards': deck.length,
                'Expected Cards': 52,
                'Unique Suits': suits.size,
                'Expected Suits': 4,
                'Unique Ranks': ranks.size,
                'Expected Ranks': 13,
                'Valid Deck': (deck.length === 52 && suits.size === 4 && ranks.size === 13) ? 'Yes' : 'No'
            });
            
            expect(deck.length).toBe(52);
            expect(suits.size).toBe(4);
            expect(ranks.size).toBe(13);
        });

        test('creates all four suits', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            const deck = cardManager.createDeck();
            
            const suits = deck.map(card => card.suit);
            const suitCounts = {
                'Hearts': suits.filter(suit => suit === 'Hearts').length,
                'Diamonds': suits.filter(suit => suit === 'Diamonds').length,
                'Clubs': suits.filter(suit => suit === 'Clubs').length,
                'Spades': suits.filter(suit => suit === 'Spades').length
            };
            
            logTestDetails('Suit Distribution', {
                'Hearts': suitCounts.Hearts,
                'Diamonds': suitCounts.Diamonds,
                'Clubs': suitCounts.Clubs,
                'Spades': suitCounts.Spades,
                'Each Suit Count': 13,
                'All Equal': Object.values(suitCounts).every(count => count === 13) ? 'Yes' : 'No'
            });
            
            expect(suitCounts.Hearts).toBe(13);
            expect(suitCounts.Diamonds).toBe(13);
            expect(suitCounts.Clubs).toBe(13);
            expect(suitCounts.Spades).toBe(13);
        });

        test('creates all thirteen ranks', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            const deck = cardManager.createDeck();
            
            const expectedRanks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
            const ranks = deck.map(card => card.rank);
            const rankCounts = {};
            
            expectedRanks.forEach(rank => {
                rankCounts[rank] = ranks.filter(r => r === rank).length;
            });
            
            logTestDetails('Rank Distribution', {
                'Number Cards (2-10)': expectedRanks.slice(0, 9).map(rank => `${rank}: ${rankCounts[rank]}`).join(', '),
                'Face Cards': `J: ${rankCounts.J}, Q: ${rankCounts.Q}, K: ${rankCounts.K}, A: ${rankCounts.A}`,
                'Each Rank Count': 4,
                'All Present': expectedRanks.every(rank => rankCounts[rank] === 4) ? 'Yes' : 'No'
            });
            
            expectedRanks.forEach(rank => {
                expect(rankCounts[rank]).toBe(4);
            });
        });
    });

    describe('Deck Shuffling', () => {
        test('shuffles deck to different order', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            cardManager.createDeck();
            const originalOrder = cardManager.deck.map(card => card.toString());
            
            cardManager.shuffleDeck();
            const shuffledOrder = cardManager.deck.map(card => card.toString());
            
            const sameOrder = JSON.stringify(originalOrder) === JSON.stringify(shuffledOrder);
            const sameLength = originalOrder.length === shuffledOrder.length;
            const sameCards = new Set(originalOrder).size === new Set(shuffledOrder).size;
            
            logTestDetails('Deck Shuffling', {
                'Original First 5': originalOrder.slice(0, 5).join(', '),
                'Shuffled First 5': shuffledOrder.slice(0, 5).join(', '),
                'Same Order': sameOrder ? 'Yes (Bad!)' : 'No (Good!)',
                'Same Length': sameLength ? 'Yes' : 'No',
                'Same Cards': sameCards ? 'Yes' : 'No',
                'Shuffle Working': (!sameOrder && sameLength && sameCards) ? 'Yes' : 'No'
            });
            
            expect(sameOrder).toBe(false);
            expect(sameLength).toBe(true);
            expect(cardManager.deck.length).toBe(52);
        });

        test('maintains deck integrity after shuffle', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            cardManager.createDeck();
            const originalSuits = cardManager.deck.map(card => card.suit);
            const originalRanks = cardManager.deck.map(card => card.rank);
            
            cardManager.shuffleDeck();
            const shuffledSuits = cardManager.deck.map(card => card.suit);
            const shuffledRanks = cardManager.deck.map(card => card.rank);
            
            const suitCounts = {
                original: { Hearts: 0, Diamonds: 0, Clubs: 0, Spades: 0 },
                shuffled: { Hearts: 0, Diamonds: 0, Clubs: 0, Spades: 0 }
            };
            
            originalSuits.forEach(suit => suitCounts.original[suit]++);
            shuffledSuits.forEach(suit => suitCounts.shuffled[suit]++);
            
            logTestDetails('Deck Integrity After Shuffle', {
                'Original Hearts': suitCounts.original.Hearts,
                'Shuffled Hearts': suitCounts.shuffled.Hearts,
                'Original Total': originalSuits.length,
                'Shuffled Total': shuffledSuits.length,
                'Integrity Maintained': JSON.stringify(suitCounts.original) === JSON.stringify(suitCounts.shuffled) ? 'Yes' : 'No'
            });
            
            expect(suitCounts.original.Hearts).toBe(suitCounts.shuffled.Hearts);
            expect(suitCounts.original.Diamonds).toBe(suitCounts.shuffled.Diamonds);
            expect(suitCounts.original.Clubs).toBe(suitCounts.shuffled.Clubs);
            expect(suitCounts.original.Spades).toBe(suitCounts.shuffled.Spades);
        });
    });

    describe('Card Drawing', () => {
        test('draws cards from deck', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            cardManager.createDeck();
            const initialSize = cardManager.getDeckSize();
            
            const drawnCard = cardManager.drawCard();
            const afterDrawSize = cardManager.getDeckSize();
            
            logTestDetails('Card Drawing', {
                'Initial Deck Size': initialSize,
                'After Draw Size': afterDrawSize,
                'Size Difference': initialSize - afterDrawSize,
                'Drawn Card': drawnCard ? drawnCard.toString() : 'null',
                'Card Defined': drawnCard ? 'Yes' : 'No',
                'Size Reduced': afterDrawSize === initialSize - 1 ? 'Yes' : 'No'
            });
            
            expect(drawnCard).toBeDefined();
            expect(afterDrawSize).toBe(initialSize - 1);
        });

        test('reduces deck size with each draw', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            cardManager.createDeck();
            const sizes = [cardManager.getDeckSize()];
            const drawnCards = [];
            
            // Draw 5 cards
            for (let i = 0; i < 5; i++) {
                const card = cardManager.drawCard();
                drawnCards.push(card.toString());
                sizes.push(cardManager.getDeckSize());
            }
            
            logTestDetails('Multiple Card Drawing', {
                'Starting Size': sizes[0],
                'After 1 Draw': sizes[1],
                'After 2 Draws': sizes[2],
                'After 3 Draws': sizes[3],
                'After 4 Draws': sizes[4],
                'After 5 Draws': sizes[5],
                'Cards Drawn': drawnCards.join(', '),
                'Consistent Reduction': sizes.every((size, i) => i === 0 || size === sizes[i-1] - 1) ? 'Yes' : 'No'
            });
            
            expect(sizes[5]).toBe(47); // 52 - 5
            sizes.forEach((size, index) => {
                if (index > 0) {
                    expect(size).toBe(sizes[index - 1] - 1);
                }
            });
        });
    });

    describe('Suit Symbol System', () => {
        test('returns correct suit symbols', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            const symbols = {
                'Hearts': cardManager.getSuitSymbol('Hearts'),
                'Diamonds': cardManager.getSuitSymbol('Diamonds'),
                'Clubs': cardManager.getSuitSymbol('Clubs'),
                'Spades': cardManager.getSuitSymbol('Spades')
            };
            
            const expected = {
                'Hearts': '♥',
                'Diamonds': '♦',
                'Clubs': '♣',
                'Spades': '♠'
            };
            
            logTestDetails('Suit Symbol Mapping', {
                'Hearts Symbol': `'${symbols.Hearts}' (Expected: '${expected.Hearts}')`,
                'Diamonds Symbol': `'${symbols.Diamonds}' (Expected: '${expected.Diamonds}')`,
                'Clubs Symbol': `'${symbols.Clubs}' (Expected: '${expected.Clubs}')`,
                'Spades Symbol': `'${symbols.Spades}' (Expected: '${expected.Spades}')`,
                'All Correct': JSON.stringify(symbols) === JSON.stringify(expected) ? 'Yes' : 'No'
            });
            
            expect(symbols.Hearts).toBe('♥');
            expect(symbols.Diamonds).toBe('♦');
            expect(symbols.Clubs).toBe('♣');
            expect(symbols.Spades).toBe('♠');
        });

        test('handles unknown suit gracefully', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            const unknownSuit = 'InvalidSuit';
            const result = cardManager.getSuitSymbol(unknownSuit);
            
            logTestDetails('Unknown Suit Handling', {
                'Input Suit': unknownSuit,
                'Returned Symbol': result,
                'Expected Behavior': 'Return original suit name',
                'Handled Gracefully': result === unknownSuit ? 'Yes' : 'No'
            });
            
            expect(result).toBe(unknownSuit);
        });
    });

    describe('Manager State', () => {
        test('tracks deck size accurately', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            let currentSize = cardManager.getDeckSize();
            logTestDetails('Initial State', {
                'Initial Deck Size': currentSize,
                'Expected': 0
            });
            expect(currentSize).toBe(0);
            
            cardManager.createDeck();
            currentSize = cardManager.getDeckSize();
            logTestDetails('After Deck Creation', {
                'Deck Size': currentSize,
                'Expected': 52
            });
            expect(currentSize).toBe(52);
            
            // Draw some cards
            cardManager.drawCard();
            cardManager.drawCard();
            cardManager.drawCard();
            currentSize = cardManager.getDeckSize();
            
            logTestDetails('After Drawing 3 Cards', {
                'Deck Size': currentSize,
                'Expected': 49,
                'Tracking Accurate': currentSize === 49 ? 'Yes' : 'No'
            });
            expect(currentSize).toBe(49);
        });

        test('maintains card manager properties', () => {
            const mockScene = createMockScene();
            const cardManager = new CardManager(mockScene);
            
            logTestDetails('Card Manager Properties', {
                'Suits Array Length': cardManager.suits.length,
                'Ranks Array Length': cardManager.ranks.length,
                'Values Object Keys': Object.keys(cardManager.values).length,
                'Scene Reference': cardManager.scene ? 'Present' : 'Missing',
                'Initial Deck Length': cardManager.deck.length
            });
            
            expect(cardManager.suits.length).toBe(4);
            expect(cardManager.ranks.length).toBe(13);
            expect(Object.keys(cardManager.values).length).toBe(13);
            expect(cardManager.scene).toBeDefined();
            expect(cardManager.deck).toBeDefined();
        });
    });
});

console.log('\n🎯 Starting Card Manager Tests...\n');