// Global UI configuration for responsive design
export const UIConfig = {
    // Hero portrait settings
    hero: {
        portraitWidth: 360,      // 240 * 1.5
        portraitHeight: 180,     // 150 * 1.5 reduced by 1/5th (225 -> 180)
        spacing: 390,            // 260 * 1.5
        glowThickness: 12,       // 8 * 1.5
        
        // Ability activation colors
        abilityColors: {
            damage: 0xff8800,      // Orange for damage abilities
            defensive: 0x888888,   // Grey for defensive abilities
            utility: 0x8888ff,     // Blue for utility abilities
            resource: 0xffdd00     // Gold for resource abilities
        },
        
        // Tooltip settings
        tooltip: {
            width: 720,          // Reduced from 900 for better fit
            height: 180,         // Even smaller for compact display
            fontSize: 28,        // 1/3 smaller than 42
            nameSize: 32,        // 1/3 smaller than 48
            minFontSize: 24,     // 1/3 smaller than 36
            maxFontSize: 35      // 1/3 smaller than 52
        },
        
        // Mana bar settings (now used for HP bar)
        manaBar: {
            height: 21,          // 14 * 1.5
            offset: 8            // 5 * 1.5 (rounded)
        }
    },
    
    // Card settings
    card: {
        width: 180,              // 120 * 1.5
        height: 252,             // 168 * 1.5
        spacing: 210             // 140 * 1.5
    },
    
    // Enemy settings
    enemy: {
        width: 240,              // 160 * 1.5
        height: 300,             // 200 * 1.5
        spacing: 270             // 180 * 1.5
    },
    
    // Responsive breakpoints
    breakpoints: {
        small: 1280,
        medium: 1920,
        large: 2560
    },
    
    // Get scaled values based on screen size
    getScaledValue: function(baseValue, factor = 1) {
        const width = (typeof window !== 'undefined' ? window.innerWidth : null) || 2560;
        const scale = Math.max(0.8, Math.min(2.0, width / 2560)); // Scale between 80% and 200%
        return Math.floor(baseValue * scale * factor);
    },
    
    // Get responsive font size with minimum
    getResponsiveFontSize: function(baseSize, minSize = 12) {
        const width = (typeof window !== 'undefined' ? window.innerWidth : null) || 2560;
        const scale = Math.max(0.8, Math.min(2.0, width / 2560));
        return Math.max(minSize, Math.floor(baseSize * scale));
    },
    
    // Debug configuration
    debug: {
        showVictoryScreen: false    // Set to false to disable victory screen
    },
    
    // UI Panel positioning
    panels: {
        position: 'left',  // 'left' or 'right' - side of screen for ability and mana panels
        ability: {
            offsetX: 160,  // Distance from edge of screen (increased for wider buttons)
            width: 280,    // Wider to match button width
            height: 400
        },
        mana: {
            offsetX: 150,  // Distance from edge of screen  
            offsetY: 200,  // Distance from bottom
            width: 400,
            height: 120
        },
        handPreview: {
            position: 'right',  // 'left' or 'right' - independent from ability/mana panels
            offsetX: 450,      // Closer to right edge (more to the right)
            offsetY: 350,      // Lower on screen (further down)
            width: 350,
            height: 80
        }
    }
};

// Update config based on screen size
export function updateUIConfig() {
    if (typeof window !== 'undefined') {
        const width = window.innerWidth || 2560;
        const scale = Math.max(0.8, Math.min(2.0, width / 2560));
        
        // Update tooltip font sizes based on screen size (1/3 smaller)
        UIConfig.hero.tooltip.fontSize = Math.max(24, Math.floor(28 * scale));
        UIConfig.hero.tooltip.nameSize = Math.max(28, Math.floor(32 * scale));
    }
}

// Initialize on load
if (typeof window !== 'undefined') {
    updateUIConfig();
    window.addEventListener('resize', updateUIConfig);
}