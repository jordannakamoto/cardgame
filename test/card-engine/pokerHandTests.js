import Card from '../../src/game/Card.js';
import PokerHand, { HAND_RANKINGS, HAND_NAMES } from '../../src/game/PokerHand.js';
import { describe, test, expect, logAction, logResult, logGameState } from '../testFramework.js';

const createCard = (rank, suit, value) => new Card(rank, suit, value);

describe('Poker Hand Recognition System', () => {
    
    describe('Royal Flush Detection', () => {
        test('Deal Royal Flush in Hearts', () => {
            logGameState('DEALING CARDS');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('K', 'Hearts', 13),
                createCard('Q', 'Hearts', 12),
                createCard('J', 'Hearts', 11),
                createCard('10', 'Hearts', 10)
            ];
            
            logAction('Creating PokerHand instance');
            const hand = new PokerHand(cards);
            
            logResult('Hand Classification', hand.handName);
            logResult('Hand Rank', hand.handRank);
            logGameState('ROYAL FLUSH DETECTED');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
            expect(hand.handName).toBe('Royal Flush');
            expect(hand.tieBreakers).toEqual([14]);
        });

        test('Deal Royal Flush in Spades', () => {
            logGameState('DEALING CARDS');
            const cards = [
                createCard('10', 'Spades', 10),
                createCard('J', 'Spades', 11),
                createCard('Q', 'Spades', 12),
                createCard('K', 'Spades', 13),
                createCard('A', 'Spades', 14)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Classification', hand.handName);
            logGameState('ROYAL FLUSH CONFIRMED');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.ROYAL_FLUSH);
        });
    });

    describe('Straight Flush Detection', () => {
        test('Deal 9-High Straight Flush', () => {
            logGameState('DEALING STRAIGHT FLUSH');
            const cards = [
                createCard('9', 'Clubs', 9),
                createCard('8', 'Clubs', 8),
                createCard('7', 'Clubs', 7),
                createCard('6', 'Clubs', 6),
                createCard('5', 'Clubs', 5)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Hand Type', hand.handName);
            logResult('High Card', hand.tieBreakers[0]);
            
            expect(hand.handRank).toBe(HAND_RANKINGS.STRAIGHT_FLUSH);
            expect(hand.tieBreakers).toEqual([9]);
        });

        test('Deal Wheel Straight Flush (A-5)', () => {
            logGameState('DEALING WHEEL STRAIGHT FLUSH');
            const cards = [
                createCard('A', 'Diamonds', 14),
                createCard('2', 'Diamonds', 2),
                createCard('3', 'Diamonds', 3),
                createCard('4', 'Diamonds', 4),
                createCard('5', 'Diamonds', 5)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Wheel Detection', 'Ace plays low');
            logResult('Effective High', hand.tieBreakers[0]);
            
            expect(hand.handRank).toBe(HAND_RANKINGS.STRAIGHT_FLUSH);
            expect(hand.tieBreakers).toEqual([5]);
        });
    });

    describe('Four of a Kind Detection', () => {
        test('Deal Quad Kings', () => {
            logGameState('DEALING FOUR OF A KIND');
            const cards = [
                createCard('K', 'Hearts', 13),
                createCard('K', 'Diamonds', 13),
                createCard('K', 'Clubs', 13),
                createCard('K', 'Spades', 13),
                createCard('7', 'Hearts', 7)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Quads', 'Kings');
            logResult('Kicker', hand.tieBreakers[1]);
            
            expect(hand.handRank).toBe(HAND_RANKINGS.FOUR_OF_A_KIND);
            expect(hand.tieBreakers).toEqual([13, 7]);
        });

        test('Deal Quad Aces', () => {
            logGameState('DEALING PREMIUM QUADS');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('A', 'Diamonds', 14),
                createCard('A', 'Clubs', 14),
                createCard('A', 'Spades', 14),
                createCard('2', 'Hearts', 2)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Monster Hand', 'Quad Aces');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.FOUR_OF_A_KIND);
            expect(hand.tieBreakers).toEqual([14, 2]);
        });
    });

    describe('Full House Detection', () => {
        test('Deal Queens full of Eights', () => {
            logGameState('DEALING FULL HOUSE');
            const cards = [
                createCard('Q', 'Hearts', 12),
                createCard('Q', 'Diamonds', 12),
                createCard('Q', 'Clubs', 12),
                createCard('8', 'Hearts', 8),
                createCard('8', 'Spades', 8)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Boat', 'Queens over Eights');
            logAction('Trip value: ' + hand.tieBreakers[0]);
            logAction('Pair value: ' + hand.tieBreakers[1]);
            
            expect(hand.handRank).toBe(HAND_RANKINGS.FULL_HOUSE);
            expect(hand.tieBreakers).toEqual([12, 8]);
        });

        test('Deal Aces full of Kings', () => {
            logGameState('DEALING PREMIUM BOAT');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('A', 'Diamonds', 14),
                createCard('A', 'Clubs', 14),
                createCard('K', 'Hearts', 13),
                createCard('K', 'Spades', 13)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Monster Boat', 'Aces full');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.FULL_HOUSE);
            expect(hand.tieBreakers).toEqual([14, 13]);
        });
    });

    describe('Flush Detection', () => {
        test('Deal King-High Hearts Flush', () => {
            logGameState('DEALING FLUSH');
            const cards = [
                createCard('K', 'Hearts', 13),
                createCard('J', 'Hearts', 11),
                createCard('9', 'Hearts', 9),
                createCard('6', 'Hearts', 6),
                createCard('3', 'Hearts', 3)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Flush', 'King high Hearts');
            logAction('High cards: ' + hand.tieBreakers.join('-'));
            
            expect(hand.handRank).toBe(HAND_RANKINGS.FLUSH);
            expect(hand.tieBreakers).toEqual([13, 11, 9, 6, 3]);
        });

        test('Deal Ace-High Spades Flush', () => {
            logGameState('DEALING NUT FLUSH');
            const cards = [
                createCard('A', 'Spades', 14),
                createCard('Q', 'Spades', 12),
                createCard('8', 'Spades', 8),
                createCard('5', 'Spades', 5),
                createCard('2', 'Spades', 2)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Nut Flush', 'Ace high');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.FLUSH);
            expect(hand.tieBreakers).toEqual([14, 12, 8, 5, 2]);
        });
    });

    describe('Straight Detection', () => {
        test('Deal Ten-High Straight', () => {
            logGameState('DEALING STRAIGHT');
            const cards = [
                createCard('10', 'Hearts', 10),
                createCard('9', 'Diamonds', 9),
                createCard('8', 'Clubs', 8),
                createCard('7', 'Spades', 7),
                createCard('6', 'Hearts', 6)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Straight', '10 high');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.STRAIGHT);
            expect(hand.tieBreakers).toEqual([10]);
        });

        test('Deal Wheel Straight (A-5)', () => {
            logGameState('DEALING WHEEL');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('2', 'Diamonds', 2),
                createCard('3', 'Clubs', 3),
                createCard('4', 'Spades', 4),
                createCard('5', 'Hearts', 5)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Wheel Straight', 'Ace low, 5 high');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.STRAIGHT);
            expect(hand.tieBreakers).toEqual([5]);
        });

        test('Deal Broadway Straight', () => {
            logGameState('DEALING BROADWAY');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('K', 'Diamonds', 13),
                createCard('Q', 'Clubs', 12),
                createCard('J', 'Spades', 11),
                createCard('10', 'Hearts', 10)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Broadway', 'Ace high straight');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.STRAIGHT);
            expect(hand.tieBreakers).toEqual([14]);
        });
    });

    describe('Three of a Kind Detection', () => {
        test('Deal Trip Jacks', () => {
            logGameState('DEALING TRIPS');
            const cards = [
                createCard('J', 'Hearts', 11),
                createCard('J', 'Diamonds', 11),
                createCard('J', 'Clubs', 11),
                createCard('A', 'Spades', 14),
                createCard('6', 'Hearts', 6)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Trips', 'Jacks');
            logAction('Kickers: ' + hand.tieBreakers.slice(1).join('-'));
            
            expect(hand.handRank).toBe(HAND_RANKINGS.THREE_OF_A_KIND);
            expect(hand.tieBreakers).toEqual([11, 14, 6]);
        });
    });

    describe('Two Pair Detection', () => {
        test('Deal Kings and Sevens', () => {
            logGameState('DEALING TWO PAIR');
            const cards = [
                createCard('K', 'Hearts', 13),
                createCard('K', 'Diamonds', 13),
                createCard('7', 'Clubs', 7),
                createCard('7', 'Spades', 7),
                createCard('A', 'Hearts', 14)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Two Pair', 'Kings and Sevens');
            logAction('Kicker: ' + hand.tieBreakers[2]);
            
            expect(hand.handRank).toBe(HAND_RANKINGS.TWO_PAIR);
            expect(hand.tieBreakers).toEqual([13, 7, 14]);
        });

        test('Deal Aces and Deuces', () => {
            logGameState('DEALING ACES UP');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('A', 'Diamonds', 14),
                createCard('2', 'Clubs', 2),
                createCard('2', 'Spades', 2),
                createCard('K', 'Hearts', 13)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Two Pair', 'Aces and Deuces');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.TWO_PAIR);
            expect(hand.tieBreakers).toEqual([14, 2, 13]);
        });
    });

    describe('One Pair Detection', () => {
        test('Deal Pocket Queens', () => {
            logGameState('DEALING ONE PAIR');
            const cards = [
                createCard('Q', 'Hearts', 12),
                createCard('Q', 'Diamonds', 12),
                createCard('K', 'Clubs', 13),
                createCard('8', 'Spades', 8),
                createCard('3', 'Hearts', 3)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Pair', 'Queens');
            logAction('Kickers: ' + hand.tieBreakers.slice(1).join('-'));
            
            expect(hand.handRank).toBe(HAND_RANKINGS.ONE_PAIR);
            expect(hand.tieBreakers).toEqual([12, 13, 8, 3]);
        });

        test('Deal Pocket Aces', () => {
            logGameState('DEALING POCKET ROCKETS');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('A', 'Diamonds', 14),
                createCard('K', 'Clubs', 13),
                createCard('Q', 'Spades', 12),
                createCard('J', 'Hearts', 11)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Premium Pair', 'Pocket Aces');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.ONE_PAIR);
            expect(hand.tieBreakers).toEqual([14, 13, 12, 11]);
        });
    });

    describe('High Card Detection', () => {
        test('Deal Ace High', () => {
            logGameState('DEALING HIGH CARD');
            const cards = [
                createCard('A', 'Hearts', 14),
                createCard('K', 'Diamonds', 13),
                createCard('Q', 'Clubs', 12),
                createCard('J', 'Spades', 11),
                createCard('9', 'Hearts', 9)
            ];
            
            const hand = new PokerHand(cards);
            logResult('High Card', 'Ace high');
            logAction('Cards: ' + hand.tieBreakers.join('-'));
            
            expect(hand.handRank).toBe(HAND_RANKINGS.HIGH_CARD);
            expect(hand.tieBreakers).toEqual([14, 13, 12, 11, 9]);
        });

        test('Deal Seven High Rags', () => {
            logGameState('DEALING GARBAGE HAND');
            const cards = [
                createCard('7', 'Hearts', 7),
                createCard('5', 'Diamonds', 5),
                createCard('4', 'Clubs', 4),
                createCard('3', 'Spades', 3),
                createCard('2', 'Hearts', 2)
            ];
            
            const hand = new PokerHand(cards);
            logResult('Trash Hand', '7 high');
            
            expect(hand.handRank).toBe(HAND_RANKINGS.HIGH_CARD);
            expect(hand.tieBreakers).toEqual([7, 5, 4, 3, 2]);
        });
    });

    describe('Hand Comparison System', () => {
        test('Royal Flush beats Quad Aces', () => {
            logGameState('SHOWDOWN TIME');
            
            const royalFlush = new PokerHand([
                createCard('A', 'Hearts', 14),
                createCard('K', 'Hearts', 13),
                createCard('Q', 'Hearts', 12),
                createCard('J', 'Hearts', 11),
                createCard('10', 'Hearts', 10)
            ]);

            const quadAces = new PokerHand([
                createCard('A', 'Hearts', 14),
                createCard('A', 'Diamonds', 14),
                createCard('A', 'Clubs', 14),
                createCard('A', 'Spades', 14),
                createCard('K', 'Hearts', 13)
            ]);

            logAction('Player 1: ' + royalFlush.handName);
            logAction('Player 2: ' + quadAces.handName);
            
            const result = royalFlush.compareHands(quadAces);
            logResult('Winner', result > 0 ? 'Royal Flush' : 'Quad Aces');

            expect(result).toBeGreaterThan(0);
        });

        test('Ace High beats King High', () => {
            logGameState('HIGH CARD SHOWDOWN');
            
            const aceHigh = new PokerHand([
                createCard('A', 'Hearts', 14),
                createCard('K', 'Diamonds', 13),
                createCard('Q', 'Clubs', 12),
                createCard('J', 'Spades', 11),
                createCard('9', 'Hearts', 9)
            ]);

            const kingHigh = new PokerHand([
                createCard('K', 'Hearts', 13),
                createCard('Q', 'Diamonds', 12),
                createCard('J', 'Clubs', 11),
                createCard('10', 'Spades', 10),
                createCard('8', 'Hearts', 8)
            ]);

            logAction('Comparing high cards');
            const result = aceHigh.compareHands(kingHigh);
            logResult('Winner', result > 0 ? 'Ace High' : 'King High');

            expect(result).toBeGreaterThan(0);
        });
    });

    describe('Hand Validation', () => {
        test('Reject insufficient cards', () => {
            logGameState('VALIDATION CHECK');
            logAction('Attempting 1-card hand');
            
            expect(() => {
                new PokerHand([createCard('A', 'Hearts', 14)]);
            }).toThrow('Poker hand must contain exactly 5 cards');
            
            logResult('Validation', 'Correctly rejected');
        });

        test('Reject too many cards', () => {
            logGameState('VALIDATION CHECK');
            logAction('Attempting 6-card hand');
            
            expect(() => {
                new PokerHand([
                    createCard('A', 'Hearts', 14),
                    createCard('K', 'Hearts', 13),
                    createCard('Q', 'Hearts', 12),
                    createCard('J', 'Hearts', 11),
                    createCard('10', 'Hearts', 10),
                    createCard('9', 'Hearts', 9)
                ]);
            }).toThrow('Poker hand must contain exactly 5 cards');
            
            logResult('Validation', 'Correctly rejected');
        });
    });
});

console.log('\n▶️  Starting Poker Engine...\n');