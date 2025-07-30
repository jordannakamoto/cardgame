import Phaser from 'phaser';
import FoilPipeline from '../rendering/FoilPipeline.js';

export default class PackOpeningScene extends Phaser.Scene {
    constructor() {
        super({ key: 'PackOpeningScene' });
    }

    init(data) {
        this.pack = data.pack;
        this.onComplete = data.onComplete || (() => {});
        this.inventory = data.inventory;
        this.playerDeck = data.playerDeck;
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Dark background
        this.add.graphics()
            .fillStyle(0x000000, 0.9)
            .fillRect(0, 0, screenWidth, screenHeight);

        // Create pack opening animation
        this.createPackAnimation();
        
        // Skip instruction
        this.skipText = this.add.text(
            screenWidth - 50,
            50,
            'Press SPACE to skip',
            {
                fontSize: '24px',
                color: '#cccccc',
                fontFamily: 'Arial'
            }
        );
        this.skipText.setOrigin(1, 0);

        // Setup input
        this.input.keyboard.on('keydown-SPACE', () => {
            this.skipAnimation();
        });
    }

    createPackAnimation() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        // Create pack sprite (appropriately sized)
        this.packSprite = this.add.image(centerX, centerY, this.pack.artKey);
        this.packSprite.setScale(1.0);

        // Title text
        this.titleText = this.add.text(
            centerX,
            centerY - 250,
            this.pack.name,
            {
                fontSize: '48px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 3
            }
        );
        this.titleText.setOrigin(0.5);

        // Instruction text
        this.instructionText = this.add.text(
            centerX,
            centerY + 200,
            'Click to open!',
            {
                fontSize: '36px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'italic'
            }
        );
        this.instructionText.setOrigin(0.5);

        // Add pulsing animation to instruction
        this.tweens.add({
            targets: this.instructionText,
            alpha: 0.6,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Make pack clickable
        this.packSprite.setInteractive();
        this.packSprite.on('pointerdown', () => {
            this.openPack();
        });

        // Add hover effect
        this.packSprite.on('pointerover', () => {
            this.packSprite.setScale(2.1);
        });
        this.packSprite.on('pointerout', () => {
            this.packSprite.setScale(2.0);
        });
    }

    openPack() {
        // Disable further clicks
        this.packSprite.removeInteractive();
        this.instructionText.destroy();

        // Create dramatic particle burst
        this.createOpeningParticles();
        
        // Enhanced pack opening animation with multiple stages
        this.createPackOpeningSequence();
        
        // Multiple flash effects
        this.createOpeningFlashes();
        
        // Subtle screen shake effect
        this.cameras.main.shake(300, 0.003);
    }

    createOpeningParticles() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Subtle dust motes - elegant and refined
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const distance = 40 + Math.random() * 80;
            const mote = this.add.graphics();
            
            mote.fillStyle(0xcccccc, 0.6);
            mote.fillCircle(0, 0, 1 + Math.random() * 2);
            mote.setPosition(centerX, centerY);
            
            // Gentle drift outward
            this.tweens.add({
                targets: mote,
                x: centerX + Math.cos(angle) * distance,
                y: centerY + Math.sin(angle) * distance - 30,
                alpha: 0,
                duration: 1200 + Math.random() * 600,
                ease: 'Sine.easeOut',
                onComplete: () => mote.destroy()
            });
        }
        
