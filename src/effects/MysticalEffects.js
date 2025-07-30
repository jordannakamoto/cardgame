// Mystical particle effects for special cards
export class MysticalEffects {
    
    // Create swirling mystical particles around the joker card when selected
    static createJokerSelectionEffect(scene, cardContainer) {
        const effects = {
            particles: [],
            tweens: [],
            cardContainer: cardContainer, // Store reference to card
            cleanup: () => {
                effects.particles.forEach(particle => {
                    if (particle.active) particle.destroy();
                });
                effects.tweens.forEach(tween => {
                    if (tween.isActive()) tween.destroy();
                });
                effects.particles = [];
                effects.tweens = [];
            }
        };
        
        // Get card's world position with debug logging
        // For containers, we need to get the world transform matrix
        const worldTransform = cardContainer.getWorldTransformMatrix();
        const cardWorldX = worldTransform.tx;
        const cardWorldY = worldTransform.ty;
        console.log('Creating joker selection effect at world coords:', cardWorldX, cardWorldY);
        console.log('Card container local coords:', cardContainer.x, cardContainer.y);
        console.log('Card container:', cardContainer);
        
        // Create 3D swirling particles that orbit above the card
        const particleCount = 20; // Back to original count
        const cardWidth = 180; // Approximate card width
        const cardHeight = 252; // Approximate card height
        
        for (let i = 0; i < particleCount; i++) {
            const particle = scene.add.graphics();
            particle.fillStyle(0x9d4edd, 1.0); // Purple mystical color, full opacity for visibility
            particle.fillCircle(0, 0, 2 + Math.random() * 2.5); // Slightly larger particles
            particle.setBlendMode(Phaser.BlendModes.ADD); // Back to additive blending
            particle.setDepth(10000); // Very high depth to be above everything
            
            // Initial 3D orbit parameters
            const baseAngle = (i / particleCount) * Math.PI * 2;
            const orbitRadius = Math.max(cardWidth, cardHeight) * (0.35 + Math.random() * 0.15); // Tighter, more controlled orbits
            const verticalOffset = -10 - Math.random() * 20; // Closer to card
            const orbitSpeed = 0.3 + Math.random() * 0.2; // Much slower, more elegant
            const verticalOscillation = 5 + Math.random() * 5; // Subtle up/down movement
            
            // Store orbit data on particle for animation
            particle.orbitData = {
                baseAngle: baseAngle,
                currentAngle: baseAngle,
                orbitRadius: orbitRadius,
                baseVerticalOffset: verticalOffset,
                orbitSpeed: orbitSpeed,
                verticalOscillation: verticalOscillation,
                verticalPhase: Math.random() * Math.PI * 2,
                cardWorldX: cardWorldX,
                cardWorldY: cardWorldY
            };
            
            // Initial position relative to card's world position
            particle.x = cardWorldX + Math.cos(baseAngle) * orbitRadius;
            particle.y = cardWorldY + Math.sin(baseAngle) * orbitRadius + verticalOffset;
            
            // Add to scene, not card container
            effects.particles.push(particle);
            
            // Create 3D orbital motion with perspective scaling
            const orbit3D = scene.tweens.add({
                targets: particle.orbitData,
                currentAngle: baseAngle + Math.PI * 2, // Just one full rotation
                verticalPhase: particle.orbitData.verticalPhase + Math.PI * 2,
                duration: 8000 + Math.random() * 4000, // Much slower, 8-12 seconds per rotation
                ease: 'Sine.easeInOut', // Smooth easing
                repeat: -1,
                onUpdate: () => {
                    const data = particle.orbitData;
                    
                    // Update card position in case it moved
                    const currentTransform = effects.cardContainer.getWorldTransformMatrix();
                    const currentCardX = currentTransform.tx;
                    const currentCardY = currentTransform.ty;
                    
                    // Calculate 3D position relative to current card position
                    const x = Math.cos(data.currentAngle) * data.orbitRadius;
                    const z = Math.sin(data.currentAngle) * data.orbitRadius * 0.3; // Depth component
                    const y = Math.sin(data.currentAngle) * data.orbitRadius + 
                             data.baseVerticalOffset + 
                             Math.sin(data.verticalPhase) * data.verticalOscillation;
                    
                    // Apply 3D perspective and position relative to card
                    const perspective = 1 + z * 0.001; // Slight perspective effect
                    particle.x = currentCardX + x * perspective;
                    particle.y = currentCardY + y * perspective;
                    
                    // Scale based on depth (closer = bigger)
                    const depthScale = 0.7 + (z + data.orbitRadius * 0.3) / (data.orbitRadius * 0.6) * 0.6;
                    particle.setScale(depthScale);
                    
                    // Alpha based on depth and vertical position
                    const depthAlpha = 0.4 + (z + data.orbitRadius * 0.3) / (data.orbitRadius * 0.6) * 0.5;
                    const heightAlpha = 0.8 - Math.abs(y - data.baseVerticalOffset) / 60 * 0.4;
                    particle.setAlpha(Math.max(0.2, depthAlpha * heightAlpha));
                }
            });
            effects.tweens.push(orbit3D);
        }
        
        // Add floating mystical orbs above the card
        for (let i = 0; i < 5; i++) { // Fewer orbs
            const orb = scene.add.graphics();
            orb.fillStyle(0xffd700, 0.6); // Golden orb, more visible
            orb.fillCircle(0, 0, 2 + Math.random() * 2); // Slightly larger orbs
            orb.setBlendMode(Phaser.BlendModes.ADD);
            orb.setDepth(9999); // Above card but below main particles
            
            // 3D floating position above card
            const angle = Math.random() * Math.PI * 2;
            const radius = (cardWidth * 0.2) + Math.random() * (cardWidth * 0.2); // Closer to card
            const height = -5 - Math.random() * 15; // Closer to card surface
            
            // Position relative to card's world position
            orb.x = cardWorldX + Math.cos(angle) * radius;
            orb.y = cardWorldY + Math.sin(angle) * radius + height;
            
            // Store initial position for animation updates
            orb.initialData = {
                angle: angle,
                radius: radius,
                height: height,
                targetAngle: angle + 1,
                targetRadius: radius * 1.2
            };
            
            effects.particles.push(orb);
            
            // 3D floating motion with gentle orbiting
            const float3D = scene.tweens.add({
                targets: orb.initialData,
                angle: orb.initialData.targetAngle,
                radius: orb.initialData.targetRadius,
                duration: 4000 + Math.random() * 2000, // Slower floating
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true,
                delay: Math.random() * 1200,
                onUpdate: () => {
                    // Update position relative to current card position
                    const currentTransform = effects.cardContainer.getWorldTransformMatrix();
                    const currentCardX = currentTransform.tx;
                    const currentCardY = currentTransform.ty;
                    
                    orb.x = currentCardX + Math.cos(orb.initialData.angle) * orb.initialData.radius;
                    orb.y = currentCardY + Math.sin(orb.initialData.angle) * orb.initialData.radius + orb.initialData.height + (Math.random() - 0.5) * 5;
                }
            });
            
            // Separate alpha and scale animation
            const orbPulse = scene.tweens.add({
                targets: orb,
                alpha: { from: 0.6, to: 0.3 }, // More visible alpha range
                scale: { from: 1, to: 0.8 }, // Less dramatic scaling
                duration: 3000 + Math.random() * 1500, // Slower pulsing
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true,
                delay: Math.random() * 1000
            });
            
            effects.tweens.push(float3D);
            effects.tweens.push(orbPulse);
        }
        
        // Add energy tendrils
        const tendrilCount = 6;
        for (let i = 0; i < tendrilCount; i++) {
            const tendril = scene.add.graphics();
            tendril.lineStyle(2, 0x7b2cbf, 0.7); // Purple energy
            tendril.setBlendMode(Phaser.BlendModes.ADD);
            tendril.setDepth(9998); // Above card
            
            // Store tendril data for dynamic positioning
            const startAngle = (i / tendrilCount) * Math.PI * 2;
            const controlOffset = (Math.random() - 0.5) * 40;
            tendril.tendrilData = {
                startAngle: startAngle,
                endAngle: startAngle + 0.5,
                controlOffset: controlOffset
            };
            
            // Function to redraw tendril relative to current card position
            const redrawTendril = () => {
                const currentTransform = effects.cardContainer.getWorldTransformMatrix();
                const currentCardX = currentTransform.tx;
                const currentCardY = currentTransform.ty;
                
                const startX = currentCardX + Math.cos(tendril.tendrilData.startAngle) * (cardWidth * 0.4);
                const startY = currentCardY + Math.sin(tendril.tendrilData.startAngle) * (cardHeight * 0.4);
                const endX = currentCardX + Math.cos(tendril.tendrilData.endAngle) * (cardWidth * 0.6);
                const endY = currentCardY + Math.sin(tendril.tendrilData.endAngle) * (cardHeight * 0.6);
                
                // Create curved path using multiple line segments
                const segments = 8;
                const controlX = (startX + endX) / 2 + tendril.tendrilData.controlOffset;
                const controlY = (startY + endY) / 2 + tendril.tendrilData.controlOffset;
                
                tendril.clear();
                tendril.lineStyle(2, 0x7b2cbf, 0.7);
                tendril.moveTo(startX, startY);
                for (let seg = 1; seg <= segments; seg++) {
                    const t = seg / segments;
                    const invT = 1 - t;
                    const x = invT * invT * startX + 2 * invT * t * controlX + t * t * endX;
                    const y = invT * invT * startY + 2 * invT * t * controlY + t * t * endY;
                    tendril.lineTo(x, y);
                }
            };
            
            // Initial draw
            redrawTendril();
            
            effects.particles.push(tendril);
            
            // Pulsing energy effect with position updates
            const pulse = scene.tweens.add({
                targets: tendril,
                alpha: { from: 0.7, to: 0.2 },
                scaleX: { from: 1, to: 1.2 },
                scaleY: { from: 1, to: 1.2 },
                duration: 800 + Math.random() * 400,
                ease: 'Sine.easeInOut',
                repeat: -1,
                yoyo: true,
                delay: i * 100,
                onUpdate: redrawTendril // Update position during animation
            });
            effects.tweens.push(pulse);
        }
        
        // Add central glow pulse with card mask
        const centralGlow = scene.add.graphics();
        centralGlow.setDepth(9997); // Above card but below other particles
        
        // Create a mask shape that matches the card
        const maskShape = scene.make.graphics();
        maskShape.fillStyle(0xffffff);
        maskShape.fillRoundedRect(
            cardWorldX - cardWidth/2, 
            cardWorldY - cardHeight/2, 
            cardWidth, 
            cardHeight, 
            8 // Corner radius to match card
        );
        
        // Create a geometry mask from the shape
        const mask = maskShape.createGeometryMask();
        centralGlow.setMask(mask);
        
        // Draw initial glow
        centralGlow.fillStyle(0x9d4edd, 0.15); // Much more subtle
        centralGlow.fillCircle(cardWorldX, cardWorldY, Math.max(cardWidth, cardHeight) * 0.5);
        centralGlow.setBlendMode(Phaser.BlendModes.ADD);
        
        effects.particles.push(centralGlow);
        effects.particles.push(maskShape); // Add to cleanup list
        
        const glowPulse = scene.tweens.add({
            targets: centralGlow,
            scaleX: { from: 0.9, to: 1.1 }, // More subtle scaling
            scaleY: { from: 0.9, to: 1.1 },
            alpha: { from: 0.15, to: 0.05 }, // Very subtle alpha changes
            duration: 3000, // Slower pulse
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true,
            onUpdate: () => {
                // Update position relative to current card position
                const currentTransform = effects.cardContainer.getWorldTransformMatrix();
                const currentCardX = currentTransform.tx;
                const currentCardY = currentTransform.ty;
                
                // Update mask position
                maskShape.clear();
                maskShape.fillStyle(0xffffff);
                maskShape.fillRoundedRect(
                    currentCardX - cardWidth/2, 
                    currentCardY - cardHeight/2, 
                    cardWidth, 
                    cardHeight, 
                    8
                );
                
                // Redraw glow
                centralGlow.clear();
                centralGlow.fillStyle(0x9d4edd, 0.15);
                centralGlow.fillCircle(currentCardX, currentCardY, Math.max(cardWidth, cardHeight) * 0.5);
            }
        });
        effects.tweens.push(glowPulse);
        
        return effects;
    }
    
