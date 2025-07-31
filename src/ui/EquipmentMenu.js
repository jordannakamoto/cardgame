// Equipment management UI for heroes
import { Equipment } from '../equipment/Equipment.js';

export class EquipmentMenu {
    constructor(scene) {
        this.scene = scene;
        this.isOpen = false;
        this.selectedHero = null;
        this.menuContainer = null;
        this.equipmentSlots = [];
        this.inventoryItems = [];
        this.currentTab = 'equip'; // 'equip' or 'inventory'
    }
    
    // Open equipment menu for a specific hero
    open(hero, inventory) {
        if (this.isOpen) {
            this.close();
        }
        
        this.selectedHero = hero;
        this.inventory = inventory;
        this.isOpen = true;
        
        this.createMenuUI();
    }
    
    // Close equipment menu
    close() {
        if (this.menuContainer) {
            this.menuContainer.destroy();
            this.menuContainer = null;
        }
        
        this.isOpen = false;
        this.selectedHero = null;
        this.equipmentSlots = [];
        this.inventoryItems = [];
    }
    
    // Create the main menu UI
    createMenuUI() {
        const screenWidth = this.scene.cameras.main.width;
        const screenHeight = this.scene.cameras.main.height;
        
        // Main container
        this.menuContainer = this.scene.add.container(screenWidth / 2, screenHeight / 2);
        this.menuContainer.setDepth(1000);
        
        // Background overlay
        const overlay = this.scene.add.graphics();
        overlay.fillStyle(0x000000, 0.7);
        overlay.fillRect(-screenWidth / 2, -screenHeight / 2, screenWidth, screenHeight);
        this.menuContainer.add(overlay);
        
        // Menu panel
        const panelWidth = 800;
        const panelHeight = 600;
        const panel = this.scene.add.graphics();
        panel.fillStyle(0x2a2a2a, 0.95);
        panel.lineStyle(4, 0x8b4513, 1);
        panel.fillRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
        panel.strokeRoundedRect(-panelWidth / 2, -panelHeight / 2, panelWidth, panelHeight, 16);
        this.menuContainer.add(panel);
        
        // Title
        const title = this.scene.add.text(0, -panelHeight / 2 + 40, 
            `${this.selectedHero.name} - Equipment`, {
            fontSize: '32px',
            color: '#d4af37',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        this.menuContainer.add(title);
        
        // Close button
        const closeButton = this.scene.add.text(panelWidth / 2 - 40, -panelHeight / 2 + 40, 'X', {
            fontSize: '32px',
            color: '#ff6666',
            fontFamily: 'Arial'
        });
        closeButton.setOrigin(0.5);
        closeButton.setInteractive(new Phaser.Geom.Rectangle(-16, -16, 32, 32), Phaser.Geom.Rectangle.Contains);
        closeButton.on('pointerdown', () => this.close());
        closeButton.on('pointerover', () => closeButton.setScale(1.2));
        closeButton.on('pointerout', () => closeButton.setScale(1.0));
        this.menuContainer.add(closeButton);
        
        // Create tabs
        this.createTabs(panelWidth, panelHeight);
        
        // Create content based on current tab
        this.refreshContent(panelWidth, panelHeight);
    }
    
    // Create tab buttons
    createTabs(panelWidth, panelHeight) {
        const tabY = -panelHeight / 2 + 100;
        
        // Equipment tab
        const equipTab = this.createTab('Equipment', -100, tabY, this.currentTab === 'equip');
        equipTab.on('pointerdown', () => {
            this.currentTab = 'equip';
            this.refreshContent(panelWidth, panelHeight);
        });
        this.menuContainer.add(equipTab);
        
        // Inventory tab
        const inventoryTab = this.createTab('Inventory', 100, tabY, this.currentTab === 'inventory');
        inventoryTab.on('pointerdown', () => {
            this.currentTab = 'inventory';
            this.refreshContent(panelWidth, panelHeight);
        });
        this.menuContainer.add(inventoryTab);
    }
    
    // Create a single tab button
    createTab(text, x, y, isActive) {
        const container = this.scene.add.container(x, y);
        
        const bg = this.scene.add.graphics();
        const bgColor = isActive ? 0x4a4a4a : 0x333333;
        bg.fillStyle(bgColor, 1);
        bg.lineStyle(2, 0x8b4513, 1);
        bg.fillRoundedRect(-60, -20, 120, 40, 8);
        bg.strokeRoundedRect(-60, -20, 120, 40, 8);
        
        const label = this.scene.add.text(0, 0, text, {
            fontSize: '18px',
            color: isActive ? '#ffffff' : '#cccccc',
            fontFamily: 'Arial'
        });
        label.setOrigin(0.5);
        
        container.add([bg, label]);
        container.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
        
        return container;
    }
    
    // Refresh content based on current tab
    refreshContent(panelWidth, panelHeight) {
        // Clear existing content
        const contentItems = this.menuContainer.list.filter(item => 
            item.getData && item.getData('isContent')
        );
        contentItems.forEach(item => item.destroy());
        
        if (this.currentTab === 'equip') {
            this.createEquipmentView(panelWidth, panelHeight);
        } else {
            this.createInventoryView(panelWidth, panelHeight);
        }
    }
    
    // Create equipment view showing hero's current equipment
    createEquipmentView(panelWidth, panelHeight) {
        const startY = -panelHeight / 2 + 180;
        
        // Hero stats display
        this.createStatsDisplay(-panelWidth / 3, startY);
        
        // Equipment slots
        this.createEquipmentSlots(panelWidth / 3, startY);
    }
    
    // Create hero stats display
    createStatsDisplay(x, y) {
        const container = this.scene.add.container(x, y);
        container.setData('isContent', true);
        
        const title = this.scene.add.text(0, 0, 'Hero Stats', {
            fontSize: '24px',
            color: '#d4af37',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        container.add(title);
        
        const stats = [
            `Health: ${this.selectedHero.currentHealth}/${this.selectedHero.maxHealth}`,
            `Damage Reduction: ${this.selectedHero.stats.damageReduction || 0}`,
            `Dodge Chance: ${Math.round((this.selectedHero.stats.dodgeChance || 0) * 100)}%`,
            `Vampirism: ${Math.round((this.selectedHero.stats.vampirism || 0) * 100)}%`,
            `Gold Bonus: ${Math.round((this.selectedHero.stats.goldBonus || 0) * 100)}%`
        ];
        
        stats.forEach((stat, index) => {
            const statText = this.scene.add.text(0, 40 + index * 30, stat, {
                fontSize: '16px',
                color: '#ffffff',
                fontFamily: 'Arial'
            });
            statText.setOrigin(0.5);
            container.add(statText);
        });
        
        this.menuContainer.add(container);
    }
    
    // Create equipment slots
    createEquipmentSlots(x, y) {
        const container = this.scene.add.container(x, y);
        container.setData('isContent', true);
        
        const title = this.scene.add.text(0, 0, 'Equipment', {
            fontSize: '24px',
            color: '#d4af37',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        container.add(title);
        
        // Armor slot
        const armorSlot = this.createEquipmentSlot('armor', 0, 60);
        container.add(armorSlot);
        
        // Accessory slot
        const accessorySlot = this.createEquipmentSlot('accessory', 0, 160);
        container.add(accessorySlot);
        
        this.menuContainer.add(container);
    }
    
    // Create a single equipment slot
    createEquipmentSlot(slotType, x, y) {
        const container = this.scene.add.container(x, y);
        const equippedItem = this.selectedHero.equipment[slotType];
        
        // Slot background
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x444444, 0.8);
        bg.lineStyle(2, 0x666666, 1);
        bg.fillRoundedRect(-80, -40, 160, 80, 8);
        bg.strokeRoundedRect(-80, -40, 160, 80, 8);
        container.add(bg);
        
        if (equippedItem) {
            // Show equipped item
            const itemIcon = this.scene.add.text(0, -10, equippedItem.icon || '⚙️', {
                fontSize: '24px'
            });
            itemIcon.setOrigin(0.5);
            
            const itemName = this.scene.add.text(0, 15, equippedItem.name, {
                fontSize: '14px',
                color: this.getRarityColor(equippedItem.rarity),
                fontFamily: 'Arial'
            });
            itemName.setOrigin(0.5);
            
            container.add([itemIcon, itemName]);
            
            // Unequip button
            container.setInteractive(new Phaser.Geom.Rectangle(-80, -40, 160, 80), Phaser.Geom.Rectangle.Contains);
            container.on('pointerdown', () => this.unequipItem(slotType));
        } else {
            // Empty slot
            const emptyText = this.scene.add.text(0, 0, `Empty ${slotType}`, {
                fontSize: '16px',
                color: '#888888',
                fontFamily: 'Arial'
            });
            emptyText.setOrigin(0.5);
            container.add(emptyText);
        }
        
        return container;
    }
    
    // Create inventory view showing available equipment
    createInventoryView(panelWidth, panelHeight) {
        const startY = -panelHeight / 2 + 180;
        
        const container = this.scene.add.container(0, startY);
        container.setData('isContent', true);
        
        const title = this.scene.add.text(0, 0, 'Inventory Equipment', {
            fontSize: '24px',
            color: '#d4af37',
            fontFamily: 'Arial'
        });
        title.setOrigin(0.5);
        container.add(title);
        
        // Get equipment items from inventory
        const equipmentItems = this.inventory.getItems().filter(item => item.type === 'equipment');
        
        if (equipmentItems.length === 0) {
            const noItems = this.scene.add.text(0, 50, 'No equipment in inventory', {
                fontSize: '18px',
                color: '#888888',
                fontFamily: 'Arial'
            });
            noItems.setOrigin(0.5);
            container.add(noItems);
        } else {
            // Show equipment items in a grid
            equipmentItems.forEach((item, index) => {
                const itemX = (index % 4) * 150 - 225;
                const itemY = Math.floor(index / 4) * 100 + 80;
                
                const itemContainer = this.createInventoryItem(item, itemX, itemY);
                container.add(itemContainer);
            });
        }
        
        this.menuContainer.add(container);
    }
    
    // Create an inventory item display
    createInventoryItem(item, x, y) {
        const container = this.scene.add.container(x, y);
        
        // Item background
        const bg = this.scene.add.graphics();
        const rarityColor = this.getRarityColor(item.rarity || 'common');
        bg.fillStyle(0x333333, 0.9);
        bg.lineStyle(2, rarityColor, 1);
        bg.fillRoundedRect(-60, -40, 120, 80, 8);
        bg.strokeRoundedRect(-60, -40, 120, 80, 8);
        container.add(bg);
        
        // Item icon
        const icon = this.scene.add.text(0, -10, item.icon || '⚙️', {
            fontSize: '20px'
        });
        icon.setOrigin(0.5);
        container.add(icon);
        
        // Item name
        const name = this.scene.add.text(0, 15, item.name, {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Arial',
            wordWrap: { width: 100 }
        });
        name.setOrigin(0.5);
        container.add(name);
        
        // Make clickable to equip
        container.setInteractive(new Phaser.Geom.Rectangle(-60, -40, 120, 80), Phaser.Geom.Rectangle.Contains);
        container.on('pointerdown', () => this.equipItem(item));
        container.on('pointerover', () => container.setScale(1.1));
        container.on('pointerout', () => container.setScale(1.0));
        
        return container;
    }
    
    // Equip an item from inventory
    equipItem(inventoryItem) {
        if (!inventoryItem.equipmentData) {
            console.error('No equipment data found for item:', inventoryItem);
            return;
        }
        
        // Create Equipment instance from stored data
        const equipment = new Equipment(inventoryItem.equipmentData);
        
        // Try to equip the item
        if (this.selectedHero.equipItem(equipment)) {
            // Remove from inventory
            this.inventory.removeItem(inventoryItem.id);
            
            // Refresh the display
            this.refreshContent(800, 600);
            
            console.log(`Equipped ${equipment.name} to ${this.selectedHero.name}`);
        } else {
            console.error(`Cannot equip ${equipment.name} to ${this.selectedHero.name}`);
        }
    }
    
    // Unequip an item
    unequipItem(slot) {
        const equipment = this.selectedHero.unequipItem(slot);
        if (equipment) {
            // Add back to inventory
            this.inventory.addItem({
                id: equipment.id,
                name: equipment.name,
                description: equipment.description,
                slot: equipment.slot,
                rarity: equipment.rarity,
                icon: equipment.icon,
                type: 'equipment',
                equipmentData: equipment.toJSON()
            });
            
            // Refresh the display
            this.refreshContent(800, 600);
            
            console.log(`Unequipped ${equipment.name} from ${this.selectedHero.name}`);
        }
    }
    
    // Get rarity color
    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return '#9e9e9e';
            case 'uncommon': return '#4caf50';
            case 'rare': return '#2196f3';
            case 'legendary': return '#ff9800';
            default: return '#9e9e9e';
        }
    }
    
    // Check if menu is open
    isMenuOpen() {
        return this.isOpen;
    }
}