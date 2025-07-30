// Simple discard system test focusing on core logic
import PlayerDeck from '../src/game/PlayerDeck.js';
import Card from '../src/game/Card.js';

// Mock localStorage for Node.js
global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
};

console.log('=== Simple Discard Logic Test ===\n');

// Test 1: PlayerDeck card drawing
console.log('Test 1: PlayerDeck drawSingleCard functionality');
const deck = new PlayerDeck();
console.log(`Deck has ${deck.cards.length} cards`);

// Draw some single cards
console.log('\nDrawing 5 single cards:');
for (let i = 0; i < 5; i++) {
    const card = deck.drawSingleCard();
    console.log(`  ${i + 1}. ${card.toString()}`);
}

// Test 2: Simulating discard logic
console.log('\n\nTest 2: Simulating discard logic');
const testHand = [
    new Card('A', 'Hearts', 14),
    new Card('K', 'Hearts', 13),
    new Card('Q', 'Hearts', 12),
    new Card('J', 'Hearts', 11),
    new Card('10', 'Hearts', 10),
    new Card('9', 'Hearts', 9),
    new Card('8', 'Hearts', 8),
    new Card('7', 'Hearts', 7)
];

console.log('Initial hand:');
testHand.forEach((card, i) => console.log(`  ${i + 1}. ${card.toString()}`));

// Simulate selecting cards to discard
const cardsToDiscard = [testHand[0], testHand[1]]; // Discard A and K
console.log('\nCards to discard:', cardsToDiscard.map(c => c.toString()).join(', '));

// Remove discarded cards
const remainingCards = testHand.filter(card => !cardsToDiscard.includes(card));
console.log('\nRemaining cards after removal:');
remainingCards.forEach((card, i) => console.log(`  ${i + 1}. ${card.toString()}`));

// Draw replacement cards
console.log('\nDrawing replacement cards:');
const newCards = [];
for (let i = 0; i < cardsToDiscard.length; i++) {
    const newCard = deck.drawSingleCard();
    if (newCard) {
        const cardCopy = new Card(newCard.rank, newCard.suit, newCard.value, newCard.rarity);
        newCards.push(cardCopy);
        console.log(`  Drew: ${cardCopy.toString()}`);
    }
}

// Final hand
const finalHand = [...remainingCards, ...newCards];
console.log('\nFinal hand after discard and draw:');
finalHand.forEach((card, i) => console.log(`  ${i + 1}. ${card.toString()}`));

// Test 3: Card instance checking
console.log('\n\nTest 3: Card object comparison');
const card1 = new Card('A', 'Spades', 14);
const card2 = new Card('A', 'Spades', 14);
const card3 = card1;

console.log('card1:', card1.toString());
console.log('card2:', card2.toString(), '(same values as card1)');
console.log('card3:', card3.toString(), '(reference to card1)');

console.log('\nComparisons:');
console.log('card1 === card2:', card1 === card2); // false (different instances)
console.log('card1 === card3:', card1 === card3); // true (same reference)
console.log('card1.rank === card2.rank:', card1.rank === card2.rank); // true
console.log('card1.suit === card2.suit:', card1.suit === card2.suit); // true

// Test 4: Array operations
console.log('\n\nTest 4: Array indexOf with card objects');
const testArray = [card1, new Card('K', 'Hearts', 13)];
console.log('Array:', testArray.map(c => c.toString()));
console.log('indexOf(card1):', testArray.indexOf(card1)); // 0
console.log('indexOf(card2):', testArray.indexOf(card2)); // -1 (different instance)
console.log('indexOf(card3):', testArray.indexOf(card3)); // 0 (same as card1)

// Test finding by properties instead of reference
const foundCard = testArray.find(c => c.rank === 'A' && c.suit === 'Spades');
console.log('Found card by properties:', foundCard ? foundCard.toString() : 'not found');

console.log('\n=== Test Complete ===');