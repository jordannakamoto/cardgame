import { UIConfig } from '../config/UIConfig.js';
import { PreviewThemes } from './PreviewThemes.js';

export default class HandPreviewPanel {
    constructor(scene) {
        this.scene = scene;
        this.container = null;
        this.panelBg = null;
        this.textDisplay = null;
        
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

        // Create panel using theme system
        this.container = PreviewThemes.createPanel(this.scene, xPos, yPos);
        console.log('HandPreviewPanel: Container created:', this.container);

        // Create text using theme system
        const theme = PreviewThemes.getTheme();
        console.log('HandPreviewPanel: Current theme:', theme);
        
        this.textDisplay = PreviewThemes.createText(
            this.scene,
            theme.panel.width / 2,
            theme.panel.height / 2,
            'TEST TEXT'
        );
        console.log('HandPreviewPanel: Text display created:', this.textDisplay);

        // Add text to container
        this.container.add(this.textDisplay);
        console.log('HandPreviewPanel: Text added to container');
    }
    
    updateText(text) {
        console.log('HandPreviewPanel: updateText called with:', text);
        if (this.textDisplay) {
            console.log('HandPreviewPanel: Updating text display');
            PreviewThemes.updateText(this.textDisplay, text);
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