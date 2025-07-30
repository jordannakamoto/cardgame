// Special attack animations for cards and abilities
export class SpecialAttackAnimations {
    
    // Joker card special attack: glowing card + slash effect on targets
    static jokerSlashAttack(scene, cardSprite, targets, card) {
        return new Promise((resolve) => {
            if (!cardSprite || !scene) {
                resolve();
                return;
            }

            // Phase 1: Elegant card activation animation
            
            // Multiple layered glow rings
            const glowRings = [];
            for (let i = 0; i < 3; i++) {
                const ring = scene.add.graphics();
                ring.lineStyle(2 + i, 0xffd700, 0.8 - i * 0.2);
                ring.strokeCircle(cardSprite.x, cardSprite.y, 40 + i * 15);
                ring.setBlendMode(Phaser.BlendModes.ADD);
                glowRings.push(ring);
                
                // Animate rings expanding and fading
                scene.tweens.add({
                    targets: ring,
                    scaleX: 2 + i * 0.3,
                    scaleY: 2 + i * 0.3,
                    alpha: 0,
                    duration: 800 + i * 200,
                    ease: 'Power2',
                    delay: i * 100,
                    onComplete: () => ring.destroy()
                });
            }
            
            // Elegant card elevation with rotation
            const originalRotation = cardSprite.rotation;
            scene.tweens.add({
                targets: cardSprite,
                scaleX: 1.15,
                scaleY: 1.15,
                rotation: originalRotation + 0.05,
                y: cardSprite.y - 10,
                duration: 300,
                ease: 'Back.out'
            });
            
            // Return card to original position
            scene.tweens.add({
                targets: cardSprite,
                scaleX: 1.0,
                scaleY: 1.0,
                rotation: originalRotation,
                y: cardSprite.y,
                duration: 300,
                ease: 'Power2',
                delay: 300
            });

            // Swirling golden energy particles
            const energyParticles = [];
            for (let i = 0; i < 12; i++) {
                const particle = scene.add.graphics();
                particle.fillStyle(0xffd700, 0.9);
                particle.fillCircle(0, 0, 2 + Math.random() * 2);
                
                const angle = (i / 12) * Math.PI * 2;
                const radius = 80;
                particle.x = cardSprite.x + Math.cos(angle) * radius;
                particle.y = cardSprite.y + Math.sin(angle) * radius;
                particle.setBlendMode(Phaser.BlendModes.ADD);
                energyParticles.push(particle);

                // Spiral inward motion
                scene.tweens.add({
                    targets: particle,
                    x: cardSprite.x,
                    y: cardSprite.y,
                    alpha: 0,
                    scale: 2,
                    duration: 600,
                    ease: 'Power2',
                    delay: i * 30
                });
            }
            
            // Shimmering light rays
            for (let i = 0; i < 6; i++) {
                const ray = scene.add.graphics();
                ray.lineStyle(1, 0xffffff, 0.8);
                
                const angle = (i / 6) * Math.PI * 2;
                const rayLength = 60;
                const startX = cardSprite.x + Math.cos(angle) * 20;
                const startY = cardSprite.y + Math.sin(angle) * 20;
                const endX = cardSprite.x + Math.cos(angle) * rayLength;
                const endY = cardSprite.y + Math.sin(angle) * rayLength;
                
                ray.moveTo(startX, startY);
                ray.lineTo(endX, endY);
                ray.setBlendMode(Phaser.BlendModes.ADD);
                ray.setAlpha(0);
                
                // Rays fade in and out
                scene.tweens.add({
                    targets: ray,
                    alpha: 1,
                    duration: 200,
                    ease: 'Power2',
                    delay: 200 + i * 50,
                    yoyo: true,
                    onComplete: () => ray.destroy()
                });
            }

            // Phase 2: Create slash effects on all targets (after 300ms)
            scene.time.delayedCall(300, () => {
                const effectPromises = [];
                
                // If targets is an array, apply effects to all
                if (Array.isArray(targets)) {
                    targets.forEach((target, index) => {
                        if (target && target.sprite) {
                            // Stagger effects slightly for visual appeal
                            const delay = index * 50;
                            const promise = new Promise((slashResolve) => {
                                scene.time.delayedCall(delay, () => {
                                    SpecialAttackAnimations.createSlashEffect(scene, target, slashResolve);
                                });
                            });
                            effectPromises.push(promise);
                        }
                    });
                } else if (targets && targets.sprite) {
                    // Single target
                    const promise = new Promise((slashResolve) => {
                        SpecialAttackAnimations.createSlashEffect(scene, targets, slashResolve);
                    });
                    effectPromises.push(promise);
                }

                // Wait for all slash effects to complete
                Promise.all(effectPromises).then(() => {
                    // Cleanup energy particles
                    energyParticles.forEach(particle => {
                        if (particle.active) particle.destroy();
                    });
                    resolve();
                });
            });
        });
    }

