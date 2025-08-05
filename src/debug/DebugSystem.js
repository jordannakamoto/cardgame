/**
 * Debug System - Centralized management of all debug tools and presentation mode
 */
export class DebugSystem {
    static instance = null;
    static debugElements = new Map();
    static isDebugMode = true; // Default to debug mode
    static isPresentationMode = false;
    
    static getInstance() {
        if (!this.instance) {
            this.instance = new DebugSystem();
        }
        return this.instance;
    }
    
    /**
     * Register a debug element that can be hidden in presentation mode
     */
    static registerDebugElement(id, element, options = {}) {
        const debugElement = {
            id,
            element,
            // Store current visibility state at registration
            originalVisible: element.visible !== false,
            wasVisibleBeforePresentation: element.visible !== false,
            category: options.category || 'general',
            description: options.description || id,
            toggleable: options.toggleable !== false
        };
        
        this.debugElements.set(id, debugElement);
        
        // Apply current mode
        this.updateElementVisibility(debugElement);
        
        console.log(`Debug element registered: ${id} (${debugElement.category})`);
    }
    
    /**
     * Unregister a debug element
     */
    static unregisterDebugElement(id) {
        if (this.debugElements.has(id)) {
            this.debugElements.delete(id);
            console.log(`Debug element unregistered: ${id}`);
        }
    }
    
