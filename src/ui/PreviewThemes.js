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
                fontSize: '56px', // Even bigger for impact
                color: '#ffffff',
                fontFamily: 'Impact, Arial Black, Arial', // Impact font for that angular look
                fontStyle: 'bold',
                align: 'center',
                shadow: {
                    offsetX: 3,
                    offsetY: 3, 
                    color: '#000000',
                    blur: 2,
                    stroke: '#000000', // Thick black outline like the image
                    strokeThickness: 6, // Much thicker outline
                    fill: true
                },
                uppercase: true, // Transform text to uppercase
                letterSpacing: '2px' // Slightly spaced out letters
            }
        }
    };

    static currentTheme = 'persona5'; // Default theme

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
        console.log('PreviewThemes: Text config:', textConfig);
        
        let displayText = text;
        if (textConfig.uppercase) {
            displayText = text.toUpperCase();
        }

        const textStyle = {
            fontSize: textConfig.fontSize,
            color: textConfig.color,
            fontFamily: textConfig.fontFamily,
            fontStyle: textConfig.fontStyle,
            align: textConfig.align
        };

        // Add letter spacing for Persona 5 theme
        if (textConfig.letterSpacing) {
            textStyle.letterSpacing = textConfig.letterSpacing;
        }

        // Add shadow/stroke effects
        if (textConfig.shadow) {
            const shadow = textConfig.shadow;
            textStyle.shadow = {
                offsetX: shadow.offsetX,
                offsetY: shadow.offsetY,
                color: shadow.color,
                blur: shadow.blur,
                fill: shadow.fill
            };
            
            if (shadow.stroke) {
                textStyle.stroke = shadow.stroke;
                textStyle.strokeThickness = shadow.strokeThickness;
            }
        }

        console.log('PreviewThemes: Final text style:', textStyle);
        const textObject = scene.add.text(x, y, displayText, textStyle);
        textObject.setOrigin(0.5);
        console.log('PreviewThemes: Created text object at:', x, y, 'with text:', displayText);
        
        return textObject;
    }

    static updateText(textObject, text) {
        const theme = this.getTheme();
        let displayText = text;
        
        if (theme.text.uppercase) {
            displayText = text.toUpperCase();
        }
        
        textObject.setText(displayText);
    }
}