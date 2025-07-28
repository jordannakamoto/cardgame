import Enemy from './Enemy.js';

export const EnemyTypes = {
    GOBLIN: {
        name: 'Goblin',
        health: 50,
        goldReward: 8,
        artPath: 'assets/enemies/goblin1.png',
        description: 'A small, cunning creature'
    },
    ORC: {
        name: 'Orc',
        health: 80,
        goldReward: 12,
        artPath: 'assets/enemies/orc2.png',
        description: 'A brutal warrior'
    },
    TROLL: {
        name: 'Troll',
        health: 120,
        goldReward: 18,
        artPath: 'assets/enemies/troll1.png',
        description: 'A massive, regenerating beast'
    }
};

export class EnemyFactory {
    static createEnemy(scene, x, y, enemyType) {
        const config = { ...enemyType };
        return new Enemy(scene, x, y, config);
    }

    static getEnemyType(typeName) {
        return EnemyTypes[typeName.toUpperCase()];
    }

    static getAllEnemyTypes() {
        return Object.values(EnemyTypes);
    }
}

export default EnemyTypes;
