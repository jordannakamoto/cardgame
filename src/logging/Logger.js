// Centralized logging system for the game
export default class Logger {
    static config = {
        cardSelection: false,
        battle: false,
        poker: false,
        general: true
    };
    
    static log(category, message, ...args) {
        if (this.config[category]) {
            console.log(`[${category.toUpperCase()}]`, message, ...args);
        }
    }
    
    static warn(category, message, ...args) {
        if (this.config[category]) {
            console.warn(`[${category.toUpperCase()}]`, message, ...args);
        }
    }
    
    static error(category, message, ...args) {
        if (this.config[category]) {
            console.error(`[${category.toUpperCase()}]`, message, ...args);
        }
    }
    
    static enable(category) {
        this.config[category] = true;
    }
    
    static disable(category) {
        this.config[category] = false;
    }
    
    static toggle(category) {
        this.config[category] = !this.config[category];
    }
    
    static enableAll() {
        Object.keys(this.config).forEach(key => {
            this.config[key] = true;
        });
    }
    
    static disableAll() {
        Object.keys(this.config).forEach(key => {
            this.config[key] = false;
        });
    }
    
    static getConfig() {
        return { ...this.config };
    }
}