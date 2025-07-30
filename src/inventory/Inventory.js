export default class Inventory {
    constructor() {
        this.resources = {
            gold: 0,
            gems: 0,
            essence: 0
        };
        
        this.items = [];
        this.maxSlots = 20;
    }
    
    // Resource methods
    addResource(type, amount) {
        if (this.resources.hasOwnProperty(type)) {
            this.resources[type] += amount;
            return true;
        }
        return false;
    }
    
    removeResource(type, amount) {
        if (this.resources.hasOwnProperty(type) && this.resources[type] >= amount) {
            this.resources[type] -= amount;
            return true;
        }
        return false;
    }
    
    getResource(type) {
        return this.resources[type] || 0;
    }
    
    hasResource(type, amount) {
        return this.getResource(type) >= amount;
    }
    
    // Item methods
    addItem(item) {
        if (this.items.length < this.maxSlots) {
            this.items.push(item);
            return true;
        }
        return false; // Inventory full
    }
    
    removeItem(itemId) {
        const index = this.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            return this.items.splice(index, 1)[0];
        }
        return null;
    }
    
    getItems() {
        return [...this.items];
    }
    
    getItemCount() {
        return this.items.length;
    }
    
    isFull() {
        return this.items.length >= this.maxSlots;
    }
    
    // PlayerDeck integration methods
    addCardsToDeck(cards, playerDeck) {
        if (!playerDeck) return false;
        
        let addedCount = 0;
        cards.forEach(card => {
            if (playerDeck.addCard(card)) {
                addedCount++;
            }
        });
        
        return addedCount;
    }
    
    removeCardFromDeck(cardId, playerDeck) {
        if (!playerDeck) return null;
        
        return playerDeck.removeCard(cardId);
    }
    
    modifyCardInDeck(cardId, modifier, action, playerDeck) {
        if (!playerDeck) return false;
        
        return playerDeck.modifyCard(cardId, modifier, action);
    }
    
    getDeckStats(playerDeck) {
        if (!playerDeck) return null;
        
        return playerDeck.getDeckStats();
    }
    
    // Save/Load
    save() {
        return {
            resources: { ...this.resources },
            items: [...this.items],
            maxSlots: this.maxSlots
        };
    }
    
    load(data) {
        if (data.resources) {
            this.resources = { ...data.resources };
        }
        if (data.items) {
            this.items = [...data.items];
        }
        if (data.maxSlots) {
            this.maxSlots = data.maxSlots;
        }
    }
}