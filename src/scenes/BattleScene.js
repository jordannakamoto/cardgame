import Phaser from 'phaser';
import CardManager from '../game/CardManager.js';
import BattleManager from '../battle/BattleManager.js';
import Enemy from '../battle/Enemy.js';
import Inventory from '../inventory/Inventory.js';
import { EnemyTypes, EnemyFactory } from '../battle/EnemyTypes.js';
import HeroManager from '../heroes/HeroManager.js';
import { createHero } from '../heroes/HeroRegistry.js';
import PartyManager from '../party/PartyManager.js';
import { UIConfig } from '../config/UIConfig.js';

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
        // Add battle backdrop
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const backdrop = this.add.image(screenWidth / 2, screenHeight / 2, 'battle-backdrop');
        
        // Scale backdrop to cover the entire screen
        const scaleX = screenWidth / backdrop.width;
        const scaleY = screenHeight / backdrop.height;
        const scale = Math.max(scaleX, scaleY);
        backdrop.setScale(scale);
        
        // Initialize managers
        this.cardManager = new CardManager(this);
        this.battleManager = new BattleManager(this);
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
        
        // Sync heroes from party manager to hero manager
        const partyHeroes = this.partyManager.getAllHeroes();
        console.log('Syncing heroes from PartyManager to HeroManager:', partyHeroes.length, partyHeroes.map(h => h.name));
        partyHeroes.forEach(hero => {
            const success = this.heroManager.addHero(hero);
            console.log(`Added ${hero.name} to HeroManager:`, success);
        });
        
        // Create deck
        this.cardManager.createDeck();
        this.cardManager.shuffleDeck();
        
        this.createUI();
        this.createEnemies();
        this.setupEventHandlers();
        
        // Start battle
        this.battleManager.startPlayerTurn();
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
        this.infoButton.setInteractive();
        this.infoButton.on('pointerdown', () => this.toggleInfoMenu());
        this.infoButton.on('pointerover', () => this.infoButton.setTint(0xffffff));
        this.infoButton.on('pointerout', () => this.infoButton.clearTint());
        
        // Info menu (initially hidden)
        this.infoMenu = this.add.container(screenWidth / 2, screenHeight / 2);
        this.createInfoMenu();
        this.infoMenu.setVisible(false);
        this.infoMenuVisible = false;
        
        // Hand cards display area
        this.handCardsContainer = this.add.container(screenWidth / 2, screenHeight - 60);  // Moved up from 40 to 60
        
        // Hero portraits area (above cards)
        this.heroPortraitsContainer = this.add.container(screenWidth / 2, screenHeight - 600);  // 400 * 1.5
        
        // Hand preview area
        this.handPreview = this.add.text(
            screenWidth / 2,
            screenHeight - 330,     // 220 * 1.5
            '',
            {
                fontSize: '54px',   // 36 * 1.5
                color: '#ffff00',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                align: 'center'
            }
        );
        this.handPreview.setOrigin(0.5);
        
        // Gold display
        this.goldDisplay = this.add.text(
            90,                     // 60 * 1.5
            90,                     // 60 * 1.5
            'Gold: 0',
            {
                fontSize: '54px',   // 36 * 1.5
                color: '#ffdd00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        this.goldDisplay.setOrigin(0, 0.5);
        
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
        this.sortButton.setInteractive();
        this.sortButton.on('pointerdown', () => this.battleManager.toggleSortMode());
        this.sortButton.on('pointerover', () => this.sortButton.setTint(0xdddddd));
        this.sortButton.on('pointerout', () => this.sortButton.clearTint());
        
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
        const y = 450;  // Moved up from 600 to compensate for larger UI
        
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
        this.events.on('activeHeroChanged', this.updateHeroPortraits, this);
        
        // Listen for sort mode changes
        this.events.on('sortModeChanged', this.updateSortButtonText, this);
        
        // Info menu toggle with 'I' key
        this.input.keyboard.on('keydown-I', () => {
            this.toggleInfoMenu();
        });
        
        // Sort toggle with 'S' key
        this.input.keyboard.on('keydown-S', () => {
            this.battleManager.toggleSortMode();
        });
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
    
    updateHandDisplay(cards, selectedCards = []) {
        // Clear previous hand display
        this.handCardsContainer.removeAll(true);
        
        if (!cards || cards.length === 0) {
            this.handPreview.setText('');
            return;
        }
        
        // Update hand preview
        this.updateHandPreview(cards, selectedCards);
        
        // Display cards
        const cardSpacing = UIConfig.card.spacing;  // Now 210
        const startX = -(cards.length - 1) * cardSpacing / 2;
        
        // Store previous selection state to avoid replaying animations
        if (!this.previousSelectedCards) this.previousSelectedCards = [];
        
        cards.forEach((card, index) => {
            const cardX = startX + (index * cardSpacing);
            const baseCardY = 0;
            const isSelected = selectedCards.includes(index);
            const wasSelected = this.previousSelectedCards.includes(index);
            
            // Create card container for easier animation
            const cardContainer = this.add.container(cardX, isSelected ? baseCardY - 30 : baseCardY);
            
            // Only animate if selection state changed
            if (isSelected && !wasSelected) {
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
            cardData.bottomRankText.x -= cardWidth/2;
            cardData.bottomRankText.y -= cardHeight/2;
            cardData.bottomSuitText.x -= cardWidth/2;
            cardData.bottomSuitText.y -= cardHeight/2;
            cardData.centerSuitText.x -= cardWidth/2;
            cardData.centerSuitText.y -= cardHeight/2;
            
            // Add selection highlight
            if (isSelected) {
                const highlight = this.add.graphics();
                highlight.lineStyle(6, 0xffff00);
                highlight.strokeRoundedRect(-cardWidth/2 - 3, -cardHeight/2 - 3, cardWidth + 6, cardHeight + 6, 8);
                cardContainer.add(highlight);
            }
            
            // Card number indicator
            const numberText = this.add.text(0, cardHeight/2 + 30, (index + 1).toString(), {
                fontSize: '36px',  // Increased from 24px
                color: '#666666',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            });
            numberText.setOrigin(0.5);
            
            // Add elements to container
            cardContainer.add([
                cardData.graphics,
                cardData.topRankText,
                cardData.topSuitText,
                cardData.bottomRankText,
                cardData.bottomSuitText,
                cardData.centerSuitText,
                numberText
            ]);
            
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
    
    updateHandPreview(cards, selectedCards) {
        if (selectedCards.length === 0) {
            this.handPreview.setText('');
            // Clear damage preview when no cards selected
            this.clearAllDamagePreview();
            // Clear hero activation indicator
            this.updateHeroActivationIndicator(false);
            return;
        }
        
        try {
            // Get selected cards
            const selectedCardObjects = selectedCards.map(index => cards[index]);
            
            // Import PokerHand dynamically to avoid circular imports
            import('../game/PokerHand.js').then(module => {
                const PokerHand = module.default;
                const pokerHand = new PokerHand(selectedCardObjects);
                
                // Calculate damage
                const battleManager = this.scene.get('BattleScene').battleManager;
                const baseDamage = battleManager.calculateDamage(pokerHand);
                
                // Calculate hero modified damage
                let finalDamage = baseDamage;
                let heroModified = false;
                const currentTarget = battleManager.getCurrentTarget();
                
                // Only calculate damage if target is alive
                if (!currentTarget || !currentTarget.isAlive || currentTarget.currentHealth <= 0) {
                    this.handPreview.setText('');
                    this.clearAllDamagePreview();
                    this.updateHeroActivationIndicator([]);
                    return;
                }
                
                // Check which heroes will activate for this hand
                let activatedHeroes = [];
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
                
                // Update preview text to show base damage and hero bonus separately
                let previewText = `${pokerHand.handName}\n${baseDamage} damage`;
                if (heroModified) {
                    previewText += ` (+${finalDamage - baseDamage})`;
                }
                this.handPreview.setText(previewText);
                
                // Indicate hero ability activation in portrait
                this.updateHeroActivationIndicator(activatedHeroes);
                
                // Update target health bar indicator
                this.updateTargetDamageIndicator(finalDamage);
            });
        } catch (error) {
            this.handPreview.setText('Invalid hand selection');
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
        
        // Reset all portrait positions if no heroes activated
        if ((!activatedHeroes || activatedHeroes.length === 0) && this.heroManager) {
            const heroes = this.heroManager.getAllHeroes();
            const portraitContainers = this.heroPortraitsContainer.list;
            
            heroes.forEach((hero, index) => {
                if (portraitContainers[index]) {
                    const portraitContainer = portraitContainers[index];
                    // Reset to stored original position
                    if (portraitContainer.originalY !== undefined) {
                        this.tweens.add({
                            targets: portraitContainer,
                            y: portraitContainer.originalY,
                            duration: 200,
                            ease: 'Power2'
                        });
                    }
                }
            });
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
                    
                    // Create glowing effect around activated hero portrait
                    const glowEffect = this.add.graphics();
                    glowEffect.lineStyle(UIConfig.hero.glowThickness, glowColor, 1.0);
                    glowEffect.strokeRoundedRect(
                        -UIConfig.hero.portraitWidth/2 - 5, 
                        -UIConfig.hero.portraitHeight/2 - 5, 
                        UIConfig.hero.portraitWidth + 10, 
                        UIConfig.hero.portraitHeight + 10, 
                        12
                    );
                    
                    // Position at the same location as the portrait container
                    glowEffect.x = this.heroPortraitsContainer.x + portraitContainer.x;
                    glowEffect.y = this.heroPortraitsContainer.y + portraitContainer.y;
                    
                    // Add pulsing animation
                    this.tweens.add({
                        targets: glowEffect,
                        alpha: { from: 1.0, to: 0.4 },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    // Store original position if not already stored
                    if (portraitContainer.originalY === undefined) {
                        portraitContainer.originalY = portraitContainer.y;
                    }
                    
                    // Animate portrait container to slide up slightly to fixed position
                    this.tweens.add({
                        targets: portraitContainer,
                        y: portraitContainer.originalY - 8,
                        duration: 300,
                        ease: 'Back.out'
                    });
                    
                    // Move the glow effect to follow the portrait
                    this.tweens.add({
                        targets: glowEffect,
                        y: this.heroPortraitsContainer.y + portraitContainer.originalY - 8,
                        duration: 300,
                        ease: 'Back.out'
                    });
                    
                    // Add bonus indicator text next to portrait
                    const heroBonusText = this.add.text(
                        this.heroPortraitsContainer.x + portraitContainer.x + 90,
                        this.heroPortraitsContainer.y + portraitContainer.originalY - 28, // Use original position minus offset
                        '+',
                        {
                            fontSize: '32px',
                            color: `#${glowColor.toString(16).padStart(6, '0')}`,
                            fontFamily: 'Arial',
                            fontStyle: 'bold'
                        }
                    );
                    heroBonusText.setOrigin(0.5);
                    
                    // Add pulsing animation to bonus text and move it up too
                    this.tweens.add({
                        targets: heroBonusText,
                        scaleX: { from: 1.0, to: 1.3 },
                        scaleY: { from: 1.0, to: 1.3 },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    // Move the bonus text up with the portrait (to fixed position)
                    this.tweens.add({
                        targets: heroBonusText,
                        y: this.heroPortraitsContainer.y + portraitContainer.originalY - 36, // Fixed position
                        duration: 300,
                        ease: 'Back.out'
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
        this.goldDisplay.setText(`Gold: ${gold}`);
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
            portraitBg.lineStyle(isActive ? 4 : 2, isActive ? 0x000000 : 0x666666);
            portraitBg.strokeRoundedRect(-portraitWidth/2, -portraitHeight/2, portraitWidth, portraitHeight, 8);
            
            // Hero portrait image
            let heroImage = null;
            if (hero.portraitKey && this.textures.exists(hero.portraitKey)) {
                heroImage = this.add.image(0, 0, hero.portraitKey);
                heroImage.setDisplaySize(portraitWidth - 8, portraitHeight - 8);
                heroImage.setOrigin(0.5);
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

    update() {
        // Game loop updates if needed
    }
}