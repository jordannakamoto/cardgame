// Utility functions for triggering animations from various sources
import { SpecialAttackAnimations } from './SpecialAttackAnimations.js';

export class AnimationUtils {
    
    // Trigger an animation from any source (card, hero skill, item, etc.)
    static triggerAnimation(scene, animationType, sourceSprite, targets, options = {}) {
        const animationMap = {
            'jokerSlash': SpecialAttackAnimations.jokerSlashAttack,
            'lightning': SpecialAttackAnimations.lightningStrike,
            'fire': SpecialAttackAnimations.fireBlast,
            // Add more animation types as needed
        };

        const animationFunction = animationMap[animationType];
        if (animationFunction && typeof animationFunction === 'function') {
            return animationFunction(scene, sourceSprite, targets, options);
        }
        
        console.warn(`Animation type '${animationType}' not found`);
        return Promise.resolve();
    }
    
    // Helper to create a generic activation animation for any sprite
    static createActivationAnimation(scene, sprite, color = 0xffd700, duration = 400) {
        return new Promise((resolve) => {
            if (!sprite || !scene) {
                resolve();
                return;
            }

            // Create glow effect
            const glow = scene.add.graphics();
            glow.fillStyle(color, 0.6);
            glow.fillCircle(sprite.x, sprite.y, 50);
            glow.setBlendMode(Phaser.BlendModes.ADD);

            // Pulsing effect
            scene.tweens.add({
                targets: sprite,
                scaleX: 1.2,
                scaleY: 1.2,
                duration: duration / 2,
                yoyo: true,
                ease: 'Power2'
            });

            // Fade out glow
            scene.tweens.add({
                targets: glow,
                alpha: 0,
                scale: 1.5,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    glow.destroy();
                    resolve();
                }
            });
        });
    }
    
    // Helper to create screen flash effect
    static createScreenFlash(scene, color = 0xffffff, intensity = 0.3, duration = 200) {
        const flashOverlay = scene.add.rectangle(
            scene.cameras.main.centerX, 
            scene.cameras.main.centerY,
            scene.cameras.main.width,
            scene.cameras.main.height,
            color,
            intensity
        );
        flashOverlay.setDepth(1000);

        scene.tweens.add({
            targets: flashOverlay,
            alpha: 0,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                flashOverlay.destroy();
            }
        });
    }
    
    // Helper to create particle burst at a location
    static createParticleBurst(scene, x, y, particleCount = 10, color = 0xffffff, speed = 100) {
        const particles = [];
        
        for (let i = 0; i < particleCount; i++) {
            const particle = scene.add.graphics();
            particle.fillStyle(color, 1);
            particle.fillCircle(0, 0, 2 + Math.random() * 3);
            particle.x = x;
            particle.y = y;
            particles.push(particle);

            const angle = Math.random() * Math.PI * 2;
            const velocity = speed + Math.random() * speed;
            
            scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * velocity,
                y: y + Math.sin(angle) * velocity,
                alpha: 0,
                scale: 0.2,
                duration: 400 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => {
                    if (particle.active) particle.destroy();
                }
            });
        }
        
        return particles;
    }
    
    // Helper to shake a sprite
    static shakeSprite(scene, sprite, intensity = 10, duration = 300) {
        const originalX = sprite.x;
        const originalY = sprite.y;
        
        return new Promise((resolve) => {
            scene.tweens.add({
                targets: sprite,
                x: originalX + (Math.random() - 0.5) * intensity,
                y: originalY + (Math.random() - 0.5) * intensity,
                duration: 50,
                repeat: Math.floor(duration / 50),
                yoyo: true,
                ease: 'Power2',
                onComplete: () => {
                    sprite.x = originalX;
                    sprite.y = originalY;
                    resolve();
                }
            });
        });
    }
    
    // Helper to create energy beam between two points
    static createEnergyBeam(scene, startX, startY, endX, endY, color = 0x00ffff, duration = 500) {
        return new Promise((resolve) => {
            const beam = scene.add.graphics();
            beam.lineStyle(6, color, 1);
            beam.setBlendMode(Phaser.BlendModes.ADD);
            
            // Draw beam
            beam.moveTo(startX, startY);
            beam.lineTo(endX, endY);
            
            // Fade out beam
            scene.tweens.add({
                targets: beam,
                alpha: 0,
                duration: duration,
                ease: 'Power2',
                onComplete: () => {
                    beam.destroy();
                    resolve();
                }
            });
        });
    }
}

// Example usage in hero abilities:
export class HeroAnimationHelpers {
    
    // Example: Lightning hero ability
    static heroLightningStrike(scene, heroSprite, targets) {
        return AnimationUtils.triggerAnimation(scene, 'lightning', heroSprite, targets, {
            heroAbility: true
        });
    }
    
    // Example: Fire mage ability
    static heroFireBlast(scene, heroSprite, targets) {
        return AnimationUtils.triggerAnimation(scene, 'fire', heroSprite, targets, {
            heroAbility: true,
            intensity: 'high'
        });
    }
    
    // Example: Healing ability
    static heroHeal(scene, heroSprite, targets) {
        return new Promise((resolve) => {
            const promises = [];
            
            // Hero activation
            promises.push(AnimationUtils.createActivationAnimation(scene, heroSprite, 0x00ff00, 600));
            
            // Healing effects on targets
            if (Array.isArray(targets)) {
                targets.forEach((target, index) => {
                    if (target && target.sprite) {
                        const delay = index * 100;
                        const healPromise = new Promise((healResolve) => {
                            scene.time.delayedCall(delay, () => {
                                // Green healing particles
                                AnimationUtils.createParticleBurst(
                                    scene, 
                                    target.sprite.x, 
                                    target.sprite.y, 
                                    15, 
                                    0x00ff00, 
                                    80
                                );
                                
                                // Gentle glow
                                AnimationUtils.createActivationAnimation(
                                    scene, 
                                    target.sprite, 
                                    0x00ff00, 
                                    400
                                ).then(healResolve);
                            });
                        });
                        promises.push(healPromise);
                    }
                });
            }
            
            Promise.all(promises).then(resolve);
        });
    }
}