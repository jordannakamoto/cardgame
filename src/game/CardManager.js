import Card from './Card.js';
import { getCurrentTheme } from '../config/CardThemes.js';

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
        const theme = getCurrentTheme();
        const cardGraphics = this.scene.add.graphics();
        cardGraphics.x = x;
        cardGraphics.y = y;
        
        const cornerRadius = Math.max(theme.cornerRadius, cardWidth * 0.04);
        
        // Card background
        if (theme.background.gradient) {
            // Create gradient effect for magic theme
            this.createGradientBackground(cardGraphics, cardWidth, cardHeight, cornerRadius, theme);
        } else {
            cardGraphics.fillStyle(theme.background.color);
            cardGraphics.fillRoundedRect(0, 0, cardWidth, cardHeight, cornerRadius);
        }
        
        // Main border
        cardGraphics.lineStyle(theme.border.main.thickness, theme.border.main.color);
        cardGraphics.strokeRoundedRect(0, 0, cardWidth, cardHeight, cornerRadius);
        
        // Inner border
        if (theme.border.inner) {
            cardGraphics.lineStyle(theme.border.inner.thickness, theme.border.inner.color);
            const offset = theme.border.inner.offset;
            cardGraphics.strokeRoundedRect(offset, offset, cardWidth - offset*2, cardHeight - offset*2, cornerRadius - 2);
        }
        
        // Glow effect for magic theme
        if (theme.border.glow) {
            cardGraphics.lineStyle(theme.border.glow.thickness, theme.border.glow.color, theme.border.glow.alpha);
            cardGraphics.strokeRoundedRect(-2, -2, cardWidth + 4, cardHeight + 4, cornerRadius + 2);
        }
        
        // Add decorative elements for magic theme
        if (theme.decorations) {
            this.addMagicDecorations(cardGraphics, cardWidth, cardHeight, theme);
        }
        
        const color = this.getSuitColor(card.suit, theme);
        
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
    
    getSuitColor(suit, theme) {
        switch(suit) {
            case 'Hearts': return theme.text.hearts;
            case 'Diamonds': return theme.text.diamonds;
            case 'Clubs': return theme.text.clubs;
            case 'Spades': return theme.text.spades;
            default: return theme.text.spades;
        }
    }
    
    createGradientBackground(graphics, width, height, cornerRadius, theme) {
        // Create multiple layers for gradient effect
        const colors = theme.background.gradientColors;
        
        // Base background
        graphics.fillStyle(colors[0]);
        graphics.fillRoundedRect(0, 0, width, height, cornerRadius);
        
        // Gradient overlay (simulate with multiple rectangles)
        graphics.fillStyle(colors[1], 0.8);
        graphics.fillRoundedRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8, cornerRadius - 2);
        
        graphics.fillStyle(colors[2], 0.6);
        graphics.fillRoundedRect(width * 0.2, height * 0.2, width * 0.6, height * 0.6, cornerRadius - 4);
    }
    
    addMagicDecorations(graphics, width, height, theme) {
        const ornamentColor = theme.ornaments.colorOverride;
        
        if (theme.ornaments.corners) {
            // Add corner ornaments
            const ornamentSize = width * 0.08;
            graphics.lineStyle(2, ornamentColor, 0.7);
            
            // Top-left corner ornament
            graphics.beginPath();
            graphics.arc(ornamentSize * 1.5, ornamentSize * 1.5, ornamentSize, Math.PI, Math.PI * 1.5);
            graphics.strokePath();
            
            // Top-right corner ornament
            graphics.beginPath();
            graphics.arc(width - ornamentSize * 1.5, ornamentSize * 1.5, ornamentSize, Math.PI * 1.5, Math.PI * 2);
            graphics.strokePath();
            
            // Bottom-left corner ornament
            graphics.beginPath();
            graphics.arc(ornamentSize * 1.5, height - ornamentSize * 1.5, ornamentSize, Math.PI * 0.5, Math.PI);
            graphics.strokePath();
            
            // Bottom-right corner ornament
            graphics.beginPath();
            graphics.arc(width - ornamentSize * 1.5, height - ornamentSize * 1.5, ornamentSize, 0, Math.PI * 0.5);
            graphics.strokePath();
        }
        
        if (theme.ornaments.center) {
            // Add center border decoration
            graphics.lineStyle(1, ornamentColor, 0.4);
            const centerX = width * 0.5;
            const centerY = height * 0.5;
            const decorRadius = Math.min(width, height) * 0.25;
            
            // Central mystical circle
            graphics.strokeCircle(centerX, centerY, decorRadius);
            graphics.strokeCircle(centerX, centerY, decorRadius * 0.7);
        }
    }
}