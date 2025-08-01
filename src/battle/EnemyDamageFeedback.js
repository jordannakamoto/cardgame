export class EnemyDamageFeedback {
    constructor(scene) {
        this.scene = scene;
    }

    // Main method to apply all damage effects to an enemy
    applyDamageEffects(enemy, amount) {
        const damagePercent = amount / enemy.maxHealth;
        
        // Stop any existing idle animations during impact
        this.scene.tweens.killTweensOf(enemy.sprite);
        
        // Apply visual feedback based on damage amount
        this.applyVisualFeedback(enemy, damagePercent);
        
        // Apply impact animations based on damage percentage
        this.applyImpactAnimations(enemy, damagePercent);
    }

    // Visual feedback (red flash or metal chip)
    applyVisualFeedback(enemy, damagePercent) {
        if (damagePercent >= 0.1) {
            // Flash red for meaningful damage
            this.applyRedFlash(enemy);
        } else {
            // Create metal chip for disappointing damage
            this.createMetalChip(enemy);
            // Restart idle animation immediately for disappointing damage
            enemy.startIdleAnimation();
        }
    }

    // Red flash effect for meaningful damage
    applyRedFlash(enemy) {
        if (enemy.isImageSprite) {
            this.scene.tweens.add({
                targets: enemy.sprite,
                tint: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    enemy.sprite.clearTint();
                    // Don't restart idle animation here - let impact recovery handle it
                }
            });
        } else {
            // For rectangles, use fillColor
            const originalColor = enemy.sprite.fillColor;
            this.scene.tweens.add({
                targets: enemy.sprite,
                fillColor: 0xff0000,
                duration: 100,
                yoyo: true,
                onComplete: () => {
                    enemy.sprite.setFillStyle(originalColor);
                    // Don't restart idle animation here - let impact recovery handle it
                }
            });
        }
    }

    // Create metal chip effect for disappointing damage
    createMetalChip(enemy) {
        const side = Math.random() > 0.5 ? 1 : -1; // Random left or right shoulder
        
        // Position chip at shoulder/side area
        const chipX = enemy.x + (side * (40 + Math.random() * 20)); // 40-60px from center (shoulder area)
        const chipY = enemy.y - (30 + Math.random() * 40); // Upper body/shoulder height
        
        console.log('Creating metal chip at:', chipX, chipY, 'deflecting off', side > 0 ? 'right' : 'left', 'shoulder');
        
        // Create small metallic chip/spark
        const chip = this.scene.add.rectangle(chipX, chipY, 2, 4, 0xffffff, 1.0);
        chip.setDepth(15);
        chip.setRotation(Math.random() * Math.PI); // Random rotation
        
        // Glancing trajectory - deflects away from the shoulder hit
        const deflectX = chipX + (side * (35 + Math.random() * 20)); // Faster deflection
        const deflectY = chipY - (8 + Math.random() * 12); // More upward arc
        
        // Animate chip/spark flying off and fading
        this.scene.tweens.add({
            targets: chip,
            x: deflectX,
            y: deflectY,
            rotation: chip.rotation + (Math.random() - 0.5) * Math.PI * 2, // Spinning
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0,
            duration: 400,
            ease: 'Power2.easeOut',
            onComplete: () => {
                console.log('Metal chip animation complete');
                chip.destroy();
            }
        });
    }

    // Impact animations based on damage percentage
    applyImpactAnimations(enemy, damagePercent) {
        if (damagePercent >= 1.0) {
            this.applyBlastEffect(enemy);
        } else if (damagePercent >= 0.6) {
            this.applyBonkEffect(enemy);
        } else if (damagePercent >= 0.4) {
            this.applyHitEffect(enemy);
        } else if (damagePercent >= 0.2) {
            this.applyDinkEffect(enemy);
        } else if (damagePercent >= 0.1) {
            this.applyNickEffect(enemy);
        }
        // Disappointing damage (<10%): Just metal chip, no movement effects
    }

    // BLAST - Massive damage (100%+): Full knockback with random direction
    applyBlastEffect(enemy) {
        const randomAngle = (Math.random() - 0.5) * Math.PI * 0.6; // ±54 degrees from straight back
        const knockbackForce = 35;
        const knockbackX = Math.sin(randomAngle) * knockbackForce;
        const knockbackY = -Math.cos(randomAngle) * knockbackForce; // Negative = up/backward
        
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + knockbackX,
            y: enemy.y + knockbackY,
            duration: 120,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // Delay before starting recovery
                this.scene.time.delayedCall(200, () => {
                    // Very slowly return to original position
                    this.scene.tweens.add({
                        targets: enemy.sprite,
                        x: enemy.x,
                        y: enemy.y,
                        duration: 1200,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            enemy.startIdleAnimation();
                        }
                    });
                });
            }
        });
        
        // Add sprite shake during knockback for blast
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + knockbackX + (Math.random() - 0.5) * 3,
            y: enemy.y + knockbackY + (Math.random() - 0.5) * 3,
            duration: 40,
            repeat: 3,
            yoyo: true
        });
    }

    // BONK - Heavy damage (60-99%): Strong knockback with direction variation
    applyBonkEffect(enemy) {
        const randomAngle = (Math.random() - 0.5) * Math.PI * 0.5; // ±45 degrees
        const knockbackForce = 25;
        const knockbackX = Math.sin(randomAngle) * knockbackForce;
        const knockbackY = -Math.cos(randomAngle) * knockbackForce;
        
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + knockbackX,
            y: enemy.y + knockbackY,
            duration: 80,
            ease: 'Power2.easeOut',
            onComplete: () => {
                // Delay before starting recovery
                this.scene.time.delayedCall(150, () => {
                    // Slowly ease back to original position
                    this.scene.tweens.add({
                        targets: enemy.sprite,
                        x: enemy.x,
                        y: enemy.y,
                        duration: 600,
                        ease: 'Power2.easeOut',
                        onComplete: () => {
                            enemy.startIdleAnimation();
                        }
                    });
                });
            }
        });
        
        // Add sprite shake during knockback for bonk
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + knockbackX + (Math.random() - 0.5) * 2,
            y: enemy.y + knockbackY + (Math.random() - 0.5) * 2,
            duration: 35,
            repeat: 2,
            yoyo: true
        });
    }

    // HIT - Medium damage (40-59%): Strong shake
    applyHitEffect(enemy) {
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + (Math.random() - 0.5) * 8, // Random shake
            y: enemy.y + (Math.random() - 0.5) * 4, // Vertical shake
            duration: 30,
            repeat: 3,
            yoyo: true,
            onComplete: () => {
                enemy.sprite.x = enemy.x;
                enemy.sprite.y = enemy.y;
                enemy.startIdleAnimation();
            }
        });
    }

    // DINK - Light damage (20-39%): Medium shake
    applyDinkEffect(enemy) {
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + (Math.random() - 0.5) * 5, // Random shake
            y: enemy.y + (Math.random() - 0.5) * 2, // Light vertical shake
            duration: 25,
            repeat: 2,
            yoyo: true,
            onComplete: () => {
                enemy.sprite.x = enemy.x;
                enemy.sprite.y = enemy.y;
                enemy.startIdleAnimation();
            }
        });
    }

    // NICK - Very light damage (10-19%): Light shake
    applyNickEffect(enemy) {
        this.scene.tweens.add({
            targets: enemy.sprite,
            x: enemy.x + (Math.random() - 0.5) * 3, // Small shake
            duration: 20,
            repeat: 1,
            yoyo: true,
            onComplete: () => {
                enemy.sprite.x = enemy.x;
                enemy.startIdleAnimation();
            }
        });
    }
}