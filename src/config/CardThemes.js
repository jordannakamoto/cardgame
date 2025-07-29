// Card theming system
export const CardThemes = {
    classic: {
        name: 'Classic',
        background: {
            color: 0xffffff,
            gradient: false
        },
        border: {
            main: { color: 0x333333, thickness: 2 },
            inner: { color: 0xdddddd, thickness: 1, offset: 4 }
        },
        text: {
            hearts: '#cc0000',
            diamonds: '#cc0000', 
            clubs: '#000000',
            spades: '#000000'
        },
        cornerRadius: 8,
        decorations: false
    },
    
    magic: {
        name: 'Magic',
        background: {
            color: 0x1a1a2e,
            gradient: true,
            gradientColors: [0x16213e, 0x1a1a2e, 0x0f0f23]
        },
        border: {
            main: { color: 0x4a5568, thickness: 3 },
            inner: { color: 0x8b5cf6, thickness: 2, offset: 6 },
            glow: { color: 0x8b5cf6, thickness: 1, alpha: 0.5 }
        },
        text: {
            hearts: '#e53e3e',
            diamonds: '#ffd700',
            clubs: '#38b2ac',
            spades: '#805ad5'
        },
        cornerRadius: 12,
        decorations: true,
        ornaments: {
            corners: true,
            center: true,
            colorOverride: 0x4a5568
        }
    }
};

// Current active theme
let currentTheme = 'magic';

export function getCurrentTheme() {
    return CardThemes[currentTheme];
}

export function setCardTheme(themeName) {
    if (CardThemes[themeName]) {
        currentTheme = themeName;
        return true;
    }
    return false;
}

export function getAvailableThemes() {
    return Object.keys(CardThemes);
}