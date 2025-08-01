import { UIConfig } from '../config/UIConfig.js';
import { PreviewThemes } from './PreviewThemes.js';

export default class HandPreviewPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.panelBg = null;
        this.textDisplay = null;
        this.lastText = ''; // Track previous text to avoid re-animating same content
        
        this.createPanel();
    }
    
    createPanel() {
        console.log('HandPreviewPanel: Creating panel...');
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;

        // Get panel configuration
        const handConfig = UIConfig.panels.handPreview;
        const isRightSide = handConfig.position === 'right';
        
        // Calculate X position based on side preference
        const xPos = isRightSide ? 
            screenWidth - handConfig.offsetX : 
            handConfig.offsetX;
        const yPos = screenHeight - handConfig.offsetY;

        console.log('HandPreviewPanel: Position calculated as:', xPos, yPos);
        console.log('HandPreviewPanel: Screen dimensions:', screenWidth, screenHeight);

        // Create panel using theme system
        this.container = PreviewThemes.createPanel(this.scene, xPos, yPos);
        console.log('HandPreviewPanel: Container created:', this.container);

        // Create text using theme system
        const theme = PreviewThemes.getTheme();
        this.textDisplay = PreviewThemes.createText(
            this.scene,
            theme.panel.width / 2,
            theme.panel.height / 2,
            ''
        );

        // Add text to container
        this.container.add(this.textDisplay);
    }
    
    updateText(text) {
        console.log('HandPreviewPanel: updateText called with:', text);
        
        // Check if text actually changed
        if (text === this.lastText) {
            console.log('HandPreviewPanel: Same text, skipping animation');
            return; // Don't update or animate if it's the same text
        }
        
        this.lastText = text; // Store the new text
        
        if (this.textDisplay) {
            console.log('HandPreviewPanel: Updating text display with animation');
            const newTextObject = PreviewThemes.updateText(this.textDisplay, text);
            
            // If a new text object was returned (for comic text), update our reference
            if (newTextObject !== this.textDisplay) {
                // Remove old text from container if it still exists
                if (this.container && this.textDisplay) {
                    this.container.remove(this.textDisplay);
                }
                
                // Update reference and add new text to container
                this.textDisplay = newTextObject;
                if (this.container) {
                    this.container.add(this.textDisplay);
                }
            }
        } else {
            console.log('HandPreviewPanel: No text display found!');
        }
    }
    
    setTheme(themeName) {
        if (PreviewThemes.setTheme(themeName)) {
            // Recreate the panel with new theme
            if (this.container) {
                this.container.destroy();
            }
            this.createPanel();
        }
    }
    
    refresh() {
        // Force refresh the panel (useful when theme settings change)
        if (this.container) {
            this.container.destroy();
        }
        this.lastText = ''; // Reset text tracking
        this.createPanel();
    }
    
    setVisible(visible) {
        if (this.container) {
            this.container.setVisible(visible);
        }
    }
    
    destroy() {
        if (this.container) {
            this.container.destroy();
            this.container = null;
            this.textDisplay = null;
        }
    }
}