    // Reusable slash effect for any enemy
    static createSlashEffect(scene, targetEnemy, onComplete) {
        if (!targetEnemy.sprite) {
            if (onComplete) onComplete();
            return;
        }

        const enemySprite = targetEnemy.sprite;
        
        // Create multiple slash marks for a cutting effect
        const slashMarks = [];
        const slashAngles = [-45, 0, 45]; // Multiple slashes at different angles (made more diagonal)
        
        slashAngles.forEach((angle, index) => {
            const slash = scene.add.graphics();
            slash.setDepth(1000); // Above everything else
            
            const angleRad = (angle * Math.PI) / 180;
            const slashLength = 120; // Made longer
            const startX = enemySprite.x - Math.cos(angleRad) * (slashLength / 2);
            const startY = enemySprite.y - Math.sin(angleRad) * (slashLength / 2);
            const endX = enemySprite.x + Math.cos(angleRad) * (slashLength / 2);
            const endY = enemySprite.y + Math.sin(angleRad) * (slashLength / 2);
            
            slashMarks.push({ slash, startX, startY, endX, endY, angleRad });
        });
        
        // Animate slash marks appearing sequentially
        let slashIndex = 0;
        const drawNextSlash = () => {
            if (slashIndex >= slashMarks.length) {
                // All slashes drawn, start cleanup
                scene.time.delayedCall(200, () => {
                    slashMarks.forEach(mark => {
                        if (mark.slash.active) mark.slash.destroy();
                    });
                    if (onComplete) onComplete();
                });
                return;
            }
            
            const mark = slashMarks[slashIndex];
            let progress = 0;
            
            // Draw this slash with animated progress
            const slashTween = scene.tweens.add({
                targets: { progress: 0 },
                progress: 1,
                duration: 80, // Fast slash
                ease: 'Power3',
                onUpdate: (tween) => {
                    const p = tween.getValue();
                    mark.slash.clear();
                    
                    // Varying line width for cutting effect - thicker and more visible
                    const width = 6 + Math.sin(p * Math.PI) * 4;
                    mark.slash.lineStyle(width, 0xffffff, 1.0); // Full opacity
                    
                    // Add glow effect
                    mark.slash.lineStyle(width + 4, 0xffeb3b, 0.3); // Yellow glow underneath
                    mark.slash.moveTo(mark.startX, mark.startY);
                    const currentX = mark.startX + (mark.endX - mark.startX) * p;
                    const currentY = mark.startY + (mark.endY - mark.startY) * p;
                    mark.slash.lineTo(currentX, currentY);
                    
                    // Draw the main white slash on top
                    mark.slash.lineStyle(width, 0xffffff, 1.0);
                    mark.slash.moveTo(mark.startX, mark.startY);
                    mark.slash.lineTo(currentX, currentY);
                },
                onComplete: () => {
                    // Fade out this slash
                    scene.tweens.add({
                        targets: mark.slash,
                        alpha: 0,
                        duration: 300,
                        ease: 'Power2'
                    });
                    
                    // Draw next slash after short delay
                    scene.time.delayedCall(40, drawNextSlash);
                }
            });
            
            slashIndex++;
        };
        
        // Start the slash animation
        drawNextSlash();

        // Subtle enemy shake effect only
        const originalX = enemySprite.x;
        const originalY = enemySprite.y;
        scene.tweens.add({
            targets: enemySprite,
            x: originalX + (Math.random() - 0.5) * 8,
            y: originalY + (Math.random() - 0.5) * 8,
            duration: 50,
            repeat: 3,
            yoyo: true,
            ease: 'Power1',
            onComplete: () => {
                enemySprite.x = originalX;
                enemySprite.y = originalY;
            }
        });
        
        // No screen shake here - it will be handled when damage is applied

        // Cutting spark particles (fewer, more focused)
        const sparkCount = 6;
        for (let i = 0; i < sparkCount; i++) {
            const spark = scene.add.graphics();
            spark.fillStyle(0xffeb3b, 1); // Bright yellow sparks
            spark.fillCircle(0, 0, 2);
            spark.x = enemySprite.x + (Math.random() - 0.5) * 30;
            spark.y = enemySprite.y + (Math.random() - 0.5) * 30;
            spark.setDepth(110);

            // Sparks fly in random directions but not too far
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 40;
            
            scene.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle) * speed,
                y: spark.y + Math.sin(angle) * speed,
                alpha: 0,
                scale: 0.3,
                duration: 300,
                ease: 'Power2',
                onComplete: () => {
                    if (spark.active) spark.destroy();
                }
            });
        }
    }

    // Lightning strike effect (example for other special attacks)
    static lightningStrike(scene, cardSprite, targets, card) {
        return new Promise((resolve) => {
            if (!cardSprite || !scene) {
                resolve();
                return;
            }

            // Card electric buildup
            const electricGlow = scene.add.graphics();
            electricGlow.fillStyle(0x00ffff, 0.6);
            electricGlow.fillCircle(cardSprite.x, cardSprite.y, 50);
            electricGlow.setBlendMode(Phaser.BlendModes.ADD);

            // Lightning bolts to targets
            scene.time.delayedCall(200, () => {
                const lightningPromises = [];
                
                // Handle multiple targets
                if (Array.isArray(targets)) {
                    targets.forEach((target, index) => {
                        if (target && target.sprite) {
                            const delay = index * 100; // Stagger lightning strikes
                            const promise = new Promise((lightningResolve) => {
                                scene.time.delayedCall(delay, () => {
                                    SpecialAttackAnimations.createLightningBolt(scene, cardSprite, target.sprite, lightningResolve);
                                });
                            });
                            lightningPromises.push(promise);
                        }
                    });
                } else if (targets && targets.sprite) {
                    // Single target
                    const promise = new Promise((lightningResolve) => {
                        SpecialAttackAnimations.createLightningBolt(scene, cardSprite, targets.sprite, lightningResolve);
                    });
                    lightningPromises.push(promise);
                }

                Promise.all(lightningPromises).then(() => {
                    electricGlow.destroy();
                    resolve();
                });
            });
        });
    }

    // Helper method for lightning effect
    static createLightningBolt(scene, startSprite, endSprite, onComplete) {
        const lightning = scene.add.graphics();
        lightning.lineStyle(4, 0x00ffff, 1);
        lightning.setBlendMode(Phaser.BlendModes.ADD);

        // Jagged lightning path
        const segments = 8;
        const points = [];
        points.push({ x: startSprite.x, y: startSprite.y });
        
        for (let i = 1; i < segments; i++) {
            const progress = i / segments;
            const x = startSprite.x + (endSprite.x - startSprite.x) * progress + (Math.random() - 0.5) * 40;
            const y = startSprite.y + (endSprite.y - startSprite.y) * progress + (Math.random() - 0.5) * 40;
            points.push({ x, y });
        }
        points.push({ x: endSprite.x, y: endSprite.y });

        // Draw lightning
        lightning.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            lightning.lineTo(points[i].x, points[i].y);
        }

        // Fade out lightning
        scene.tweens.add({
            targets: lightning,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                lightning.destroy();
                if (onComplete) onComplete();
            }
        });

        // Enemy electric effect
        const electricEffect = scene.add.graphics();
        electricEffect.fillStyle(0x00ffff, 0.4);
        electricEffect.fillCircle(endSprite.x, endSprite.y, 80);
        electricEffect.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
            targets: electricEffect,
            alpha: 0,
            scale: 1.5,
            duration: 400,
            ease: 'Power2',
            onComplete: () => {
                electricEffect.destroy();
            }
        });
    }

    // Fire blast effect (another example)
    static fireBlast(scene, cardSprite, targets, card) {
        return new Promise((resolve) => {
            if (!cardSprite || !scene) {
                resolve();
                return;
            }

            // Card fire buildup
            const fireGlow = scene.add.graphics();
            fireGlow.fillStyle(0xff4500, 0.7);
            fireGlow.fillCircle(cardSprite.x, cardSprite.y, 55);
            fireGlow.setBlendMode(Phaser.BlendModes.ADD);

            // Fire particles from card
            const fireParticles = [];
            for (let i = 0; i < 15; i++) {
                const fire = scene.add.graphics();
                fire.fillStyle(0xff6600, 0.8);
                fire.fillCircle(0, 0, 3 + Math.random() * 3);
                fire.x = cardSprite.x + (Math.random() - 0.5) * 60;
                fire.y = cardSprite.y + (Math.random() - 0.5) * 60;
                fireParticles.push(fire);

                scene.tweens.add({
                    targets: fire,
                    y: fire.y - 50 - Math.random() * 30,
                    alpha: 0,
                    duration: 600,
                    ease: 'Power2'
                });
            }

            // Explosions at targets after delay
            scene.time.delayedCall(300, () => {
                const explosionPromises = [];
                
                // Handle multiple targets
                if (Array.isArray(targets)) {
                    targets.forEach((target, index) => {
                        if (target && target.sprite) {
                            const delay = index * 75; // Stagger explosions
                            const promise = new Promise((explosionResolve) => {
                                scene.time.delayedCall(delay, () => {
                                    SpecialAttackAnimations.createFireExplosion(scene, target.sprite, explosionResolve);
                                });
                            });
                            explosionPromises.push(promise);
                        }
                    });
                } else if (targets && targets.sprite) {
                    // Single target
                    const promise = new Promise((explosionResolve) => {
                        SpecialAttackAnimations.createFireExplosion(scene, targets.sprite, explosionResolve);
                    });
                    explosionPromises.push(promise);
                }

                Promise.all(explosionPromises).then(() => {
                    fireGlow.destroy();
                    fireParticles.forEach(fire => {
                        if (fire.active) fire.destroy();
                    });
                    resolve();
                });
            });
        });
    }

    // Helper method for fire explosion
    static createFireExplosion(scene, targetSprite, onComplete) {
        const explosion = scene.add.graphics();
        explosion.fillStyle(0xff4500, 0.8);
        explosion.fillCircle(targetSprite.x, targetSprite.y, 20);
        explosion.setBlendMode(Phaser.BlendModes.ADD);

        scene.tweens.add({
            targets: explosion,
            scaleX: 4,
            scaleY: 4,
            alpha: 0,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
                if (onComplete) onComplete();
            }
        });

        // Fire particles
        for (let i = 0; i < 20; i++) {
            const particle = scene.add.graphics();
            particle.fillStyle(0xff6600, 1);
            particle.fillCircle(0, 0, 2 + Math.random() * 4);
            particle.x = targetSprite.x;
            particle.y = targetSprite.y;

            const angle = Math.random() * Math.PI * 2;
            const speed = 80 + Math.random() * 120;
            
            scene.tweens.add({
                targets: particle,
                x: particle.x + Math.cos(angle) * speed,
                y: particle.y + Math.sin(angle) * speed,
                alpha: 0,
                duration: 400 + Math.random() * 200,
                ease: 'Power2',
                onComplete: () => {
                    if (particle.active) particle.destroy();
                }
            });
        }
    }
}