    /**
     * Toggle between debug and presentation mode
     */
    static togglePresentationMode() {
        this.isPresentationMode = !this.isPresentationMode;
        this.isDebugMode = !this.isPresentationMode;
        
        console.log(`${this.isPresentationMode ? 'Entering' : 'Exiting'} presentation mode`);
        
        // Handle fullscreen
        if (this.isPresentationMode) {
            this.enterFullscreen();
        } else {
            this.exitFullscreen();
        }
        
        // Update all registered elements
        this.debugElements.forEach(debugElement => {
            // Store current visibility before changing modes
            if (debugElement.element.visible !== undefined) {
                debugElement.wasVisibleBeforePresentation = debugElement.element.visible;
            }
            this.updateElementVisibility(debugElement);
        });
        
        // Hide all sticky notes in presentation mode
        if (this.isPresentationMode) {
            this.hideAllStickyNotes();
        } else {
            this.showAllStickyNotes();
        }
        
        // Hide context menu if visible
        this.hideContextMenu();
        
        // Emit event for other systems to listen to
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('presentationModeChanged', {
                detail: { isPresentationMode: this.isPresentationMode }
            }));
        }
        
        return this.isPresentationMode;
    }
    
    /**
     * Set presentation mode directly
     */
    static setPresentationMode(enabled) {
        if (this.isPresentationMode !== enabled) {
            this.togglePresentationMode();
        }
    }
    
    /**
     * Update visibility of a debug element based on current mode
     */
    static updateElementVisibility(debugElement) {
        if (!debugElement.element || !debugElement.toggleable) return;
        
        const shouldShow = this.isDebugMode;
        
        // Handle different types of elements
        if (debugElement.element.setVisible && typeof debugElement.element.setVisible === 'function') {
            // Phaser objects
            if (this.isPresentationMode) {
                // In presentation mode, force hide
                debugElement.element.setVisible(false);
            } else {
                // In debug mode, restore to state before presentation mode
                debugElement.element.setVisible(debugElement.wasVisibleBeforePresentation);
            }
        } else if (debugElement.element.style) {
            // DOM elements
            debugElement.element.style.display = shouldShow ? 'flex' : 'none';
        } else if (debugElement.element.visible !== undefined) {
            // Objects with visible property
            if (this.isPresentationMode) {
                debugElement.element.visible = false;
            } else {
                debugElement.element.visible = debugElement.wasVisibleBeforePresentation;
            }
        }
    }
    
    /**
     * Get all debug elements by category
     */
    static getDebugElementsByCategory(category) {
        const elements = [];
        this.debugElements.forEach(debugElement => {
            if (debugElement.category === category) {
                elements.push(debugElement);
            }
        });
        return elements;
    }
    
    /**
     * Get current mode status
     */
    static getStatus() {
        return {
            isDebugMode: this.isDebugMode,
            isPresentationMode: this.isPresentationMode,
            registeredElements: this.debugElements.size,
            categories: [...new Set(Array.from(this.debugElements.values()).map(el => el.category))]
        };
    }
    
    /**
     * Create a keyboard shortcut to toggle presentation mode
     */
    static setupKeyboardShortcut(scene) {
        if (!scene || !scene.input || !scene.input.keyboard) return;
        
        // Use P key to toggle presentation mode
        const pKey = scene.input.keyboard.addKey('P');
        pKey.on('down', () => {
            this.togglePresentationMode();
            
            // Show a brief indicator
            if (scene.add && scene.add.text) {
                const indicator = scene.add.text(
                    scene.cameras.main.width / 2,
                    100,
                    this.isPresentationMode ? 'Presentation Mode ON (Fullscreen)' : 'Debug Mode ON',
                    {
                        fontSize: '32px',
                        color: this.isPresentationMode ? '#4CAF50' : '#FF9800',
                        fontFamily: 'Arial',
                        backgroundColor: '#000000',
                        padding: { x: 20, y: 10 }
                    }
                );
                indicator.setOrigin(0.5);
                indicator.setScrollFactor(0);
                indicator.setDepth(10000);
                
                // Fade out after 2 seconds
                scene.tweens.add({
                    targets: indicator,
                    alpha: 0,
                    duration: 2000,
                    ease: 'Power2.easeOut',
                    onComplete: () => indicator.destroy()
                });
            }
        });
        
        console.log('Debug System: Press P to toggle presentation mode');
    }
    
    /**
     * Create debug info panel
     */
    static createDebugInfoPanel(scene) {
        const panel = scene.add.container(20, 20);
        panel.setScrollFactor(0);
        panel.setDepth(9999);
        
        const bg = scene.add.rectangle(0, 0, 200, 120, 0x000000, 0.8);
        bg.setOrigin(0, 0);
        
        const title = scene.add.text(5, 5, 'Debug Info', {
            fontSize: '16px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontWeight: 'bold'
        });
        
        const modeText = scene.add.text(5, 25, '', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        const elementsText = scene.add.text(5, 45, '', {
            fontSize: '14px',
            color: '#ffffff',
            fontFamily: 'Arial'
        });
        
        const shortcutText = scene.add.text(5, 85, 'Press P: Toggle Mode (Fullscreen)', {
            fontSize: '12px',
            color: '#888888',
            fontFamily: 'Arial'
        });
        
        panel.add([bg, title, modeText, elementsText, shortcutText]);
        
        // Update panel info periodically
        const updateInfo = () => {
            const status = this.getStatus();
            modeText.setText(`Mode: ${status.isPresentationMode ? 'Presentation' : 'Debug'}`);
            elementsText.setText(`Elements: ${status.registeredElements}`);
        };
        
        updateInfo();
        scene.time.addEvent({
            delay: 1000,
            callback: updateInfo,
            loop: true
        });
        
        // Register the panel itself as a debug element
        this.registerDebugElement('debugInfoPanel', panel, {
            category: 'system',
            description: 'Debug information panel'
        });
        
        return panel;
    }
    
    /**
     * Enter fullscreen mode
     */
    static enterFullscreen() {
        const gameContainer = document.getElementById('game-container');
        if (gameContainer && gameContainer.requestFullscreen) {
            gameContainer.requestFullscreen().catch(err => {
                console.warn('Failed to enter fullscreen:', err);
            });
        } else if (gameContainer.webkitRequestFullscreen) {
            // Safari compatibility
            gameContainer.webkitRequestFullscreen();
        } else if (gameContainer.msRequestFullscreen) {
            // IE11 compatibility
            gameContainer.msRequestFullscreen();
        }
    }
    
    /**
     * Exit fullscreen mode
     */
    static exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(err => {
                console.warn('Failed to exit fullscreen:', err);
            });
        } else if (document.webkitExitFullscreen) {
            // Safari compatibility
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            // IE11 compatibility
            document.msExitFullscreen();
        }
    }
    
    /**
     * Hide all sticky notes
     */
    static hideAllStickyNotes() {
        if (window.StickyNoteManager && window.StickyNoteManager.StickyNote) {
            const StickyNote = window.StickyNoteManager.StickyNote;
            StickyNote.notes.forEach(note => {
                if (note.element) {
                    note.wasVisibleBeforePresentation = note.element.style.display !== 'none';
                    note.element.style.display = 'none';
                }
            });
        }
    }
    
    /**
     * Show all sticky notes that were visible before
     */
    static showAllStickyNotes() {
        if (window.StickyNoteManager && window.StickyNoteManager.StickyNote) {
            const StickyNote = window.StickyNoteManager.StickyNote;
            StickyNote.notes.forEach(note => {
                if (note.element && note.wasVisibleBeforePresentation !== false) {
                    note.element.style.display = 'flex';
                }
            });
        }
    }
    
    /**
     * Hide context menu if visible
     */
    static hideContextMenu() {
        const contextMenu = document.querySelector('.context-menu');
        if (contextMenu) {
            contextMenu.style.display = 'none';
        }
    }
    
    /**
     * Check if we're in fullscreen mode
     */
    static isFullscreen() {
        return document.fullscreenElement || 
               document.webkitFullscreenElement || 
               document.msFullscreenElement;
    }
    
    /**
     * Listen for fullscreen changes to sync with presentation mode
     */
    static setupFullscreenListeners() {
        const handleFullscreenChange = () => {
            // If we exited fullscreen while in presentation mode, exit presentation mode
            if (!this.isFullscreen() && this.isPresentationMode) {
                this.setPresentationMode(false);
                // Update the presentation button
                const presentationBtn = document.getElementById('presentation-mode');
                if (presentationBtn) {
                    presentationBtn.classList.remove('presentation');
                    presentationBtn.textContent = '🎥 Presentation Mode';
                }
            }
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('msfullscreenchange', handleFullscreenChange);
    }
}

// Set up fullscreen listeners when the module loads
DebugSystem.setupFullscreenListeners();

// Make DebugSystem globally available
if (typeof window !== 'undefined') {
    window.DebugSystem = DebugSystem;
}

export default DebugSystem;