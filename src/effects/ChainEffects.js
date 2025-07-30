// Chain effect system for cards with chain trait
export class ChainEffects {
    
    // Create simple chain attack sequence with cumulative damage
    static async executeChainAttack(scene, chainCard, allHands, totalDamage, targetEnemy) {
        console.log(`Executing chain attack with ${allHands.length} hands for ${totalDamage} total damage`);
        
        // Make the existing chain text grow when attack activates
        this.growChainSelectionText(scene, chainCard);
        
        // Apply damage for each hand in sequence with visual feedback
        for (let i = 0; i < allHands.length; i++) {
            const hand = allHands[i];
            const handDamage = hand.damage;
            const isLastHit = (i === allHands.length - 1);
            
            // Delay between each chain link (longer pause before final hit)
            const delay = isLastHit ? 700 : 450; // Extra pause before finale
            await new Promise(resolve => setTimeout(resolve, delay));
            
            // Show hand name briefly
            this.showHandLabel(scene, hand.handName, i + 1, allHands.length);
            
            // Apply damage with escalating enemy effects
            this.applyChainDamage(scene, targetEnemy, handDamage, i + 1, allHands.length, isLastHit, totalDamage);
            
            // Wait for shake animation to complete (medium)
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        return {
            effects: [],
            cleanup: () => {
                // No cleanup needed since we removed the redundant effect
            }
        };
    }
    
    // Create simple "CHAIN" text above the card when selected
    static createChainTextEffect(scene, chainCard) {
        // Get chain card position
        const cardContainer = scene.cardContainers ? scene.cardContainers.find(container => 
            container && container.chainCard === chainCard
        ) : null;
        
        if (!cardContainer) return null;
        
        const worldTransform = cardContainer.getWorldTransformMatrix();
        const cardX = worldTransform.tx;
        const cardY = worldTransform.ty;
        
        // Create stylized "CHAIN" text above the card
        const chainText = scene.add.text(
            cardX,
            cardY - 100,
            'CHAIN',
            {
                fontSize: '42px',
                color: '#ff6600',
                fontFamily: 'Arial',
                fontStyle: 'bold italic',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        chainText.setOrigin(0.5);
        chainText.setDepth(10000);
        chainText.setRotation(-0.2); // Slight slant
        chainText.setAlpha(0);
        
        // Animate in
        scene.tweens.add({
            targets: chainText,
            alpha: 1,
            y: cardY - 120,
            scaleX: { from: 0.5, to: 1.2 },
            scaleY: { from: 0.5, to: 1.2 },
            duration: 300,
            ease: 'Back.out'
        });
        
        // Hold briefly then fade out
        scene.time.delayedCall(1500, () => {
            scene.tweens.add({
                targets: chainText,
                alpha: 0,
                y: cardY - 140,
                duration: 400,
                ease: 'Power2',
                onComplete: () => {
                    if (chainText.active) chainText.destroy();
                }
            });
        });
        
        return {
            element: chainText,
            cleanup: () => {
                if (chainText && chainText.active) chainText.destroy();
            }
        };
    }
    
    // Show hand name for each chain link
    static showHandLabel(scene, handName, linkNumber, totalLinks) {
        const screenWidth = scene.cameras.main.width;
        const screenHeight = scene.cameras.main.height;
        
        const linkText = scene.add.text(
            screenWidth / 2,
            screenHeight / 2 - 80,
            `${linkNumber}/${totalLinks}: ${handName}`,
            {
                fontSize: '36px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3,
                align: 'center'
            }
        );
        linkText.setOrigin(0.5);
        linkText.setDepth(10002);
        linkText.setAlpha(0);
        
        // Quick flash in and out
        scene.tweens.add({
            targets: linkText,
            alpha: 1,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                scene.time.delayedCall(300, () => {
                    scene.tweens.add({
                        targets: linkText,
                        alpha: 0,
                        duration: 200,
                        ease: 'Power2',
                        onComplete: () => {
                            if (linkText.active) linkText.destroy();
                        }
                    });
                });
            }
        });
    }
    
    // Apply damage with escalating enemy effects
    static applyChainDamage(scene, targetEnemy, damage, linkNumber, totalLinks, isLastHit = false, totalDamage = 0) {
        if (!targetEnemy || !targetEnemy.sprite) return;
        
        // Apply actual damage to enemy's health bar
        targetEnemy.takeDamage(damage, { 
            isChainAttack: true, 
            chainLink: linkNumber,
            skipShake: true // We'll handle shake manually
        });
        
        // Calculate escalating intensity based on chain progress
        const progress = linkNumber / totalLinks;
        const baseShakeIntensity = 6;
        const shakeIntensity = baseShakeIntensity + (progress * 10); // 6 to 16 intensity
        const shakeDuration = 40 + (progress * 20); // 40 to 60ms duration
        const shakeRepeats = Math.floor(2 + (progress * 3)); // 2 to 5 repeats
        
        // Enemy shake effect with escalating intensity
        const originalX = targetEnemy.sprite.x;
        const originalY = targetEnemy.sprite.y;
        
        scene.tweens.add({
            targets: targetEnemy.sprite,
            x: originalX + shakeIntensity,
            y: originalY + (shakeIntensity * 0.3), // Slight vertical shake
            duration: shakeDuration,
            yoyo: true,
            repeat: shakeRepeats,
            ease: 'Power2',
            onComplete: () => {
                targetEnemy.sprite.x = originalX;
                targetEnemy.sprite.y = originalY;
            }
        });
        
        // Create slash effect over the enemy
        this.createChainSlashEffect(scene, targetEnemy, progress);
        
        // Screen shake for dramatic effect (stronger for later hits)
        if (progress > 0.5) {
            const shakeIntensity = (progress - 0.5) * 0.008; // Slightly more noticeable
            const shakeDuration = 80 + (progress * 40); // 80 to 120ms
            
            scene.cameras.main.shake(shakeDuration, shakeIntensity);
        }
        
        // Show damage number with escalating size and color
        const damageColor = progress > 0.7 ? '#ff3333' : '#ff6600';
        const fontSize = 28 + (progress * 12); // 28 to 40px
        
        if (isLastHit) {
            // Show final chain total instead of individual damage
            this.showFinalChainDamage(scene, targetEnemy, totalDamage, totalLinks);
        } else {
            this.showDamageNumber(scene, targetEnemy, damage, damageColor, fontSize);
        }
    }
    
    // Show final chain damage total on the last hit
    static showFinalChainDamage(scene, targetEnemy, totalDamage, chainLength) {
        if (!targetEnemy || !targetEnemy.sprite) return;
        
        // Show final total damage in larger text
        const finalDamageText = scene.add.text(
            targetEnemy.sprite.x,
            targetEnemy.sprite.y - 60,
            `CHAIN: ${totalDamage}`,
            {
                fontSize: '48px',
                color: '#ffaa00',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        finalDamageText.setOrigin(0.5);
        finalDamageText.setDepth(10000);
        
        // Dramatic entrance and exit
        scene.tweens.add({
            targets: finalDamageText,
            y: finalDamageText.y - 100,
            scaleX: { from: 0.5, to: 1.5 },
            scaleY: { from: 0.5, to: 1.5 },
            alpha: { from: 1, to: 0 },
            duration: 1200,
            ease: 'Power2',
            onComplete: () => {
                if (finalDamageText.active) finalDamageText.destroy();
            }
        });
    }
    
    // Create slash effect for chain hits
    static createChainSlashEffect(scene, targetEnemy, progress) {
        if (!targetEnemy || !targetEnemy.sprite) return;
        
        // Calculate slash properties based on progress
        const slashIntensity = 0.7 + (progress * 0.3); // 0.7 to 1.0 alpha
        const slashColor = progress > 0.7 ? 0xff3333 : 0xff6600; // Red for final hits
        const slashWidth = 3 + (progress * 4); // 3 to 7px width
        
        // Position slash over enemy (smaller, centered)
        const enemyX = targetEnemy.sprite.x;
        const enemyY = targetEnemy.sprite.y;
        const baseLength = targetEnemy.sprite.displayWidth * 0.6; // Smaller base size
        
        // Animate slash length growing
        let currentLength = 0;
        const targetLength = baseLength + (progress * baseLength * 0.5); // Length grows with progress
        
        const slash = scene.add.graphics();
        slash.setDepth(targetEnemy.sprite.depth + 1);
        
        // Function to draw slash at current length
        const drawSlash = (length) => {
            slash.clear();
            
            // Main slash line
            slash.lineStyle(slashWidth, slashColor, slashIntensity);
            slash.beginPath();
            slash.moveTo(enemyX - length/2, enemyY - length/3);
            slash.lineTo(enemyX + length/2, enemyY + length/3);
            slash.strokePath();
            
            // Glow effect (thinner)
            slash.lineStyle(slashWidth * 1.5, slashColor, slashIntensity * 0.2);
            slash.beginPath();
            slash.moveTo(enemyX - length/2, enemyY - length/3);
            slash.lineTo(enemyX + length/2, enemyY + length/3);
            slash.strokePath();
        };
        
        // Animate slash growing
        scene.tweens.add({
            targets: { length: currentLength },
            length: targetLength,
            duration: 120,
            ease: 'Power2',
            onUpdate: (tween) => {
                const length = tween.targets[0].length;
                drawSlash(length);
            },
            onComplete: () => {
                // Fade out slash
                scene.tweens.add({
                    targets: slash,
                    alpha: 0,
                    duration: 200,
                    ease: 'Power2',
                    onComplete: () => {
                        if (slash.active) slash.destroy();
                    }
                });
            }
        });
    }
    
    // Make the existing chain selection text grow when attack activates
    static growChainSelectionText(scene, chainCard) {
        // Find the chain card container with existing chain text
        const cardContainer = scene.cardContainers ? scene.cardContainers.find(container => 
            container && container.chainCard === chainCard
        ) : null;
        
        if (!cardContainer || !cardContainer.chainTextEffect) return;
        
        const chainText = cardContainer.chainTextEffect.element;
        if (chainText && chainText.active) {
            // Animate the existing chain text to grow
            scene.tweens.add({
                targets: chainText,
                scaleX: { from: 1.0, to: 1.5 },
                scaleY: { from: 1.0, to: 1.5 },
                alpha: { from: 0.9, to: 1.0 },
                duration: 300,
                ease: 'Back.out',
                onComplete: () => {
                    // Hold for a moment then return to normal size
                    scene.time.delayedCall(500, () => {
                        if (chainText && chainText.active) {
                            scene.tweens.add({
                                targets: chainText,
                                scaleX: 1.0,
                                scaleY: 1.0,
                                alpha: 0.9,
                                duration: 200,
                                ease: 'Power2'
                            });
                        }
                    });
                }
            });
        }
    }
    
    // Show damage number with specified color and size
    static showDamageNumber(scene, targetEnemy, damage, color = '#ffffff', fontSize = 32) {
        if (!targetEnemy || !targetEnemy.sprite) return;
        
        const damageText = scene.add.text(
            targetEnemy.sprite.x + (Math.random() - 0.5) * 40,
            targetEnemy.sprite.y - 30,
            `${damage}`,
            {
                fontSize: `${fontSize}px`,
                color: color,
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: Math.max(2, Math.floor(fontSize / 16))
            }
        );
        damageText.setOrigin(0.5);
        damageText.setDepth(10000);
        
        // Float up and fade
        scene.tweens.add({
            targets: damageText,
            y: damageText.y - 60,
            alpha: { from: 1, to: 0 },
            scaleX: { from: 1, to: 1.3 },
            scaleY: { from: 1, to: 1.3 },
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                if (damageText.active) damageText.destroy();
            }
        });
    }
}