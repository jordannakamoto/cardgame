export const GameModes = {
    BATTLE: 'battle',
    CAMPAIGN: 'campaign',
    SHOP: 'shop',
    EVENT: 'event',
    PARTY: 'party'
};

export class ModeManager {
    constructor() {
        this.currentMode = GameModes.BATTLE;
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    getCurrentMode() {
        return this.currentMode;
    }
}

export default new ModeManager();