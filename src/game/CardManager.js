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
        
        // Card background - special handling for joker
        const isJoker = card.rank === 'Joker' && card.suit === 'Wild';
        if (isJoker) {
            // Special legendary gradient background for joker
            this.createJokerBackground(cardGraphics, cardWidth, cardHeight, cornerRadius);
        } else if (theme.background.gradient) {
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
        
        // Special artwork for joker cards
        let cardArtwork = null;
        if (card.rank === 'Joker' && card.suit === 'Wild') {
            const artKey = 'warrior2_joker';
            if (this.scene.textures.exists(artKey)) {
                cardArtwork = this.scene.add.image(
                    cardWidth / 2, 
                    cardHeight / 2, 
                    artKey
                );
                
                // Scale artwork to fill the full card face (minus small border margin)
                const artScale = Math.min(
                    (cardWidth * 0.95) / cardArtwork.width,
                    (cardHeight * 0.9) / cardArtwork.height
                );
                cardArtwork.setScale(artScale);
                cardArtwork.setDepth(1); // Above card background
                cardArtwork.setAlpha(0.5); // Make more transparent to match other card aesthetics
            }
        }
        
        const color = this.getSuitColor(card.suit, theme);
        
        // Special styling for joker cards (isJoker already declared above)
        const jokerColor = isJoker ? '#FFFFFF' : color; // White color for joker
        const jokerStyle = isJoker ? {
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 6,
                fill: true
            }
        } : {};
        
        const rankFontSize = Math.max(36, cardWidth * 0.18);  // Increased from 0.12 to 0.18
        const suitFontSize = Math.max(48, cardWidth * 0.24);  // Increased from 0.18 to 0.24
        const centerSuitSize = Math.max(80, cardWidth * 0.35); // Increased from 0.25 to 0.35
        
        // Top-left rank and suit
        const displayRank = isJoker ? '★' : card.rank;
        const topRankText = this.scene.add.text(x + cardWidth * 0.08, y + cardHeight * 0.06, displayRank, {
            fontSize: `${isJoker ? rankFontSize * 0.8 : rankFontSize}px`,
            color: jokerColor,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            ...jokerStyle
        });
        if (isJoker) topRankText.setDepth(3); // Above artwork for joker cards
        
        const topSuitText = this.scene.add.text(x + cardWidth * 0.08, y + cardHeight * 0.16, isJoker ? '' : this.getSuitSymbol(card.suit), {
            fontSize: `${suitFontSize}px`,
            color: jokerColor,
            fontFamily: 'Arial',
            ...jokerStyle
        });
        if (isJoker) topSuitText.setDepth(3); // Above artwork for joker cards
        
        // Bottom-right rank and suit removed for cleaner design
        
        // Large center suit symbol (skip for joker cards with artwork)
        let centerSuitText = null;
        if (!isJoker || !cardArtwork) {
            const centerSymbol = this.getSuitSymbol(card.suit);
            centerSuitText = this.scene.add.text(x + cardWidth * 0.5, y + cardHeight * 0.5, centerSymbol, {
                fontSize: `${centerSuitSize}px`,
                color: jokerColor,
                fontFamily: 'Arial',
                ...jokerStyle
            });
            centerSuitText.setOrigin(0.5);
            centerSuitText.setAlpha(0.3); // Make it subtle for regular cards
        }
        
        cardGraphics.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
        cardGraphics.on('pointerdown', () => {
            console.log(`Clicked: ${card.toString()}`);
        });
        
        const cardData = { 
            graphics: cardGraphics, 
            topRankText, 
            topSuitText
        };
        
        // Only add centerSuitText if it exists (not for joker cards with artwork)
        if (centerSuitText) {
            cardData.centerSuitText = centerSuitText;
        }
        
        // Add artwork if it exists
        if (cardArtwork) {
            cardData.artwork = cardArtwork;
        }
        
        return cardData;
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
    
    createJokerBackground(graphics, cardWidth, cardHeight, cornerRadius) {
        // Create a legendary gradient background for joker cards
        const steps = 20;
        const colors = [
            0x1a1a2e, // Dark blue
            0x16213e, // Darker blue
            0x0f3460, // Deep blue
            0x533483, // Purple
            0x7b2cbf, // Violet
            0x9d4edd, // Light purple
        ];
        
        for (let i = 0; i < steps; i++) {
            const progress = i / (steps - 1);
            const colorIndex = Math.floor(progress * (colors.length - 1));
            const colorProgress = (progress * (colors.length - 1)) - colorIndex;
            
            let color;
            if (colorIndex >= colors.length - 1) {
                color = colors[colors.length - 1];
            } else {
                // Interpolate between colors
                const c1 = colors[colorIndex];
                const c2 = colors[colorIndex + 1];
                color = this.interpolateColor(c1, c2, colorProgress);
            }
            
            const stripHeight = cardHeight / steps;
            const y = i * stripHeight;
            
            graphics.fillStyle(color, 0.9);
            if (i === 0) {
                // First strip with rounded top corners
                graphics.fillRoundedRect(0, y, cardWidth, stripHeight + 2, { tl: cornerRadius, tr: cornerRadius, bl: 0, br: 0 });
            } else if (i === steps - 1) {
                // Last strip with rounded bottom corners
                graphics.fillRoundedRect(0, y - 2, cardWidth, stripHeight + 2, { tl: 0, tr: 0, bl: cornerRadius, br: cornerRadius });
            } else {
                // Middle strips
                graphics.fillRect(0, y, cardWidth, stripHeight + 1);
            }
        }
        
        // Add golden sparkle overlay
        for (let i = 0; i < 15; i++) {
            const sparkleX = Math.random() * cardWidth;
            const sparkleY = Math.random() * cardHeight;
            const sparkleSize = 1 + Math.random() * 2;
            
            graphics.fillStyle(0xffd700, 0.6);
            graphics.fillCircle(sparkleX, sparkleY, sparkleSize);
        }
    }
    
    interpolateColor(color1, color2, factor) {
        const r1 = (color1 >> 16) & 0xff;
        const g1 = (color1 >> 8) & 0xff;
        const b1 = color1 & 0xff;
        
        const r2 = (color2 >> 16) & 0xff;
        const g2 = (color2 >> 8) & 0xff;
        const b2 = color2 & 0xff;
        
        const r = Math.round(r1 + (r2 - r1) * factor);
        const g = Math.round(g1 + (g2 - g1) * factor);
        const b = Math.round(b1 + (b2 - b1) * factor);
        
        return (r << 16) | (g << 8) | b;
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