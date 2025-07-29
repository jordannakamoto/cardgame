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

        // Rich gradient background like Balatro
        this.createBackground();

        // Shop title with ornate styling
        this.titleText = this.add.text(
            screenWidth / 2,
            120,
            'MERCHANT\'S SANCTUM',
            {
                fontSize: '84px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 4
            }
        );
        this.titleText.setOrigin(0.5);

        // Gold display with ornate frame
        this.createGoldDisplay();

        // Generate limited shop inventory
        this.generateShopInventory();
        
        // Create shop display
        this.createShopDisplay();

        // Continue button
        this.createContinueButton();

        // Setup input
        this.setupInput();
    }
    
    createBackground() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // Rich gradient background
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x2a1810, 0x2a1810, 0x1a0f08, 0x1a0f08, 1);
        bg.fillRect(0, 0, screenWidth, screenHeight);
        
        // Add subtle texture with multiple overlays
        const overlay1 = this.add.graphics();
        overlay1.fillStyle(0x3a2820, 0.3);
        overlay1.fillRect(0, 0, screenWidth, screenHeight);
        
        // Add ornate border
        const border = this.add.graphics();
        border.lineStyle(8, 0xd4af37, 0.6);
        border.strokeRoundedRect(20, 20, screenWidth - 40, screenHeight - 40, 20);
        
        border.lineStyle(4, 0x8b4513, 0.4);
        border.strokeRoundedRect(30, 30, screenWidth - 60, screenHeight - 60, 15);
    }
    
    createGoldDisplay() {
        const screenWidth = this.cameras.main.width;
        
        // Ornate gold frame
        const goldFrame = this.add.graphics();
        goldFrame.fillStyle(0x8b4513, 0.8);
        goldFrame.fillRoundedRect(80, 60, 280, 80, 12);
        goldFrame.lineStyle(4, 0xd4af37, 1.0);
        goldFrame.strokeRoundedRect(80, 60, 280, 80, 12);
        
        // Inner glow
        goldFrame.lineStyle(2, 0xffd700, 0.6);
        goldFrame.strokeRoundedRect(86, 66, 268, 68, 9);
        
        this.goldDisplay = this.add.text(
            220,
            100,
            `${this.playerGold}`,
            {
                fontSize: '48px',
                color: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 3
            }
        );
        this.goldDisplay.setOrigin(0.5);
        
        // Gold coin icon
        const coinIcon = this.add.text(
            140,
            100,
            '🪙',
            {
                fontSize: '36px'
            }
        );
        coinIcon.setOrigin(0.5);
    }

    generateShopInventory() {
        // Define all possible items
        const allItems = [
            {
                name: 'Health Potion',
                description: 'Restore 50 health to active hero',
                price: 8,
                type: 'consumable',
                rarity: 'common',
                effect: { type: 'heal', value: 50 }
            },
            {
                name: 'Power Ring',
                description: '+5 damage to all poker hands',
                price: 15,
                type: 'equipment',
                rarity: 'uncommon',
                effect: { type: 'damage_boost', value: 5 }
            },
            {
                name: 'Lucky Charm',
                description: 'Pairs deal +10 bonus damage',
                price: 12,
                type: 'equipment',
                rarity: 'uncommon',
                effect: { type: 'pair_bonus', value: 10 }
            },
            {
                name: 'Arcane Crystal',
                description: 'All heroes gain +1 ability activation',
                price: 25,
                type: 'equipment',
                rarity: 'rare',
                effect: { type: 'ability_boost', value: 1 }
            },
            {
                name: 'Golden Deck',
                description: 'Face cards deal +3 extra damage',
                price: 18,
                type: 'deck_modifier',
                rarity: 'uncommon',
                effect: { type: 'face_card_bonus', value: 3 }
            },
            {
                name: 'Merchant\'s Blessing',
                description: 'Gain +50% gold from battles',
                price: 30,
                type: 'equipment',
                rarity: 'rare',
                effect: { type: 'gold_multiplier', value: 1.5 }
            }
        ];
        
        // Get available heroes
        const allHeroData = getAllHeroShopData();
        const availableHeroes = allHeroData.filter(heroData => 
            !this.partyManager || !this.partyManager.ownsHero(heroData.id)
        ).map(heroData => ({
            ...heroData,
            category: 'hero'
        }));
        
        // Combine all purchaseables
        const allPurchaseables = [...allItems, ...availableHeroes];
        
        // Randomly select 6 items for the shop (Balatro-style limited selection)
        this.shopInventory = [];
        const shuffled = [...allPurchaseables].sort(() => Math.random() - 0.5);
        
        // Take first 6 items (2 heroes max)
        let heroCount = 0;
        for (const item of shuffled) {
            if (this.shopInventory.length >= 6) break;
            if (item.category === 'hero' && heroCount >= 2) continue;
            
            this.shopInventory.push(item);
            if (item.category === 'hero') heroCount++;
        }
        
        console.log('Generated shop inventory:', this.shopInventory.length, 'items');
    }
    
    createShopDisplay() {
        const screenWidth = this.cameras.main.width;
        const startY = 350;
        const itemsPerRow = 3;
        const cardSpacing = 280;
        const rowSpacing = 380;
        
        // Create shop title section
        const shopLabel = this.add.text(
            screenWidth / 2,
            220,
            'AVAILABLE WARES',
            {
                fontSize: '42px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 2
            }
        );
        shopLabel.setOrigin(0.5);
        
        this.itemContainers = [];
        
        this.shopInventory.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            
            // Calculate position for centered grid layout
            const totalRowWidth = Math.min(this.shopInventory.length, itemsPerRow) * cardSpacing - cardSpacing;
            const rowItemCount = Math.min(this.shopInventory.length - row * itemsPerRow, itemsPerRow);
            const rowWidth = (rowItemCount - 1) * cardSpacing;
            const startX = (screenWidth - rowWidth) / 2;
            const itemX = startX + (col * cardSpacing);
            const itemY = startY + (row * rowSpacing);
            
            const container = this.createShopItem(item, itemX, itemY, index);
            this.itemContainers.push(container);
        });
    }

    createShopItem(item, x, y, index) {
        const container = this.add.container(x, y);
        const canAfford = this.playerGold >= item.price;

        // Larger Balatro-style card
        const cardWidth = 240;
        const cardHeight = 320;
        const itemBg = this.add.graphics();
        
        // Rich card background with gradient
        if (canAfford) {
            itemBg.fillGradientStyle(0x3a2f28, 0x3a2f28, 0x2a1f18, 0x2a1f18, 1);
        } else {
            itemBg.fillGradientStyle(0x2a1f18, 0x2a1f18, 0x1a0f08, 0x1a0f08, 1);
        }
        itemBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 16);
        
        // Ornate border based on rarity
        const rarityColor = item.rarity ? this.getRarityColor(item.rarity) : 0x8b4513;
        itemBg.lineStyle(4, canAfford ? rarityColor : 0x444444, canAfford ? 1.0 : 0.5);
        itemBg.strokeRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 16);
        
        // Inner glow for affordable items
        if (canAfford) {
            itemBg.lineStyle(2, rarityColor, 0.4);
            itemBg.strokeRoundedRect(-cardWidth/2 + 4, -cardHeight/2 + 4, cardWidth - 8, cardHeight - 8, 12);
        }

        // Price display - more prominent
        const priceContainer = this.add.container(0, -cardHeight/2 + 25);
        const priceBg = this.add.graphics();
        priceBg.fillStyle(0x8b4513, 0.9);
        priceBg.fillRoundedRect(-40, -15, 80, 30, 15);
        priceBg.lineStyle(3, canAfford ? 0xffd700 : 0x666666, 1.0);
        priceBg.strokeRoundedRect(-40, -15, 80, 30, 15);
        
        const priceText = this.add.text(0, 0, `${item.price}`, {
            fontSize: '24px',
            color: canAfford ? '#ffd700' : '#666666',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        priceText.setOrigin(0.5);
        
        // Coin icon
        const coinIcon = this.add.text(-25, 0, '🪙', {
            fontSize: '16px'
        });
        coinIcon.setOrigin(0.5);
        
        priceContainer.add([priceBg, coinIcon, priceText]);

        // Rarity banner
        if (item.rarity) {
            const rarityBanner = this.add.graphics();
            rarityBanner.fillStyle(rarityColor, 0.8);
            rarityBanner.fillRoundedRect(-cardWidth/2, -cardHeight/2 + 50, cardWidth, 30, 8);
            
            const rarityText = this.add.text(0, -cardHeight/2 + 65, item.rarity.toUpperCase(), {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            });
            rarityText.setOrigin(0.5);
            container.add([rarityBanner, rarityText]);
        }

        // Item visual representation (larger)
        const itemVisual = this.createItemVisual(item, canAfford);

        // Item name
        const nameText = this.add.text(0, cardHeight/2 - 60, item.name, {
            fontSize: '18px',
            color: canAfford ? '#d4af37' : '#666666',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: cardWidth - 20 }
        });
        nameText.setOrigin(0.5);
        
        // Short description
        const descText = this.add.text(0, cardHeight/2 - 25, item.description, {
            fontSize: '12px',
            color: canAfford ? '#cccccc' : '#555555',
            fontFamily: 'Arial',
            align: 'center',
            wordWrap: { width: cardWidth - 30 }
        });
        descText.setOrigin(0.5);

        // Add to container
        container.add([itemBg, priceContainer, itemVisual, nameText, descText]);

        // Make entire card interactive
        const hitArea = new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        
        if (canAfford) {
            container.on('pointerdown', (pointer, localX, localY, event) => {
                if (event) event.stopPropagation();
                this.buyItem(index);
            });
            container.on('pointerover', () => {
                container.setScale(1.08);
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
        const visual = this.add.container(0, -40);
        
        if (item.category === 'hero') {
            // Larger hero portrait
            const portraitBg = this.add.graphics();
            const bgColor = canAfford ? 0x444444 : 0x222222;
            portraitBg.fillStyle(bgColor);
            portraitBg.fillRoundedRect(-70, -50, 140, 100, 12);
            portraitBg.lineStyle(3, canAfford ? 0x888888 : 0x444444);
            portraitBg.strokeRoundedRect(-70, -50, 140, 100, 12);
            
            // Hero type with larger icon
            const typeColor = item.type === 'damage' ? 0xff6666 : 
                             item.type === 'support' ? 0x66ff66 : 0x6666ff;
            const typeIcon = this.add.circle(0, 0, 35, typeColor, canAfford ? 0.9 : 0.4);
            
            const typeSymbol = item.type === 'damage' ? '⚔️' : 
                              item.type === 'support' ? '🛡️' : '⚡';
            const symbolText = this.add.text(0, 0, typeSymbol, {
                fontSize: '32px',
                color: '#ffffff'
            });
            symbolText.setOrigin(0.5);
            
            visual.add([portraitBg, typeIcon, symbolText]);
        } else {
            // Larger item icon
            const itemIcon = this.createItemIcon(item, canAfford);
            visual.add(itemIcon);
        }
        
        return visual;
    }

    createItemIcon(item, canAfford) {
        const iconBg = this.add.graphics();
        const rarityColor = item.rarity ? this.getRarityColor(item.rarity) : 0x8b4513;
        
        // Ornate circular background
        iconBg.fillStyle(canAfford ? 0x3a2f28 : 0x222222);
        iconBg.fillCircle(0, 0, 50);
        iconBg.lineStyle(4, canAfford ? rarityColor : 0x444444, canAfford ? 1.0 : 0.5);
        iconBg.strokeCircle(0, 0, 50);
        
        // Inner circle for depth
        iconBg.lineStyle(2, canAfford ? rarityColor : 0x333333, canAfford ? 0.6 : 0.3);
        iconBg.strokeCircle(0, 0, 42);
        
        // Item type specific icons with better visuals
        let iconSymbol = '?';
        let iconColor = '#ffffff';
        
        switch(item.type) {
            case 'consumable':
                iconSymbol = '🧪';
                iconColor = '#66ff88';
                break;
            case 'equipment':
                iconSymbol = '💍';
                iconColor = '#ffd700';
                break;
            case 'deck_modifier':
                iconSymbol = '🃏';
                iconColor = '#ff6666';
                break;
        }
        
        const iconText = this.add.text(0, 0, iconSymbol, {
            fontSize: '40px',
            color: canAfford ? iconColor : '#666666'
        });
        iconText.setOrigin(0.5);
        
        return this.add.container(0, 0, [iconBg, iconText]);
    }

    getRarityColor(rarity) {
        switch(rarity) {
            case 'common': return 0x9e9e9e;
            case 'uncommon': return 0x4caf50;
            case 'rare': return 0x2196f3;
            case 'legendary': return 0xff9800;
            case 'mythic': return 0x9c27b0;
            default: return 0x8b4513;
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
        const item = this.shopInventory[itemIndex];
        
        if (!item) {
            console.error('Shop item not found at index:', itemIndex);
            return;
        }
        
        if (this.playerGold >= item.price) {
            if (item.category === 'hero') {
                this.buyHero(item, itemIndex);
            } else {
                this.buyRegularItem(item, itemIndex);
            }
        }
    }
    
    buyRegularItem(item, itemIndex) {
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

        // Remove item from shop inventory (sold out)
        this.shopInventory.splice(itemIndex, 1);
        this.refreshShopDisplay();
    }
    
    buyHero(heroData, itemIndex) {
        if (!heroData || typeof heroData.price !== 'number') {
            console.error('Invalid hero data:', heroData);
            return;
        }
        
        if (this.partyManager && this.partyManager.ownsHero(heroData.id)) {
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
            }

            // Show purchase feedback
            this.showPurchaseEffect(heroData);

            // Remove hero from shop inventory (sold out)
            this.shopInventory.splice(itemIndex, 1);
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

        // Recreate shop display with remaining items
        this.createShopDisplay();
    }

    updateGoldDisplay() {
        this.goldDisplay.setText(`${this.playerGold}`);
    }

    createContinueButton() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Ornate continue button
        const buttonContainer = this.add.container(screenWidth / 2, screenHeight - 120);
        
        const continueButton = this.add.graphics();
        continueButton.fillGradientStyle(0x8b4513, 0x8b4513, 0x654321, 0x654321, 1);
        continueButton.fillRoundedRect(-150, -40, 300, 80, 20);
        continueButton.lineStyle(4, 0xd4af37, 1.0);
        continueButton.strokeRoundedRect(-150, -40, 300, 80, 20);
        
        // Inner glow
        continueButton.lineStyle(2, 0xffd700, 0.6);
        continueButton.strokeRoundedRect(-144, -34, 288, 68, 16);

        const continueText = this.add.text(
            0,
            0,
            'VENTURE FORTH',
            {
                fontSize: '36px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#8b4513',
                strokeThickness: 2
            }
        );
        continueText.setOrigin(0.5);
        
        buttonContainer.add([continueButton, continueText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-150, -40, 300, 80);
        buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        buttonContainer.on('pointerdown', () => this.continueToNextBattle());
        buttonContainer.on('pointerover', () => {
            buttonContainer.setScale(1.05);
            continueText.setTint(0xffffff);
        });
        buttonContainer.on('pointerout', () => {
            buttonContainer.setScale(1.0);
            continueText.clearTint();
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