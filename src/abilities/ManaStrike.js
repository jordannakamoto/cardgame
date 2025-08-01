import ActiveAbility from './ActiveAbility.js';

export default class ManaStrike extends ActiveAbility {
    constructor() {
        super({
            name: 'Mana Strike',
            description: 'Channel all suit energies to deal direct damage to an enemy',
            manaCosts: {
                '♠': 1,
                '♥': 1, 
                '♦': 1,
                '♣': 1
            },
            cooldown: 0,
            targetType: 'enemy'
        });
        
        this.baseDamage = 25;
    }
    
    async execute(target, battleContext) {
        if (!target || !target.isAlive) {
            throw new Error('Invalid target for Mana Strike');
        }
        
        const damage = this.baseDamage;
        
        // Create dramatic visual effect
        await this.createVisualEffect(target, battleContext.scene);
        
        // Deal damage
        target.takeDamage(damage, { isSpecialAttack: true });
        
        // Show damage text
        this.showDamageText(target, damage, battleContext.scene);
        
        console.log(`Mana Strike dealt ${damage} damage to ${target.name}`);
    }
    
    async createVisualEffect(target, scene) {
        // Create magical strike effect
        const strikeEffect = scene.add.graphics();
        strikeEffect.setDepth(1500);
        
        // Draw magical energy bolt
        strikeEffect.lineStyle(6, 0xffffff, 1);
        strikeEffect.lineBetween(
            scene.cameras.main.width / 2,
            100,
            target.x,
            target.y
        );
        
        // Add colored energy particles for each suit
        const suitColors = [0x8b5cf6, 0xef4444, 0xeab308, 0x3b82f6]; // Purple, Red, Yellow, Blue
        const particles = [];
        
        suitColors.forEach((color, index) => {
            for (let i = 0; i < 8; i++) {
                const particle = scene.add.circle(
                    target.x + (Math.random() - 0.5) * 100,
                    target.y + (Math.random() - 0.5) * 100,
                    Math.random() * 8 + 4,
                    color,
                    0.8
                );
                particle.setDepth(1500);
                particles.push(particle);
                
                // Animate particles converging on target
                scene.tweens.add({
                    targets: particle,
                    x: target.x,
                    y: target.y,
                    scaleX: 0,
                    scaleY: 0,
                    alpha: 0,
                    duration: 300 + (i * 50),
                    ease: 'Power2',
                    onComplete: () => particle.destroy()
                });
            }
        });
        
        // Flash effect on target
        const flash = scene.add.circle(target.x, target.y, 80, 0xffffff, 0.6);
        flash.setDepth(1500);
        
        scene.tweens.add({
            targets: flash,
            scaleX: 2,
            scaleY: 2,
            alpha: 0,
            duration: 400,
            ease: 'Power2',
            onComplete: () => flash.destroy()
        });
        
        // Animate and cleanup strike line
        scene.tweens.add({
            targets: strikeEffect,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => strikeEffect.destroy()
        });
        
        // Wait for effect to complete
        return new Promise(resolve => {
            scene.time.delayedCall(600, resolve);
        });
    }
    
    showDamageText(target, damage, scene) {
        const damageText = scene.add.text(target.x, target.y - 120, `★ ${damage}`, {
            fontSize: '48px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: '#000000',
            strokeThickness: 3
        });
        damageText.setOrigin(0.5);
        damageText.setDepth(1600);
        
        // Animate damage text
        scene.tweens.add({
            targets: damageText,
            y: damageText.y - 80,
            alpha: 0,
            scale: 1.5,
            duration: 1200,
            ease: 'Power2',
            onComplete: () => damageText.destroy()
        });
    }
    
    createIcon(scene, x, y) {
        // Create a magical star icon representing the mana strike
        const icon = scene.add.graphics();
        
        // Draw star shape
        icon.fillStyle(0xffffff, 0.9);
        icon.lineStyle(2, 0x444444, 1);
        
        const centerX = x;
        const centerY = y;
        const outerRadius = 20;
        const innerRadius = 10;
        const points = 8;
        
        icon.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points;
            const pointX = centerX + Math.cos(angle) * radius;
            const pointY = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                icon.moveTo(pointX, pointY);
            } else {
                icon.lineTo(pointX, pointY);
            }
        }
        icon.closePath();
        icon.fillPath();
        icon.strokePath();
        
        // Add colored dots for each suit requirement
        const suitColors = [0x8b5cf6, 0xef4444, 0xeab308, 0x3b82f6];
        suitColors.forEach((color, index) => {
            const angle = (index * Math.PI * 2) / 4;
            const dotX = centerX + Math.cos(angle) * 15;
            const dotY = centerY + Math.sin(angle) * 15;
            
            const dot = scene.add.circle(dotX, dotY, 3, color);
            icon.add ? icon.add(dot) : null; // Add to container if possible
        });
        
        return icon;
    }
}