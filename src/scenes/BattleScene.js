import Phaser from 'phaser';
import CardManager from '../game/CardManager.js';
import BattleManager from '../battle/BattleManager.js';
import Enemy from '../battle/Enemy.js';
import Inventory from '../inventory/Inventory.js';
import { EnemyTypes, EnemyFactory } from '../battle/EnemyTypes.js';
import HeroManager from '../heroes/HeroManager.js';
import StarterHero from '../heroes/heroes/StarterHero.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
    }

    create() {
        // Initialize managers
        this.cardManager = new CardManager(this);
        this.battleManager = new BattleManager(this);
        this.inventory = new Inventory();
        this.heroManager = new HeroManager(this);
        
        // Create starter hero
        const starterHero = new StarterHero();
        this.heroManager.addHero(starterHero);
        
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
        
        // Battle title
        this.titleText = this.add.text(
            screenWidth / 2,
            60,
            'BATTLE',
            {
                fontSize: '64px',
                color: '#ffffff',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        this.titleText.setOrigin(0.5);
        
        // Info button (small 'i' in corner)
        this.infoButton = this.add.text(
            screenWidth - 60,
            60,
            'i',
            {
                fontSize: '40px',
                color: '#cccccc',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                backgroundColor: '#333333',
                padding: { x: 16, y: 12 }
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
        this.handCardsContainer = this.add.container(screenWidth / 2, screenHeight - 40);
        
        // Hero portraits area (above cards)
        this.heroPortraitsContainer = this.add.container(screenWidth / 2, screenHeight - 400);
        
        // Hand preview area
        this.handPreview = this.add.text(
            screenWidth / 2,
            screenHeight - 220,
            '',
            {
                fontSize: '36px',
                color: '#ffff00',
                fontFamily: 'Arial',
                fontStyle: 'bold',
                align: 'center'
            }
        );
        this.handPreview.setOrigin(0.5);
        
        // Gold display
        this.goldDisplay = this.add.text(
            60,
            60,
            'Gold: 0',
            {
                fontSize: '36px',
                color: '#ffdd00',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }
        );
        this.goldDisplay.setOrigin(0, 0.5);
        
        // Hero display
        this.heroDisplay = this.add.text(
            60,
            120,
            '',
            {
                fontSize: '28px',
                color: '#ffffff',
                fontFamily: 'Arial'
            }
        );
        this.heroDisplay.setOrigin(0, 0.5);
        
        // Mana display
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
        const spacing = 400;
        const totalWidth = (enemyTypes.length - 1) * spacing;
        const startX = (screenWidth - totalWidth) / 2;
        const y = 600;
        
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
        
        // Info menu toggle with 'I' key
        this.input.keyboard.on('keydown-I', () => {
            this.toggleInfoMenu();
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
        const cardSpacing = 160;
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
            const cardWidth = 120;
            const cardHeight = 168;
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
            const numberText = this.add.text(0, cardHeight/2 + 20, (index + 1).toString(), {
                fontSize: '24px',
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
            this.handPreview.setText('Select cards to see hand preview');
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
                if (this.scene.get('BattleScene').heroManager) {
                    finalDamage = this.scene.get('BattleScene').heroManager.calculateDamageWithHero(baseDamage, pokerHand, {
                        targetEnemy: battleManager.getCurrentTarget(),
                        selectedCards: selectedCardObjects
                    });
                    heroModified = finalDamage !== baseDamage;
                }
                
                // Update preview text to show base damage and hero bonus separately
                let previewText = `${pokerHand.handName}\n${baseDamage} damage`;
                if (heroModified) {
                    previewText += ` (+${finalDamage - baseDamage})`;
                }
                this.handPreview.setText(previewText);
                
                // Indicate hero ability activation in portrait
                this.updateHeroActivationIndicator(heroModified);
                
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
        
        // Then show preview on current target
        if (targetEnemy && targetEnemy.isAlive) {
            targetEnemy.showDamagePreview(damage);
        }
    }
    
    clearAllDamagePreview() {
        const battleManager = this.scene.get('BattleScene').battleManager;
        battleManager.enemies.forEach(enemy => {
            enemy.hideDamagePreview();
        });
    }
    
    updateHeroActivationIndicator(isActivated) {
        // Clear any existing activation effects
        if (this.heroActivationEffect) {
            this.heroActivationEffect.destroy();
            this.heroActivationEffect = null;
        }
        if (this.heroBonusText) {
            this.heroBonusText.destroy();
            this.heroBonusText = null;
        }
        
        // Reset portrait positions if deactivating
        if (!isActivated && this.heroManager) {
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
        }
        
        if (isActivated && this.heroManager) {
            const activeHero = this.heroManager.getActiveHero();
            if (activeHero) {
                const heroes = this.heroManager.getAllHeroes();
                const activeIndex = heroes.indexOf(activeHero);
                
                // Get the active hero's portrait container
                const portraitContainers = this.heroPortraitsContainer.list;
                if (portraitContainers[activeIndex]) {
                    const portraitContainer = portraitContainers[activeIndex];
                    
                    // Create glowing effect around active hero portrait
                    const glowEffect = this.add.graphics();
                    glowEffect.lineStyle(8, 0xff8800, 1.0);
                    glowEffect.strokeRoundedRect(-85, -55, 170, 110, 12);
                    
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
                    this.heroBonusText = this.add.text(
                        this.heroPortraitsContainer.x + portraitContainer.x + 90,
                        this.heroPortraitsContainer.y + portraitContainer.originalY - 28, // Use original position minus offset
                        '+',
                        {
                            fontSize: '32px',
                            color: '#ff8800',
                            fontFamily: 'Arial',
                            fontStyle: 'bold'
                        }
                    );
                    this.heroBonusText.setOrigin(0.5);
                    
                    // Add pulsing animation to bonus text and move it up too
                    this.tweens.add({
                        targets: this.heroBonusText,
                        scaleX: { from: 1.0, to: 1.3 },
                        scaleY: { from: 1.0, to: 1.3 },
                        duration: 600,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.easeInOut'
                    });
                    
                    // Move the bonus text up with the portrait (to fixed position)
                    this.tweens.add({
                        targets: this.heroBonusText,
                        y: this.heroPortraitsContainer.y + portraitContainer.originalY - 36, // Fixed position
                        duration: 300,
                        ease: 'Back.out'
                    });
                    
                    this.heroActivationEffect = glowEffect;
                }
            }
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
        const hero = this.heroManager.getActiveHero();
        if (hero) {
            this.heroDisplay.setText(`Hero: ${hero.name}`);
            this.updateManaDisplay(hero.currentMana, hero.maxMana);
        }
    }
    
    updateManaDisplay(current, max) {
        this.manaDisplay.setText(`Mana: ${current}/${max}`);
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
        
        const portraitWidth = 160;
        const portraitHeight = 100;
        const spacing = 180;
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
            
            
            // Mana bar background
            const manaBarBg = this.add.rectangle(0, portraitHeight/2 + 35, portraitWidth - 10, 8, 0x333333);
            
            // Mana bar
            const manaPercent = hero.currentMana / hero.maxMana;
            const manaBarWidth = (portraitWidth - 10) * manaPercent;
            const manaBar = this.add.rectangle(
                -(portraitWidth - 10)/2 + manaBarWidth/2, 
                portraitHeight/2 + 35, 
                manaBarWidth, 
                8, 
                0x6666ff
            );
            
            // Add elements to container
            portraitContainer.add([portraitBg, heroImage, manaBarBg, manaBar]);
            
            // Make portrait clickable to switch heroes
            portraitBg.setInteractive(new Phaser.Geom.Rectangle(-portraitWidth/2, -portraitHeight/2, portraitWidth, portraitHeight), Phaser.Geom.Rectangle.Contains);
            portraitBg.on('pointerdown', () => {
                this.heroManager.setActiveHero(index);
                this.updateHeroDisplay();
            });
            
            // Add hover effect
            portraitBg.on('pointerover', () => {
                portraitContainer.setScale(1.05);
            });
            portraitBg.on('pointerout', () => {
                portraitContainer.setScale(1.0);
            });
            
            // Add to main container
            this.heroPortraitsContainer.add(portraitContainer);
        });
    }
    
    update() {
        // Game loop updates if needed
    }
}