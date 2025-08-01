export default class ManaSystem {
    constructor(scene) {
        this.scene = scene;
        
        // Mana pools for each suit
        this.mana = {
            '♠': 0, // Spades - black
            '♥': 0, // Hearts - red  
            '♦': 0, // Diamonds - red
            '♣': 0  // Clubs - black
        };
        
        // Maximum mana per suit
        this.maxMana = 10;
        
        // UI elements
        this.manaContainer = null;
        this.manaTexts = {};
        this.manaIcons = {};
        
        this.createUI();
        this.setupEventListeners();
    }
    
    createUI() {
        // Position above the hand preview panel, moved right slightly
        const screenHeight = this.scene.cameras.main.height;
        this.manaContainer = this.scene.add.container(150, screenHeight - 200);
        this.manaContainer.setDepth(1000); // High depth to stay on top
        this.manaContainer.setScrollFactor(0); // Keep fixed to camera
        
        // Background panel for mana display - much bigger
        const panelWidth = 400;
        const panelHeight = 120;
        const panelBg = this.scene.add.rectangle(0, 0, panelWidth, panelHeight, 0x000000, 0.6);
        panelBg.setStrokeStyle(2, 0x444444);
        this.manaContainer.add(panelBg);
        
        // Remove title text as requested
        
        // Create mana displays for each suit
        const suits = ['♠', '♥', '♦', '♣'];
        const suitColors = {
            '♠': '#8b5cf6', // Purple for spades
            '♥': '#ef4444', // Red for hearts
            '♦': '#eab308', // Yellow for diamonds
            '♣': '#3b82f6'  // Blue for clubs
        };
        
        suits.forEach((suit, index) => {
            const xPos = -120 + (index * 80); // Even more spacing for larger display
            const yPos = 0; // Center vertically since no title
            
            // Suit symbol - much bigger
            const suitIcon = this.scene.add.text(xPos, yPos - 15, suit, {
                fontSize: '48px',
                color: suitColors[suit],
                fontFamily: 'Arial'
            });
            suitIcon.setOrigin(0.5);
            this.manaContainer.add(suitIcon);
            this.manaIcons[suit] = suitIcon;
            
            // Mana count - same color as suit
            const manaText = this.scene.add.text(xPos, yPos + 25, '0', {
                fontSize: '36px',
                color: suitColors[suit],
                fontFamily: 'Arial',
                fontWeight: 'bold'
            });
            manaText.setOrigin(0.5);
            this.manaContainer.add(manaText);
            this.manaTexts[suit] = manaText;
        });
    }
    
    setupEventListeners() {
        // Listen for card play events from battle manager
        this.scene.events.on('handPlayed', this.onHandPlayed, this);
        
        // Listen for battle start/end to reset mana
        this.scene.events.on('battleStart', this.resetMana, this);
        this.scene.events.on('battleEnd', this.resetMana, this);
    }
    
    onHandPlayed(eventData) {
        console.log('ManaSystem: handPlayed event received', eventData);
        if (!eventData || !eventData.selectedCards) {
            console.log('ManaSystem: No selectedCards in event data');
            return;
        }
        
        // Generate mana from played cards
        eventData.selectedCards.forEach(card => {
            console.log('ManaSystem: Adding mana for suit', card.suit);
            const suitSymbol = this.convertSuitToSymbol(card.suit);
            this.addMana(suitSymbol, 1);
        });
    }
    
    convertSuitToSymbol(suitName) {
        const suitMap = {
            'Spades': '♠',
            'Hearts': '♥', 
            'Diamonds': '♦',
            'Clubs': '♣'
        };
        return suitMap[suitName] || suitName;
    }
    
    addMana(suit, amount) {
        console.log('ManaSystem: addMana called with suit:', suit, 'amount:', amount);
        if (!this.mana.hasOwnProperty(suit)) {
            console.log('ManaSystem: Invalid suit:', suit);
            return;
        }
        
        const oldAmount = this.mana[suit];
        this.mana[suit] = Math.min(this.maxMana, this.mana[suit] + amount);
        console.log('ManaSystem: Mana for', suit, 'changed from', oldAmount, 'to', this.mana[suit]);
        
        // Update display
        this.updateManaDisplay(suit);
        
        // Animate mana gain if amount increased
        if (this.mana[suit] > oldAmount) {
            this.animateManaGain(suit);
        }
    }
    
    spendMana(suit, amount) {
        if (!this.mana.hasOwnProperty(suit)) return false;
        
        if (this.mana[suit] >= amount) {
            this.mana[suit] -= amount;
            this.updateManaDisplay(suit);
            this.animateManaSpend(suit);
            return true;
        }
        
        return false;
    }
    
    getMana(suit) {
        return this.mana[suit] || 0;
    }
    
    getAllMana() {
        return { ...this.mana };
    }
    
    canAfford(suitCosts) {
        // suitCosts format: { '♠': 2, '♥': 1, etc. }
        for (const [suit, cost] of Object.entries(suitCosts)) {
            if (this.getMana(suit) < cost) {
                return false;
            }
        }
        return true;
    }
    
    updateManaDisplay(suit) {
        if (this.manaTexts[suit]) {
            const current = this.mana[suit];
            this.manaTexts[suit].setText(current.toString());
            
            // Keep the same color as the suit
            const suitColors = {
                '♠': '#8b5cf6', // Purple for spades
                '♥': '#ef4444', // Red for hearts
                '♦': '#eab308', // Yellow for diamonds
                '♣': '#3b82f6'  // Blue for clubs
            };
            this.manaTexts[suit].setColor(suitColors[suit]);
        }
    }
    
    animateManaGain(suit) {
        if (this.manaIcons[suit] && this.manaTexts[suit]) {
            // Pulse animation for mana gain
            this.scene.tweens.add({
                targets: [this.manaIcons[suit], this.manaTexts[suit]],
                scaleX: 1.3,
                scaleY: 1.3,
                duration: 150,
                yoyo: true,
                ease: 'Power2'
            });
            
            // Glow effect
            this.scene.tweens.add({
                targets: this.manaIcons[suit],
                alpha: 0.6,
                duration: 100,
                yoyo: true,
                repeat: 2,
                ease: 'Power2'
            });
        }
    }
    
    animateManaSpend(suit) {
        if (this.manaTexts[suit]) {
            // Fade animation for mana spend
            this.scene.tweens.add({
                targets: this.manaTexts[suit],
                alpha: 0.3,
                duration: 100,
                yoyo: true,
                ease: 'Power2'
            });
        }
    }
    
    resetMana() {
        // Reset all mana to 0
        Object.keys(this.mana).forEach(suit => {
            this.mana[suit] = 0;
            this.updateManaDisplay(suit);
        });
    }
    
    destroy() {
        // Clean up event listeners
        this.scene.events.off('handPlayed', this.onHandPlayed, this);
        this.scene.events.off('battleStart', this.resetMana, this);
        this.scene.events.off('battleEnd', this.resetMana, this);
        
        // Destroy UI
        if (this.manaContainer) {
            this.manaContainer.destroy();
        }
    }
}