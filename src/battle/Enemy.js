import { PerspectiveConfig } from '../config/PerspectiveConfig.js';

export default class Enemy {
    constructor(scene, x, y, config) {
        this.scene = scene;
        this.x = x;
        this.y = y;

        // Enemy stats
        this.name = config.name || 'Enemy';
        this.maxHealth = config.health || 100;
        this.currentHealth = this.maxHealth;
        this.isAlive = true;
        this.isTargeted = false;
        this.goldReward = config.goldReward || Math.floor(this.maxHealth / 10) + 5; // Scale with health
        this.artPath = config.artPath || null;
        this.description = config.description || '';

        // Visual elements
        this.sprite = null;
        this.healthBar = null;
        this.healthBarBg = null;
        this.nameText = null;
        this.targetIndicator = null;
        this.damagePreview = null;
        this.targetGlow = null;
        this.targetOutline = null;
        this.targetParticles = [];
        this.targetScaleTween = null;
        this.targetArrow = null;
        this.targetOrb = null;

        this.createVisuals();
    }

    createVisuals() {
        // Try to load enemy art, fallback to rectangle
        try {
            if (this.artPath && this.scene.textures.exists(this.getTextureKey())) {
                this.sprite = this.scene.add.image(this.x, this.y, this.getTextureKey());
                this.sprite.setDisplaySize(320, 400);  // Increased from 240x300 to 320x400

                // Improve image quality
                this.sprite.setTexture(this.getTextureKey());
                this.sprite.setOrigin(0.5, 0.5);

                // Enable smooth scaling
                this.scene.textures.get(this.getTextureKey()).setFilter(Phaser.Textures.FilterMode.LINEAR);

                // Apply outline effect to image sprites
                this.sprite.setPostPipeline('OutlinePipeline');

                this.isImageSprite = true;
            } else {
                this.createFallbackSprite();
            }
        } catch (error) {
            console.warn(`Failed to load sprite for ${this.name}, using fallback:`, error);
            this.createFallbackSprite();
        }

        // Store original position and scale immediately after sprite creation
        if (this.sprite) {
            this.originalScaleX = this.sprite.scaleX;
            this.originalScaleY = this.sprite.scaleY;
            // Set enemy sprite to a higher depth so shadows can go behind
            this.sprite.setDepth(10);
            console.log('Enemy sprite depth for', this.name, 'set to:', this.sprite.depth);
        }

        // Create soft shadow beneath enemy
        this.createSoftShadow();

        this.createUI();
        this.startIdleAnimation();
    }

    createFallbackSprite() {
        // Fallback rectangle with different colors per enemy type
        let color = 0x8B4513; // Default brown
        if (this.name === 'Goblin') color = 0x228B22; // Green
        else if (this.name === 'Orc') color = 0x8B0000; // Dark red
        else if (this.name === 'Troll') color = 0x696969; // Gray

        this.sprite = this.scene.add.rectangle(this.x, this.y, 320, 400, color);  // Increased from 240x300 to 320x400
        this.sprite.setStrokeStyle(8, 0x654321);  // Increased stroke thickness
        this.isImageSprite = false;
    }

    createSoftShadow() {
        console.log('Creating shadow for', this.name, 'with enemy sprite at depth 10');

        // Create soft, blurred shadow beneath the enemy
        const shadowWidth = 280;
        const shadowHeight = 50;
        const shadowY = this.y + 160;

        // Create multiple layers for heavy blur effect (reduced opacity by half)
        const shadowLayers = [
            { alpha: 0.15, scale: 0.8, offsetY: 0 },   // Core shadow
            { alpha: 0.125, scale: 1.0, offsetY: 1 },  // Close blur
            { alpha: 0.1, scale: 1.2, offsetY: 3 },    // Medium blur
            { alpha: 0.075, scale: 1.4, offsetY: 5 },  // Soft blur
            { alpha: 0.05, scale: 1.6, offsetY: 7 },   // Very soft blur
            { alpha: 0.035, scale: 1.8, offsetY: 9 },  // Ultra soft blur
            { alpha: 0.02, scale: 2.0, offsetY: 11 },  // Extremely diffused
            { alpha: 0.01, scale: 2.2, offsetY: 13 }   // Maximum diffusion
        ];

        this.shadowContainer = this.scene.add.container(this.x, shadowY);
        // Set shadow depth definitely behind enemy (enemy is at depth 10)
        this.shadowContainer.setDepth(5);

        shadowLayers.forEach(layer => {
            const shadow = this.scene.add.ellipse(
                0, layer.offsetY,
                shadowWidth * layer.scale,
                shadowHeight * layer.scale,
                0x000000,
                layer.alpha
            );
            this.shadowContainer.add(shadow);
        });

        console.log('Soft shadow created for', this.name, 'at depth 5 (enemy at depth 10)');
    }

