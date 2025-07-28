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
                this.sprite.setDisplaySize(160, 200);
                
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
    }
    
    createFallbackSprite() {
        // Fallback rectangle with different colors per enemy type
        let color = 0x8B4513; // Default brown
        if (this.name === 'Goblin') color = 0x228B22; // Green
        else if (this.name === 'Orc') color = 0x8B0000; // Dark red
        else if (this.name === 'Troll') color = 0x696969; // Gray
        
        this.sprite = this.scene.add.rectangle(this.x, this.y, 160, 200, color);
        this.sprite.setStrokeStyle(4, 0x654321);
        this.isImageSprite = false;
    }
    
    createUI() {
        // Enemy name
        this.nameText = this.scene.add.text(this.x, this.y - 140, this.name, {
            fontSize: '28px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        this.nameText.setOrigin(0.5);
        
        // Health bar background
        this.healthBarBg = this.scene.add.rectangle(this.x, this.y + 140, 160, 16, 0x444444);
        
        // Health bar
        this.healthBar = this.scene.add.rectangle(this.x, this.y + 140, 160, 16, 0x00ff00);
        
        // Target indicator (initially hidden)
        this.targetIndicator = this.scene.add.graphics();
        this.targetIndicator.lineStyle(3, 0xffff00);
        this.targetIndicator.strokeRect(this.x - 100, this.y - 120, 200, 240);
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
        const damageText = this.scene.add.text(this.x, this.y - 60, `-${amount}`, {
            fontSize: '40px',
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
        const newWidth = 160 * healthPercent;
        
        // Update width but keep position fixed at center
        this.healthBar.width = newWidth;
        this.healthBar.x = this.x; // Keep centered on enemy
        
        // Keep health bar green at all times
        this.healthBar.setFillStyle(0x00ff00);
    }
    
    die() {
        this.isAlive = false;
        this.setTargeted(false);
        
        // Death animation
        this.scene.tweens.add({
            targets: [this.sprite, this.healthBar, this.healthBarBg, this.nameText],
            alpha: 0.3,
            duration: 500,
            ease: 'Power2'
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
        
        const currentWidth = 160 * healthPercent;
        const afterWidth = 160 * afterDamagePercent;
        const damageWidth = currentWidth - afterWidth;
        
        if (damageWidth > 0) {
            // Health bar starts at this.x - 80 and is 160 wide
            // afterWidth is the width of remaining health
            // We want to position the damage preview right after the remaining health
            const damageStartX = this.x - 80 + afterWidth;
            
            this.damagePreview = this.scene.add.rectangle(
                damageStartX + (damageWidth / 2), // Center the damage rectangle in its section
                this.y + 140,
                damageWidth,
                16,
                0xff0000,
                0.6 // Semi-transparent red
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