    // Create a mystical aura effect that can be applied to any sprite
    static createMysticalAura(scene, sprite, color = 0x9d4edd) {
        const aura = scene.add.graphics();
        aura.fillStyle(color, 0.4);
        aura.fillCircle(sprite.x, sprite.y, sprite.displayWidth * 0.7);
        aura.setBlendMode(Phaser.BlendModes.ADD);
        aura.setDepth(sprite.depth - 1);
        
        const auraTween = scene.tweens.add({
            targets: aura,
            scaleX: 1.5,
            scaleY: 1.5,
            alpha: 0.1,
            duration: 1000,
            ease: 'Sine.easeInOut',
            repeat: -1,
            yoyo: true
        });
        
        return {
            aura: aura,
            tween: auraTween,
            cleanup: () => {
                if (auraTween.isActive()) auraTween.destroy();
                if (aura.active) aura.destroy();
            }
        };
    }
    
    // Mystical trail effect for moving particles
    static createMysticalTrail(scene, startX, startY, endX, endY, color = 0x7b2cbf) {
        const trailPoints = 10;
        const particles = [];
        
        for (let i = 0; i < trailPoints; i++) {
            const progress = i / (trailPoints - 1);
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            const particle = scene.add.graphics();
            particle.fillStyle(color, 0.8 - progress * 0.6);
            particle.fillCircle(x, y, 3 - progress * 2);
            particle.setBlendMode(Phaser.BlendModes.ADD);
            particles.push(particle);
            
            // Fade out particles over time
            scene.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0.2,
                duration: 500 + i * 50,
                ease: 'Power2',
                onComplete: () => {
                    if (particle.active) particle.destroy();
                }
            });
        }
        
        return particles;
    }
}