    createUI() {
        // Enemy name (removed for cleaner look)
        // this.nameText = this.scene.add.text(this.x, this.y - 210, this.name, {  // 140 * 1.5
        //     fontSize: '42px',  // 28 * 1.5
        //     color: '#ffffff',
        //     fontFamily: 'Arial'
        // });
        // this.nameText.setOrigin(0.5);
        this.nameText = null;

        // Health bar background
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y + 210, 240, 24, 0x444444);  // 140 * 1.5, 160 * 1.5, 16 * 1.5

        // Health bar
        this.healthBar = this.scene.add.rectangle(this.x, this.y + 210, 240, 24, 0xff4444);  // 140 * 1.5, 160 * 1.5, 16 * 1.5

        // Target indicator (initially hidden)
        this.targetIndicator = this.scene.add.graphics();
        this.targetIndicator.lineStyle(6, 0xffff00);  // Slightly thicker
        this.targetIndicator.strokeRect(this.x - 200, this.y - 240, 400, 480);  // Adjusted for 320x400 sprite size
        this.targetIndicator.setVisible(false);

        // Make enemy clickable for targeting
        this.makeInteractive();
    }

    takeDamage(amount, options = {}) {
        if (!this.isAlive) return;

        // Clear damage preview before applying damage
        this.hideDamagePreview();

        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthBar();

        // Screen shake for special attacks
        if (options.isSpecialAttack) {
            const camera = this.scene.cameras.main;
            camera.shake(200, 0.008); // More noticeable shake when damage is applied
        }

        // Create damage text
        const damageText = this.scene.add.text(this.x, this.y - 90, `-${amount}`, {  // 60 * 1.5
            fontSize: '60px',  // 40 * 1.5
            color: '#ff0000',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        damageText.setOrigin(0.5);

        // Animate damage text
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 80,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });

        // Flash red (different methods for image vs rectangle)
        if (this.sprite) {
            if (this.isImageSprite) {
                this.scene.tweens.add({
                    targets: this.sprite,
                    tint: 0xff0000,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.sprite.clearTint();
                    }
                });
            } else {
                // For rectangles, use fillColor
                const originalColor = this.sprite.fillColor;
                this.scene.tweens.add({
                    targets: this.sprite,
                    fillColor: 0xff0000,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => {
                        this.sprite.setFillStyle(originalColor);
                    }
                });
            }
        }

        if (this.currentHealth <= 0) {
            this.die();
        }
    }

    updateHealthBar() {
        const healthPercent = this.currentHealth / this.maxHealth;
        const newWidth = 240 * healthPercent;  // 160 * 1.5

        // Update width but keep position fixed at center
        this.healthBar.width = newWidth;
        this.healthBar.x = this.x; // Keep centered on enemy

        // Keep health bar red at all times
        this.healthBar.setFillStyle(0xff4444);
    }

    die() {
        this.isAlive = false;
        this.setTargeted(false);

        // Kill all idle animations first
        this.scene.tweens.killTweensOf(this.sprite);

        // Death animation - gentle fade out
        const fadeTargets = [this.sprite, this.healthBar, this.healthBarBg];
        if (this.nameText) fadeTargets.push(this.nameText);
        if (this.shadowContainer) fadeTargets.push(this.shadowContainer);

        this.scene.tweens.add({
            targets: fadeTargets,
            alpha: 0,
            duration: 1000,  // Slower, more gentle
            ease: 'Linear',  // Smooth, even fade
            onComplete: () => {
                // Hide all elements completely after animation
                if (this.sprite) this.sprite.setVisible(false);
                if (this.healthBar) this.healthBar.setVisible(false);
                if (this.healthBarBg) this.healthBarBg.setVisible(false);
                if (this.nameText) this.nameText.setVisible(false);
                if (this.targetIndicator) this.targetIndicator.setVisible(false);
                if (this.shadowContainer) this.shadowContainer.setVisible(false);
            }
        });

        // Notify battle manager (gold will be awarded at battle end)
        console.log('Enemy emitting death event:', this.name, 'currentHealth:', this.currentHealth, 'isAlive:', this.isAlive);
        this.scene.events.emit('enemyDied', this);
    }

    setTargeted(targeted) {
        this.isTargeted = targeted;

        if (targeted) {
            this.showTargetEffects();
        } else {
            this.hideTargetEffects();
            this.hideDamagePreview();
        }
    }

    showTargetEffects() {
        // Clear any existing target effects
        this.hideTargetEffects();

        // 1. Create floating down arrow above the enemy (elegant ornate style)
        this.targetArrow = this.scene.add.graphics();

        const arrowSize = 32; // Slightly smaller
        const arrowX = this.x;
        const arrowY = this.y - 280; // Lowered position

        // Draw left (shadow) side of the arrow - darker silver with FF elegance
        this.targetArrow.fillStyle(0x9090a0, 0.95); // Darker silver for shadow side
        this.targetArrow.lineStyle(2, 0x606070, 1.0); // Dark silver outline

        this.targetArrow.beginPath();
        // Sharp elongated point (bottom center)
        this.targetArrow.moveTo(arrowX, arrowY + arrowSize * 1.1);
        // Left wing - more angular and diamond-like
        this.targetArrow.lineTo(arrowX - arrowSize * 0.8, arrowY + arrowSize * 0.2);
        this.targetArrow.lineTo(arrowX - arrowSize * 0.5, arrowY + arrowSize * 0.05); // Angular cut
        this.targetArrow.lineTo(arrowX - arrowSize * 0.35, arrowY + arrowSize * 0.15);
        // Elegant curved transition to shaft
        this.targetArrow.lineTo(arrowX - arrowSize * 0.25, arrowY - arrowSize * 0.1);
        // Long slender shaft
        this.targetArrow.lineTo(arrowX - arrowSize * 0.15, arrowY - arrowSize * 0.6);
        // Ornate nock with curves
        this.targetArrow.lineTo(arrowX - arrowSize * 0.08, arrowY - arrowSize * 0.8);
        this.targetArrow.lineTo(arrowX, arrowY - arrowSize * 0.75);
        // Center line back down
        this.targetArrow.lineTo(arrowX, arrowY + arrowSize * 1.1);
        this.targetArrow.closePath();
        this.targetArrow.fillPath();
        this.targetArrow.strokePath();

        // Draw right (highlight) side of the arrow - brighter silver with FF elegance
        this.targetArrow.fillStyle(0xd0d0e0, 0.95); // Bright silver for lit side
        this.targetArrow.lineStyle(2, 0x606070, 1.0); // Dark silver outline

        this.targetArrow.beginPath();
        // Sharp elongated point (bottom center)
        this.targetArrow.moveTo(arrowX, arrowY + arrowSize * 1.1);
        // Right wing - more angular and diamond-like
        this.targetArrow.lineTo(arrowX + arrowSize * 0.8, arrowY + arrowSize * 0.2);
        this.targetArrow.lineTo(arrowX + arrowSize * 0.5, arrowY + arrowSize * 0.05); // Angular cut
        this.targetArrow.lineTo(arrowX + arrowSize * 0.35, arrowY + arrowSize * 0.15);
        // Elegant curved transition to shaft
        this.targetArrow.lineTo(arrowX + arrowSize * 0.25, arrowY - arrowSize * 0.1);
        // Long slender shaft
        this.targetArrow.lineTo(arrowX + arrowSize * 0.15, arrowY - arrowSize * 0.6);
        // Ornate nock with curves
        this.targetArrow.lineTo(arrowX + arrowSize * 0.08, arrowY - arrowSize * 0.8);
        this.targetArrow.lineTo(arrowX, arrowY - arrowSize * 0.75);
        // Center line back down
        this.targetArrow.lineTo(arrowX, arrowY + arrowSize * 1.1);
        this.targetArrow.closePath();
        this.targetArrow.fillPath();
        this.targetArrow.strokePath();

        // Add extra highlight on the right side for more depth
        this.targetArrow.fillStyle(0xf0f0ff, 0.7); // Light silver highlight
        this.targetArrow.beginPath();
        this.targetArrow.moveTo(arrowX, arrowY + arrowSize * 1.0);
        this.targetArrow.lineTo(arrowX + arrowSize * 0.5, arrowY + arrowSize * 0.2);
        this.targetArrow.lineTo(arrowX + arrowSize * 0.2, arrowY + arrowSize * 0.15);
        this.targetArrow.lineTo(arrowX + arrowSize * 0.1, arrowY - arrowSize * 0.2);
        this.targetArrow.lineTo(arrowX, arrowY - arrowSize * 0.3);
        this.targetArrow.closePath();
        this.targetArrow.fillPath();

        // Add ornate decorative elements - Final Fantasy style
        this.targetArrow.lineStyle(1, 0xe0e0ff, 0.8); // Bright silver details
        // Central line down the elongated shaft
        this.targetArrow.beginPath();
        this.targetArrow.moveTo(arrowX, arrowY + arrowSize * 0.9);
        this.targetArrow.lineTo(arrowX, arrowY - arrowSize * 0.3);
        this.targetArrow.strokePath();

        // Elegant decorative fletching with FF-style curves
        this.targetArrow.lineStyle(1, 0x8080a0, 0.7);
        // Multiple curved fletching lines for ornate look
        for (let i = -1; i <= 1; i += 2) {
            // Upper fletching curves
            this.targetArrow.beginPath();
            this.targetArrow.moveTo(arrowX + i * 4, arrowY - arrowSize * 0.7);
            this.targetArrow.lineTo(arrowX + i * 8, arrowY - arrowSize * 0.8);
            this.targetArrow.strokePath();

            // Lower fletching curves
            this.targetArrow.beginPath();
            this.targetArrow.moveTo(arrowX + i * 3, arrowY - arrowSize * 0.6);
            this.targetArrow.lineTo(arrowX + i * 6, arrowY - arrowSize * 0.65);
            this.targetArrow.strokePath();
        }

        // Add diamond/star-like ornamental details along the shaft
        this.targetArrow.fillStyle(0xe0e0ff, 0.9);
        for (let i = 0; i < 3; i++) {
            const gemY = arrowY - arrowSize * (0.2 + i * 0.15);
            // Draw small diamond/star shapes instead of circles
            this.targetArrow.beginPath();
            this.targetArrow.moveTo(arrowX, gemY - 2); // Top point
            this.targetArrow.lineTo(arrowX + 1.5, gemY); // Right point
            this.targetArrow.lineTo(arrowX, gemY + 2); // Bottom point
            this.targetArrow.lineTo(arrowX - 1.5, gemY); // Left point
            this.targetArrow.closePath();
            this.targetArrow.fillPath();
        }

        // Add blue glow effect manually with multiple layers
        this.targetGlow = this.scene.add.graphics();

        // Large background glow centered on arrow body
        this.targetGlow.fillStyle(0x4da6ff, 0.1); // Outer blue glow - reduced opacity
        this.targetGlow.fillCircle(arrowX, arrowY, arrowSize * 1.4); // Large glow circle around arrow body

        this.targetGlow.fillStyle(0x87ceeb, 0.15); // Medium blue glow - reduced opacity
        this.targetGlow.fillCircle(arrowX, arrowY, arrowSize * 1.1); // Medium glow circle

        // Focused glow at the arrow center (vertical middle)
        const arrowCenterY = arrowY + arrowSize * 0.1; // Arrow center location
        this.targetGlow.fillStyle(0xb0e0e6, 0.15); // Much more subtle inner glow at the center
        this.targetGlow.fillCircle(arrowX, arrowCenterY, arrowSize * 0.4); // Small focused glow at arrow center

        this.targetGlow.setScrollFactor(0);

        // Create a magical orb of light at the arrow center (very subtle)
        this.targetOrb = this.scene.add.graphics();
        const orbY = arrowY + arrowSize * 0.1; // Position at arrow center (vertical middle)

        // Outer orb glow
        this.targetOrb.fillStyle(0x4da6ff, 0.08); // Much more transparent
        this.targetOrb.fillCircle(arrowX, orbY, 12); // Smaller outer glow

        this.targetOrb.fillStyle(0x87ceeb, 0.15); // Much more transparent
        this.targetOrb.fillCircle(arrowX, orbY, 6); // Smaller main orb

        this.targetOrb.fillStyle(0xb0e0e6, 0.12); // Much more transparent
        this.targetOrb.fillCircle(arrowX, orbY, 9); // Smaller medium glow

        this.targetOrb.fillStyle(0xffffff, 0.25); // Much more transparent white center
        this.targetOrb.fillCircle(arrowX, orbY, 2); // Smaller bright core

        this.targetArrow.setScrollFactor(0); // Keep fixed to camera
        this.targetOrb.setScrollFactor(0); // Keep orb fixed to camera too

        // Add floating animation (slightly faster and more movement)
        this.scene.tweens.add({
            targets: [this.targetArrow, this.targetOrb, this.targetGlow],
            y: arrowY - 6, // More movement
            duration: 1800, // Faster animation
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add very gentle pulsing animation to the orb and glow
        this.scene.tweens.add({
            targets: [this.targetOrb, this.targetGlow],
            alpha: 0.2, // More subtle pulsing
            duration: 1200, // Slower pulsing
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // 2. Enhanced subtle camera effects using config values
        this.scene.cameras.main.zoomTo(PerspectiveConfig.camera.targetingZoom, PerspectiveConfig.camera.zoomDuration);

        // Enhanced pan toward the enemy using config values
        const currentCenterX = this.scene.cameras.main.width / 2;
        const currentCenterY = this.scene.cameras.main.height / 2;
        const panX = currentCenterX + (this.x - currentCenterX) * PerspectiveConfig.camera.targetingPan;
        const panY = currentCenterY + (this.y - currentCenterY) * PerspectiveConfig.camera.targetingPan;
        this.scene.cameras.main.pan(panX, panY, PerspectiveConfig.camera.panDuration);
    }

    hideTargetEffects() {
        // Remove floating arrow, orb, and glow
        if (this.targetArrow) {
            this.scene.tweens.killTweensOf(this.targetArrow);
            this.targetArrow.destroy();
            this.targetArrow = null;
        }

        if (this.targetOrb) {
            this.scene.tweens.killTweensOf(this.targetOrb);
            this.targetOrb.destroy();
            this.targetOrb = null;
        }

        if (this.targetGlow) {
            this.scene.tweens.killTweensOf(this.targetGlow);
            this.targetGlow.destroy();
            this.targetGlow = null;
        }

        // Reset camera
        this.scene.cameras.main.zoomTo(1.0, 400);
        this.scene.cameras.main.centerOn(this.scene.cameras.main.width / 2, this.scene.cameras.main.height / 2);

        // Hide old target indicator
        this.targetIndicator.setVisible(false);
    }


    showDamagePreview(damage) {
        if (!this.isAlive) return;

        // Clear existing preview first
        this.hideDamagePreview();

        const healthPercent = this.currentHealth / this.maxHealth;
        const afterDamageHealth = Math.max(0, this.currentHealth - damage);
        const afterDamagePercent = afterDamageHealth / this.maxHealth;

        const currentWidth = 240 * healthPercent;  // 160 * 1.5
        const afterWidth = 240 * afterDamagePercent;  // 160 * 1.5
        const damageWidth = currentWidth - afterWidth;

        if (damageWidth > 0) {
            // Health bar starts at this.x - 120 and is 240 wide  // 80 * 1.5, 160 * 1.5
            // afterWidth is the width of remaining health
            // We want to position the damage preview right after the remaining health
            const damageStartX = this.x - 120 + afterWidth;  // 80 * 1.5

            this.damagePreview = this.scene.add.rectangle(
                damageStartX + (damageWidth / 2), // Center the damage rectangle in its section
                this.y + 210,  // 140 * 1.5
                damageWidth,
                24,  // 16 * 1.5
                0x555555,
                0.8 // Semi-transparent dark grey
            );
        }

        // Don't show damage number in preview - only show after actual attack
    }

    hideDamagePreview() {
        if (this.damagePreview) {
            this.damagePreview.destroy();
            this.damagePreview = null;
        }

        // Don't clear damageText here since it's not created in preview anymore
    }


    getHealthPercent() {
        return this.currentHealth / this.maxHealth;
    }

    isDefeated() {
        return !this.isAlive;
    }

    startIdleAnimation() {
        if (!this.sprite) return;

        // Store original position and scale
        this.originalScaleX = this.sprite.scaleX;
        this.originalScaleY = this.sprite.scaleY;

        // Enhanced horizontal sway (more apparent)
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.x + 6,  // More noticeable horizontal movement
            duration: 3000 + Math.random() * 1000, // 3-4 seconds
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1000 // Random start delay
        });

        // Enhanced breathing effect (more apparent)
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: this.originalScaleX * 1.02,  // Increased from 2% to 3% scale change
            scaleY: this.originalScaleY * 0.98,  // More noticeable squash
            duration: 1500 + Math.random() * 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 500
        });

        // Add subtle vertical breathing movement
        this.scene.tweens.add({
            targets: this.sprite,
            y: this.y - 5, // Move up 5px
            duration: 1800 + Math.random() * 400, // Slightly different timing from scale
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 600 // Different delay pattern
        });
    }

    destroy() {
        // Clean up target effects first
        this.hideTargetEffects();

        if (this.sprite) this.sprite.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.nameText) this.nameText.destroy();
        if (this.targetIndicator) this.targetIndicator.destroy();
        if (this.shadowContainer) this.shadowContainer.destroy();
        this.hideDamagePreview();
    }

    getTextureKey() {
        return `enemy_${this.name.toLowerCase()}`;
    }

    makeInteractive() {
        // Make the sprite clickable for targeting with pixel-perfect detection
        if (this.isImageSprite) {
            // For image sprites, use pixel-perfect hit area
            this.sprite.setInteractive({
                pixelPerfect: true,
                alphaTolerance: 1 // Only pixels with alpha > 1 are clickable
            });
        } else {
            // For fallback rectangles, use normal rectangular hit area
            this.sprite.setInteractive();
        }

        this.sprite.on('pointerdown', () => {
            if (this.isAlive && this.scene.battleManager) {
                // Find this enemy's index in the battle manager's enemy array
                const enemyIndex = this.scene.battleManager.enemies.indexOf(this);
                if (enemyIndex !== -1) {
                    this.scene.battleManager.selectEnemy(enemyIndex);
                }
            }
        });

        // Add hover effect
        this.sprite.on('pointerover', () => {
            if (this.isAlive) {
                this.sprite.setTint(0xdddddd);
            }
        });

        this.sprite.on('pointerout', () => {
            if (this.isAlive) {
                this.sprite.clearTint();
            }
        });
    }
}
