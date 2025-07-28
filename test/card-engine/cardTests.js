import Card from '../../src/game/Card.js';
import { describe, test, expect, logAction, logResult, logTestDetails } from '../testFramework.js';

describe('Card System', () => {
    
    describe('Card Creation', () => {
        test('creates card with correct properties', () => {
            logAction('Creating Ace of Hearts card with value 14');
            const card = new Card('A', 'Hearts', 14);
            
            logResult('Card rank set', 'A', card.rank, card.rank === 'A');
            logResult('Card suit set', 'Hearts', card.suit, card.suit === 'Hearts');
            logResult('Card value set', '14', card.value, card.value === 14);
            logResult('Card starts face down', 'false', card.faceUp, card.faceUp === false);
            
            expect(card.rank).toBe('A');
            expect(card.suit).toBe('Hearts');
            expect(card.value).toBe(14);
            expect(card.faceUp).toBe(false);
        });

        test('creates number card correctly', () => {
            logAction('Creating Seven of Clubs card');
            const card = new Card('7', 'Clubs', 7);
            
            logResult('Number card created', '7 of Clubs', card.toString());
            logTestDetails('Card properties verified', {
                'Rank': card.rank,
                'Suit': card.suit,
                'Value': card.value,
                'String format': card.toString()
            });
            
            expect(card.rank).toBe('7');
            expect(card.suit).toBe('Clubs');
            expect(card.value).toBe(7);
        });
    });

    describe('Card Functionality', () => {
        test('flips card state correctly', () => {
            logAction('Creating King of Spades and testing flip mechanism');
            const card = new Card('K', 'Spades', 13);
            
            const initialState = card.faceUp;
            logAction(`Card starts face down: ${initialState}`);
            
            logAction('Flipping card to face up');
            card.flip();
            const afterFirstFlip = card.faceUp;
            
            logAction('Flipping card back to face down');
            card.flip();
            const afterSecondFlip = card.faceUp;
            
            logResult('Initial state', 'face down (false)', initialState, initialState === false);
            logResult('After first flip', 'face up (true)', afterFirstFlip, afterFirstFlip === true);
            logResult('After second flip', 'face down (false)', afterSecondFlip, afterSecondFlip === false);
            logResult('Flip mechanism working', 'yes', (initialState !== afterFirstFlip && initialState === afterSecondFlip) ? 'yes' : 'no');
            
            expect(initialState).toBe(false);
            expect(afterFirstFlip).toBe(true);
            expect(afterSecondFlip).toBe(false);
        });

        test('returns correct string representation', () => {
            logAction('Creating Queen of Diamonds and testing toString method');
            const card = new Card('Q', 'Diamonds', 12);
            
            logAction('Calling toString() method');
            const stringRep = card.toString();
            const expected = 'Q of Diamonds';
            
            logResult('String representation', expected, stringRep, stringRep === expected);
            logTestDetails('Format verification', {
                'Expected format': 'Rank of Suit',
                'Actual output': stringRep,
                'Matches expected': stringRep === expected ? 'yes' : 'no'
            });
            
            expect(stringRep).toBe(expected);
        });
    });

    describe('Card Code Generation', () => {
        test('generates correct card code for ace', () => {
            logAction('Creating Ace of Hearts and generating card code');
            const card = new Card('A', 'Hearts', 14);
            
            logAction('Calling getCardCode() method');
            const cardCode = card.getCardCode();
            
            logResult('Card code generated', 'AH', cardCode, cardCode === 'AH');
            logTestDetails('Code format explanation', {
                'First character': 'A (from rank)',
                'Second character': 'H (from Hearts)',
                'Expected result': 'AH',
                'Actual result': cardCode
            });
            
            expect(cardCode).toBe('AH');
        });

        test('generates correct card code for ten', () => {
            logAction('Creating Ten of Spades (special case: 10 -> T)');
            const card = new Card('10', 'Spades', 10);
            
            logAction('Testing special ten card code conversion');
            const cardCode = card.getCardCode();
            
            logResult('Ten card code', 'TS', cardCode, cardCode === 'TS');
            logTestDetails('Special case handling', {
                'Rank': '10',
                'Code conversion': '10 becomes T',
                'Suit': 'Spades -> S',
                'Final code': cardCode
            });
            
            expect(cardCode).toBe('TS');
        });

        test('generates correct card code for face cards', () => {
            logAction('Testing face card code generation');
            const jack = new Card('J', 'Clubs', 11);
            const queen = new Card('Q', 'Diamonds', 12);
            const king = new Card('K', 'Hearts', 13);
            
            logAction('Generating codes for Jack, Queen, King');
            const jackCode = jack.getCardCode();
            const queenCode = queen.getCardCode();
            const kingCode = king.getCardCode();
            
            logResult('Jack of Clubs', 'JC', jackCode, jackCode === 'JC');
            logResult('Queen of Diamonds', 'QD', queenCode, queenCode === 'QD');
            logResult('King of Hearts', 'KH', kingCode, kingCode === 'KH');
            
            logTestDetails('Face card verification', {
                'Jack': `${jack.toString()} -> ${jackCode}`,
                'Queen': `${queen.toString()} -> ${queenCode}`,
                'King': `${king.toString()} -> ${kingCode}`
            });
            
            expect(jackCode).toBe('JC');
            expect(queenCode).toBe('QD');
            expect(kingCode).toBe('KH');
        });

        test('generates correct card code for number cards', () => {
            logAction('Testing number card code generation');
            const two = new Card('2', 'Hearts', 2);
            const five = new Card('5', 'Spades', 5);
            const nine = new Card('9', 'Diamonds', 9);
            
            logAction('Processing number cards 2, 5, 9');
            
            logResult('Two of Hearts', '2H', two.getCardCode());
            logResult('Five of Spades', '5S', five.getCardCode());
            logResult('Nine of Diamonds', '9D', nine.getCardCode());
            
            logTestDetails('Number card pattern', {
                'Rule': 'First char of rank + First char of suit',
                'Two example': `2 + H = ${two.getCardCode()}`,
                'Five example': `5 + S = ${five.getCardCode()}`,
                'Nine example': `9 + D = ${nine.getCardCode()}`
            });
            
            expect(two.getCardCode()).toBe('2H');
            expect(five.getCardCode()).toBe('5S');
            expect(nine.getCardCode()).toBe('9D');
        });
    });

    describe('Card Properties Validation', () => {
        test('validates all suit types', () => {
            logAction('Creating one card of each suit to test suit handling');
            const hearts = new Card('A', 'Hearts', 14);
            const diamonds = new Card('A', 'Diamonds', 14);
            const clubs = new Card('A', 'Clubs', 14);
            const spades = new Card('A', 'Spades', 14);
            
            logAction('Verifying each suit is stored correctly');
            const allSuits = [hearts.suit, diamonds.suit, clubs.suit, spades.suit];
            const uniqueSuits = new Set(allSuits);
            
            logResult('Hearts suit', 'Hearts', hearts.suit);
            logResult('Diamonds suit', 'Diamonds', diamonds.suit);
            logResult('Clubs suit', 'Clubs', clubs.suit);
            logResult('Spades suit', 'Spades', spades.suit);
            logResult('All suits unique', 'yes', uniqueSuits.size === 4 ? 'yes' : 'no');
            
            expect(hearts.suit).toBe('Hearts');
            expect(diamonds.suit).toBe('Diamonds');
            expect(clubs.suit).toBe('Clubs');
            expect(spades.suit).toBe('Spades');
        });

        test('validates rank and value consistency', () => {
            logAction('Testing rank-value consistency across different card types');
            
            const testCases = [
                { rank: '2', value: 2, type: 'number' },
                { rank: '7', value: 7, type: 'number' },
                { rank: 'J', value: 11, type: 'face' },
                { rank: 'Q', value: 12, type: 'face' },
                { rank: 'K', value: 13, type: 'face' },
                { rank: 'A', value: 14, type: 'ace' }
            ];
            
            testCases.forEach(testCase => {
                logAction(`Creating ${testCase.type} card: ${testCase.rank}`);
                const card = new Card(testCase.rank, 'Hearts', testCase.value);
                
                logResult(`${testCase.rank} rank`, testCase.rank, card.rank, card.rank === testCase.rank);
                logResult(`${testCase.rank} value`, testCase.value, card.value, card.value === testCase.value);
                
                expect(card.rank).toBe(testCase.rank);
                expect(card.value).toBe(testCase.value);
            });
            
            logTestDetails('Consistency verification complete', {
                'Number cards': '2-9 have numeric values',
                'Face cards': 'J=11, Q=12, K=13',
                'Ace': 'A=14 (high value)',
                'All tests': 'Passed rank-value consistency'
            });
        });
    });
});

console.log('\n🎯 Starting Card System Tests...\n');