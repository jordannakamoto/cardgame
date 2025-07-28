import ModeManager, { GameModes } from '../managers/ModeManager.js';

export class DebugMenu {
    constructor() {
        this.init();
    }

    init() {
        const battleBtn = document.getElementById('battle-mode');
        const campaignBtn = document.getElementById('campaign-mode');
        const shopBtn = document.getElementById('shop-mode');
        const eventBtn = document.getElementById('event-mode');
        const partyBtn = document.getElementById('party-mode');

        battleBtn.addEventListener('click', () => this.setMode(GameModes.BATTLE));
        campaignBtn.addEventListener('click', () => this.setMode(GameModes.CAMPAIGN));
        shopBtn.addEventListener('click', () => this.setMode(GameModes.SHOP));
        eventBtn.addEventListener('click', () => this.setMode(GameModes.EVENT));
        partyBtn.addEventListener('click', () => this.setMode(GameModes.PARTY));
    }

    setMode(mode) {
        ModeManager.setMode(mode);
        this.updateButtonStates(mode);
    }

    updateButtonStates(activeMode) {
        const buttons = document.querySelectorAll('.menu-button');
        buttons.forEach(btn => btn.classList.remove('active'));

        if (activeMode === GameModes.BATTLE) {
            document.getElementById('battle-mode').classList.add('active');
        } else if (activeMode === GameModes.CAMPAIGN) {
            document.getElementById('campaign-mode').classList.add('active');
        } else if (activeMode === GameModes.SHOP) {
            document.getElementById('shop-mode').classList.add('active');
        } else if (activeMode === GameModes.EVENT) {
            document.getElementById('event-mode').classList.add('active');
        } else if (activeMode === GameModes.PARTY) {
            document.getElementById('party-mode').classList.add('active');
        }
    }
}