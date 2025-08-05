import Phaser from 'phaser';
import Inventory from '../inventory/Inventory.js';
import PartyManager from '../party/PartyManager.js';
import { createHero, getAllHeroShopData } from '../heroes/HeroRegistry.js';
import { packManager } from '../packs/PackManager.js';
import { EquipmentRegistry } from '../equipment/EquipmentRegistry.js';
import { Equipment } from '../equipment/Equipment.js';
import { EquipmentMenu } from '../ui/EquipmentMenu.js';
import { SVGIconManager } from '../ui/SVGIconManager.js';

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
        this.heroManager = data.heroManager || null; // Get heroManager from battle
        this.playerDeck = data.playerDeck || null;

        // Create party manager if not provided
        if (!this.partyManager) {
            this.partyManager = new PartyManager(this);
        }
        
        // If no heroes exist anywhere, create a starter hero
        const partyHeroes = this.partyManager.getAllHeroes();
        const heroManagerHeroes = this.heroManager ? this.heroManager.getAllHeroes() : [];
        
        if (partyHeroes.length === 0 && heroManagerHeroes.length === 0) {
            console.log('No heroes found, creating starter hero for shop');
            const starterHero = createHero('starter_hero');
            this.partyManager.purchaseHero(starterHero);
        }
        
        // Use heroManager as fallback if no partyManager heroes
        if (this.heroManager && (!this.partyManager || this.partyManager.getAllHeroes().length === 0)) {
            console.log('Using heroManager for hero portraits');
        }
        
        // Initialize equipment menu
        this.equipmentMenu = new EquipmentMenu(this);
    }

    async create() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Load the token icon first
        await SVGIconManager.loadSVGAsTexture(this, 'TOKEN', 'token-icon', {
            size: 32,
            color: '#ffffff'
        });

        // Rich gradient background like Balatro
        this.createBackground();

        // Modern shop title
        this.titleText = this.add.text(
            screenWidth / 2,
            120,
            'SHOP',
            {
                fontSize: '72px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: '300',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        this.titleText.setOrigin(0.5);

        // Gold display with ornate frame
        this.createGoldDisplay();

        // Generate limited shop inventory
        this.generateShopInventory();

        // Create shop display
        this.createShopDisplay();
        
        // Create inventory grid
        console.log('=== CALLING createInventoryGrid ===');
        this.createInventoryGrid();
        
        // Hero portraits for equipment management
        console.log('=== CALLING createHeroPortraits ===');
        this.createHeroPortraits();

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

        // Modern dark background
        const bg = this.add.graphics();
        bg.fillStyle(0x0a0a0a, 1); // Very dark background
        bg.fillRect(0, 0, screenWidth, screenHeight);

        // Subtle dark gradient overlay
        const overlay = this.add.graphics();
        overlay.fillGradientStyle(0x1a1a1a, 0x1a1a1a, 0x0a0a0a, 0x0a0a0a, 0.6);
        overlay.fillRect(0, 0, screenWidth, screenHeight);

        // Clean angular border
        const border = this.add.graphics();
        border.lineStyle(2, 0x333333, 0.8);
        border.strokeRect(40, 40, screenWidth - 80, screenHeight - 80);
    }

    createGoldDisplay() {
        const screenWidth = this.cameras.main.width;

        // Modern angular frame
        const goldFrame = this.add.graphics();
        goldFrame.fillStyle(0x1a1a1a, 0.9);
        goldFrame.fillRect(80, 60, 280, 80);
        goldFrame.lineStyle(2, 0x444444, 1.0);
        goldFrame.strokeRect(80, 60, 280, 80);

        this.goldDisplay = this.add.text(
            220,
            100,
            `${this.playerGold}`,
            {
                fontSize: '42px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: '500'
            }
        );
        this.goldDisplay.setOrigin(0.5);

        // Gold coin icon
        const coinIcon = this.add.image(140, 100, 'token-icon');
        coinIcon.setScale(0.8);
        coinIcon.setOrigin(0.5);
    }

    generateShopInventory() {
        // Get equipment from the new system
        const allEquipment = EquipmentRegistry.getShopEquipment(4).map(equipment => ({
            ...equipment.toJSON(),
            category: 'equipment'
        }));
        
        // Keep some consumables for variety
        const consumables = [
            {
                name: 'Health Potion',
                description: 'Restore 50 health to active hero',
                price: 8,
                type: 'consumable',
                category: 'consumable',
                rarity: 'common',
                effect: { type: 'heal', value: 50 }
            }
        ];
        
        const allItems = [...allEquipment, ...consumables];

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
        const screenHeight = this.cameras.main.height;
        this.itemContainers = [];

        // Separate items by category
        const equipment = this.shopInventory.filter(item => item.category === 'equipment');
        const cardsAndPacks = this.shopInventory.filter(item => item.category === 'pack' || item.category === 'hero');

        // Simple centered grid layout
        const allItems = [...equipment, ...cardsAndPacks];

        // Simple shop items grid - properly distributed
        if (allItems.length > 0) {
            const cols = 3;
            const itemSpacing = 280;
            const rowSpacing = 380;
            const totalRows = Math.ceil(allItems.length / cols);
            
            // Start position (top-left of grid area) - moved down
            const gridStartY = 400; // Moved down from 300 to 400
            const gridCenterX = screenWidth / 2;
            const gridWidth = (cols - 1) * itemSpacing;
            const gridStartX = gridCenterX - gridWidth/2;
            
            allItems.forEach((item, index) => {
                const col = index % cols;
                const row = Math.floor(index / cols);
                
                // Simple grid positioning
                const itemX = gridStartX + (col * itemSpacing);
                const itemY = gridStartY + (row * rowSpacing);
                
                const container = this.createShopItem(item, itemX, itemY, index);
                this.itemContainers.push(container);
            });
        }
    }


    createShopItem(item, x, y, index) {
        const container = this.add.container(x, y);
        const canAfford = this.playerGold >= item.price;

        // Standard shop item size
        const cardWidth = 280;
        const cardHeight = 360;
        const itemBg = this.add.graphics();

        // Modern angular card background (skip for packs)
        if (item.category !== 'pack') {
            if (canAfford) {
                itemBg.fillStyle(0x1a1a1a, 0.9);
                itemBg.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
                itemBg.lineStyle(2, 0x444444, 0.8);
                itemBg.strokeRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
            } else {
                itemBg.fillStyle(0x0f0f0f, 0.7);
                itemBg.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
                itemBg.lineStyle(1, 0x333333, 0.5);
                itemBg.strokeRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
            }
        }

        // Get rarity color for other UI elements
        const rarityColor = item.rarity ? this.getRarityColor(item.rarity) : 0x8b4513;

        // Price display - different styling for packs vs regular items
        let priceContainer;

        if (item.category === 'pack') {
            // Angular pack price display
            priceContainer = this.add.container(0, -cardHeight/2 + 75);
            const priceBg = this.add.graphics();

            // Clean pack price (no background box)

            const priceText = this.add.text(20, 0, `${item.price}`, {
                fontSize: '28px',
                color: canAfford ? '#ffffff' : '#666666',
                fontFamily: 'Arial',
                fontWeight: '500'
            });
            priceText.setOrigin(0.5);

            // Clean coin icon for packs
            const coinIcon = this.add.image(-30, 0, 'token-icon');
            coinIcon.setScale(0.6);
            coinIcon.setOrigin(0.5);

            priceContainer.add([priceBg, coinIcon, priceText]);
        } else {
            // Angular regular item price display
            priceContainer = this.add.container(0, -cardHeight/2 + 35);
            const priceBg = this.add.graphics();

            // Clean price (no background box)

            const priceText = this.add.text(15, 0, `${item.price}`, {
                fontSize: '28px',
                color: canAfford ? '#ffffff' : '#666666',
                fontFamily: 'Arial',
                fontWeight: '500'
            });
            priceText.setOrigin(0.5);

            // Clean coin icon
            const coinIcon = this.add.image(-30, 0, 'token-icon');
            coinIcon.setScale(0.6);
            coinIcon.setOrigin(0.5);

            priceContainer.add([priceBg, coinIcon, priceText]);
        }


        // Item visual representation (larger)
        const itemVisual = this.createItemVisual(item, canAfford, cardWidth, cardHeight);

        // Item name and description - skip both for packs
        let nameText, descText;

        if (item.category === 'pack') {
            // For packs, we only show the "CARD PACK" label at top and price at bottom
            // No name or description text needed
        } else {
            // Regular items get both name and description - modern styling
            nameText = this.add.text(0, cardHeight/2 - 80, item.name, {
                fontSize: '22px',
                color: canAfford ? '#ffffff' : '#666666',
                fontFamily: 'Arial',
                fontWeight: '600',
                align: 'center',
                wordWrap: { width: cardWidth - 30 }
            });
            nameText.setOrigin(0.5);

            descText = this.add.text(0, cardHeight/2 - 35, item.description, {
                fontSize: '14px',
                color: canAfford ? '#cccccc' : '#555555',
                fontFamily: 'Arial',
                fontWeight: '400',
                align: 'center',
                wordWrap: { width: cardWidth - 40 }
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

                // Pack hover with 3D tilt effect (no scaling)
                container.on('pointerover', () => {
                    // No scaling, just 3D tilt continues to work
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
                    const packMesh = this.findPackMesh(container);
                    if (packMesh) {
                        this.resetPackTilt(packMesh);
                    }
                });
            } else {
                // Regular item hover with background color tween
                container.hoverValue = 0; // Add a hover value to interpolate
                
                container.on('pointerover', () => {
                    if (canAfford) {
                        // Tween hover value from 0 to 1
                        this.tweens.add({
                            targets: container,
                            hoverValue: 1,
                            duration: 200,
                            ease: 'Power2',
                            onUpdate: () => {
                                const t = container.hoverValue;
                                // Interpolate colors
                                const bgColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                                    Phaser.Display.Color.ValueToColor(0x1a1a1a),
                                    Phaser.Display.Color.ValueToColor(0x242424),
                                    1,
                                    t
                                );
                                const borderColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                                    Phaser.Display.Color.ValueToColor(0x444444),
                                    Phaser.Display.Color.ValueToColor(0x666666),
                                    1,
                                    t
                                );
                                
                                itemBg.clear();
                                itemBg.fillStyle(Phaser.Display.Color.GetColor(bgColor.r, bgColor.g, bgColor.b), 0.9);
                                itemBg.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
                                itemBg.lineStyle(2, Phaser.Display.Color.GetColor(borderColor.r, borderColor.g, borderColor.b), 0.8);
                                itemBg.strokeRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
                            }
                        });
                    }
                });
                container.on('pointerout', () => {
                    if (canAfford) {
                        // Tween hover value back to 0
                        this.tweens.add({
                            targets: container,
                            hoverValue: 0,
                            duration: 200,
                            ease: 'Power2',
                            onUpdate: () => {
                                const t = container.hoverValue;
                                // Interpolate colors
                                const bgColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                                    Phaser.Display.Color.ValueToColor(0x1a1a1a),
                                    Phaser.Display.Color.ValueToColor(0x242424),
                                    1,
                                    t
                                );
                                const borderColor = Phaser.Display.Color.Interpolate.ColorWithColor(
                                    Phaser.Display.Color.ValueToColor(0x444444),
                                    Phaser.Display.Color.ValueToColor(0x666666),
                                    1,
                                    t
                                );
                                
                                itemBg.clear();
                                itemBg.fillStyle(Phaser.Display.Color.GetColor(bgColor.r, bgColor.g, bgColor.b), 0.9);
                                itemBg.fillRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
                                itemBg.lineStyle(2, Phaser.Display.Color.GetColor(borderColor.r, borderColor.g, borderColor.b), 0.8);
                                itemBg.strokeRect(-cardWidth/2, -cardHeight/2, cardWidth, cardHeight);
                            }
                        });
                    }
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
            portraitBg.fillRect(-90, -65, 180, 130);
            portraitBg.lineStyle(4, canAfford ? 0x888888 : 0x444444);
            portraitBg.strokeRect(-90, -65, 180, 130);

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
            // Create the mesh with texture - smaller for grid layout
            // Further scaled down mesh size to match other grid items
            const meshWidth = 1.0;   // Reduced from 1.6 to 1.0
            const meshHeight = 1.4;  // Reduced from 2.24 to 1.4
            
            const packMesh = this.add.mesh(0, 30, item.artKey); // Moved up from y:60 to y:30
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

            // "CARD PACK" label at the very top - adjusted for smaller mesh
            const labelBg = this.add.graphics();
            labelBg.fillStyle(0x000000, 0.8);
            labelBg.fillRect(-80, -140, 160, 30);

            const labelText = this.add.text(0, -125, 'CARD PACK', {
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
        // No background circle - clean icon only

        // Item type specific icons with better visuals
        let iconSymbol = '?';
        let iconColor = '#ffffff';

        if (item.category === 'equipment') {
            // Use equipment's custom icon if available
            iconSymbol = item.icon || (item.slot === 'armor' ? '🛡️' : '💍');
            iconColor = '#ffd700';
        } else {
            switch(item.type) {
                case 'consumable':
                    iconSymbol = '🧪';
                    iconColor = '#66ff88';
                    break;
                case 'deck_modifier':
                    iconSymbol = '🃏';
                    iconColor = '#ff6666';
                    break;
                default:
                    iconSymbol = '❓';
                    iconColor = '#cccccc';
            }
        }

        const iconText = this.add.text(0, 0, iconSymbol, {
            fontSize: '52px',
            color: canAfford ? iconColor : '#666666'
        });
        iconText.setOrigin(0.5);

        return this.add.container(0, 0, [iconText]);
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
        console.log('Buying item:', item);
        if (!item || typeof item.price !== 'number') {
            console.error('Invalid item data:', item);
            return;
        }

        // Deduct gold
        this.playerGold -= item.price;
        this.inventory.addResource('gold', -item.price);
        this.updateGoldDisplay();

        // Add item to inventory - force type to 'equipment' if undefined
        const itemType = item.type || 'equipment';
        this.inventory.addItem({
            id: `${itemType}_${Date.now()}`,
            name: item.name,
            description: item.description,
            type: itemType,
            effect: item.effect,
            icon: item.icon || '⚙️',
            rarity: item.rarity || 'common'
        });

        // Refresh inventory display
        this.refreshInventoryGrid();

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
            playerDeck: this.playerDeck,
            onComplete: (revealedCards) => {
                console.log('Pack opened! Revealed cards:', revealedCards);
                // Pack opening scene will handle adding cards to inventory and deck
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

        // Angular continue button
        const buttonContainer = this.add.container(screenWidth / 2, screenHeight - 120);

        const continueButton = this.add.graphics();
        continueButton.fillStyle(0x1a1a1a, 0.9);
        continueButton.fillRect(-150, -40, 300, 80);
        continueButton.lineStyle(2, 0x666666, 1.0);
        continueButton.strokeRect(-150, -40, 300, 80);

        const continueText = this.add.text(
            0,
            0,
            'CONTINUE',
            {
                fontSize: '32px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontWeight: '500'
            }
        );
        continueText.setOrigin(0.5);

        buttonContainer.add([continueButton, continueText]);

        // Make interactive
        const hitArea = new Phaser.Geom.Rectangle(-150, -40, 300, 80);
        buttonContainer.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        buttonContainer.on('pointerdown', () => this.continueToNextBattle());
        buttonContainer.on('pointerover', () => {
            buttonContainer.setScale(1.02);
            continueButton.clear();
            continueButton.fillStyle(0x2a2a2a, 0.9);
            continueButton.fillRect(-150, -40, 300, 80);
            continueButton.lineStyle(2, 0x888888, 1.0);
            continueButton.strokeRect(-150, -40, 300, 80);
        });
        buttonContainer.on('pointerout', () => {
            buttonContainer.setScale(1.0);
            continueButton.clear();
            continueButton.fillStyle(0x1a1a1a, 0.9);
            continueButton.fillRect(-150, -40, 300, 80);
            continueButton.lineStyle(2, 0x666666, 1.0);
            continueButton.strokeRect(-150, -40, 300, 80);
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
    
    // Create hero portraits for equipment management
    createHeroPortraits() {
        console.log('Creating hero portraits...');
        console.log('Party manager:', this.partyManager);
        console.log('Hero manager:', this.heroManager);
        
        let heroes = [];
        
        // Try partyManager first
        if (this.partyManager) {
            heroes = this.partyManager.getAllHeroes();
            console.log('Heroes from partyManager:', heroes);
        }
        
        // Fallback to heroManager if no heroes from partyManager
        if ((!heroes || heroes.length === 0) && this.heroManager) {
            console.log('Trying heroManager - type:', typeof this.heroManager.getAllHeroes);
            heroes = this.heroManager.getAllHeroes();
            console.log('Heroes from heroManager:', heroes);
            console.log('HeroManager object:', this.heroManager);
        }
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        if (!heroes || heroes.length === 0) {
            console.log('No heroes to show from either manager!');
            
            // Create a test message where heroes should be
            const noHeroesText = this.add.text(
                screenWidth - 400,
                screenHeight - 200,
                'NO HEROES FOUND',
                {
                    fontSize: '32px',
                    color: '#ff0000',
                    fontFamily: 'Arial'
                }
            );
            noHeroesText.setOrigin(0.5);
            
            return; // No heroes to show
        }
        
        // Position on left side, in upper area
        const heroSectionX = 300;
        const heroSectionY = screenHeight - 600;
        
        // Title for hero section
        const heroTitle = this.add.text(
            heroSectionX,
            heroSectionY - 60,
            'Heroes - Equipment',
            {
                fontSize: '24px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        heroTitle.setOrigin(0.5);
        
        // Create hero portraits in horizontal layout with wider spacing
        const portraitSpacing = 160;  // Wider spacing for bigger portraits
        const startX = heroSectionX - (heroes.length * portraitSpacing) / 2 + portraitSpacing / 2;
        
        console.log('Starting to create hero portraits, heroes count:', heroes.length);
        console.log('Hero section position:', heroSectionX, heroSectionY);
        
        // Initialize hero portraits tracking array
        this.heroPortraits = [];
        
        heroes.forEach((hero, index) => {
            console.log(`Creating portrait ${index} for hero:`, hero.name);
            const portraitX = startX + (index * portraitSpacing);
            const portraitY = heroSectionY;
            
            console.log(`Portrait position: x=${portraitX}, y=${portraitY}`);
            
            // Hero portrait container - bigger size
            const portraitContainer = this.add.container(portraitX, portraitY);
            
            // Portrait background - bigger and more interactive
            const portraitSize = 100;
            const portraitBg = this.add.graphics();
            portraitBg.fillStyle(0x444444, 0.9);
            portraitBg.lineStyle(3, 0x8b4513, 1);
            portraitBg.fillRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize);
            portraitBg.strokeRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize);
            portraitContainer.add(portraitBg);
            
            // Hero portrait image or fallback icon
            if (hero.portraitKey) {
                console.log('Using portrait image:', hero.portraitKey);
                const heroPortrait = this.add.image(0, -5, hero.portraitKey);
                heroPortrait.setDisplaySize(70, 70); // Fit within the portrait container
                heroPortrait.setOrigin(0.5);
                portraitContainer.add(heroPortrait);
            } else {
                console.log('No portrait key, using icon');
                const heroIcon = this.add.text(0, -10, this.getHeroIcon(hero), {
                    fontSize: '36px'
                });
                heroIcon.setOrigin(0.5);
                portraitContainer.add(heroIcon);
            }
            
            // Hero name - positioned better
            const heroName = this.add.text(0, 25, hero.name, {
                fontSize: '14px',
                color: '#ffffff',
                fontFamily: 'Arial'
            });
            heroName.setOrigin(0.5);
            portraitContainer.add(heroName);
            
            // Health bar - smaller and positioned better
            const healthBarWidth = 80;
            const healthBarBg = this.add.graphics();
            healthBarBg.fillStyle(0x333333, 0.8);
            healthBarBg.fillRect(-healthBarWidth/2, 38, healthBarWidth, 8);
            portraitContainer.add(healthBarBg);
            
            const healthPercent = hero.currentHealth / hero.maxHealth;
            const healthBar = this.add.graphics();
            healthBar.fillStyle(healthPercent > 0.5 ? 0x4caf50 : healthPercent > 0.25 ? 0xff9800 : 0xf44336, 1);
            healthBar.fillRect(-healthBarWidth/2, 38, healthBarWidth * healthPercent, 8);
            portraitContainer.add(healthBar);
            
            const healthText = this.add.text(0, 42, `${hero.currentHealth}/${hero.maxHealth}`, {
                fontSize: '8px',
                color: '#ffffff',
                fontFamily: 'Arial'
            });
            healthText.setOrigin(0.5);
            portraitContainer.add(healthText);
            
            // Equipment indicators - positioned at top corners
            const armorIcon = this.add.text(-25, -35, hero.equipment.armor ? '🛡️' : '⬜', {
                fontSize: '12px'
            });
            armorIcon.setOrigin(0.5);
            portraitContainer.add(armorIcon);
            
            const accessoryIcon = this.add.text(25, -35, hero.equipment.accessory ? '💍' : '⬜', {
                fontSize: '12px'
            });
            accessoryIcon.setOrigin(0.5);
            portraitContainer.add(accessoryIcon);
            
            // Create a proper interactive button
            const clickArea = this.add.rectangle(0, 0, portraitSize, portraitSize, 0x000000, 0);
            clickArea.setInteractive({ useHandCursor: true });
            portraitContainer.add(clickArea);
            
            clickArea.on('pointerdown', () => {
                console.log('Hero portrait clicked:', hero.name);
                this.openEquipmentMenu(hero);
            });
            clickArea.on('pointerover', () => {
                portraitContainer.setScale(1.1);
                // Create hover effect by changing the background
                portraitBg.clear();
                portraitBg.fillStyle(0x666666, 0.9);
                portraitBg.lineStyle(3, 0xffd700, 1);
                portraitBg.fillRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize);
                portraitBg.strokeRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize);
            });
            clickArea.on('pointerout', () => {
                portraitContainer.setScale(1.0);
                // Restore original background
                portraitBg.clear();
                portraitBg.fillStyle(0x444444, 0.9);
                portraitBg.lineStyle(3, 0x8b4513, 1);
                portraitBg.fillRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize);
                portraitBg.strokeRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize);
            });
            
            // Add to tracking array for drag and drop
            this.heroPortraits.push({
                hero: hero,
                container: portraitContainer,
                background: portraitBg, // Store reference to background for tinting
                x: portraitX,
                y: portraitY
            });
        });
    }
    
    // Get hero icon based on type
    getHeroIcon(hero) {
        console.log('Getting icon for hero:', hero.name, 'type:', hero.type);
        switch (hero.type) {
            case 'damage': return '⚔️';
            case 'support': return '🛡️';
            case 'hybrid': return '⚡';
            default: 
                console.log('Using default icon for hero type:', hero.type);
                return '👤';
        }
    }
    
    // Create inventory grid for equipment management
    createInventoryGrid() {
        console.log('=== INSIDE createInventoryGrid ===');
        console.log('Inventory object:', this.inventory);
        console.log('Inventory getItems method:', typeof this.inventory?.getItems);
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        console.log('Screen dimensions:', screenWidth, 'x', screenHeight);
        
        // Position in the right side, above hero portraits
        const inventoryX = screenWidth - 400;
        const inventoryY = screenHeight - 500;
        
        console.log('Inventory position:', inventoryX, inventoryY);
        
        // Title for inventory section
        const inventoryTitle = this.add.text(
            inventoryX,
            inventoryY - 50,
            'Your Inventory',
            {
                fontSize: '32px',
                color: '#d4af37',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        inventoryTitle.setOrigin(0.5);
        inventoryTitle.setData('isInventoryTitle', true);
        
        // Get equipment items from inventory
        let equipmentItems = [];
        if (this.inventory && this.inventory.getItems) {
            const allItems = this.inventory.getItems();
            console.log('All inventory items:', allItems);
            console.log('Item types:', allItems.map(item => `${item.name}: ${item.type}`));
            equipmentItems = allItems.filter(item => item.type === 'equipment');
            console.log('Equipment items after filter:', equipmentItems);
        } else {
            console.log('No inventory or getItems method!');
        }
        
        // Grid settings - smaller, more compact
        const itemsPerRow = 4;
        const itemSize = 60;
        const itemSpacing = 70;
        const startX = inventoryX - (itemsPerRow * itemSpacing) / 2 + itemSpacing / 2;
        const startY = inventoryY;
        
        // Create grid background slots (empty slots to show grid structure)
        const maxRows = 3; // Show 3 rows worth of slots
        for (let row = 0; row < maxRows; row++) {
            for (let col = 0; col < itemsPerRow; col++) {
                const x = startX + (col * itemSpacing);
                const y = startY + (row * itemSpacing);
                
                // Create empty slot background
                const slotBg = this.add.graphics();
                slotBg.fillStyle(0x333333, 0.3); // Dark gray, semi-transparent
                slotBg.lineStyle(1, 0x666666, 0.5); // Light gray border
                slotBg.fillRect(-itemSize/2, -itemSize/2, itemSize, itemSize);
                slotBg.strokeRect(-itemSize/2, -itemSize/2, itemSize, itemSize);
                slotBg.x = x;
                slotBg.y = y;
                slotBg.setData('isInventoryTitle', true); // So it gets cleared on refresh
            }
        }
        
        // Create inventory items on top of grid
        equipmentItems.forEach((item, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = startX + (col * itemSpacing);
            const y = startY + (row * itemSpacing);
            
            this.createInventoryItem(item, x, y, itemSize);
        });
        
        // No empty message needed - empty grid slots show the structure
    }
    
    // Create a single inventory item with drag functionality
    createInventoryItem(item, x, y, size) {
        const itemContainer = this.add.container(x, y);
        
        // Item background with rarity color
        const rarityColor = this.getRarityColor(item.rarity || 'common');
        const itemBg = this.add.graphics();
        itemBg.fillStyle(0x333333, 0.9);
        itemBg.lineStyle(3, rarityColor, 1);
        itemBg.fillRect(-size/2, -size/2, size, size);
        itemBg.strokeRect(-size/2, -size/2, size, size);
        itemContainer.add(itemBg);
        
        // Item icon
        const icon = this.add.text(0, -8, item.icon || '⚙️', {
            fontSize: '24px'
        });
        icon.setOrigin(0.5);
        itemContainer.add(icon);
        
        // Item name (truncated)
        const name = this.add.text(0, 20, item.name, {
            fontSize: '12px',
            color: '#ffffff',
            fontFamily: 'Arial',
            wordWrap: { width: size - 10 }
        });
        name.setOrigin(0.5);
        itemContainer.add(name);
        
        // Make draggable
        itemContainer.setInteractive(new Phaser.Geom.Rectangle(-size/2, -size/2, size, size), Phaser.Geom.Rectangle.Contains);
        itemContainer.setData('item', item);
        itemContainer.setData('isInventoryItem', true);
        
        // Drag functionality
        this.input.setDraggable(itemContainer);
        
        itemContainer.on('dragstart', (pointer, dragX, dragY) => {
            itemContainer.setScale(1.1);
            itemContainer.setDepth(1000);
        });
        
        itemContainer.on('drag', (pointer, dragX, dragY) => {
            itemContainer.x = dragX;
            itemContainer.y = dragY;
            
            // Check if over a hero portrait and highlight it
            const dropTarget = this.getHeroPortraitAt(pointer.x, pointer.y);
            
            // Reset all hero portraits to normal
            if (this.heroPortraits) {
                this.heroPortraits.forEach(portraitData => {
                    const bg = portraitData.background;
                    const portraitSize = 100;
                    bg.clear();
                    bg.fillStyle(0x444444, 0.9);
                    bg.lineStyle(3, 0x8b4513, 1);
                    bg.fillRoundedRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize, 12);
                    bg.strokeRoundedRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize, 12);
                });
            }
            
            // Highlight drop target with green glow
            if (dropTarget) {
                const bg = dropTarget.background;
                const portraitSize = 100;
                bg.clear();
                bg.fillStyle(0x444444, 0.9);
                bg.lineStyle(4, 0x00ff88, 1); // Green border
                bg.fillRoundedRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize, 12);
                bg.strokeRoundedRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize, 12);
            }
        });
        
        itemContainer.on('dragend', (pointer) => {
            itemContainer.setScale(1.0);
            itemContainer.setDepth(0);
            
            // Reset all hero portraits to normal
            if (this.heroPortraits) {
                this.heroPortraits.forEach(portraitData => {
                    const bg = portraitData.background;
                    const portraitSize = 100;
                    bg.clear();
                    bg.fillStyle(0x444444, 0.9);
                    bg.lineStyle(3, 0x8b4513, 1);
                    bg.fillRoundedRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize, 12);
                    bg.strokeRoundedRect(-portraitSize/2, -portraitSize/2, portraitSize, portraitSize, 12);
                });
            }
            
            // Check if dropped on a hero portrait
            const dropTarget = this.getHeroPortraitAt(pointer.x, pointer.y);
            if (dropTarget) {
                this.equipItemToHero(item, dropTarget);
                itemContainer.destroy();
                this.refreshInventoryGrid();
            } else {
                // Snap back to original position
                itemContainer.x = x;
                itemContainer.y = y;
            }
        });
        
        // Hover effects
        itemContainer.on('pointerover', () => {
            if (!itemContainer.input.isDragging) {
                itemContainer.setScale(1.05);
            }
        });
        
        itemContainer.on('pointerout', () => {
            if (!itemContainer.input.isDragging) {
                itemContainer.setScale(1.0);
            }
        });
    }
    
    // Get rarity color for items
    getRarityColor(rarity) {
        switch (rarity) {
            case 'common': return 0x9e9e9e;
            case 'uncommon': return 0x4caf50;
            case 'rare': return 0x2196f3;
            case 'legendary': return 0xff9800;
            default: return 0x9e9e9e;
        }
    }
    
    // Check if pointer is over a hero portrait
    getHeroPortraitAt(x, y) {
        if (!this.heroPortraits) return null;
        
        for (let portraitData of this.heroPortraits) {
            const portrait = portraitData.container;
            const bounds = portrait.getBounds();
            
            if (x >= bounds.x && x <= bounds.x + bounds.width &&
                y >= bounds.y && y <= bounds.y + bounds.height) {
                return portraitData;
            }
        }
        return null;
    }
    
    // Equip an item to a hero
    equipItemToHero(item, dropTarget) {
        const hero = dropTarget.hero;
        console.log(`Equipping ${item.name} to ${hero.name}`);
        console.log('Item data:', item);
        console.log('Hero equipment before:', hero.equipment);
        
        // Create Equipment class instance from inventory item
        const equipment = new Equipment({
            id: item.id,
            name: item.name,
            description: item.description,
            slot: 'accessory', // Default to accessory slot for now
            rarity: item.rarity || 'common',
            icon: item.icon || '⚙️',
            passiveStats: {
                // Add some basic stats based on item name/description
                damageReduction: item.name.includes('Shield') ? 5 : 0,
                vampirism: item.name.includes('Healing') || item.name.includes('Regeneration') ? 0.1 : 0,
                goldBonus: item.name.includes('Trickster') ? 0.2 : 0
            }
        });
        
        // Equip to hero (assuming hero has an equipItem method)
        if (hero.equipItem) {
            const success = hero.equipItem(equipment);
            console.log('Equipment success:', success);
        } else {
            // Fallback: directly assign to equipment slot
            if (!hero.equipment) hero.equipment = {};
            hero.equipment[equipment.slot] = equipment;
            console.log('Directly equipped to hero.equipment');
        }
        
        console.log('Hero equipment after:', hero.equipment);
        
        // Remove item from inventory
        this.inventory.removeItem(item.id);
        
        // Show success message
        const successText = this.add.text(
            dropTarget.x,
            dropTarget.y - 50,
            `Equipped!`,
            {
                fontSize: '18px',
                color: '#00ff00',
                fontFamily: 'Arial'
            }
        );
        successText.setOrigin(0.5);
        
        // Fade out success message
        this.tweens.add({
            targets: successText,
            alpha: 0,
            y: successText.y - 30,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => successText.destroy()
        });
    }
    
    // Refresh the inventory grid after changes
    refreshInventoryGrid() {
        console.log('=== REFRESHING INVENTORY GRID ===');
        
        // Clear existing inventory items and title
        const inventoryItems = this.children.list.filter(child => 
            child.getData && (child.getData('isInventoryItem') || child.getData('isInventoryTitle'))
        );
        console.log('Clearing', inventoryItems.length, 'inventory items');
        inventoryItems.forEach(item => item.destroy());
        
        // Recreate the grid
        this.createInventoryGrid();
    }
    
    // Open equipment menu for a hero (legacy - will be removed)
    openEquipmentMenu(hero) {
        this.equipmentMenu.open(hero, this.inventory);
    }
}
