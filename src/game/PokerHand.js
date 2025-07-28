import Card from './Card.js';

export const HAND_RANKINGS = {
    HIGH_CARD: 1,
    ONE_PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
    ROYAL_FLUSH: 10
};

export const HAND_NAMES = {
    [HAND_RANKINGS.HIGH_CARD]: 'High Card',
    [HAND_RANKINGS.ONE_PAIR]: 'One Pair',
    [HAND_RANKINGS.TWO_PAIR]: 'Two Pair',
    [HAND_RANKINGS.THREE_OF_A_KIND]: 'Three of a Kind',
    [HAND_RANKINGS.STRAIGHT]: 'Straight',
    [HAND_RANKINGS.FLUSH]: 'Flush',
    [HAND_RANKINGS.FULL_HOUSE]: 'Full House',
    [HAND_RANKINGS.FOUR_OF_A_KIND]: 'Four of a Kind',
    [HAND_RANKINGS.STRAIGHT_FLUSH]: 'Straight Flush',
    [HAND_RANKINGS.ROYAL_FLUSH]: 'Royal Flush'
};

export default class PokerHand {
    constructor(cards) {
        if (!Array.isArray(cards) || cards.length < 1 || cards.length > 5) {
            throw new Error('Poker hand must contain between 1 and 5 cards');
        }
        
        this.cards = [...cards].sort((a, b) => b.value - a.value);
        this.handRank = null;
        this.handName = null;
        this.tieBreakers = [];
        
        this.evaluateHand();
    }

    evaluateHand() {
        const result = this.determineHandType();
        this.handRank = result.rank;
        this.handName = HAND_NAMES[result.rank];
        this.tieBreakers = result.tieBreakers;
    }

    determineHandType() {
        const values = this.cards.map(card => card.value);
        const suits = this.cards.map(card => card.suit);
        const valueCounts = this.getValueCounts(values);
        const isFlush = this.isFlush(suits);
        const straightInfo = this.getStraightInfo(values);

        if (isFlush && straightInfo.isStraight) {
            if (straightInfo.highCard === 14 && straightInfo.lowCard === 10) {
                return { rank: HAND_RANKINGS.ROYAL_FLUSH, tieBreakers: [14] };
            }
            return { rank: HAND_RANKINGS.STRAIGHT_FLUSH, tieBreakers: [straightInfo.highCard] };
        }

        if (this.hasFourOfAKind(valueCounts)) {
            const fourKind = this.getFourOfAKindValue(valueCounts);
            const kicker = values.find(v => v !== fourKind);
            return { rank: HAND_RANKINGS.FOUR_OF_A_KIND, tieBreakers: [fourKind, kicker] };
        }

        if (this.hasFullHouse(valueCounts)) {
            const threeKind = this.getThreeOfAKindValue(valueCounts);
            const pair = this.getPairValue(valueCounts);
            return { rank: HAND_RANKINGS.FULL_HOUSE, tieBreakers: [threeKind, pair] };
        }

        if (isFlush) {
            return { rank: HAND_RANKINGS.FLUSH, tieBreakers: [...values] };
        }

        if (straightInfo.isStraight) {
            return { rank: HAND_RANKINGS.STRAIGHT, tieBreakers: [straightInfo.highCard] };
        }

        if (this.hasThreeOfAKind(valueCounts)) {
            const threeKind = this.getThreeOfAKindValue(valueCounts);
            const kickers = values.filter(v => v !== threeKind).sort((a, b) => b - a);
            return { rank: HAND_RANKINGS.THREE_OF_A_KIND, tieBreakers: [threeKind, ...kickers] };
        }

        if (this.hasTwoPair(valueCounts)) {
            const pairs = this.getTwoPairValues(valueCounts);
            const kicker = values.find(v => !pairs.includes(v));
            return { rank: HAND_RANKINGS.TWO_PAIR, tieBreakers: [...pairs.sort((a, b) => b - a), kicker] };
        }

        if (this.hasOnePair(valueCounts)) {
            const pair = this.getPairValue(valueCounts);
            const kickers = values.filter(v => v !== pair).sort((a, b) => b - a);
            return { rank: HAND_RANKINGS.ONE_PAIR, tieBreakers: [pair, ...kickers] };
        }

        return { rank: HAND_RANKINGS.HIGH_CARD, tieBreakers: [...values] };
    }

    getValueCounts(values) {
        const counts = {};
        values.forEach(value => {
            counts[value] = (counts[value] || 0) + 1;
        });
        return counts;
    }

    isFlush(suits) {
        return suits.length === 5 && new Set(suits).size === 1;
    }

    getStraightInfo(values) {
        const uniqueValues = [...new Set(values)].sort((a, b) => b - a);
        
        if (uniqueValues.length !== 5) {
            return { isStraight: false };
        }

        // Check for A-2-3-4-5 straight (wheel)
        if (uniqueValues.join(',') === '14,5,4,3,2') {
            return { isStraight: true, highCard: 5, lowCard: 2 };
        }

        // Check for regular straight
        const isConsecutive = uniqueValues.every((value, index) => {
            if (index === 0) return true;
            return uniqueValues[index - 1] - value === 1;
        });

        if (isConsecutive) {
            return { isStraight: true, highCard: uniqueValues[0], lowCard: uniqueValues[4] };
        }

        return { isStraight: false };
    }

    hasFourOfAKind(valueCounts) {
        return Object.values(valueCounts).includes(4);
    }

    getFourOfAKindValue(valueCounts) {
        return parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 4));
    }

    hasFullHouse(valueCounts) {
        const counts = Object.values(valueCounts);
        const totalCards = counts.reduce((sum, count) => sum + count, 0);
        return totalCards === 5 && counts.includes(3) && counts.includes(2);
    }

    hasThreeOfAKind(valueCounts) {
        return Object.values(valueCounts).includes(3);
    }

    getThreeOfAKindValue(valueCounts) {
        return parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 3));
    }

    hasTwoPair(valueCounts) {
        return Object.values(valueCounts).filter(count => count === 2).length === 2;
    }

    getTwoPairValues(valueCounts) {
        return Object.keys(valueCounts)
            .filter(key => valueCounts[key] === 2)
            .map(key => parseInt(key));
    }

    hasOnePair(valueCounts) {
        return Object.values(valueCounts).includes(2);
    }

    getPairValue(valueCounts) {
        return parseInt(Object.keys(valueCounts).find(key => valueCounts[key] === 2));
    }

    compareHands(otherHand) {
        if (this.handRank !== otherHand.handRank) {
            return this.handRank - otherHand.handRank;
        }

        // Compare tie breakers
        for (let i = 0; i < Math.max(this.tieBreakers.length, otherHand.tieBreakers.length); i++) {
            const thisValue = this.tieBreakers[i] || 0;
            const otherValue = otherHand.tieBreakers[i] || 0;
            
            if (thisValue !== otherValue) {
                return thisValue - otherValue;
            }
        }

        return 0; // Tie
    }

    toString() {
        const cardStrings = this.cards.map(card => card.toString()).join(', ');
        return `${this.handName}: [${cardStrings}]`;
    }

    getHandSummary() {
        return {
            name: this.handName,
            rank: this.handRank,
            cards: this.cards.map(card => card.toString()),
            tieBreakers: this.tieBreakers
        };
    }
}