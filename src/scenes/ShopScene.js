import Phaser from 'phaser';
import Inventory from '../inventory/Inventory.js';
import PartyManager from '../party/PartyManager.js';
import { createHero, getAllHeroShopData } from '../heroes/HeroRegistry.js';
import { packManager } from '../packs/PackManager.js';

// Import the custom pipeline
import FoilPipeline from '../rendering/FoilPipeline.js';

export default class ShopScene extends Phaser.Scene {
    constructor() {
        super({ key: 'ShopScene' });
        // Properties for tilt tracking
        this.currentTiltAmount = 0;
        this.currentTiltAngle = 0;
    }

    // Add foil pipeline
    preload() {
        const renderer = this.renderer;
        if (renderer.pipelines && !renderer.pipelines.has('FoilShader')) {
            renderer.pipelines.add('FoilShader', new FoilPipeline({
                game: this.game,
                renderer: renderer
            }));
        }
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

        // Hold a reference to the pipeline instance
        this.foilPipeline = this.renderer.pipelines.get('FoilShader');
    }

    // Update loop to handle tilt for shader
    update(time, delta) {
        // Update the tilt uniforms on our custom pipeline instance
        if (this.foilPipeline) {
            this.foilPipeline.setTilt(this.currentTiltAmount, this.currentTiltAngle);
        }
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

        // Get available packs
        const availablePacks = packManager.getRandomPacksForShop(2).map(pack => {
            pack.category = 'pack';
            return pack;
        });

        // Combine all purchaseables
        const allPurchaseables = [...allItems, ...availableHeroes, ...availablePacks];

        // Randomly select 6 items for the shop (Balatro-style limited selection)
        this.shopInventory = [];
        const shuffled = [...allPurchaseables].sort(() => Math.random() - 0.5);

        // Take first 6 items (2 heroes max, 1 pack max)
        let heroCount = 0;
        let packCount = 0;
        for (const item of shuffled) {
            if (this.shopInventory.length >= 6) break;
            if (item.category === 'hero' && heroCount >= 2) continue;
            if (item.category === 'pack' && packCount >= 1) continue;

            this.shopInventory.push(item);
            if (item.category === 'hero') heroCount++;
            if (item.category === 'pack') packCount++;
        }

        console.log('Generated shop inventory:', this.shopInventory.length, 'items');
    }

    createShopDisplay() {
        const screenWidth = this.cameras.main.width;
        const startY = 380;
        const itemsPerRow = 3;
        const cardSpacing = 360;
        const rowSpacing = 480;

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
        const cardWidth = 320;
        const cardHeight = 420;
        const itemBg = this.add.graphics();

        // Rich card background with gradient - no borders (skip for packs)
        if (item.category !== 'pack') {
            if (canAfford) {
                itemBg.fillGradientStyle(0x3a2f28, 0x3a2f28, 0x2a1f18, 0x2a1f18, 1);
            } else {
                itemBg.fillGradientStyle(0x2a1f18, 0x2a1f18, 0x1a0f08, 0x1a0f08, 1);
            }
            itemBg.fillRoundedRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight, 16);
        }

        // Get rarity color for other UI elements
        const rarityColor = item.rarity ? this.getRarityColor(item.rarity) : 0x8b4513;

        // Price display - different styling for packs vs regular items
        let priceContainer;

