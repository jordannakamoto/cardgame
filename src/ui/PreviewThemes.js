export class PreviewThemes {
    static themes = {
        minimal: {
            name: 'Minimal',
            panel: {
                width: 350,
                height: 80,
                background: {
                    color: 0x2a2a2a,
                    alpha: 0.9,
                    cornerRadius: 12
                },
                border: {
                    color: 0x555555,
                    alpha: 0.8,
                    thickness: 3,
                    innerGlow: {
                        color: 0x888888,
                        alpha: 0.4,
                        thickness: 1,
                        offset: 4
                    }
                }
            },
            text: {
                fontSize: '36px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                align: 'center',
                shadow: null
            }
        },
        
        classy: {
            name: 'Classy',
            panel: {
                width: 400,
                height: 120,
                background: {
                    color: 0x000000,
                    alpha: 0.0, // Transparent background
                    cornerRadius: 0
                },
                border: {
                    color: 0x000000,
                    alpha: 0.0, // No border
                    thickness: 0
                }
            },
            text: {
                fontSize: '84px', // Bigger for better readability
                handTypeFontSize: '64px', // Bigger for hand type too
                color: '#d4c4a8', // More noticeable off-white with beige tone
                fontFamily: 'Libre Caslon Display, serif', // Elegant, readable serif font
                fontStyle: 'normal', // Let the font's natural style show
                align: 'center',
                stroke: '#ffffff', // White outline for definition
                strokeThickness: 2, // Subtle outline
                uppercase: false, // Keep natural capitalization for elegance
                jitter: false, // No jitter - clean and refined
                comicStyle: false, // Use regular text rendering
                wordWrap: true,
                maxWidth: 450, // Wider to accommodate larger text
                baseRotation: 0, // No rotation - clean and straight
                containerRotation: 0, // No container rotation
                showDamageNumbers: false, // Clean hand type only
                animation: {
                    enabled: true,
                    entrance: 'elegantfade', // Custom elegant entrance
                    duration: 400,
                    delay: 0
                }
            }
        },
        
        persona5: {
            name: 'Persona 5',
            panel: {
                width: 420,
                height: 100,
                background: {
                    color: 0x000000,
                    alpha: 0.0, // Transparent background - no panel
                    cornerRadius: 0
                },
                border: {
                    color: 0x000000,
                    alpha: 0.0, // No border
                    thickness: 0
                }
            },
            text: {
                fontSize: '72px', // Large size for damage numbers
                handTypeFontSize: '48px', // Smaller size for hand type
                color: '#ffffff', // White text
                fontFamily: 'Bebas Neue, Impact, Arial Black, Arial', // Comic-style font
                fontStyle: 'bold italic', // Add italic for slanted look
                align: 'center',
                stroke: '#000000', // Thick black outline
                strokeThickness: 8, // Extra thick outline for comic book style
                uppercase: true, // Transform text to uppercase
                jitter: true, // Enable letter position jittering
                comicStyle: true, // Enable comic book styling
                wordWrap: true, // Enable word wrapping
                maxWidth: 300, // Maximum width before wrapping
                baseRotation: -0.15, // Base slant angle in radians (~-8.5 degrees)
                containerRotation: -0.12, // Rotate the entire text area (~-7 degrees)
                showDamageNumbers: false, // Show/hide damage numbers (just show hand type if false)
                animation: {
                    enabled: true, // Quick fade for hand type display
                    entrance: 'quickfade', // Quick fade-in for regular use
                    duration: 200, // Fast fade
                    delay: 0, // No stagger for quick display
                    // Saved for later use:
                    specialBounce: {
                        entrance: 'bounce',
                        duration: 600,
                        delay: 100 // For special moments like big wins!
                    }
                }
            }
        }
    };

    static currentTheme = 'classy'; // Default theme

    static setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            return true;
        }
        return false;
    }

    static getTheme() {
        return this.themes[this.currentTheme];
    }

    static getCurrentThemeName() {
        return this.currentTheme;
    }

    static toggleDamageNumbers(handPreviewPanel = null) {
        const theme = this.getTheme();
        if (theme.text) {
            theme.text.showDamageNumbers = !theme.text.showDamageNumbers;
            console.log('Damage numbers toggled:', theme.text.showDamageNumbers ? 'ON' : 'OFF');
            
            // Refresh the panel if provided
            if (handPreviewPanel && handPreviewPanel.refresh) {
                handPreviewPanel.refresh();
            }
            
            return theme.text.showDamageNumbers;
        }
        return false;
    }

    static setShowDamageNumbers(show, handPreviewPanel = null) {
        const theme = this.getTheme();
        if (theme.text) {
            theme.text.showDamageNumbers = show;
            console.log('Damage numbers set to:', show ? 'ON' : 'OFF');
            
            // Refresh the panel if provided
            if (handPreviewPanel && handPreviewPanel.refresh) {
                handPreviewPanel.refresh();
            }
        }
    }

    static createPanel(scene, x, y) {
        const theme = this.getTheme();
        const panelConfig = theme.panel;
        
        // Create panel container
        const container = scene.add.container(x, y);
        container.setScrollFactor(0);

        if (this.currentTheme === 'persona5') {
            this.createPersona5Panel(scene, container, panelConfig);
        } else {
            this.createMinimalPanel(scene, container, panelConfig);
        }

        return container;
    }

    static createMinimalPanel(scene, container, config) {
        const panelBg = scene.add.graphics();
        
        // Background
        panelBg.fillStyle(config.background.color, config.background.alpha);
        panelBg.fillRoundedRect(0, 0, config.width, config.height, config.background.cornerRadius);
        
        // Border
        panelBg.lineStyle(config.border.thickness, config.border.color, config.border.alpha);
        panelBg.strokeRoundedRect(0, 0, config.width, config.height, config.background.cornerRadius);

        // Inner glow
        if (config.border.innerGlow) {
            const glow = config.border.innerGlow;
            panelBg.lineStyle(glow.thickness, glow.color, glow.alpha);
            panelBg.strokeRoundedRect(
                glow.offset, glow.offset, 
                config.width - glow.offset * 2, 
                config.height - glow.offset * 2, 
                config.background.cornerRadius - 4
            );
        }

        container.add(panelBg);
        return panelBg;
    }

    static createPersona5Panel(scene, container, config) {
        // For Persona 5 theme, we don't add any background panel
        // The stylized text will be the only visual element
        // Just return null since no panel background is needed
        return null;
    }

    static addPersona5Decorations(scene, graphics, width, height) {
        // Add small decorative triangles in corners (P5 style)
        graphics.fillStyle(0xff0000, 0.8);
        
        // Top-right corner triangle
        graphics.beginPath();
        graphics.moveTo(width - 15, 0);
        graphics.lineTo(width, 0);
        graphics.lineTo(width, 15);
        graphics.closePath();
        graphics.fillPath();
        
        // Bottom-left corner accent
        graphics.fillStyle(0xffffff, 0.6);
        graphics.fillRect(0, height - 4, 30, 4);
    }

    static createText(scene, x, y, text) {
        const theme = this.getTheme();
        const textConfig = theme.text;
        
        console.log('PreviewThemes: Creating text with theme:', this.currentTheme);
        
        let displayText = text;
        if (textConfig.uppercase) {
            displayText = text.toUpperCase();
        }

        // Check if this is comic book style
        if (textConfig.comicStyle && textConfig.jitter) {
            return this.createComicText(scene, x, y, displayText, textConfig);
        }
        
        // For classy theme, use simple regular text rendering
        if (this.currentTheme === 'classy') {
            return this.createSimpleText(scene, x, y, displayText, textConfig);
        }

        // Regular text creation
        const textStyle = {
            fontSize: textConfig.fontSize,
            color: textConfig.color,
            fontFamily: textConfig.fontFamily,
            fontStyle: textConfig.fontStyle,
            align: textConfig.align
        };

        // Add word wrap if enabled
        if (textConfig.wordWrap && textConfig.maxWidth) {
            textStyle.wordWrap = { width: textConfig.maxWidth, useAdvancedWrap: true };
        }

        // Add stroke if defined
        if (textConfig.stroke) {
            textStyle.stroke = textConfig.stroke;
            textStyle.strokeThickness = textConfig.strokeThickness;
        }

        const textObject = scene.add.text(x, y, displayText, textStyle);
        textObject.setOrigin(0.5);
        textObject.setDepth(9999);
        
        return textObject;
    }

    static createComicText(scene, x, y, text, textConfig) {
        console.log('PreviewThemes: Creating comic book style text');
        
        // Create a container to hold all the jittered letters
        const textContainer = scene.add.container(x, y);
        textContainer.setDepth(9999);
        
        // Apply container rotation for overall tilt
        if (textConfig.containerRotation) {
            textContainer.setRotation(textConfig.containerRotation);
        }
        
        // Create a deterministic random seed based on hand type only (not damage)
        const handType = this.extractHandType(text);
        const textSeed = this.getTextSeed(handType);

        // Parse and format the text (remove colon, separate hand type and damage)
        const formattedLines = this.formatPreviewText(text, textConfig);

        const lineHeight = parseInt(textConfig.fontSize) * 1.2;
        const totalHeight = formattedLines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        formattedLines.forEach((lineData, lineIndex) => {
            const letters = lineData.text.split('');
            const currentFontSize = lineData.fontSize;
            const lineWidth = letters.length * (parseInt(currentFontSize) * 0.6);
            const startX = -(lineWidth / 2);
            const currentY = startY + (lineIndex * lineHeight);

            letters.forEach((letter, letterIndex) => {
                if (letter === ' ') return; // Skip spaces

                // Calculate base position
                const baseX = startX + (letterIndex * (parseInt(currentFontSize) * 0.6));
                
                // Create unique seed for this letter position
                const letterSeed = textSeed + lineIndex * 1000 + letterIndex;
                
                // Add jitter to position using seeded random
                const jitterX = (this.seededRandom(letterSeed) - 0.5) * 8; // Random offset -4 to +4
                const jitterY = (this.seededRandom(letterSeed + 1) - 0.5) * 6; // Random offset -3 to +3
                const jitterRotation = (this.seededRandom(letterSeed + 2) - 0.5) * 0.1; // Small rotation
                
                // Apply base slant plus jitter rotation
                const totalRotation = (textConfig.baseRotation || 0) + jitterRotation;

                // Create individual letter
                const letterText = scene.add.text(baseX + jitterX, currentY + jitterY, letter, {
                    fontSize: currentFontSize,
                    color: textConfig.color,
                    fontFamily: textConfig.fontFamily,
                    fontStyle: textConfig.fontStyle,
                    stroke: textConfig.stroke,
                    strokeThickness: textConfig.strokeThickness
                });
                
                letterText.setOrigin(0.5);
                letterText.setRotation(totalRotation);
                
                // Add slight random scale variation for more comic book feel
                const scaleVariation = 0.9 + (this.seededRandom(letterSeed + 3) * 0.2); // 0.9 to 1.1
                letterText.setScale(scaleVariation);

                textContainer.add(letterText);
                
                // Add entrance animation if enabled
                if (textConfig.animation && textConfig.animation.enabled) {
                    this.animateLetter(letterText, lineIndex, letterIndex, textConfig.animation, scene);
                }
            });
        });

        return textContainer;
    }

    static createSimpleText(scene, x, y, text, textConfig) {
        console.log('PreviewThemes: Creating simple classy text');
        
        // Parse and format the text 
        const formattedLines = this.formatPreviewText(text, textConfig);
        
        // Create a container for the text
        const textContainer = scene.add.container(x, y);
        textContainer.setDepth(9999);
        
        const lineHeight = parseInt(textConfig.handTypeFontSize || textConfig.fontSize) * 1.2;
        const totalHeight = formattedLines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        formattedLines.forEach((lineData, lineIndex) => {
            const currentY = startY + (lineIndex * lineHeight);
            
            // Create simple text object without letterSpacing or other problematic properties
            const lineText = scene.add.text(0, currentY, lineData.text, {
                fontSize: lineData.fontSize,
                color: textConfig.color,
                fontFamily: textConfig.fontFamily,
                fontStyle: textConfig.fontStyle,
                align: textConfig.align,
                stroke: textConfig.stroke,
                strokeThickness: textConfig.strokeThickness
                // No letterSpacing - use default
            });
            
            lineText.setOrigin(0.5);
            textContainer.add(lineText);
            
            // Simple fade-in animation for the whole text line
            if (textConfig.animation && textConfig.animation.enabled) {
                lineText.setAlpha(0);
                scene.tweens.add({
                    targets: lineText,
                    alpha: 1,
                    duration: textConfig.animation.duration,
                    delay: lineIndex * 100, // Slight stagger between lines
                    ease: 'Sine.easeOut'
                });
            }
        });

        return textContainer;
    }

    static createClassyText(scene, x, y, text, textConfig) {
        console.log('PreviewThemes: Creating classy text');
        
        // Parse and format the text 
        const formattedLines = this.formatPreviewText(text, textConfig);
        
        // Create a container for the text
        const textContainer = scene.add.container(x, y);
        textContainer.setDepth(9999);
        
        const lineHeight = parseInt(textConfig.handTypeFontSize || textConfig.fontSize) * 1.2;
        const totalHeight = formattedLines.length * lineHeight;
        const startY = -(totalHeight / 2) + (lineHeight / 2);

        formattedLines.forEach((lineData, lineIndex) => {
            const currentY = startY + (lineIndex * lineHeight);
            
            // Create elegant text object - simple and clean
            const lineText = scene.add.text(0, currentY, lineData.text, {
                fontSize: lineData.fontSize,
                color: textConfig.color,
                fontFamily: textConfig.fontFamily,
                fontStyle: textConfig.fontStyle,
                align: textConfig.align,
                stroke: textConfig.stroke,
                strokeThickness: textConfig.strokeThickness,
                letterSpacing: textConfig.letterSpacing || '0px'
            });
            
            lineText.setOrigin(0.5);
            textContainer.add(lineText);
            
            // Simple fade-in animation for the whole text line (no individual letters)
            if (textConfig.animation && textConfig.animation.enabled) {
                lineText.setAlpha(0);
                scene.tweens.add({
                    targets: lineText,
                    alpha: 1,
                    duration: textConfig.animation.duration,
                    delay: lineIndex * 100, // Slight stagger between lines
                    ease: 'Sine.easeOut'
                });
            }
        });

        return textContainer;
    }

    static updateText(textObject, text) {
        const theme = this.getTheme();
        let displayText = text;
        
        if (theme.text.uppercase) {
            displayText = text.toUpperCase();
        }
        
        // Check if this is a container (comic text) or regular text object
        if (textObject.type === 'Container') {
            // For comic text containers, we need to recreate the text
            // Store the original position
            const x = textObject.x;
            const y = textObject.y;
            const scene = textObject.scene;
            
            // Destroy the old container
            textObject.destroy();
            
            // Create new comic text
            const newTextObject = this.createComicText(scene, x, y, displayText, theme.text);
            return newTextObject;
        } else {
            // Regular text object
            textObject.setText(displayText);
            return textObject;
        }
    }

    // Simple seeded random number generator
    static seededRandom(seed) {
        const x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    // Generate a numeric seed from text content
    static getTextSeed(text) {
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            const char = text.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash);
    }

    // Extract just the hand type from preview text (e.g., "HIGH CARD : 11" -> "HIGH CARD")
    static extractHandType(text) {
        // Split on " : " and take the first part (the hand type)
        const parts = text.split(' : ');
        return parts[0] || text; // Fallback to full text if no " : " found
    }

    // Format preview text into lines with different font sizes
    static formatPreviewText(text, textConfig) {
        const parts = text.split(' : ');
        const lines = [];
        
        if (parts.length >= 2) {
            // Hand type on first line (smaller)
            lines.push({
                text: parts[0],
                fontSize: textConfig.handTypeFontSize || textConfig.fontSize
            });
            
            // Only add damage numbers if enabled
            if (textConfig.showDamageNumbers) {
                // Damage on second line (larger)
                lines.push({
                    text: parts[1],
                    fontSize: textConfig.fontSize
                });
            }
        } else {
            // Fallback: single line with regular font size
            lines.push({
                text: text,
                fontSize: textConfig.fontSize
            });
        }
        
        return lines;
    }

    // Animate individual letters with entrance effects
    static animateLetter(letterText, lineIndex, letterIndex, animConfig, scene) {
        const delay = (lineIndex * 500) + (letterIndex * animConfig.delay); // Stagger by line and letter
        const originalScale = letterText.scaleX;
        const originalAlpha = letterText.alpha;
        
        // Set initial state based on animation type
        switch (animConfig.entrance) {
            case 'elegantfade':
                letterText.setAlpha(0);
                letterText.setScale(originalScale * 0.95); // Slightly smaller start
                scene.tweens.add({
                    targets: letterText,
                    alpha: originalAlpha,
                    scaleX: originalScale,
                    scaleY: originalScale,
                    duration: animConfig.duration,
                    delay: delay,
                    ease: 'Sine.easeOut' // Smooth, elegant easing
                });
                break;
                
            case 'quickfade':
                letterText.setAlpha(0);
                scene.tweens.add({
                    targets: letterText,
                    alpha: originalAlpha,
                    duration: animConfig.duration,
                    delay: delay,
                    ease: 'Power1.easeOut'
                });
                break;
                
            case 'bounce':
                letterText.setScale(0);
                scene.tweens.add({
                    targets: letterText,
                    scaleX: originalScale,
                    scaleY: originalScale,
                    duration: animConfig.duration,
                    delay: delay,
                    ease: 'Back.easeOut',
                    yoyo: false
                });
                break;
                
            case 'fade':
                letterText.setAlpha(0);
                scene.tweens.add({
                    targets: letterText,
                    alpha: originalAlpha,
                    duration: animConfig.duration,
                    delay: delay,
                    ease: 'Power2.easeOut'
                });
                break;
                
            case 'scale':
                letterText.setScale(originalScale * 2);
                letterText.setAlpha(0);
                scene.tweens.add({
                    targets: letterText,
                    scaleX: originalScale,
                    scaleY: originalScale,
                    alpha: originalAlpha,
                    duration: animConfig.duration,
                    delay: delay,
                    ease: 'Elastic.easeOut'
                });
                break;
        }
    }
}