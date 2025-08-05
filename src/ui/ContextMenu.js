// Right-click context menu system for the entire app
export class ContextMenu {
    constructor() {
        this.menuElement = null;
        this.isVisible = false;
        this.menuItems = [];
        
        this.init();
    }
    
    init() {
        // Create context menu element
        this.menuElement = document.createElement('div');
        this.menuElement.className = 'context-menu';
        this.menuElement.style.cssText = `
            position: fixed;
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 6px;
            padding: 4px 0;
            z-index: 10000;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
            min-width: 180px;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 13px;
            color: #e0e0e0;
        `;
        
        document.body.appendChild(this.menuElement);
        
        // Register with debug system
        import('../debug/DebugSystem.js').then(module => {
            const DebugSystem = module.default;
            DebugSystem.registerDebugElement('contextMenu', this.menuElement, {
                category: 'ui',
                description: 'Right-click context menu'
            });
        });
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Register default menu items
        this.registerDefaultItems();
    }
    
    setupEventListeners() {
        // Prevent default context menu and show custom one
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.show(e.clientX, e.clientY);
        });
        
        // Hide menu on left click or escape
        document.addEventListener('click', (e) => {
            if (!this.menuElement.contains(e.target)) {
                this.hide();
            }
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
        
        // Hide menu when scrolling
        document.addEventListener('scroll', () => {
            this.hide();
        });
    }
    
    registerDefaultItems() {
        this.addMenuItem({
            label: 'Create Sticky Note',
            action: () => this.createStickyNote(),
            icon: '📝'
        });
        
        this.addMenuItem({
            label: 'Clear All Notes',
            action: () => this.clearAllNotes(),
            icon: '🗑️'
        });
        
        this.addMenuItem({ separator: true });
        
        this.addMenuItem({
            label: 'Toggle Debug Info',
            action: () => this.toggleDebugInfo(),
            icon: '🐛'
        });
        
        this.addMenuItem({
            label: 'Restart Battle',
            action: () => this.restartBattle(),
            icon: '🔄'
        });
        
        this.addMenuItem({
            label: 'Return to Menu',
            action: () => this.returnToMenu(),
            icon: '🏠'
        });
    }
    
    addMenuItem(item) {
        this.menuItems.push(item);
    }
    
    show(x, y) {
        // Don't show context menu in presentation mode
        if (window.DebugSystem && window.DebugSystem.isPresentationMode) {
            return;
        }
        
        this.render();
        this.menuElement.style.display = 'block';
        this.isVisible = true;
        
        // Position the menu
        this.position(x, y);
    }
    
    hide() {
        this.menuElement.style.display = 'none';
        this.isVisible = false;
    }
    
    position(x, y) {
        const menuRect = this.menuElement.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Adjust position if menu would go off screen
        let adjustedX = x;
        let adjustedY = y;
        
        if (x + menuRect.width > viewportWidth) {
            adjustedX = viewportWidth - menuRect.width - 10;
        }
        
        if (y + menuRect.height > viewportHeight) {
            adjustedY = viewportHeight - menuRect.height - 10;
        }
        
        this.menuElement.style.left = `${adjustedX}px`;
        this.menuElement.style.top = `${adjustedY}px`;
    }
    
    render() {
        this.menuElement.innerHTML = '';
        
        this.menuItems.forEach((item, index) => {
            if (item.separator) {
                const separator = document.createElement('div');
                separator.className = 'context-menu-separator';
                separator.style.cssText = `
                    height: 1px;
                    background: #444;
                    margin: 4px 0;
                `;
                this.menuElement.appendChild(separator);
            } else {
                const menuItem = this.createMenuItem(item, index);
                this.menuElement.appendChild(menuItem);
            }
        });
    }
    
    createMenuItem(item, index) {
        const menuItem = document.createElement('div');
        menuItem.className = 'context-menu-item';
        menuItem.style.cssText = `
            padding: 8px 16px;
            cursor: pointer;
            display: flex;
            align-items: center;
            transition: background-color 0.1s ease;
        `;
        
        // Icon and label
        if (item.icon) {
            const icon = document.createElement('span');
            icon.textContent = item.icon;
            icon.style.marginRight = '8px';
            menuItem.appendChild(icon);
        }
        
        const label = document.createElement('span');
        label.textContent = item.label;
        menuItem.appendChild(label);
        
        // Hover effects
        menuItem.addEventListener('mouseenter', () => {
            menuItem.style.backgroundColor = '#3a3a3a';
        });
        
        menuItem.addEventListener('mouseleave', () => {
            menuItem.style.backgroundColor = 'transparent';
        });
        
        // Click handler
        if (item.action) {
            menuItem.addEventListener('click', (e) => {
                e.stopPropagation();
                item.action();
                this.hide();
            });
        }
        
        return menuItem;
    }
    
    
    // Developer tool actions
    createStickyNote() {
        const { StickyNote } = window.StickyNoteManager || {};
        if (StickyNote) {
            StickyNote.create();
        } else {
            console.warn('StickyNote system not available');
        }
    }
    
    clearAllNotes() {
        if (window.StickyNoteManager && window.StickyNoteManager.StickyNote) {
            window.StickyNoteManager.StickyNote.clearAll();
        }
    }
    
    toggleDebugInfo() {
        // Toggle debug information display
        console.log('Debug info toggled');
        // Implementation depends on existing debug system
    }
    
    restartBattle() {
        // Restart current battle
        if (window.game && window.game.scene && window.game.scene.isActive('BattleScene')) {
            window.game.scene.restart('BattleScene');
        }
    }
    
    returnToMenu() {
        // Return to main menu
        if (window.game && window.game.scene) {
            window.game.scene.start('GameScene');
        }
    }
}