        // Minimal paper fragments
        for (let i = 0; i < 5; i++) {
            const fragment = this.add.graphics();
            
            // Small paper-like rectangles
            fragment.fillStyle(0xf5f5f5, 0.8);
            fragment.fillRect(-4, -6, 8, 12);
            
            fragment.setPosition(centerX + (Math.random() - 0.5) * 60, centerY + (Math.random() - 0.5) * 60);
            
            // Gentle float away
            this.tweens.add({
                targets: fragment,
                y: fragment.y - 100 - Math.random() * 50,
                x: fragment.x + (Math.random() - 0.5) * 30,
                rotation: (Math.random() - 0.5) * 1,
                alpha: 0,
                duration: 1500 + Math.random() * 500,
                ease: 'Sine.easeOut',
                onComplete: () => fragment.destroy()
            });
        }
    }

    createPackOpeningSequence() {
        // Stage 1: Pack pulses and glows
        this.tweens.add({
            targets: this.packSprite,
            scaleX: 2.3,
            scaleY: 2.3,
            duration: 200,
            ease: 'Power2',
            yoyo: true,
            repeat: 1,
            onComplete: () => {
                // Stage 2: Pack tears open with rotation
                this.tweens.add({
                    targets: this.packSprite,
                    scaleX: 2.8,
                    scaleY: 1.2,
                    rotation: 0.3,
                    alpha: 0.7,
                    duration: 300,
                    ease: 'Power2',
                    onComplete: () => {
                        // Stage 3: Pack explodes away
                        this.tweens.add({
                            targets: this.packSprite,
                            scaleX: 0.1,
                            scaleY: 0.1,
                            rotation: 2,
                            alpha: 0,
                            y: this.packSprite.y - 100,
                            duration: 400,
                            ease: 'Power3',
                            onComplete: () => {
                                // Wait a moment then reveal cards
                                this.time.delayedCall(200, () => {
                                    this.revealCards();
                                });
                            }
                        });
                    }
                });
            }
        });
    }

    createOpeningFlashes() {
        // Single subtle flash
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.3);
        flash.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);
        
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => flash.destroy()
        });
    }

    revealCards() {
        // Generate cards from pack
        this.revealedCards = this.pack.open();
        
        // Create card reveal animation
        this.createCardReveal();
    }

    createCardReveal() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        const cardSpacing = 180;
        const startX = centerX - (this.revealedCards.length - 1) * cardSpacing / 2;

        // Subtle ambient effect
        
        // Elegant reveal text
        const revealText = this.add.text(
            centerX,
            centerY - 220,
            'Cards Revealed',
            {
                fontSize: '36px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 2
            }
        );
        revealText.setOrigin(0.5);
        revealText.setAlpha(0);
        revealText.setScale(0.5);
        
        // Exciting text entrance
        this.tweens.add({
            targets: revealText,
            alpha: 1,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 300,
            ease: 'Back.out',
            onComplete: () => {
                // Pulsing animation
                this.tweens.add({
                    targets: revealText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 800,
                    yoyo: true,
                    repeat: -1,
                    ease: 'Sine.easeInOut'
                });
            }
        });

        // Create card displays with dramatic timing
        this.cardContainers = [];
        this.revealedCards.forEach((card, index) => {
            const cardX = startX + index * cardSpacing;
            const cardY = centerY + 50;

            // Stagger card reveals with building excitement
            this.time.delayedCall(800 + index * 300, () => {
                this.createDramaticCardReveal(card, cardX, cardY, index);
            });
        });

        // Continue button appears with fanfare
        this.time.delayedCall(2000 + this.revealedCards.length * 300, () => {
            this.createContinueButton();
        });
    }

    createLightRays() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;
        
        // Create multiple light rays emanating from center
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const ray = this.add.graphics();
            
            ray.lineStyle(3, 0xffd700, 0.8);
            ray.beginPath();
            ray.moveTo(0, 0);
            ray.lineTo(800, 0);
            ray.closePath();
            ray.strokePath();
            
            ray.setPosition(centerX, centerY);
            ray.setRotation(angle);
            ray.setAlpha(0);
            ray.setScale(0, 1);
            
            // Animate rays expanding outward
            this.tweens.add({
                targets: ray,
                alpha: 1,
                scaleX: 1,
                duration: 500,
                delay: i * 50,
                ease: 'Power2',
                onComplete: () => {
                    // Fade out rays
                    this.tweens.add({
                        targets: ray,
                        alpha: 0,
                        duration: 1000,
                        delay: 500,
                        onComplete: () => ray.destroy()
                    });
                }
            });
        }
    }

    createDramaticCardReveal(card, x, y, index) {
        // Pre-reveal buildup with particles
        this.createCardRevealParticles(x, y);
        
        // Create the actual card after buildup
        this.time.delayedCall(200, () => {
            this.createCardDisplay(card, x, y, index);
        });
    }

    createCardRevealParticles(x, y) {
        // Minimal shimmer at card position
        for (let i = 0; i < 3; i++) {
            const shimmer = this.add.graphics();
            
            shimmer.fillStyle(0xffffff, 0.4);
            shimmer.fillCircle(0, 0, 2);
            shimmer.setPosition(x + (Math.random() - 0.5) * 40, y + (Math.random() - 0.5) * 40);
            shimmer.setAlpha(0);
            
            this.tweens.add({
                targets: shimmer,
                alpha: 0.8,
                scaleX: 1.5,
                scaleY: 1.5,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    this.tweens.add({
                        targets: shimmer,
                        alpha: 0,
                        duration: 400,
                        onComplete: () => shimmer.destroy()
                    });
                }
            });
        }
    }

    createCardDisplay(card, x, y, index) {
        const container = this.add.container(x, y);
        const rarityColor = this.pack.getRarityColor(card.rarity);
        
        // Rarity-based glow effect
        const glowRadius = this.getRarityGlowRadius(card.rarity);
        if (glowRadius > 0) {
            const glow = this.add.graphics();
            glow.fillStyle(rarityColor, 0.3);
            glow.fillCircle(0, 0, glowRadius);
            glow.setBlendMode('ADD');
            container.add(glow);
        }

        // Card background with enhanced rarity styling
        const cardBg = this.add.graphics();
        
        // Dynamic background based on rarity
        if (card.rarity === 'legendary') {
            cardBg.fillGradientStyle(0xff4500, 0xffa500, 0xcc3600, 0xff4500, 1);
        } else if (card.rarity === 'rare') {
            cardBg.fillGradientStyle(0x1565c0, 0x2196f3, 0x0d47a1, 0x1565c0, 1);
        } else if (card.rarity === 'uncommon') {
            cardBg.fillGradientStyle(0x2e7d32, 0x4caf50, 0x1b5e20, 0x2e7d32, 1);
        } else {
            cardBg.fillGradientStyle(0x424242, 0x616161, 0x212121, 0x424242, 1);
        }
        
        cardBg.fillRoundedRect(-85, -125, 170, 250, 15);
        
        // Enhanced rarity border with thickness based on rarity
        const borderThickness = card.rarity === 'legendary' ? 6 : card.rarity === 'rare' ? 5 : card.rarity === 'uncommon' ? 4 : 3;
        cardBg.lineStyle(borderThickness, rarityColor, 1.0);
        cardBg.strokeRoundedRect(-85, -125, 170, 250, 15);

        // Add shimmer effect for rare+ cards
        if (card.rarity !== 'common') {
            this.addCardShimmer(container, rarityColor);
        }

        // Card name with rarity-based styling
        const nameText = this.add.text(0, -85, card.name, {
            fontSize: card.rarity === 'legendary' ? '20px' : '18px',
            color: card.rarity === 'legendary' ? '#ffd700' : '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 150 },
            stroke: card.rarity === 'legendary' ? '#ff6600' : '#000000',
            strokeThickness: card.rarity === 'legendary' ? 2 : 1
        });
        nameText.setOrigin(0.5);

        // Enhanced suit/rank display
        const suitText = this.add.text(0, -25, `${card.rank}`, {
            fontSize: '52px',
            color: (card.suit === 'Hearts' || card.suit === 'Diamonds') ? '#ff4444' : '#333333',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 2
        });
        suitText.setOrigin(0.5);

        const suitSymbol = this.add.text(0, 25, this.getSuitSymbol(card.suit), {
            fontSize: '36px',
            color: (card.suit === 'Hearts' || card.suit === 'Diamonds') ? '#ff4444' : '#333333',
            stroke: '#ffffff',
            strokeThickness: 1
        });
        suitSymbol.setOrigin(0.5);

        // Enhanced rarity text with animation
        const rarityText = this.add.text(0, 70, card.rarity.toUpperCase(), {
            fontSize: '14px',
            color: rarityColor,
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
        });
        rarityText.setOrigin(0.5);

        // Special properties
        if (card.special && card.special.description) {
            const specialText = this.add.text(0, 95, card.special.description, {
                fontSize: '11px',
                color: '#cccccc',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: 150 }
            });
            specialText.setOrigin(0.5);
            container.add(specialText);
        }

        container.add([cardBg, nameText, suitText, suitSymbol, rarityText]);

        // Dramatic entrance animation based on rarity
        container.setScale(0);
        container.setAlpha(0);
        container.setRotation(0.5);
        
        const entranceDuration = card.rarity === 'legendary' ? 600 : card.rarity === 'rare' ? 500 : 400;
        
        this.tweens.add({
            targets: container,
            scaleX: 1.1,
            scaleY: 1.1,
            alpha: 1,
            rotation: 0,
            duration: entranceDuration,
            ease: 'Back.out',
            onComplete: () => {
                // Scale back to normal size
                this.tweens.add({
                    targets: container,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Power2'
                });
            }
        });

        // Subtle screen feedback for high-tier cards
        if (card.rarity === 'legendary') {
            this.cameras.main.shake(200, 0.002);
        }

        // Enhanced floating animation
        this.tweens.add({
            targets: container,
            y: y - 15,
            duration: 2500 + Math.random() * 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Rarity-based pulsing for legendary cards
        if (card.rarity === 'legendary') {
            this.tweens.add({
                targets: rarityText,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }

        this.cardContainers.push(container);
    }

    getRarityGlowRadius(rarity) {
        switch (rarity) {
            case 'legendary': return 120;
            case 'rare': return 100;
            case 'uncommon': return 80;
            default: return 0;
        }
    }

    addCardShimmer(container, color) {
        const shimmer = this.add.graphics();
        shimmer.lineStyle(2, color, 0.6);
        
        // Create animated shimmer lines
        for (let i = 0; i < 3; i++) {
            shimmer.beginPath();
            shimmer.moveTo(-80, -100 + i * 20);
            shimmer.lineTo(80, -100 + i * 20);
            shimmer.closePath();
            shimmer.strokePath();
        }
        
        shimmer.setAlpha(0);
        container.add(shimmer);
        
        // Animate shimmer effect
        this.tweens.add({
            targets: shimmer,
            alpha: 0.8,
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    getSuitSymbol(suit) {
        switch (suit) {
            case 'Hearts': return '♥';
            case 'Diamonds': return '♦';
            case 'Clubs': return '♣';
            case 'Spades': return '♠';
            default: return '?';
        }
    }

    createContinueButton() {
        const centerX = this.cameras.main.centerX;
        const centerY = this.cameras.main.centerY;

        const continueButton = this.add.container(centerX, centerY + 250);

        const buttonBg = this.add.graphics();
        buttonBg.fillStyle(0x8b4513, 1.0);
        buttonBg.fillRoundedRect(-100, -30, 200, 60, 15);
        buttonBg.lineStyle(3, 0xd4af37, 1.0);
        buttonBg.strokeRoundedRect(-100, -30, 200, 60, 15);

        const buttonText = this.add.text(0, 0, 'CONTINUE', {
            fontSize: '24px',
            color: '#d4af37',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);

        continueButton.add([buttonBg, buttonText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-100, -30, 200, 60);
        continueButton.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        continueButton.on('pointerdown', () => {
            this.completePack();
        });

        continueButton.on('pointerover', () => {
            continueButton.setScale(1.05);
        });

        continueButton.on('pointerout', () => {
            continueButton.setScale(1.0);
        });

        // Entrance animation
        continueButton.setAlpha(0);
        this.tweens.add({
            targets: continueButton,
            alpha: 1,
            duration: 500
        });
    }

    completePack() {
        // Add cards to player deck if provided
        if (this.playerDeck && this.revealedCards) {
            this.revealedCards.forEach(cardData => {
                // Add the card directly to the player deck
                this.playerDeck.addCard(cardData);
            });
        }

        // Add cards to inventory as items if provided (for reference/tracking)
        if (this.inventory && this.revealedCards) {
            this.revealedCards.forEach(card => {
                this.inventory.addItem({
                    id: card.cardId,
                    name: card.toString(),
                    type: 'card',
                    rarity: card.rarity,
                    data: card
                });
            });
        }

        // Call completion callback with the revealed cards
        this.onComplete(this.revealedCards);

        // Return to previous scene
        this.scene.stop();
    }

    skipAnimation() {
        // Skip directly to card reveal
        if (!this.revealedCards) {
            this.revealedCards = this.pack.open();
        }
        
        // Clean up current animations
        this.tweens.killAll();
        this.children.removeAll(true);
        
        // Show cards immediately
        this.createCardReveal();
    }

    createPackMesh(x, y, artKey) {
        // Create plane geometry for the pack - make it bigger and more visible
        const meshWidth = 200;   // Much larger, similar to image scale
        const meshHeight = 280;  // Proportional to pack aspect ratio
        const plane = this.createPlaneGeometry(meshWidth, meshHeight, 1, 1);
        
        // Create mesh
        const packMesh = this.add.mesh(x, y, artKey);
        packMesh.addVertices(plane.vertices, plane.uvs, plane.indices, true, plane.normals);
        packMesh.panZ(20); // Bring forward
        
        // Skip foil pipeline for now to ensure visibility
        console.log('Created pack mesh at', x, y, 'with texture', artKey);
        
        return packMesh;
    }

    createPlaneGeometry(width, height, widthSegments = 1, heightSegments = 1) {
        const vertices = [];
        const uvs = [];
        const normals = [];
        const indices = [];

        const gridX = widthSegments;
        const gridY = heightSegments;
        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        const segmentWidth = width / gridX;
        const segmentHeight = height / gridY;

        // Generate vertices, normals and uvs
        for (let iy = 0; iy < gridY1; iy++) {
            const y = iy * segmentHeight - height / 2;
            for (let ix = 0; ix < gridX1; ix++) {
                const x = ix * segmentWidth - width / 2;

                vertices.push(x, y, 0);
                normals.push(0, 0, 1);
                uvs.push(ix / gridX, iy / gridY); // Fixed UV coordinates
            }
        }

        // Generate indices
        for (let iy = 0; iy < gridY; iy++) {
            for (let ix = 0; ix < gridX; ix++) {
                const a = ix + gridX1 * iy;
                const b = ix + gridX1 * (iy + 1);
                const c = (ix + 1) + gridX1 * (iy + 1);
                const d = (ix + 1) + gridX1 * iy;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        return { vertices, uvs, indices, normals };
    }
}