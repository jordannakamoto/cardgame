import Phaser from 'phaser';
import CardManager from '../game/CardManager.js';
import PlayerDeck from '../game/PlayerDeck.js';
import BattleManager from '../battle/BattleManager.js';
import Enemy from '../battle/Enemy.js';
import Inventory from '../inventory/Inventory.js';
import { EnemyTypes, EnemyFactory } from '../battle/EnemyTypes.js';
import HeroManager from '../heroes/HeroManager.js';
import { createHero } from '../heroes/HeroRegistry.js';
import PartyManager from '../party/PartyManager.js';
import { UIConfig } from '../config/UIConfig.js';
import { setCardTheme, getCurrentTheme, getAvailableThemes } from '../config/CardThemes.js';
import { MysticalEffects } from '../effects/MysticalEffects.js';
import { cardTraitRegistry } from '../game/CardTraitRegistry.js';
import { PerspectiveConfig } from '../config/PerspectiveConfig.js';
import ManaSystem from '../battle/ManaSystem.js';
import AbilityManager from '../battle/AbilityManager.js';
import HandPreviewPanel from '../ui/HandPreviewPanel.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    init(data) {
        // Receive data from previous scene (like shop)
        if (data && data.inventory) {
            this.inventory = data.inventory;
        }
        if (data && data.gold !== undefined) {
            // Gold will be set in inventory
        }
        if (data && data.partyManager) {
            this.partyManager = data.partyManager;
        }
    }

    create() {
        // Note: Don't remove all event listeners as it breaks the UI system
        // Instead, rely on individual component cleanup

        // Add battle backdrop with parallax support
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        this.backdrop = this.add.image(screenWidth / 2, screenHeight / 2, 'battle-backdrop');
        
        // Scale backdrop slightly larger than screen to allow for subtle parallax movement
        const scaleX = screenWidth / this.backdrop.width;
        const scaleY = screenHeight / this.backdrop.height;
        const baseScale = Math.max(scaleX, scaleY);
        const parallaxScale = baseScale * PerspectiveConfig.backdrop.scaleIncrease;
        this.backdrop.setScale(parallaxScale);
        
        // Store original position and perspective settings
        this.backdropOriginalX = screenWidth / 2;
        this.backdropOriginalY = screenHeight / 2;

        // Initialize managers
        this.cardManager = new CardManager(this);
        this.playerDeck = new PlayerDeck();
        this.battleManager = new BattleManager(this);
        this.manaSystem = new ManaSystem(this);
        if (!this.inventory) {
            this.inventory = new Inventory();
        }

        // Initialize party manager if not provided
        if (!this.partyManager) {
            this.partyManager = new PartyManager(this);
            // Create starter hero using the registry (ensures proper initialization)
            const starterHero = createHero('starter_hero');
            this.partyManager.purchaseHero(starterHero);
        }

        this.heroManager = new HeroManager(this);

        // Create ability manager after hero manager is ready
        this.abilityManager = new AbilityManager(this, this.heroManager, this.manaSystem);

        // Sync heroes from party manager to hero manager
        const partyHeroes = this.partyManager.getAllHeroes();
        console.log('Syncing heroes from PartyManager to HeroManager:', partyHeroes.length, partyHeroes.map(h => h.name));
        partyHeroes.forEach(hero => {
            const success = this.heroManager.addHero(hero);
            console.log(`Added ${hero.name} to HeroManager:`, success);
        });

        // Refresh ability display after heroes are synced
        if (this.abilityManager) {
            this.abilityManager.refreshAbilities();
        }

        // Initialize CardManager for visual rendering only
        this.cardManager.createDeck(); // Keep for compatibility with card rendering methods

        this.createUI();
        this.createEnemies();
        this.setupEventHandlers();

        // Initialize card traits for this battle
        this.initializeCardTraits();

        // Start battle after a small delay to ensure everything is initialized
        this.time.delayedCall(100, () => {
            this.battleManager.startPlayerTurn();

            // Initialize discard counter display
            this.updateDiscardCounter(this.battleManager.discardsRemaining, this.battleManager.maxDiscards);
        });
    }

    createUI() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        // Battle title (removed - backdrop provides context)
        // this.titleText = this.add.text(
        //     screenWidth / 2,
        //     90,
        //     'BATTLE',
        //     {
        //         fontSize: '96px',      // 64 * 1.5
        //         color: '#ffffff',
        //         fontFamily: 'Arial',
        //         fontStyle: 'bold'
        //     }
        // );
        // this.titleText.setOrigin(0.5);

        // Info button (small 'i' in corner)
        this.infoButton = this.add.text(
            screenWidth - 90,
            90,
            'i',
            {
                fontSize: '60px',      // 40 * 1.5
                color: '#cccccc',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                backgroundColor: '#333333',
                padding: { x: 24, y: 18 }  // 16 * 1.5, 12 * 1.5
            }
        );
        this.infoButton.setOrigin(0.5);
        this.infoButton.setScrollFactor(0); // Keep fixed to camera
        this.infoButton.setInteractive();
        this.infoButton.on('pointerdown', () => this.toggleInfoMenu());
        this.infoButton.on('pointerover', () => this.infoButton.setTint(0xffffff));
        this.infoButton.on('pointerout', () => this.infoButton.clearTint());

        // Info menu (initially hidden)
        this.infoMenu = this.add.container(screenWidth / 2, screenHeight / 2);
        this.infoMenu.setScrollFactor(0); // Keep fixed to camera
        this.createInfoMenu();
        this.infoMenu.setVisible(false);
        this.infoMenuVisible = false;

        // Hand cards display area at bottom
        this.handCardsContainer = this.add.container(screenWidth / 2, screenHeight - 140);  // Cards back at bottom
        this.handCardsContainer.setScrollFactor(0); // Keep cards fixed to camera

        // Hero portraits area (above cards)
        this.heroPortraitsContainer = this.add.container(screenWidth / 2, screenHeight - 480);  // Portraits back above cards
        this.heroPortraitsContainer.setScrollFactor(0); // Keep hero portraits fixed to camera

        // Create hand preview panel
        this.handPreviewPanel = new HandPreviewPanel(this);
        
        // Make accessible globally for console commands
        window.handPreviewPanel = this.handPreviewPanel;

        // Gold display with symbol
        this.goldDisplay = this.add.text(
            90,                     // 60 * 1.5
            90,                     // 60 * 1.5
            '🪙 0',
            {
                fontSize: '54px',   // 36 * 1.5
                color: '#ffdd00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        this.goldDisplay.setOrigin(0, 0.5);
        this.goldDisplay.setScrollFactor(0); // Keep fixed to camera

        // Update gold display with current inventory amount
        this.updateGoldDisplay();

        // Hero display (removed - now shown in portraits)
        // this.heroDisplay = this.add.text(
        //     90,                     // 60 * 1.5
        //     180,                    // 120 * 1.5
        //     '',
        //     {
        //         fontSize: '42px',   // 28 * 1.5
        //         color: '#ffffff',
        //         fontFamily: 'Arial'
        //     }
        // );
        // this.heroDisplay.setOrigin(0, 0.5);

        // Mana display (hidden for now)
        this.manaDisplay = this.add.text(
            60,
            160,
            'Mana: 0/50',
            {
                fontSize: '24px',
                color: '#6666ff',
                fontFamily: 'Arial'
            }
        );
        this.manaDisplay.setOrigin(0, 0.5);
        this.manaDisplay.setVisible(false); // Hide mana display

        // Sort toggle button (positioned to the right of card hand area)
        this.sortButton = this.add.text(
            screenWidth / 2 + 1050,    // 700 * 1.5
            screenHeight - 80,         // Adjusted to match new card position
            'Sort: Suit',
            {
                fontSize: '42px',      // 28 * 1.5
                color: '#ffffff',
                fontFamily: 'Arial',
                backgroundColor: '#333333',
                padding: { x: 30, y: 18 }  // 20 * 1.5, 12 * 1.5
            }
        );
        this.sortButton.setOrigin(0.5);
        this.sortButton.setScrollFactor(0); // Keep fixed to camera
        this.sortButton.setInteractive();
        this.sortButton.on('pointerdown', () => this.battleManager.toggleSortMode());
        this.sortButton.on('pointerover', () => this.sortButton.setTint(0xdddddd));
        this.sortButton.on('pointerout', () => this.sortButton.clearTint());

        // Discard counter
        this.discardCounter = this.add.text(
            screenWidth / 2 + 1050,
            screenHeight - 140,
            'Discards: 1/1',
            {
                fontSize: '32px',
                color: '#ffaa44',
                fontFamily: 'Arial',
                backgroundColor: '#333333',
                padding: { x: 20, y: 12 }
            }
        );
        this.discardCounter.setOrigin(0.5);
        this.discardCounter.setScrollFactor(0); // Keep fixed to camera


        this.updateHeroDisplay();
        this.createHeroPortraits();
    }


    createEnemies() {
        // Create enemies using the new type system
        const enemyTypes = [
            EnemyTypes.GOBLIN,
            EnemyTypes.ORC,
            EnemyTypes.TROLL
        ];

        const screenWidth = this.cameras.main.width;
        const spacing = 600;  // 400 * 1.5
        const totalWidth = (enemyTypes.length - 1) * spacing;
        const startX = (screenWidth - totalWidth) / 2;
        const y = 350;  // Moved up further from 450 to 350

        enemyTypes.forEach((enemyType, index) => {
            const enemy = EnemyFactory.createEnemy(this, startX + (index * spacing), y, enemyType);
            this.battleManager.addEnemy(enemy);
        });
    }

    setupEventHandlers() {
        // Listen for hand changes
        this.events.on('handChanged', this.updateHandDisplay, this);

        // Listen for gold earned
        this.events.on('goldEarned', this.onGoldEarned, this);

        // Listen for mana changes
        this.events.on('manaChanged', this.updateManaDisplay, this);

        // Listen for hero changes
        this.events.on('activeHeroChanged', (hero) => {
            console.log('activeHeroChanged event triggered for:', hero?.name);
            this.updateHeroPortraits();
        });

        // Listen for sort mode changes
        this.events.on('sortModeChanged', this.updateSortButtonText, this);

        // Listen for discard changes
        this.events.on('discardsChanged', this.updateDiscardCounter, this);

        // Listen for hero damage events
        this.events.on('heroDamageTaken', (heroId, damageData) => {
            this.updateHeroHealthBar(heroId, damageData);
        });

        // Info menu toggle with 'I' key
        this.input.keyboard.on('keydown-I', () => {
            this.toggleInfoMenu();
        });

        // Sort toggle with 'S' key
        this.input.keyboard.on('keydown-S', () => {
            this.battleManager.toggleSortMode();
        });
    }

    // Initialize card traits for this battle session
    initializeCardTraits() {
        console.log('Initializing card traits for battle...');

        // Get all cards from player deck
        const allCards = this.playerDeck.getAllCards();

        // Get current party heroes
        const partyHeroes = this.partyManager.getAllHeroes();

        // Initialize traits based on active heroes
        cardTraitRegistry.initializeForBattle(allCards, partyHeroes);

        console.log(`Card traits initialized for ${allCards.length} cards with ${partyHeroes.length} heroes`);
    }

    createInfoMenu() {
        // Semi-transparent background
        const bg = this.add.graphics();
        bg.fillStyle(0x000000, 0.8);
        bg.fillRoundedRect(-200, -150, 400, 300, 10);
        bg.lineStyle(2, 0xffffff, 0.8);
        bg.strokeRoundedRect(-200, -150, 400, 300, 10);

        // Title
        const title = this.add.text(0, -120, 'CONTROLS & INFO', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        });
        title.setOrigin(0.5);

        // Controls text
        const controlsText = `Controls:
Arrow Keys - Target Enemy
1-8 Keys - Select Cards (or click cards)
ENTER - Attack with selected cards
D - Discard selected cards (limited uses)
SPACE - Draw new hand
S - Toggle sort mode (Rank/Suit)
I - Toggle this menu

Game Info:
Select up to 5 cards from your 8-card hand
Make poker hands to damage enemies
Selected cards move up with yellow border
Hover over cards for preview`;

        const controls = this.add.text(0, -20, controlsText, {
            fontSize: '14px',
            color: '#cccccc',
            fontFamily: 'Arial',
            align: 'center',
            lineSpacing: 4
        });
        controls.setOrigin(0.5);

        // Close instruction
        const closeText = this.add.text(0, 110, 'Press I or click outside to close', {
            fontSize: '12px',
            color: '#999999',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        });
        closeText.setOrigin(0.5);

        this.infoMenu.add([bg, title, controls, closeText]);

        // Click outside to close
        bg.setInteractive();
        bg.on('pointerdown', (pointer, localX, localY) => {
            // Only close if clicking on the background, not the content area
            if (Math.abs(localX) > 180 || Math.abs(localY) > 130) {
                this.toggleInfoMenu();
            }
        });
    }

    toggleInfoMenu() {
        this.infoMenuVisible = !this.infoMenuVisible;
        this.infoMenu.setVisible(this.infoMenuVisible);

        if (this.infoMenuVisible) {
            // Bring to front
            this.children.bringToTop(this.infoMenu);
        }
    }

    updateHandDisplay(cards, selectedCards = [], forceAnimation = false, newCards = []) {
        if (!cards || cards.length === 0) {
            this.handCardsContainer.removeAll(true);
            this.handPreviewPanel.updateText('');
            return;
        }

        // Update hand preview
        this.updateHandPreview(cards, selectedCards);

        // Store previous selection state to avoid replaying animations
        if (!this.previousSelectedCards) this.previousSelectedCards = [];

        // Check if we can optimize by only updating selection states instead of re-rendering everything
        if (this.canOptimizeSelection(cards, selectedCards, forceAnimation, newCards)) {
            this.updateCardSelectionStates(cards, selectedCards);
            this.previousSelectedCards = [...selectedCards];
            return;
        }

        // Full re-render needed - clean up mystical effects first
        this.cleanupMysticalEffects();

        // Clear previous hand display
        this.handCardsContainer.removeAll(true);

        // Display cards
        const cardSpacing = UIConfig.card.spacing;  // Now 210
        const startX = -(cards.length - 1) * cardSpacing / 2;

        // Store card containers for special attack animations
        this.cardContainers = [];
        // Store active mystical effects for cleanup
        this.activeMysticalEffects = [];

        // Determine which cards should animate
        if (forceAnimation && newCards.length > 0) {
            // Selective animation - only animate the specific new cards passed in
            const newCardIds = newCards.map(card => `${card.rank}-${card.suit}`);
            this.shouldAnimateCard = (index) => {
                const cardId = `${cards[index].rank}-${cards[index].suit}`;
                return newCardIds.includes(cardId);
            };
        } else if (forceAnimation) {
            // Force all cards to animate (Space key)
            this.shouldAnimateCard = (index) => true;
        } else {
            // No animation for regular updates
            this.shouldAnimateCard = (index) => false;
        }

        this.previousCards = [...cards];

        cards.forEach((card, index) => {
            const cardX = startX + (index * cardSpacing);
            const baseCardY = 0;
            const isSelected = selectedCards.includes(index);
            const wasSelected = this.previousSelectedCards.includes(index);

            // Create card container for easier animation
            const cardContainer = this.add.container(cardX, isSelected ? baseCardY - 30 : baseCardY);

            // Fan-in animation for new cards only
            if (this.shouldAnimateCard(index)) {
                // This is a new card - animate it in
                cardContainer.x = 0; // Start at center
                cardContainer.y = baseCardY + 80; // Start below
                cardContainer.rotation = (index - (cards.length - 1) / 2) * 0.15; // Start with fan rotation
                cardContainer.alpha = 0; // Start invisible
                cardContainer.setScale(0.8); // Start slightly small

                // Calculate delay - count how many new cards come before this one
                let newCardsBefore = 0;
                for (let i = 0; i < index; i++) {
                    if (this.shouldAnimateCard(i)) {
                        newCardsBefore++;
                    }
                }

                // Animate to final position with fan effect
                this.tweens.add({
                    targets: cardContainer,
                    x: cardX,
                    y: isSelected ? baseCardY - 30 : baseCardY,
                    rotation: 0, // End straight
                    alpha: 1,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 500,
                    ease: 'Back.out',
                    delay: newCardsBefore * 80, // Stagger based on new card position
                });
            }
            // Selection state animations (existing cards)
            else if (isSelected && !wasSelected) {
                cardContainer.y = baseCardY; // Start at base position
                this.tweens.add({
                    targets: cardContainer,
                    y: baseCardY - 30,
                    duration: 200,
                    ease: 'Back.out'
                });
            } else if (!isSelected && wasSelected) {
                cardContainer.y = baseCardY - 30; // Start at elevated position
                this.tweens.add({
                    targets: cardContainer,
                    y: baseCardY,
                    duration: 200,
                    ease: 'Back.out'
                });
            }

            // Use CardManager's improved card rendering
            const cardWidth = UIConfig.card.width;   // Now 180
            const cardHeight = UIConfig.card.height; // Now 252
            const cardData = this.cardManager.createCardSprite(card, 0, 0, cardWidth, cardHeight);

            // Adjust the card elements' positions to be centered
            cardData.graphics.x = -cardWidth/2;
            cardData.graphics.y = -cardHeight/2;
            cardData.topRankText.x -= cardWidth/2;
            cardData.topRankText.y -= cardHeight/2;
            cardData.topSuitText.x -= cardWidth/2;
            cardData.topSuitText.y -= cardHeight/2;

            // Only adjust centerSuitText position if it exists
            if (cardData.centerSuitText) {
                cardData.centerSuitText.x -= cardWidth/2;
                cardData.centerSuitText.y -= cardHeight/2;
            }

            // Adjust artwork position if it exists (for joker cards)
            if (cardData.artwork) {
                cardData.artwork.x -= cardWidth/2;
                cardData.artwork.y -= cardHeight/2;
            }

            // Add soft selection shadow (add it first so it renders behind the card)
            if (isSelected) {
                const softShadow = this.createSoftCardShadow(cardWidth, cardHeight);
                cardContainer.addAt(softShadow, 0); // Add at index 0 to render behind other elements

                // Add mystical effect for joker cards
                const card = cards[index];
                if (card && card.rank === 'Joker' && card.suit === 'Wild') {
                    const mysticalEffect = MysticalEffects.createJokerSelectionEffect(this, cardContainer);
                    // Store reference for cleanup when card is deselected
                    cardContainer.mysticalEffect = mysticalEffect;
                    this.activeMysticalEffects.push(mysticalEffect);
                }
            } else {
                // Cleanup mystical effect when card is deselected
                if (cardContainer.mysticalEffect) {
                    cardContainer.mysticalEffect.cleanup();
                    // Remove from active effects array
                    const effectIndex = this.activeMysticalEffects.indexOf(cardContainer.mysticalEffect);
                    if (effectIndex > -1) {
                        this.activeMysticalEffects.splice(effectIndex, 1);
                    }
                    cardContainer.mysticalEffect = null;
                }
            }

            // Card number indicator (hidden for cleaner look)
            // const numberText = this.add.text(0, cardHeight/2 + 30, (index + 1).toString(), {
            //     fontSize: '36px',  // Increased from 24px
            //     color: '#666666',
            //     fontFamily: 'Arial',
            //     fontStyle: 'bold'
            // });
            // numberText.setOrigin(0.5);

            // Add elements to container
            const containerElements = [
                cardData.graphics,
                cardData.topRankText,
                cardData.topSuitText
            ];

            // Add center suit text if it exists (not for joker cards with artwork)
            if (cardData.centerSuitText) {
                containerElements.push(cardData.centerSuitText);
            }

            // Add artwork if it exists (for joker cards)
            if (cardData.artwork) {
                containerElements.push(cardData.artwork);
            }

            cardContainer.add(containerElements);

            // Store card container for special attack animations and attach card data
            cardContainer.cardData = card; // Attach the card data for animation lookup
            this.cardContainers[index] = cardContainer;

            // Make card interactive
            cardData.graphics.setInteractive(new Phaser.Geom.Rectangle(0, 0, cardWidth, cardHeight), Phaser.Geom.Rectangle.Contains);
            cardData.graphics.on('pointerdown', () => {
                this.scene.get('BattleScene').battleManager.toggleCardSelection(index);
            });

            // Add hover effect
            cardData.graphics.on('pointerover', () => {
                cardContainer.setScale(1.05);
            });
            cardData.graphics.on('pointerout', () => {
                cardContainer.setScale(1.0);
            });

            // Add to main container
            this.handCardsContainer.add(cardContainer);
        });

        // Update previous selection state
        this.previousSelectedCards = [...selectedCards];
    }

    canOptimizeSelection(cards, selectedCards, forceAnimation, newCards) {
        // Can't optimize if we need to force animation or have new cards
        if (forceAnimation || (newCards && newCards.length > 0)) {
            return false;
        }

        // Can't optimize if we don't have existing card containers
        if (!this.cardContainers || this.cardContainers.length === 0) {
            return false;
        }

        // Can't optimize if the number of cards changed
        if (!this.previousCards || this.previousCards.length !== cards.length) {
            return false;
        }

        // Can't optimize if the actual cards changed (different ranks/suits)
        for (let i = 0; i < cards.length; i++) {
            if (!this.previousCards[i] ||
                this.previousCards[i].rank !== cards[i].rank ||
                this.previousCards[i].suit !== cards[i].suit) {
                return false;
            }
        }

        // We can optimize - only selection states are changing
        return true;
    }

    updateCardSelectionStates(cards, selectedCards) {
        if (!this.cardContainers) return;

        cards.forEach((card, index) => {
            const cardContainer = this.cardContainers[index];
            if (!cardContainer) return;

            const isSelected = selectedCards.includes(index);
            const wasSelected = this.previousSelectedCards.includes(index);
            const baseCardY = 0;

            // Only update if selection state actually changed
            if (isSelected !== wasSelected) {
                // Remove old selection shadow with fade-out
                const existingShadow = cardContainer.list.find(child => child.isShadow);
                if (existingShadow) {
                    this.tweens.add({
                        targets: existingShadow,
                        alpha: 0,
                        duration: 150,
                        ease: 'Power2',
                        onComplete: () => {
                            if (existingShadow.active) existingShadow.destroy();
                        }
                    });
                }

                // Clean up old mystical effect
                if (cardContainer.mysticalEffect) {
                    cardContainer.mysticalEffect.cleanup();
                    const effectIndex = this.activeMysticalEffects.indexOf(cardContainer.mysticalEffect);
                    if (effectIndex > -1) {
                        this.activeMysticalEffects.splice(effectIndex, 1);
                    }
                    cardContainer.mysticalEffect = null;
                }

                // Clean up old chain text effect
                if (cardContainer.chainTextEffect) {
                    cardContainer.chainTextEffect.cleanup();
                    cardContainer.chainTextEffect = null;
                }

                if (isSelected) {
                    // Add soft selection shadow (add it first so it renders behind the card)
                    const cardWidth = UIConfig.card.width;
                    const cardHeight = UIConfig.card.height;
                    const softShadow = this.createSoftCardShadow(cardWidth, cardHeight);
                    cardContainer.addAt(softShadow, 0); // Add at index 0 to render behind other elements

                    // Add mystical effect for joker cards
                    if (card && card.rank === 'Joker' && card.suit === 'Wild') {
                        const mysticalEffect = MysticalEffects.createJokerSelectionEffect(this, cardContainer);
                        cardContainer.mysticalEffect = mysticalEffect;
                        this.activeMysticalEffects.push(mysticalEffect);
                    }

                    // Add chain text for chain cards
                    if (card && card.hasChain && card.hasChain()) {
                        const chainTextEffect = this.createChainSelectionText(cardContainer);
                        cardContainer.chainTextEffect = chainTextEffect;
                    }

                    // Animate to selected position
                    this.tweens.add({
                        targets: cardContainer,
                        y: baseCardY - 30,
                        duration: 200,
                        ease: 'Back.out'
                    });
                } else {
                    // Animate to unselected position
                    this.tweens.add({
                        targets: cardContainer,
                        y: baseCardY,
                        duration: 200,
                        ease: 'Back.out'
                    });
                }
            }
        });
    }

    cleanupMysticalEffects() {
        if (this.activeMysticalEffects) {
            this.activeMysticalEffects.forEach(effect => {
                if (effect && effect.cleanup) {
                    effect.cleanup();
                }
            });
            this.activeMysticalEffects = [];
        }
    }

    createChainSelectionText(cardContainer) {
        const worldTransform = cardContainer.getWorldTransformMatrix();
        const cardX = worldTransform.tx;
        const cardY = worldTransform.ty;

        // Create stylized "CHAIN" text above the card
        const chainText = this.add.text(
            cardX,
            cardY - 140,
            'CHAIN',
            {
                fontSize: '32px',
                color: '#ff6600',
                fontFamily: 'Arial',
                fontStyle: 'bold italic',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        chainText.setOrigin(0.5);
        chainText.setDepth(10000);
        chainText.setRotation(-0.15); // Slight slant
        chainText.setAlpha(0);

        // Animate in
        this.tweens.add({
            targets: chainText,
            alpha: 0.9,
            y: cardY - 150,
            scaleX: { from: 0.5, to: 1.0 },
            scaleY: { from: 0.5, to: 1.0 },
            duration: 200,
            ease: 'Back.out'
        });

        return {
            element: chainText,
            cleanup: () => {
                if (chainText && chainText.active) {
                    // Fade out when deselected
                    this.tweens.add({
                        targets: chainText,
                        alpha: 0,
                        scaleX: 0.5,
                        scaleY: 0.5,
                        duration: 150,
                        ease: 'Power2',
                        onComplete: () => {
                            if (chainText.active) chainText.destroy();
                        }
                    });
                }
            }
        };
    }

    updateHandPreview(cards, selectedCards) {
        if (selectedCards.length === 0) {
            this.handPreviewPanel.updateText('');
            // Clear damage preview when no cards selected
            this.clearAllDamagePreview();
            // Clear hero activation indicator
            this.updateHeroActivationIndicator(false);
            return;
        }

        try {
            // Get selected cards
            const selectedCardObjects = selectedCards.map(index => cards[index]);

            // Check if any selected card has chain trait
            const chainCard = selectedCardObjects.find(card => card.hasChain && card.hasChain());

            // Import PokerHand dynamically to avoid circular imports
            import('../game/PokerHand.js').then(module => {
                const PokerHand = module.default;
                const battleManager = this.scene.get('BattleScene').battleManager;
                const currentTarget = battleManager.getCurrentTarget();

                // Only calculate damage if target is alive
                if (!currentTarget || !currentTarget.isAlive || currentTarget.currentHealth <= 0) {
                    this.handPreviewPanel.updateText('');
                    this.clearAllDamagePreview();
                    this.updateHeroActivationIndicator([]);
                    return;
                }

                let finalDamage, previewText, activatedHeroes = [];

                if (chainCard) {
                    // Calculate chain damage preview
                    const chainLinks = battleManager.createChainLinks(selectedCardObjects, currentTarget);

                    // Get additional hands from remaining cards
                    const remainingCards = battleManager.playerHand.filter((card, index) => !selectedCards.includes(index));
                    const chainData = chainCard.getChainData();
                    const maxChainLinks = chainData.maxChainLinks || 3;
                    const additionalHands = battleManager.findChainableHands(remainingCards, Math.max(0, maxChainLinks - chainLinks.length));

                    // Combine all hands for total damage
                    const allHands = [
                        ...chainLinks,
                        ...additionalHands.map(handData => ({
                            handName: handData.hand.handName,
                            damage: battleManager.calculateDamageWithHero(handData.hand, currentTarget, handData.cards),
                            cards: handData.cards
                        }))
                    ];

                    finalDamage = allHands.reduce((sum, hand) => sum + hand.damage, 0);

                    // Create chain preview text
                    const linkCount = allHands.length;
                    const primaryHandName = chainLinks[0] ? chainLinks[0].handName : 'Chain';
                    previewText = `${primaryHandName} Chain (${linkCount} links) : ${finalDamage}`;

                    // Check for hero activation (use first chain link for hero calculations)
                    if (this.scene.get('BattleScene').heroManager && chainLinks.length > 0) {
                        const firstLinkHand = new PokerHand(chainLinks[0].cards);
                        const context = {
                            targetEnemy: currentTarget,
                            selectedCards: chainLinks[0].cards
                        };

                        this.scene.get('BattleScene').heroManager.getAllHeroes().forEach(hero => {
                            const heroMultiplier = hero.calculateMultiplier(firstLinkHand, context);
                            if (hero.hasActivatedAbilities()) {
                                activatedHeroes.push({
                                    hero: hero,
                                    abilities: hero.lastActivatedAbilities
                                });
                            }
                        });
                    }
                } else {
                    // Calculate normal damage
                    const pokerHand = new PokerHand(selectedCardObjects);
                    const baseDamage = battleManager.calculateDamage(pokerHand);

                    // Calculate hero modified damage
                    finalDamage = baseDamage;
                    let heroModified = false;

                    // Check which heroes will activate for this hand
                    if (this.scene.get('BattleScene').heroManager) {
                        const context = {
                            targetEnemy: currentTarget,
                            selectedCards: selectedCardObjects
                        };

                        // Check each hero individually to see which ones activate
                        this.scene.get('BattleScene').heroManager.getAllHeroes().forEach(hero => {
                            const heroMultiplier = hero.calculateMultiplier(pokerHand, context);
                            if (hero.hasActivatedAbilities()) {
                                activatedHeroes.push({
                                    hero: hero,
                                    abilities: hero.lastActivatedAbilities
                                });
                            }
                        });

                        finalDamage = this.scene.get('BattleScene').heroManager.calculateDamageWithHero(baseDamage, pokerHand, context);
                        heroModified = finalDamage !== baseDamage;
                    }

                    // Update preview text with normal format
                    previewText = `${pokerHand.handName} : ${baseDamage}`;
                    if (heroModified) {
                        previewText += ` (+${finalDamage - baseDamage})`;
                    }
                }

                this.handPreviewPanel.updateText(previewText);

                // Indicate hero ability activation in portrait
                this.updateHeroActivationIndicator(activatedHeroes);

                // Update target health bar indicator
                this.updateTargetDamageIndicator(finalDamage);
            });
        } catch (error) {
            this.handPreviewPanel.updateText('Invalid hand selection');
        }
    }

    updateTargetDamageIndicator(damage) {
        const battleManager = this.scene.get('BattleScene').battleManager;
        const targetEnemy = battleManager.getCurrentTarget();

        // Clear indicators from all enemies first
        battleManager.enemies.forEach(enemy => {
            enemy.hideDamagePreview();
        });

        // Then show preview on current target only if it's alive
        if (targetEnemy && targetEnemy.isAlive && targetEnemy.currentHealth > 0) {
            targetEnemy.showDamagePreview(damage);
        }
    }

    clearAllDamagePreview() {
        const battleManager = this.scene.get('BattleScene').battleManager;
        battleManager.enemies.forEach(enemy => {
            enemy.hideDamagePreview();
        });
    }

    updateHeroActivationIndicator(activatedHeroes) {
        // Clear any existing activation effects
        if (this.heroActivationEffects) {
            this.heroActivationEffects.forEach(effect => effect.destroy());
        }
        if (this.heroBonusTexts) {
            this.heroBonusTexts.forEach(text => text.destroy());
        }
        this.heroActivationEffects = [];
        this.heroBonusTexts = [];

        // No need to reset portrait positions since we don't move them anymore
        if (!activatedHeroes || activatedHeroes.length === 0) {
            return;
        }

        if (activatedHeroes && activatedHeroes.length > 0 && this.heroManager) {
            const allHeroes = this.heroManager.getAllHeroes();
            const portraitContainers = this.heroPortraitsContainer.list;

            // Show activation effects for each activated hero
            activatedHeroes.forEach(heroData => {
                const activatedHero = heroData.hero;
                const heroIndex = allHeroes.indexOf(activatedHero);
                if (heroIndex !== -1 && portraitContainers[heroIndex]) {
                    const portraitContainer = portraitContainers[heroIndex];

                    // Determine color based on activated ability types
                    let glowColor = UIConfig.hero.abilityColors.damage; // Default
                    if (heroData.abilities && heroData.abilities.length > 0) {
                        // Use the first activated ability's type for color
                        const abilityType = heroData.abilities[0].type || 'damage';
                        glowColor = UIConfig.hero.abilityColors[abilityType] || UIConfig.hero.abilityColors.damage;
                    }

                    // Create glowing effect around activated hero portrait as part of the container
                    const glowEffect = this.add.graphics();
                    glowEffect.lineStyle(UIConfig.hero.glowThickness, glowColor, 1.0);
                    glowEffect.strokeRoundedRect(
                        -UIConfig.hero.portraitWidth/2 - 5,
                        -UIConfig.hero.portraitHeight/2 - 5,
                        UIConfig.hero.portraitWidth + 10,
                        UIConfig.hero.portraitHeight + 10,
                        12
                    );

                    // Add glow effect to the portrait container so it renders with proper layering
                    portraitContainer.addAt(glowEffect, 0); // Add at index 0 so it renders behind other elements

                    // Add pulsing animation
                    this.tweens.add({
                        targets: glowEffect,
                        alpha: { from: 1.0, to: 0.4 },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });

                    // Store original position for bonus text positioning
                    if (portraitContainer.originalY === undefined) {
                        portraitContainer.originalY = portraitContainer.y;
                    }

                    // No portrait elevation - keep portraits in original position to reduce visual noise

                    // Add bonus indicator text next to portrait
                    const heroBonusText = this.add.text(
                        this.heroPortraitsContainer.x + portraitContainer.x + 90,
                        this.heroPortraitsContainer.y + portraitContainer.y - 20, // Position relative to current portrait position
                        '+',
                        {
                            fontSize: '32px',
                            color: `#${glowColor.toString(16).padStart(6, '0')}`,
                            fontFamily: 'Arial',
                            fontStyle: 'bold'
                        }
                    );
                    heroBonusText.setOrigin(0.5);

                    // Add pulsing animation to bonus text only
                    this.tweens.add({
                        targets: heroBonusText,
                        scaleX: { from: 1.0, to: 1.3 },
                        scaleY: { from: 1.0, to: 1.3 },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });

                    this.heroActivationEffects.push(glowEffect);
                    this.heroBonusTexts.push(heroBonusText);
                }
            });
        }
    }

    onGoldEarned(amount) {
        this.inventory.addResource('gold', amount);
        this.updateGoldDisplay();
    }

    updateGoldDisplay() {
        const gold = this.inventory.getResource('gold');
        this.goldDisplay.setText(`🪙 ${gold}`);
    }

    updateHeroDisplay() {
        // Hero display removed - now shown in portraits
        // const hero = this.heroManager.getActiveHero();
        // if (hero) {
        //     this.heroDisplay.setText(`Hero: ${hero.name} (${hero.currentHealth}/${hero.maxHealth} HP)`);
        //     // this.updateManaDisplay(hero.currentMana, hero.maxMana); // Disabled for now
        // }
    }

    updateManaDisplay(current, max) {
        this.manaDisplay.setText(`Mana: ${current}/${max}`);
    }

    updateSortButtonText(sortByRank) {
        // Show what mode it will switch TO, not what it's currently on
        this.sortButton.setText(sortByRank ? 'Sort: Suit' : 'Sort: Rank');
    }

    updateDiscardCounter(remaining, max) {
        if (this.discardCounter) {
            this.discardCounter.setText(`Discards: ${remaining}/${max}`);

            // Change color based on availability
            if (remaining > 0) {
                this.discardCounter.setStyle({ color: '#ffaa44' }); // Orange when available
            } else {
                this.discardCounter.setStyle({ color: '#888888' }); // Gray when used up
            }
        }
    }

    updateHeroHealthBar(heroId, damageData) {
        // Find the hero in the party
        const heroes = this.heroManager.getAllHeroes();
        const heroIndex = heroes.findIndex(hero => hero.id === heroId);
        
        if (heroIndex === -1) return;
        
        const hero = heroes[heroIndex];
        const portraitContainers = this.heroPortraitsContainer.list;
        
        if (heroIndex >= portraitContainers.length) return;
        
        const portraitContainer = portraitContainers[heroIndex];
        const portraitElements = portraitContainer.list;
        const hpBar = portraitElements[3]; // HP bar is at index 3
        const hpText = portraitElements[4]; // HP text is at index 4
        
        if (!hpBar || !hpText || typeof hpText.setText !== 'function') return;
        
        // Calculate new health bar dimensions
        const portraitWidth = UIConfig.hero.portraitWidth;
        const hpPercent = hero.currentHealth / hero.maxHealth;
        const newHpBarWidth = (portraitWidth - 10) * hpPercent;
        
        // Kill any existing health bar tweens
        this.tweens.killTweensOf(hpBar);
        
        // Update HP text immediately
        hpText.setText(`${hero.currentHealth}/${hero.maxHealth}`);
        
        // Simple width-only animation (no position changes)
        this.tweens.add({
            targets: hpBar,
            width: newHpBarWidth,
            duration: 150,
            ease: 'Elastic.easeOut'
        });
    }


    animateDiscard(cardsToDiscard, onComplete) {
        console.log('[ANIM] animateDiscard called with cards:', cardsToDiscard.map(c => c.toString()));
        console.log('[ANIM] cardContainers:', this.cardContainers ? this.cardContainers.length : 'undefined');

        // Find the card containers for the cards to discard
        const discardContainers = [];

        if (!this.cardContainers) {
            console.error('[ANIM] No cardContainers found! Calling onComplete immediately.');
            onComplete();
            return;
        }

        // Debug: log all containers
        console.log('[ANIM] Available containers:');
        this.cardContainers.forEach((container, i) => {
            if (container && container.cardData) {
                console.log(`  [${i}] ${container.cardData.rank} of ${container.cardData.suit}`);
            }
        });

        cardsToDiscard.forEach(card => {
            const container = this.cardContainers.find(container => {
                if (!container || !container.cardData) return false;
                const matches = container.cardData.rank === card.rank &&
                               container.cardData.suit === card.suit;
                if (matches) {
                    console.log(`[ANIM] Found match for ${card.toString()}`);
                }
                return matches;
            });

            if (container) {
                discardContainers.push(container);
            } else {
                console.warn(`[ANIM] No container found for card: ${card.toString()}`);
            }
        });

        // Animate each card being discarded
        let animationsComplete = 0;
        const totalAnimations = discardContainers.length;

        if (totalAnimations === 0) {
            onComplete();
            return;
        }

        discardContainers.forEach((container, index) => {
            // Stagger the animations
            this.time.delayedCall(index * 50, () => {
                // Fade out and move down
                this.tweens.add({
                    targets: container,
                    y: container.y + 200,
                    alpha: 0,
                    scaleX: 0.7,
                    scaleY: 0.7,
                    rotation: (Math.random() - 0.5) * 0.5,
                    duration: 400,
                    ease: 'Power2',
                    onComplete: () => {
                        animationsComplete++;
                        if (animationsComplete === totalAnimations) {
                            // All animations done, call callback
                            onComplete();
                        }
                    }
                });
            });
        });
    }

    createHeroPortraits() {
        this.updateHeroPortraits();
    }

    updateHeroPortraits() {
        // Clear existing portraits
        this.heroPortraitsContainer.removeAll(true);

        const heroes = this.heroManager.getAllHeroes();
        const activeHero = this.heroManager.getActiveHero();

        if (heroes.length === 0) return;

        const portraitWidth = UIConfig.hero.portraitWidth;
        const portraitHeight = UIConfig.hero.portraitHeight;
        const spacing = UIConfig.hero.spacing;
        const startX = -(heroes.length - 1) * spacing / 2;

        heroes.forEach((hero, index) => {
            const heroX = startX + (index * spacing);
            const isActive = hero === activeHero;

            // Create hero portrait container
            const portraitContainer = this.add.container(heroX, 0);

            // Portrait background
            const portraitBg = this.add.graphics();
            portraitBg.fillStyle(isActive ? 0x444444 : 0x222222);
            portraitBg.fillRoundedRect(-portraitWidth/2, -portraitHeight/2, portraitWidth, portraitHeight, 8);
            portraitBg.lineStyle(isActive ? 3 : 2, isActive ? 0x888888 : 0x666666);
            portraitBg.strokeRoundedRect(-portraitWidth/2, -portraitHeight/2, portraitWidth, portraitHeight, 8);

            // Hero portrait image with cropping
            let heroImage = null;
            if (hero.portraitKey && this.textures.exists(hero.portraitKey)) {
                heroImage = this.add.image(0, 0, hero.portraitKey);

                // Scale to fit width, keeping aspect ratio
                const texture = this.textures.get(hero.portraitKey);
                const textureWidth = texture.source[0].width;
                const textureHeight = texture.source[0].height;

                // Scale to fit the width
                const scale = (portraitWidth - 8) / textureWidth;
                const scaledHeight = textureHeight * scale;

                // Set the scale and crop from bottom
                heroImage.setScale(scale);
                heroImage.setOrigin(0.5, 0.4); // Move origin up to show top portion

                // Crop to show only the top portion
                const cropHeight = Math.min(textureHeight, textureHeight * (portraitHeight - 8) / scaledHeight);
                heroImage.setCrop(0, 0, textureWidth, cropHeight);
            } else {
                // Fallback colored rectangle
                const fallbackColor = hero.type === 'damage' ? 0xff6666 :
                                    hero.type === 'support' ? 0x66ff66 : 0x6666ff;
                heroImage = this.add.rectangle(0, 0, portraitWidth - 8, portraitHeight - 8, fallbackColor);
            }


            // HP bar background
            const hpBarBg = this.add.rectangle(0, portraitHeight/2 + UIConfig.hero.manaBar.offset, portraitWidth - 10, UIConfig.hero.manaBar.height, 0x333333);

            // HP bar
            const hpPercent = hero.currentHealth / hero.maxHealth;
            const hpBarWidth = (portraitWidth - 10) * hpPercent;
            const hpBar = this.add.rectangle(
                -(portraitWidth - 10)/2 + hpBarWidth/2,
                portraitHeight/2 + UIConfig.hero.manaBar.offset,
                hpBarWidth,
                UIConfig.hero.manaBar.height,
                0xff4444
            );

            // HP text
            const hpText = this.add.text(0, portraitHeight/2 + UIConfig.hero.manaBar.offset, `${hero.currentHealth}/${hero.maxHealth}`, {
                fontSize: '30px',   // 20 * 1.5
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 3  // 2 * 1.5
            });
            hpText.setOrigin(0.5);

            // Add elements to container
            portraitContainer.add([portraitBg, heroImage, hpBarBg, hpBar, hpText]);

            // Make portrait clickable to switch heroes
            portraitBg.setInteractive(new Phaser.Geom.Rectangle(-portraitWidth/2, -portraitHeight/2, portraitWidth, portraitHeight), Phaser.Geom.Rectangle.Contains);
            portraitBg.on('pointerdown', () => {
                this.heroManager.setActiveHero(index);
                this.updateHeroDisplay();
            });

            // Add hover effect with tooltip
            portraitBg.on('pointerover', () => {
                portraitContainer.setScale(1.05);
                this.showHeroTooltip(hero, portraitContainer);
            });
            portraitBg.on('pointerout', () => {
                portraitContainer.setScale(1.0);
                this.hideHeroTooltip();
            });

            // Add to main container
            this.heroPortraitsContainer.add(portraitContainer);
        });
    }

    showHeroTooltip(hero, portraitContainer) {
        // Clear any existing tooltip
        this.hideHeroTooltip();

        // Calculate tooltip position
        const tooltipX = this.heroPortraitsContainer.x + portraitContainer.x;
        const tooltipY = this.heroPortraitsContainer.y + portraitContainer.y - 120;

        // Create tooltip container
        this.heroTooltip = this.add.container(tooltipX, tooltipY);
        this.heroTooltip.setScrollFactor(0); // Keep fixed to camera

        // Tooltip background
        const tooltipWidth = UIConfig.hero.tooltip.width;
        const tooltipHeight = UIConfig.hero.tooltip.height;
        const tooltipBg = this.add.graphics();
        tooltipBg.fillStyle(0x000000, 0.9);
        tooltipBg.fillRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8);
        tooltipBg.lineStyle(2, 0xffff00, 0.8);
        tooltipBg.strokeRoundedRect(-tooltipWidth/2, -tooltipHeight/2, tooltipWidth, tooltipHeight, 8);

        // Hero name
        const nameText = this.add.text(0, -tooltipHeight/2 + 40, hero.name, {
            fontSize: `${UIConfig.hero.tooltip.nameSize}px`,
            color: '#ffff00',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        });
        nameText.setOrigin(0.5);

        // Abilities (main focus in new system)
        let yOffset = -tooltipHeight/2 + 90; // Start below the name with proper spacing
        const tooltipElements = [tooltipBg, nameText];

        if (hero.abilities && hero.abilities.length > 0) {
            hero.abilities.forEach(ability => {
                const abilityText = this.add.text(0, yOffset, ability.description, {
                    fontSize: `${UIConfig.hero.tooltip.fontSize}px`,
                    color: '#ff8800',
                    fontFamily: 'Arial',
                    align: 'center',
                    wordWrap: { width: tooltipWidth - 20 }
                });
                abilityText.setOrigin(0.5);
                tooltipElements.push(abilityText);
                yOffset += 60; // Much more spacing for larger text
            });
        } else {
            // Fallback for heroes without abilities
            const noAbilityText = this.add.text(0, yOffset, 'No special abilities', {
                fontSize: `${Math.max(UIConfig.hero.tooltip.minFontSize, UIConfig.hero.tooltip.fontSize - 2)}px`,
                color: '#666666',
                fontFamily: 'Arial',
                align: 'center'
            });
            noAbilityText.setOrigin(0.5);
            tooltipElements.push(noAbilityText);
            yOffset += 20;
        }

        // Add all elements to tooltip
        this.heroTooltip.add(tooltipElements);

        // Animate tooltip appearance
        this.heroTooltip.setAlpha(0);
        this.tweens.add({
            targets: this.heroTooltip,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });

        // Bring tooltip to front
        this.children.bringToTop(this.heroTooltip);
    }

    hideHeroTooltip() {
        if (this.heroTooltip) {
            this.heroTooltip.destroy();
            this.heroTooltip = null;
        }
    }

    // Create soft, card-shaped shadow for selected cards with blur and fade
    createSoftCardShadow(cardWidth, cardHeight) {
        const shadowContainer = this.add.container(0, 0);
        shadowContainer.setDepth(-1); // Behind the card
        shadowContainer.setAlpha(0); // Start invisible for fade-in
        
        // Create more shadow layers for better blur effect (reduced opacity by half)
        const shadowLayers = [
            { alpha: 0.2, scale: 0.92, offsetX: 3, offsetY: 6 },    // Sharp core shadow
            { alpha: 0.15, scale: 0.96, offsetX: 4, offsetY: 8 },   // Close blur
            { alpha: 0.1, scale: 1.02, offsetX: 6, offsetY: 12 },   // Medium blur
            { alpha: 0.075, scale: 1.08, offsetX: 8, offsetY: 16 }, // Soft blur
            { alpha: 0.04, scale: 1.15, offsetX: 10, offsetY: 20 }, // Very soft blur
            { alpha: 0.02, scale: 1.25, offsetX: 12, offsetY: 24 }  // Ultra soft blur
        ];
        
        shadowLayers.forEach(layer => {
            // Create card-shaped shadow (rounded rectangle)
            const shadow = this.add.graphics();
            shadow.fillStyle(0x000000, layer.alpha);
            
            // Draw rounded rectangle shadow that resembles card shape
            const shadowWidth = cardWidth * layer.scale;
            const shadowHeight = cardHeight * layer.scale;
            const cornerRadius = 8 * layer.scale; // Rounded corners like a card
            
            shadow.fillRoundedRect(
                -shadowWidth/2 + layer.offsetX, 
                -shadowHeight/2 + layer.offsetY, 
                shadowWidth, 
                shadowHeight, 
                cornerRadius
            );
            
            shadowContainer.add(shadow);
        });
        
        // Fade in animation
        this.tweens.add({
            targets: shadowContainer,
            alpha: 1,
            duration: 200,
            ease: 'Power2'
        });
        
        shadowContainer.isShadow = true; // Mark for identification
        return shadowContainer;
    }

    // Perspective skew effect - distort background based on viewing angle
    updateBackdropParallax(enemyIndex) {
        if (!this.backdrop || !this.battleManager.enemies || this.battleManager.enemies.length === 0) {
            return;
        }

        const targetEnemy = this.battleManager.enemies[enemyIndex];
        if (!targetEnemy) return;

        const screenWidth = this.cameras.main.width;
        const screenCenter = screenWidth / 2;
        
        // Calculate the viewing angle based on target enemy
        const focusPoint = targetEnemy.x;
        const viewingAngle = (focusPoint - screenCenter) / screenCenter; // -1 to 1
        
        // Store original enemy sprite positions if not already stored
        if (!this.enemyOriginalPositions) {
            this.enemyOriginalPositions = this.battleManager.enemies.map(enemy => ({
                x: enemy.sprite.x,
                y: enemy.sprite.y
            }));
        }

        // Calculate perspective effects using config values
        const perspectiveRange = PerspectiveConfig.backdrop.perspectiveRange;
        const backgroundShift = -viewingAngle * (perspectiveRange * PerspectiveConfig.backdrop.backgroundShiftMultiplier);
        const enemyShift = viewingAngle * (perspectiveRange * PerspectiveConfig.enemies.shiftMultiplier);
        const perspectiveRotation = viewingAngle * PerspectiveConfig.backdrop.rotationMultiplier;
        
        
        // Animate backdrop
        this.tweens.add({
            targets: this.backdrop,
            x: this.backdropOriginalX + backgroundShift,
            y: this.backdropOriginalY,
            rotation: perspectiveRotation,
            duration: PerspectiveConfig.backdrop.animationDuration,
            ease: PerspectiveConfig.backdrop.animationEasing
        });
        
        // Move enemies very slightly to maintain perspective relationship
        // IMPORTANT: Only animate position, don't interfere with breathing scale animations
        this.battleManager.enemies.forEach((enemy, index) => {
            if (this.enemyOriginalPositions[index]) {
                this.tweens.add({
                    targets: enemy.sprite, // Target the sprite directly, not the enemy wrapper
                    x: this.enemyOriginalPositions[index].x + enemyShift, // Move from original position
                    duration: PerspectiveConfig.enemies.animationDuration,
                    ease: PerspectiveConfig.enemies.animationEasing
                });
            }
        });
    }

    update() {
        // Game loop updates if needed
    }

    shutdown() {
        // Clean up mystical effects
        this.cleanupMysticalEffects();

        // Clean up any remaining event listeners
        if (this.battleManager) {
            this.events.removeListener('enemyDied', this.battleManager.onEnemyDied);
        }

        // Clean up hero event subscriptions
        if (this.heroManager) {
            this.heroManager.getAllHeroes().forEach(hero => {
                if (hero.cleanup) {
                    hero.cleanup();
                }
            });
        }

        // Clean up mana system
        if (this.manaSystem) {
            this.manaSystem.destroy();
        }

        // Clean up ability manager
        if (this.abilityManager) {
            this.abilityManager.destroy();
        }

        console.log('BattleScene shutdown complete');
    }
}
