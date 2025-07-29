import Phaser from 'phaser';
import Inventory from '../inventory/Inventory.js';
import PartyManager from '../party/PartyManager.js';
import { createHero, getAllHeroShopData } from '../heroes/HeroRegistry.js';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
    }

    init(data) {
        // Receive data from previous scene
        this.playerGold = data.gold || 0;
        this.inventory = data.inventory || new Inventory();
        this.partyManager = data.partyManager || null;
        
        // Create party manager if not provided
        if (!this.partyManager) {
            this.partyManager = new PartyManager(this);
        }
    }

    create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Background
        this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x1a1a2e);

        // Shop title
        this.titleText = this.add.text(
            screenWidth / 2,
            100,
            'SHOP',
            {
                fontSize: '72px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        this.titleText.setOrigin(0.5);

        // Gold display
        this.goldDisplay = this.add.text(
            100,
            100,
            `Gold: ${this.playerGold}`,
            {
                fontSize: '36px',
                color: '#ffdd00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        this.goldDisplay.setOrigin(0, 0.5);

        // Initialize shop state FIRST
        this.currentShopTab = 'items'; // 'items' or 'heroes'
        
        // Shop sections
        this.createShopTabs();
        this.createShopItems();

        // Continue button
        this.createContinueButton();

        // Setup input
        this.setupInput();
        
        // Update tab appearance to match initial state
        this.itemsTab.setFillStyle(0x66BB6A);
        this.heroesTab.setFillStyle(0x2196F3);
    }
    
    createShopTabs() {
        const screenWidth = this.cameras.main.width;
        
        // Items tab
        this.itemsTab = this.add.rectangle(screenWidth / 2 - 150, 200, 200, 50, 0x4CAF50);
        this.itemsTab.setStrokeStyle(2, 0x66BB6A);
        const itemsTabText = this.add.text(screenWidth / 2 - 150, 200, 'ITEMS', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        itemsTabText.setOrigin(0.5);
        
        // Heroes tab
        this.heroesTab = this.add.rectangle(screenWidth / 2 + 150, 200, 200, 50, 0x2196F3);
        this.heroesTab.setStrokeStyle(2, 0x42A5F5);
        const heroesTabText = this.add.text(screenWidth / 2 + 150, 200, 'HEROES', {
            fontSize: '24px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        heroesTabText.setOrigin(0.5);
        
        // Make tabs interactive
        this.itemsTab.setInteractive();
        this.itemsTab.on('pointerdown', (pointer, localX, localY, event) => {
            console.log('Items tab clicked');
            if (event) event.stopPropagation();
            this.switchTab('items');
        });
        this.itemsTab.on('pointerover', () => this.itemsTab.setFillStyle(0x66BB6A));
        this.itemsTab.on('pointerout', () => this.itemsTab.setFillStyle(this.currentShopTab === 'items' ? 0x66BB6A : 0x4CAF50));
        
        this.heroesTab.setInteractive();
        this.heroesTab.on('pointerdown', (pointer, localX, localY, event) => {
            console.log('Heroes tab clicked');
            if (event) event.stopPropagation();
            this.switchTab('heroes');
        });
        this.heroesTab.on('pointerover', () => this.heroesTab.setFillStyle(0x42A5F5));
        this.heroesTab.on('pointerout', () => this.heroesTab.setFillStyle(this.currentShopTab === 'heroes' ? 0x42A5F5 : 0x2196F3));
    }
    
    switchTab(tabName) {
        console.log('Tab switch requested:', this.currentShopTab, '->', tabName);
        console.trace('Tab switch call stack');
        
        this.currentShopTab = tabName;
        
        // Update tab appearance
        this.itemsTab.setFillStyle(tabName === 'items' ? 0x66BB6A : 0x4CAF50);
        this.heroesTab.setFillStyle(tabName === 'heroes' ? 0x42A5F5 : 0x2196F3);
        
        // Refresh shop display
        this.refreshShopDisplay();
    }

    createShopItems() {
        const screenWidth = this.cameras.main.width;
        const startY = 300;
        const itemSpacing = 150;

        // Define shop items (testing prices - much lower)
        this.itemShopItems = [
            {
                name: 'Health Potion',
                description: 'Restore 50 health',
                price: 2,
                type: 'consumable',
                effect: { type: 'heal', value: 50 }
            },
            {
                name: 'Power Ring',
                description: '+5 damage to all hands',
                price: 5,
                type: 'equipment',
                effect: { type: 'damage_boost', value: 5 }
            },
            {
                name: 'Lucky Charm',
                description: 'Pairs deal +10 bonus damage',
                price: 3,
                type: 'equipment',
                effect: { type: 'pair_bonus', value: 10 }
            },
            {
                name: 'Mana Crystal',
                description: 'Start battles with +20 mana',
                price: 4,
                type: 'equipment',
                effect: { type: 'mana_boost', value: 20 }
            },
            {
                name: 'Card Pack',
                description: 'Add random card to deck',
                price: 3,
                type: 'deck_modifier',
                effect: { type: 'add_card', value: 1 }
            }
        ];
        
        // Get hero shop items
        const allHeroData = getAllHeroShopData();
        console.log('All hero data:', allHeroData.length, allHeroData);
        this.heroShopItems = allHeroData.map(heroData => ({
            ...heroData,
            category: 'hero'
        }));
        console.log('Hero shop items:', this.heroShopItems.length);

        // Create item displays
        this.itemContainers = [];
        this.displayCurrentShopItems();
    }
    
    displayCurrentShopItems() {
        const screenWidth = this.cameras.main.width;
        const startY = 350;
        const itemsPerRow = 4;
        const cardSpacing = 220;
        const rowSpacing = 320;
        
        const currentItems = this.currentShopTab === 'items' ? this.itemShopItems : this.heroShopItems;
        
        currentItems.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            
            // Calculate position for grid layout
            const totalRowWidth = (itemsPerRow - 1) * cardSpacing;
            const startX = (screenWidth - totalRowWidth) / 2;
            const itemX = startX + (col * cardSpacing);
            const itemY = startY + (row * rowSpacing);
            
            const container = this.createShopItem(item, itemX, itemY, index);
            this.itemContainers.push(container);
        });
    }

    createShopItem(item, x, y, index) {
        const container = this.add.container(x, y);
        const canAfford = this.playerGold >= item.price;

        // Card-style background
        const cardWidth = 200;
        const cardHeight = 280;
        const itemBg = this.add.graphics();
        
        // Main card background
        itemBg.fillStyle(canAfford ? 0x2a2a2a : 0x1a1a1a);
        itemBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12);
        itemBg.lineStyle(3, canAfford ? 0x555555 : 0x333333);
        itemBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 12);

        // Price tag at top
        const priceTag = this.add.graphics();
        priceTag.fillStyle(0x1a1a2e);
        priceTag.fillRoundedRect(-30, -cardHeight/2 - 10, 60, 30, 8);
        priceTag.lineStyle(2, canAfford ? 0xffdd00 : 0xaa8800);
        priceTag.strokeRoundedRect(-30, -cardHeight/2 - 10, 60, 30, 8);
        
        const priceText = this.add.text(0, -cardHeight/2 + 5, `$${item.price}`, {
            fontSize: '18px',
            color: canAfford ? '#ffdd00' : '#aa8800',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        priceText.setOrigin(0.5);

        // Item visual representation
        const itemVisual = this.createItemVisual(item, canAfford);

        // Item name at bottom
        const nameText = this.add.text(0, cardHeight/2 - 40, item.name, {
            fontSize: '16px',
            color: canAfford ? '#ffffff' : '#666666',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: cardWidth - 20 }
        });
        nameText.setOrigin(0.5);

        // Rarity indicator (for heroes)
        if (item.rarity) {
            const rarityColor = this.getRarityColor(item.rarity);
            const rarityBg = this.add.graphics();
            rarityBg.fillStyle(rarityColor, 0.3);
            rarityBg.fillRoundedRect(-cardWidth/2 + 5, -cardHeight/2 + 5, cardWidth - 10, 25, 6);
            rarityBg.lineStyle(2, rarityColor);
            rarityBg.strokeRoundedRect(-cardWidth/2 + 5, -cardHeight/2 + 5, cardWidth - 10, 25, 6);
            
            const rarityText = this.add.text(0, -cardHeight/2 + 17, item.rarity.toUpperCase(), {
                fontSize: '12px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            });
            rarityText.setOrigin(0.5);
            container.add([rarityBg, rarityText]);
        }

        // Add to container
        container.add([itemBg, priceTag, priceText, itemVisual, nameText]);

        // Make entire card interactive
        const hitArea = new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        if (canAfford) {
            container.on('pointerdown', (pointer, localX, localY, event) => {
                console.log('Item clicked:', item.name, 'tab:', this.currentShopTab, 'index:', index);
                
                // Stop event propagation to prevent interference
                if (event) {
                    event.stopPropagation();
                }
                
                // Double-check bounds at click time
                const currentItems = this.currentShopTab === 'items' ? this.itemShopItems : this.heroShopItems;
                if (index >= 0 && index < currentItems.length) {
                    this.buyItem(index);
                } else {
                    console.warn('Click on invalid item index:', index, 'max:', currentItems.length - 1);
                }
            });
            container.on('pointerover', () => {
                container.setScale(1.05);
                this.showItemTooltip(item, container);
            });
            container.on('pointerout', () => {
                container.setScale(1.0);
                this.hideItemTooltip();
            });
        } else {
            container.on('pointerover', () => {
                this.showItemTooltip(item, container);
            });
            container.on('pointerout', () => {
                this.hideItemTooltip();
            });
        }

        return container;
    }

    createItemVisual(item, canAfford) {
        const visual = this.add.container(0, -20);
        
        if (item.category === 'hero') {
            // Hero portrait placeholder - would use actual portrait in full implementation
            const portraitBg = this.add.graphics();
            portraitBg.fillStyle(canAfford ? 0x444444 : 0x222222);
            portraitBg.fillRoundedRect(-60, -40, 120, 80, 8);
            portraitBg.lineStyle(2, canAfford ? 0x666666 : 0x444444);
            portraitBg.strokeRoundedRect(-60, -40, 120, 80, 8);
            
            // Hero type icon
            const typeColor = item.type === 'damage' ? 0xff6666 : 
                             item.type === 'support' ? 0x66ff66 : 0x6666ff;
            const typeIcon = this.add.circle(0, 0, 25, typeColor, canAfford ? 0.8 : 0.4);
            
            const typeSymbol = item.type === 'damage' ? '⚔' : 
                              item.type === 'support' ? '🛡' : '⚡';
            const symbolText = this.add.text(0, 0, typeSymbol, {
                fontSize: '24px',
                color: '#ffffff'
            });
            symbolText.setOrigin(0.5);
            
            visual.add([portraitBg, typeIcon, symbolText]);
        } else {
            // Item icon representation
            const itemIcon = this.createItemIcon(item, canAfford);
            visual.add(itemIcon);
        }
        
        return visual;
    }

    createItemIcon(item, canAfford) {
        const iconBg = this.add.graphics();
        iconBg.fillStyle(canAfford ? 0x333333 : 0x222222);
        iconBg.fillCircle(0, 0, 40);
        iconBg.lineStyle(3, canAfford ? 0x666666 : 0x444444);
        iconBg.strokeCircle(0, 0, 40);
        
        // Item type specific icons
        let iconSymbol = '?';
        let iconColor = '#ffffff';
        
        switch(item.type) {
            case 'consumable':
                iconSymbol = '🧪';
                iconColor = '#66ff66';
                break;
            case 'equipment':
                iconSymbol = '💍';
                iconColor = '#ffdd00';
                break;
            case 'deck_modifier':
                iconSymbol = '🃏';
                iconColor = '#ff6666';
                break;
        }
        
        const iconText = this.add.text(0, 0, iconSymbol, {
            fontSize: '32px',
            color: canAfford ? iconColor : '#666666'
        });
        iconText.setOrigin(0.5);
        
        return this.add.container(0, 0, [iconBg, iconText]);
    }

    getRarityColor(rarity) {
        switch(rarity) {
            case 'common': return 0x888888;
            case 'uncommon': return 0x4CAF50;
            case 'rare': return 0x2196F3;
            case 'legendary': return 0xFF9800;
            default: return 0x666666;
        }
    }

    showItemTooltip(item, itemContainer) {
        // Clear any existing tooltip
        this.hideItemTooltip();
        
        // Calculate tooltip position
        const tooltipX = itemContainer.x + 150;
        const tooltipY = itemContainer.y;
        
        // Create tooltip container
        this.itemTooltip = this.add.container(tooltipX, tooltipY);
        
        // Tooltip background
        const tooltipWidth = 300;
        const tooltipHeight = 120;
        const tooltipBg = this.add.graphics();
        tooltipBg.fillStyle(0x000000, 0.95);
        tooltipBg.fillRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8);
        tooltipBg.lineStyle(2, 0xffff00, 0.8);
        tooltipBg.strokeRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8);
        
        // Item name
        const nameText = this.add.text(0, -35, item.name, {
            fontSize: '18px',
            color: '#ffff00',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        });
        nameText.setOrigin(0.5);
        
        // Item description
        const descText = this.add.text(0, 0, item.description, {
            fontSize: '14px',
            color: '#cccccc',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: tooltipWidth - 20 }
        });
        descText.setOrigin(0.5);
        
        // Price info
        const priceInfo = this.add.text(0, 35, `Price: ${item.price} gold`, {
            fontSize: '12px',
            color: this.playerGold >= item.price ? '#66ff66' : '#ff6666',
            fontFamily: 'Arial',
            align: 'center'
        });
        priceInfo.setOrigin(0.5);
        
        // Add elements to tooltip
        this.itemTooltip.add([tooltipBg, nameText, descText, priceInfo]);
        
        // Animate tooltip appearance
        this.itemTooltip.setAlpha(0);
        this.tweens.add({
            targets: this.itemTooltip,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
        
        // Bring tooltip to front
        this.children.bringToTop(this.itemTooltip);
    }
    
    hideItemTooltip() {
        if (this.itemTooltip) {
            this.itemTooltip.destroy();
            this.itemTooltip = null;
        }
    }

    buyItem(itemIndex) {
        const currentItems = this.currentShopTab === 'items' ? this.itemShopItems : this.heroShopItems;
        const item = currentItems[itemIndex];
        
        // Defensive check - make sure item exists
        if (!item) {
            console.error('Shop item not found at index:', itemIndex, 'currentTab:', this.currentShopTab, 'itemsLength:', currentItems.length);
            return;
        }
        
        if (this.playerGold >= item.price) {
            // Check if it's a hero purchase
            if (item.category === 'hero') {
                this.buyHero(item);
            } else {
                this.buyRegularItem(item);
            }
        }
    }
    
    buyRegularItem(item) {
        // Additional safety check
        if (!item || typeof item.price !== 'number') {
            console.error('Invalid item data:', item);
            return;
        }
        
        // Deduct gold
        this.playerGold -= item.price;
        this.inventory.addResource('gold', -item.price);
        this.updateGoldDisplay();

        // Add item to inventory
        this.inventory.addItem({
            id: `${item.type}_${Date.now()}`,
            name: item.name,
            description: item.description,
            type: item.type,
            effect: item.effect
        });

        // Show purchase feedback
        this.showPurchaseEffect(item);

        // Refresh shop display
        this.refreshShopDisplay();
    }
    
    buyHero(heroData) {
        // Additional safety check
        if (!heroData || typeof heroData.price !== 'number') {
            console.error('Invalid hero data:', heroData);
            return;
        }
        
        if (this.partyManager && this.partyManager.ownsHero(heroData.id)) {
            // Show error - already own this hero
            this.showPurchaseError('You already own this hero!');
            return;
        }
        
        // Deduct gold
        this.playerGold -= heroData.price;
        this.inventory.addResource('gold', -heroData.price);
        this.updateGoldDisplay();

        // Create and add hero
        try {
            const hero = createHero(heroData.id);
            if (this.partyManager) {
                this.partyManager.purchaseHero(hero);
                console.log('Hero purchased successfully:', hero.name);
                console.log('Party size after purchase:', this.partyManager.party.getSize());
                console.log('Available heroes after purchase:', this.partyManager.availableHeroes.length);
                console.log('All party heroes:', this.partyManager.getAllHeroes().map(h => h.name));
            }

            // Show purchase feedback
            this.showPurchaseEffect(heroData);

            // Refresh shop display
            this.refreshShopDisplay();
        } catch (error) {
            console.error('Failed to purchase hero:', error);
            // Refund gold on error
            this.playerGold += heroData.price;
            this.inventory.addResource('gold', heroData.price);
            this.updateGoldDisplay();
        }
    }

    showPurchaseError(message) {
        const screenWidth = this.cameras.main.width;
        
        // Error message text
        const errorText = this.add.text(
            screenWidth / 2,
            200,
            message,
            {
                fontSize: '24px',
                color: '#ff4444',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        errorText.setOrigin(0.5);

        // Animate and fade out
        this.tweens.add({
            targets: errorText,
            y: errorText.y - 30,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => errorText.destroy()
        });
    }

    showPurchaseEffect(item) {
        const screenWidth = this.cameras.main.width;
        
        // Purchase confirmation text
        const purchaseText = this.add.text(
            screenWidth / 2,
            200,
            `Purchased: ${item.name}!`,
            {
                fontSize: '32px',
                color: '#4CAF50',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        purchaseText.setOrigin(0.5);

        // Animate and fade out
        this.tweens.add({
            targets: purchaseText,
            y: purchaseText.y - 50,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => purchaseText.destroy()
        });
    }

    refreshShopDisplay() {
        // Remove old item containers
        if (this.itemContainers) {
            this.itemContainers.forEach(container => {
                if (container && container.destroy) {
                    container.destroy();
                }
            });
        }
        this.itemContainers = [];

        // Recreate shop items with updated affordability
        this.displayCurrentShopItems();
    }

    updateGoldDisplay() {
        this.goldDisplay.setText(`Gold: ${this.playerGold}`);
    }

    createContinueButton() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        const continueButton = this.add.rectangle(
            screenWidth / 2,
            screenHeight - 100,
            300,
            80,
            0x2196F3
        );
        continueButton.setStrokeStyle(3, 0x42A5F5);

        const continueText = this.add.text(
            screenWidth / 2,
            screenHeight - 100,
            'CONTINUE',
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        continueText.setOrigin(0.5);

        // Make interactive
        continueButton.setInteractive();
        continueButton.on('pointerdown', () => this.continueToNextBattle());
        continueButton.on('pointerover', () => {
            continueButton.setFillStyle(0x42A5F5);
            continueText.setScale(1.1);
        });
        continueButton.on('pointerout', () => {
            continueButton.setFillStyle(0x2196F3);
            continueText.setScale(1.0);
        });
    }

    setupInput() {
        // ESC or ENTER to continue
        this.input.keyboard.on('keydown-ESC', () => {
            this.continueToNextBattle();
        });
        
        this.input.keyboard.on('keydown-ENTER', () => {
            this.continueToNextBattle();
        });
    }

    continueToNextBattle() {
        // Return to battle with updated inventory and gold
        this.scene.start('BattleScene', {
            gold: this.playerGold,
            inventory: this.inventory,
            partyManager: this.partyManager
        });
    }
}