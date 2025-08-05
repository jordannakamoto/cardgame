/**
 * Simple SVG Icon Manager
 * Loads and creates Phaser textures from SVG files
 */
export class SVGIconManager {
    static loadedIcons = new Map();
    
    // Available icons with their file paths
    static ICONS = {
        TOKEN: 'assets/icons/token.svg',
        // Add more icons here as needed
    };
    
    /**
     * Load an SVG and create a Phaser texture from it
     * @param {Phaser.Scene} scene - The scene to load the texture in
     * @param {string} iconKey - Key from ICONS
     * @param {string} textureKey - Key to store the texture as
     * @param {object} options - Options for rendering
     * @returns {Promise<void>}
     */
    static async loadSVGAsTexture(scene, iconKey, textureKey, options = {}) {
        const {
            size = 64,
            color = '#ffffff'
        } = options;
        
        if (this.loadedIcons.has(textureKey)) {
            return; // Already loaded
        }
        
        const svgPath = this.ICONS[iconKey];
        if (!svgPath) {
            console.warn(`Icon not found: ${iconKey}`);
            return;
        }
        
        try {
            // Fetch the SVG
            const response = await fetch(svgPath);
            const svgText = await response.text();
            
            // Create a white on transparent version of the SVG
            let coloredSVG = svgText.replace(/fill="[^"]*"/g, `fill="${color}"`);
            // Remove any background/black fills and make transparent
            coloredSVG = coloredSVG.replace(/fill="#000000"/g, 'fill="transparent"');
            coloredSVG = coloredSVG.replace(/fill="black"/g, 'fill="transparent"');
            
            // Create SVG blob
            const svgBlob = new Blob([coloredSVG], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            // Create image and canvas to convert to texture
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = size;
            canvas.height = size;
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    ctx.clearRect(0, 0, size, size);
                    ctx.drawImage(img, 0, 0, size, size);
                    
                    // Create Phaser texture from canvas
                    scene.textures.addCanvas(textureKey, canvas);
                    this.loadedIcons.set(textureKey, true);
                    
                    URL.revokeObjectURL(url);
                    resolve();
                };
                img.onerror = reject;
                img.src = url;
            });
            
        } catch (error) {
            console.error(`Failed to load SVG icon ${iconKey}:`, error);
        }
    }
    
    /**
     * Create an icon sprite using a loaded texture
     * @param {Phaser.Scene} scene - The scene
     * @param {number} x - X position  
     * @param {number} y - Y position
     * @param {string} textureKey - The texture key
     * @param {object} options - Display options
     * @returns {Phaser.GameObjects.Image} The icon sprite
     */
    static createIcon(scene, x, y, textureKey, options = {}) {
        const {
            scale = 1,
            tint = null,
            alpha = 1
        } = options;
        
        const icon = scene.add.image(x, y, textureKey);
        icon.setScale(scale);
        icon.setAlpha(alpha);
        
        if (tint !== null) {
            icon.setTint(tint);
        }
        
        return icon;
    }
    
    /**
     * Preload common icons
     * @param {Phaser.Scene} scene - The scene to load in
     * @returns {Promise<void>}
     */
    static async preloadCommonIcons(scene) {
        const promises = [
            this.loadSVGAsTexture(scene, 'TOKEN', 'icon-token-white', { size: 32, color: '#ffffff' }),
            this.loadSVGAsTexture(scene, 'TOKEN', 'icon-token-large', { size: 48, color: '#ffffff' })
        ];
        
        await Promise.all(promises);
        console.log('Common icons loaded');
    }
    
    /**
     * Create a text with icon prefix
     * @param {Phaser.Scene} scene - The scene
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {string} iconKey - Icon texture key
     * @param {string} text - Text to display
     * @param {object} options - Style options
     * @returns {Phaser.GameObjects.Container} Container with icon and text
     */
    static createIconText(scene, x, y, iconKey, text, options = {}) {
        const {
            iconScale = 1,
            textStyle = { fontSize: '32px', color: '#ffffff', fontFamily: 'Arial' },
            spacing = 15
        } = options;
        
        const container = scene.add.container(x, y);
        
        // Create icon
        if (scene.textures.exists(iconKey)) {
            const icon = scene.add.image(-spacing/2, 0, iconKey);
            icon.setScale(iconScale);
            icon.setOrigin(1, 0.5);
            container.add(icon);
        }
        
        // Create text
        const textObj = scene.add.text(spacing/2, 0, text, textStyle);
        textObj.setOrigin(0, 0.5);
        container.add(textObj);
        
        return container;
    }
}

export default SVGIconManager;