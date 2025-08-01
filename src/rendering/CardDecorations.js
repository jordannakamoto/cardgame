export class CardDecorations {
    static decorationThemes = {
        none: {
            enabled: false
        },
        magic: {
            enabled: true,
            ornaments: {
                corners: true,
                center: true,
                colorOverride: 0x9966ff // Purple color for ornaments
            },
            cornerOrnamentScale: 0.08,  // Percentage of card width
            centerCircleScale: 0.25,    // Percentage of min(width, height)
            centerCircleInnerScale: 0.7 // Scale of inner circle relative to outer
        },
        classic: {
            enabled: true,
            ornaments: {
                corners: true,
                center: false,
                colorOverride: 0x000000 // Black for classic look
            },
            cornerOrnamentScale: 0.06,
            centerCircleScale: 0,
            centerCircleInnerScale: 0
        },
        minimal: {
            enabled: false
        }
    };

    static currentTheme = 'magic'; // Default theme

    static setTheme(themeName) {
        if (this.decorationThemes[themeName]) {
            this.currentTheme = themeName;
        }
    }

    static getTheme() {
        return this.decorationThemes[this.currentTheme];
    }

    static addDecorations(graphics, width, height) {
        const theme = this.getTheme();
        if (!theme.enabled) return;

        const ornamentColor = theme.ornaments.colorOverride;
        
        if (theme.ornaments.corners) {
            this.addCornerOrnaments(graphics, width, height, ornamentColor, theme.cornerOrnamentScale);
        }
        
        if (theme.ornaments.center) {
            this.addCenterOrnament(graphics, width, height, ornamentColor, theme.centerCircleScale, theme.centerCircleInnerScale);
        }
    }

    static addCornerOrnaments(graphics, width, height, color, scale) {
        const ornamentSize = width * scale;
        graphics.lineStyle(2, color, 0.7);
        
        // Top-left corner ornament
        graphics.beginPath();
        graphics.arc(ornamentSize * 1.5, ornamentSize * 1.5, ornamentSize, Math.PI, Math.PI * 1.5);
        graphics.strokePath();
        
        // Top-right corner ornament
        graphics.beginPath();
        graphics.arc(width - ornamentSize * 1.5, ornamentSize * 1.5, ornamentSize, Math.PI * 1.5, Math.PI * 2);
        graphics.strokePath();
        
        // Bottom-left corner ornament
        graphics.beginPath();
        graphics.arc(ornamentSize * 1.5, height - ornamentSize * 1.5, ornamentSize, Math.PI * 0.5, Math.PI);
        graphics.strokePath();
        
        // Bottom-right corner ornament
        graphics.beginPath();
        graphics.arc(width - ornamentSize * 1.5, height - ornamentSize * 1.5, ornamentSize, 0, Math.PI * 0.5);
        graphics.strokePath();
    }

    static addCenterOrnament(graphics, width, height, color, scale, innerScale) {
        graphics.lineStyle(1, color, 0.4);
        const centerX = width * 0.5;
        const centerY = height * 0.5;
        const decorRadius = Math.min(width, height) * scale;
        
        // Central mystical circle
        graphics.strokeCircle(centerX, centerY, decorRadius);
        graphics.strokeCircle(centerX, centerY, decorRadius * innerScale);
    }

    // Configuration methods
    static configure(themeName, config) {
        if (this.decorationThemes[themeName]) {
            this.decorationThemes[themeName] = {
                ...this.decorationThemes[themeName],
                ...config
            };
        }
    }

    static createCustomTheme(name, config) {
        this.decorationThemes[name] = {
            enabled: true,
            ...config
        };
    }
}