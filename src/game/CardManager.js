import Card from './Card.js';

export default class CardManager {
    constructor(scene) {
        this.scene = scene;
        this.deck = [];
        this.suits = ['Hearts', 'Diamonds', 'Clubs', 'Spades'];
        this.ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
        this.values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
            'J': 11, 'Q': 12, 'K': 13, 'A': 14
        };
    }

    createDeck() {
        this.deck = [];
        for (const suit of this.suits) {
            for (const rank of this.ranks) {
                const card = new Card(rank, suit, this.values[rank]);
                this.deck.push(card);
            }
        }
        return this.deck;
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    drawCard() {
        return this.deck.pop();
    }

    displayCards() {
        const sampleCards = this.deck.slice(0, 5);
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        const cardWidth = Math.min(300, screenWidth * 0.18);
        const cardHeight = cardWidth * 1.4;
        const cardSpacing = cardWidth * 1.2;
        const totalWidth = (sampleCards.length * cardSpacing) - (cardSpacing - cardWidth);
        
        const startX = (screenWidth - totalWidth) / 2;
        const y = screenHeight * 0.4;
        
        sampleCards.forEach((card, index) => {
            this.createCardSprite(card, startX + (index * cardSpacing), y, cardWidth, cardHeight);
        });
    }

    createCardSprite(card, x, y, cardWidth = 300, cardHeight = 420) {
        const cardGraphics = this.scene.add.graphics();
        cardGraphics.x = x;
        cardGraphics.y = y;
        
        const cornerRadius = Math.max(8, cardWidth * 0.04);
        
        // Card background with subtle gradient effect
        cardGraphics.fillStyle(0xffffff);
        cardGraphics.fillRoundedRect(0, 0, cardWidth, cardHeight, cornerRadius);
        
        // Card border
        cardGraphics.lineStyle(Math.max(2, cardWidth * 0.01), 0x333333);
        cardGraphics.strokeRoundedRect(0, 0, cardWidth, cardHeight, cornerRadius);
        
        // Inner border for more card-like appearance
        cardGraphics.lineStyle(1, 0xdddddd);
        cardGraphics.strokeRoundedRect(4, 4, cardWidth - 8, cardHeight - 8, cornerRadius - 2);
        
        const color = (card.suit === 'Hearts' || card.suit === 'Diamonds') ? '#cc0000' : '#000000';
        
        const rankFontSize = Math.max(36, cardWidth * 0.18);  // Increased from 0.12 to 0.18
        const suitFontSize = Math.max(48, cardWidth * 0.24);  // Increased from 0.18 to 0.24
        const centerSuitSize = Math.max(80, cardWidth * 0.35); // Increased from 0.25 to 0.35
        
        // Top-left rank and suit
        const topRankText = this.scene.add.text(x + cardWidth * 0.08, y + cardHeight * 0.06, card.rank, {
            fontSize: `${rankFontSize}px`,
            color: color,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        
        const topSuitText = this.scene.add.text(x + cardWidth * 0.08, y + cardHeight * 0.16, this.getSuitSymbol(card.suit), {
            fontSize: `${suitFontSize}px`,
            color: color,
            fontFamily: 'Arial'
        });
        
        // Bottom-right rank and suit (rotated)
        const bottomRankText = this.scene.add.text(x + cardWidth * 0.92, y + cardHeight * 0.94, card.rank, {
            fontSize: `${rankFontSize}px`,
            color: color,
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        bottomRankText.setOrigin(1, 1);
        bottomRankText.setRotation(Math.PI);
        
        const bottomSuitText = this.scene.add.text(x + cardWidth * 0.92, y + cardHeight * 0.84, this.getSuitSymbol(card.suit), {
            fontSize: `${suitFontSize}px`,
            color: color,
            fontFamily: 'Arial'
        });
        bottomSuitText.setOrigin(1, 1);
        bottomSuitText.setRotation(Math.PI);
        
        // Large center suit symbol
        const centerSuitText = this.scene.add.text(x + cardWidth * 0.5, y + cardHeight * 0.5, this.getSuitSymbol(card.suit), {
            fontSize: `${centerSuitSize}px`,
            color: color,
            fontFamily: 'Arial'
        });
        centerSuitText.setOrigin(0.5);
        centerSuitText.setAlpha(0.3); // Make it subtle
        
        cardGraphics.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
        cardGraphics.on('pointerdown', () => {
            console.log(`Clicked: ${card.toString()}`);
        });
        
        return { 
            graphics: cardGraphics, 
            topRankText, 
            topSuitText, 
            bottomRankText, 
            bottomSuitText, 
            centerSuitText 
        };
    }

    getSuitSymbol(suit) {
        const symbols = {
            'Hearts': '♥',
            'Diamonds': '♦',
            'Clubs': '♣',
            'Spades': '♠'
        };
        return symbols[suit] || suit;
    }

    getDeckSize() {
        return this.deck.length;
    }
}