        if (item.category === 'pack') {
            // Special pack price display positioned below the "CARD PACK" label
            priceContainer = this.add.container(0, -cardHeight/2 + 75);
            const priceBg = this.add.graphics();

            // Wide pack price banner
            priceBg.fillGradientStyle(0x000000, 0x000000, 0x333333, 0x333333, 0.9);
            priceBg.fillRoundedRect(-140, -20, 280, 40, 20);
            priceBg.lineStyle(4, canAfford ? 0xffd700 : 0x666666, 1.0);
            priceBg.strokeRoundedRect(-140, -20, 280, 40, 20);

            const priceText = this.add.text(20, 0, `${item.price}`, {
                fontSize: '32px',
                color: canAfford ? '#ffd700' : '#666666',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            priceText.setOrigin(0.5);

            // Larger coin icon for packs
            const coinIcon = this.add.text(-30, 0, '🪙', {
                fontSize: '28px'
            });
            coinIcon.setOrigin(0.5);

            priceContainer.add([priceBg, coinIcon, priceText]);
        } else {
            // Regular item price display
            priceContainer = this.add.container(0, -cardHeight/2 + 35);
            const priceBg = this.add.graphics();

            // Ornate price badge
            priceBg.fillGradientStyle(0x8b4513, 0x8b4513, 0x654321, 0x654321, 1);
            priceBg.fillRoundedRect(-60, -20, 120, 40, 20);
            priceBg.lineStyle(4, canAfford ? 0xd4af37 : 0x666666, 1.0);
            priceBg.strokeRoundedRect(-60, -20, 120, 40, 20);

            // Inner glow
            priceBg.lineStyle(2, canAfford ? 0xffd700 : 0x888888, 0.6);
            priceBg.strokeRoundedRect(-54, -14, 108, 28, 16);

            const priceText = this.add.text(15, 0, `${item.price}`, {
                fontSize: '32px',
                color: canAfford ? '#ffd700' : '#666666',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            priceText.setOrigin(0.5);

            // Coin icon - larger and more prominent
            const coinIcon = this.add.text(-30, 0, '🪙', {
                fontSize: '28px'
            });
            coinIcon.setOrigin(0.5);

            priceContainer.add([priceBg, coinIcon, priceText]);
        }

        // Rarity banner - larger and more elegant
        if (item.rarity) {
            const rarityBanner = this.add.graphics();
            rarityBanner.fillStyle(rarityColor, 0.9);
            rarityBanner.fillRoundedRect(-cardWidth/2, -cardHeight/2 + 80, cardWidth, 40, 12);

            const rarityText = this.add.text(0, -cardHeight/2 + 100, item.rarity.toUpperCase(), {
                fontSize: '18px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            rarityText.setOrigin(0.5);
            container.add([rarityBanner, rarityText]);
        }

        // Item visual representation (larger)
        const itemVisual = this.createItemVisual(item, canAfford, cardWidth, cardHeight);

        // Item name and description - skip both for packs
        let nameText, descText;

        if (item.category === 'pack') {
            // For packs, we only show the "CARD PACK" label at top and price at bottom
            // No name or description text needed
        } else {
            // Regular items get both name and description
            nameText = this.add.text(0, cardHeight/2 - 80, item.name, {
                fontSize: '24px',
                color: canAfford ? '#d4af37' : '#666666',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                align: 'center',
                wordWrap: { width: cardWidth - 30 },
                stroke: '#000000',
                strokeThickness: 2
            });
            nameText.setOrigin(0.5);

            descText = this.add.text(0, cardHeight/2 - 35, item.description, {
                fontSize: '16px',
                color: canAfford ? '#cccccc' : '#555555',
                fontFamily: 'Arial',
                align: 'center',
                wordWrap: { width: cardWidth - 40 },
                stroke: '#000000',
                strokeThickness: 1
            });
            descText.setOrigin(0.5);
        }

        // Add to container
        const elementsToAdd = [itemBg, priceContainer, itemVisual];
        if (nameText) {
            elementsToAdd.push(nameText);
        }
        if (descText) {
            elementsToAdd.push(descText);
        }
        container.add(elementsToAdd);

        // Make entire card interactive
        const hitArea = new Phaser.Geom.Rectangle(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
        container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        if (canAfford) {
            container.on('pointerdown', (pointer, localX, localY, event) => {
                if (event) event.stopPropagation();
                this.buyItem(index);
            });

            if (item.category === 'pack') {
                // Store original position for reset
                container.originalX = container.x;
                container.originalY = container.y;

                // Special pack hover with 3D tilt effect
                container.on('pointerover', () => {
                    container.setScale(1.08);
                });
                container.on('pointermove', (pointer) => {
                    // Calculate mouse position relative to container center
                    const bounds = container.getBounds();
                    const centerX = bounds.centerX;
                    const centerY = bounds.centerY;
                    
                    // Use the actual container bounds for proper range
                    const halfWidth = bounds.width / 2;
                    const halfHeight = bounds.height / 2;
                    const mouseX = (pointer.worldX - centerX) / halfWidth;
                    // Add Y offset to compensate for texture positioning bias
                    const yOffset = 150; // Even larger offset to center properly
                    const mouseY = (pointer.worldY - centerY - yOffset) / halfHeight;
                    
                    // Find the pack mesh in the container
                    const packMesh = this.findPackMesh(container);
                    if (packMesh) {
                        this.updatePackTilt(packMesh, mouseX, mouseY, bounds.width, bounds.height);
                    }
                });
                container.on('pointerout', () => {
                    container.setScale(1.0);
                    const packMesh = this.findPackMesh(container);
                    if (packMesh) {
                        this.resetPackTilt(packMesh);
                    }
                });
            } else {
                // Regular item hover
                container.on('pointerover', () => {
                    container.setScale(1.08);
                });
                container.on('pointerout', () => {
                    container.setScale(1.0);
                });
            }
        }

        return container;
    }

    createItemVisual(item, canAfford, cardWidth, cardHeight) {
        const visual = this.add.container(0, -40);

        if (item.category === 'hero') {
            // Larger hero portrait
            const portraitBg = this.add.graphics();
            const bgColor = canAfford ? 0x444444 : 0x222222;
            portraitBg.fillStyle(bgColor);
            portraitBg.fillRoundedRect(-90, -65, 180, 130, 16);
            portraitBg.lineStyle(4, canAfford ? 0x888888 : 0x444444);
            portraitBg.strokeRoundedRect(-90, -65, 180, 130, 16);

            // Hero type with larger icon
            const typeColor = item.type === 'damage' ? 0xff6666 :
                             item.type === 'support' ? 0x66ff66 : 0x6666ff;
            const typeIcon = this.add.circle(0, 0, 45, typeColor, canAfford ? 0.9 : 0.4);

            const typeSymbol = item.type === 'damage' ? '⚔️' :
                              item.type === 'support' ? '🛡️' : '⚡';
            const symbolText = this.add.text(0, 0, typeSymbol, {
                fontSize: '40px',
                color: '#ffffff'
            });
            symbolText.setOrigin(0.5);

            visual.add([portraitBg, typeIcon, symbolText]);
        } else if (item.category === 'pack') {
            // Create the mesh with texture following the working version
            // Scaled down mesh size
            const meshWidth = 1.6;   // 2 * 0.8 = 1.6 units wide
            const meshHeight = 2.24; // 2.8 * 0.8 = 2.24 units tall
            
            const packMesh = this.add.mesh(0, 60, item.artKey);
            const plane = this.createPlaneGeometry(meshWidth, meshHeight, 1, 1);

            // Add geometry to mesh following working version
            packMesh.addVertices(plane.vertices, plane.uvs, plane.indices, true, plane.normals);
            packMesh.hideCCW = false;
            
            // Position mesh forward in Z space like validation code
            packMesh.panZ(20);
            
            // Center the mesh model position for proper rotation around center
            packMesh.modelPosition.set(0, 0, 0);

            // Save original verts for tilt
            packMesh.originalVertices = [...plane.vertices];
            packMesh.originalUvs = [...plane.uvs];
            packMesh.originalIndices = [...plane.indices];
            packMesh.originalNormals = [...plane.normals];
            
            // Store dimensions for tilt calculations
            packMesh.meshWidth = meshWidth;
            packMesh.meshHeight = meshHeight;

            // Apply foil shader
            this.createFoilShader(packMesh, canAfford);

            if (!canAfford) {
                packMesh.setTint(0x666666);
            }

            // "CARD PACK" label at the very top
            const labelBg = this.add.graphics();
            labelBg.fillStyle(0x000000, 0.8);
            labelBg.fillRoundedRect(-100, -180, 200, 35, 18);

            const labelText = this.add.text(0, -162, 'CARD PACK', {
                fontSize: '20px',
                color: '#ffd700',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            });
            labelText.setOrigin(0.5);

            visual.add([packMesh, labelBg, labelText]);
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

        // Larger ornate circular background
        iconBg.fillStyle(canAfford ? 0x3a2f28 : 0x222222);
        iconBg.fillCircle(0, 0, 65);
        iconBg.lineStyle(5, canAfford ? rarityColor : 0x444444, canAfford ? 1.0 : 0.5);
        iconBg.strokeCircle(0, 0, 65);

        // Inner circle for depth
        iconBg.lineStyle(3, canAfford ? rarityColor : 0x333333, canAfford ? 0.6 : 0.3);
        iconBg.strokeCircle(0, 0, 55);

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
            fontSize: '52px',
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


    buyItem(itemIndex) {
        const item = this.shopInventory[itemIndex];

        if (!item) {
            console.error('Shop item not found at index:', itemIndex);
            return;
        }

        if (this.playerGold >= item.price) {
            if (item.category === 'hero') {
                this.buyHero(item, itemIndex);
            } else if (item.category === 'pack') {
                this.buyPack(item, itemIndex);
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

    buyPack(packData, itemIndex) {
        if (!packData || typeof packData.price !== 'number') {
            console.error('Invalid pack data:', packData);
            return;
        }

        // Deduct gold
        this.playerGold -= packData.price;
        this.inventory.addResource('gold', -packData.price);
        this.updateGoldDisplay();

        // Show purchase feedback
        this.showPurchaseEffect(packData);

        // Remove pack from shop inventory (sold out)
        this.shopInventory.splice(itemIndex, 1);
        this.refreshShopDisplay();

        // Open pack with animation
        this.openPack(packData);
    }

    openPack(packData) {
        // Launch pack opening scene
        this.scene.launch('PackOpeningScene', {
            pack: packData,
            inventory: this.inventory,
            onComplete: (revealedCards) => {
                console.log('Pack opened! Revealed cards:', revealedCards);
                // Pack opening scene will handle adding cards to inventory
            }
        });
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

    createFoilShader(packMesh, canAfford) {
        if (!canAfford) return;

        try {
            // Apply the foil pipeline
            packMesh.setPipeline('FoilShader');
            
            // Create tween to animate the time uniform
            this.tweens.add({
                targets: { time: 0 },
                time: Math.PI * 2,
                duration: 8000,
                repeat: -1,
                onUpdate: (tween) => {
                    if (packMesh.pipeline && packMesh.pipeline.set1f) {
                        packMesh.pipeline.set1f('time', tween.getValue());
                    }
                }
            });
        } catch (error) {
            console.warn('Foil shader failed, using fallback');
            this.createFoilFallback(packMesh);
        }
    }

    createFoilFallback(packImage) {
        // Fallback foil effect using tween animations
        const originalTint = packImage.tint;

        // Create shimmering effect with tint changes
        this.tweens.add({
            targets: packImage,
            tint: { from: 0xffffff, to: 0xddddff },
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Add subtle scale pulsing
        this.tweens.add({
            targets: packImage,
            scaleX: { from: 1.0, to: 1.02 },
            scaleY: { from: 1.0, to: 1.02 },
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
    }

    createPlaneGeometry(width, height, widthSegments = 1, heightSegments = 1) {
        // Create PlaneGeometry exactly like the working validation code
        const vertices = [];
        const uvs = [];
        const normals = [];
        const indices = [];

        const width_half = width / 2;
        const height_half = height / 2;

        const gridX = Math.floor(widthSegments);
        const gridY = Math.floor(heightSegments);

        const gridX1 = gridX + 1;
        const gridY1 = gridY + 1;

        const segment_width = width / gridX;
        const segment_height = height / gridY;

        // Generate vertices, normals, and uvs
        for (let iy = 0; iy < gridY1; iy++) {
            const y = iy * segment_height - height_half;

            for (let ix = 0; ix < gridX1; ix++) {
                const x = ix * segment_width - width_half;

                vertices.push(x, -y, 0);
                normals.push(0, 0, 1);
                uvs.push(ix / gridX);
                uvs.push(iy / gridY);  // Remove the flip to fix upside-down texture
            }
        }

        // Generate indices
        for (let iy = 0; iy < gridY; iy++) {
            for (let ix = 0; ix < gridX; ix++) {
                const a = ix + gridX1 * iy;
                const b = ix + gridX1 * (iy + 1);
                const c = (ix + 1) + gridX1 * (iy + 1);
                const d = (ix + 1) + gridX1 * iy;

                indices.push(a, b, d);
                indices.push(b, c, d);
            }
        }

        const plane = { vertices, uvs, normals, indices };
        
        // Pad UVS array as in working validation code
        this.padUVSArray(plane);
        
        return plane;
    }
    
    padUVSArray(geom) {
        // Pad UVS array exactly like the working validation code
        var verticesElements = geom.vertices.length;
        var uvsElements = geom.uvs.length;

        var fillElements = new Array(verticesElements - uvsElements).fill(0);

        geom.uvs = geom.uvs.concat(fillElements);
    }

    findPackMesh(container) {
        // Find the pack image object in the container's children
        for (let child of container.list) {
            if (child.isPackImage || child.type === 'Mesh') {
                return child;
            }
            // If it's a nested container, search recursively
            if (child.list) {
                for (let nestedChild of child.list) {
                    if (nestedChild.isPackImage || nestedChild.type === 'Mesh') {
                        return nestedChild;
                    }
                }
            }
        }
        return null;
    }

    updatePackTilt(packMesh, mouseX, mouseY, cardWidth, cardHeight) {
        const tiltIntensity = 0.15;  // Rotation intensity in radians
        const mx = Math.max(-1, Math.min(1, mouseX));
        const my = Math.max(-1, Math.min(1, mouseY));

        // Physics-correct rotation - pressed corner goes down
        packMesh.modelRotation.x = my * tiltIntensity;
        packMesh.modelRotation.y = mx * tiltIntensity;
        
        // Calculate tilt amount and angle for foil shader
        const tiltAmount = Math.sqrt(mx * mx + my * my); // Distance from center = total tilt
        const tiltAngle = Math.atan2(my, mx); // Angle of tilt direction
        
        // Store for shader update
        this.currentTiltAmount = tiltAmount;
        this.currentTiltAngle = tiltAngle;
        
        // Z rotation based on distance from center for twist effect
        const distanceFromCenter = Math.sqrt(mx * mx + my * my);
        const maxDistance = Math.sqrt(2); // Max possible distance (corner)
        packMesh.modelRotation.z = (mx + my) * 0.05 * (distanceFromCenter / maxDistance);

        // Optional: Add subtle shadow based on tilt
        const container = packMesh.parentContainer;
        if (container && !container.shadowGraphics) {
            container.shadowGraphics = this.add.graphics();
            container.shadowGraphics.setDepth(container.depth - 1);
        }

        if (container && container.shadowGraphics) {
            container.shadowGraphics.clear();
            container.shadowGraphics.fillStyle(0x000000, 0.2);

            const shadowOffsetX = mx * 4;
            const shadowOffsetY = my * 3 + 8;

            container.shadowGraphics.fillRoundedRect(
                container.x + shadowOffsetX - 50,
                container.y + shadowOffsetY - 70,
                100,
                140,
                8
            );
        }
    }

    resetPackTilt(packMesh) {
        // Reset 3D rotations to zero
        packMesh.modelRotation.x = 0;
        packMesh.modelRotation.y = 0;
        packMesh.modelRotation.z = 0;

        // Remove shadow
        const container = packMesh.parentContainer;
        if (container && container.shadowGraphics) {
            container.shadowGraphics.clear();
        }
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
