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
                
                this.isImageSprite = true;
            } else {
                this.createFallbackSprite();
            }
        } catch (error) {
            console.warn(`Failed to load sprite for ${this.name}, using fallback:`, error);
            this.createFallbackSprite();
        }
        
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
    
    createUI() {
        // Enemy name
        this.nameText = this.scene.add.text(this.x, this.y - 210, this.name, {  // 140 * 1.5
            fontSize: '42px',  // 28 * 1.5
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.nameText.setOrigin(0.5);
        
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
    
    takeDamage(amount) {
        if (!this.isAlive) return;
        
        // Clear damage preview before applying damage
        this.hideDamagePreview();
        
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.updateHealthBar();
        
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
        this.scene.tweens.add({
            targets: [this.sprite, this.healthBar, this.healthBarBg, this.nameText],
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
            }
        });
        
        // Notify battle manager (gold will be awarded at battle end)
        this.scene.events.emit('enemyDied', this);
    }
    
    setTargeted(targeted) {
        this.isTargeted = targeted;
        this.targetIndicator.setVisible(targeted);
        
        // Hide damage preview when not targeted
        if (!targeted) {
            this.hideDamagePreview();
        }
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
        
        // Very subtle horizontal sway
        this.scene.tweens.add({
            targets: this.sprite,
            x: this.x + 4,  // Subtle 4px horizontal movement
            duration: 3000 + Math.random() * 1000, // 3-4 seconds
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 1000 // Random start delay
        });
        
        // Subtle scale breathing effect
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: this.originalScaleX * 1.02,  // 2% scale change
            scaleY: this.originalScaleY * 0.98,  // Slight squash
            duration: 1500 + Math.random() * 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 500
        });
    }
    
    destroy() {
        if (this.sprite) this.sprite.destroy();
        if (this.healthBar) this.healthBar.destroy();
        if (this.healthBarBg) this.healthBarBg.destroy();
        if (this.nameText) this.nameText.destroy();
        if (this.targetIndicator) this.targetIndicator.destroy();
        this.hideDamagePreview();
    }
    
    getTextureKey() {
        return `enemy_${this.name.toLowerCase()}`;
    }
    
    makeInteractive() {
        // Make the sprite clickable for targeting
        this.sprite.setInteractive();
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