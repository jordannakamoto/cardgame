export default class Card {
    constructor(rank, suit, value) {
        this.rank = rank;
        this.suit = suit;
        this.value = value;
        this.faceUp = false;
    }

    flip() {
        this.faceUp = !this.faceUp;
    }

    toString() {
        return `${this.rank} of ${this.suit}`;
    }

    getCardCode() {
        const rankCode = this.rank === '10' ? 'T' : this.rank[0];
        const suitCode = this.suit[0].toUpperCase();
        return `${rankCode}${suitCode}`;
    }
}