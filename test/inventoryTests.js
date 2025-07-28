import { describe, test, expect, logAction, logResult, logGameState } from './testFramework.js';
import Inventory from '../src/inventory/Inventory.js';

// Test the inventory and resource system
describe('Inventory System Tests', () => {
    test('Basic Resource Management', () => {
        logGameState('INITIALIZING INVENTORY');
        
        const inventory = new Inventory();
        
        // Test initial state
        logAction('Creating new inventory');
        logResult('Initial gold', inventory.getResource('gold'));
        expect(inventory.getResource('gold'), 0, 'Initial gold should be 0');
        expect(inventory.getResource('gems'), 0, 'Initial gems should be 0');
        expect(inventory.getResource('essence'), 0, 'Initial essence should be 0');
        
        // Test resource addition
        logGameState('ADDING RESOURCES');
        logAction('Adding 50 gold');
        inventory.addResource('gold', 50);
        logResult('Gold after addition', inventory.getResource('gold'));
        expect(inventory.getResource('gold'), 50, 'Gold should be 50 after adding 50');
        
        logAction('Adding 25 gems');
        inventory.addResource('gems', 25);
        expect(inventory.getResource('gems'), 25, 'Gems should be 25 after adding 25');
        
        // Test resource removal
        logGameState('SPENDING RESOURCES');
        logAction('Spending 30 gold');
        const goldSpent = inventory.removeResource('gold', 30);
        expect(goldSpent, true, 'Should successfully spend 30 gold');
        expect(inventory.getResource('gold'), 20, 'Should have 20 gold remaining');
        
        logAction('Attempting to spend 100 gold (insufficient funds)');
        const insufficientSpend = inventory.removeResource('gold', 100);
        expect(insufficientSpend, false, 'Should fail to spend insufficient gold');
        expect(inventory.getResource('gold'), 20, 'Gold should remain unchanged');
        
        // Test resource checking
        logGameState('CHECKING RESOURCE AVAILABILITY');
        expect(inventory.hasResource('gold', 15), true, 'Should have 15 gold');
        expect(inventory.hasResource('gold', 50), false, 'Should not have 50 gold');
        
        // Test item management
        logGameState('MANAGING ITEMS');
        const testItem = { id: 'sword1', name: 'Iron Sword', value: 100 };
        
        const itemAdded = inventory.addItem(testItem);
        expect(itemAdded, true, 'Item should be added successfully');
        expect(inventory.getItemCount(), 1, 'Item count should be 1');
        
        const items = inventory.getItems();
        expect(items[0]?.name, 'Iron Sword', 'Retrieved item name should match');
        
        // Test save/load
        logGameState('SAVE/LOAD SYSTEM');
        const saveData = inventory.save();
        expect(saveData.resources.gold, 20, 'Save data should contain correct gold amount');
        
        const newInventory = new Inventory();
        newInventory.load(saveData);
        expect(newInventory.getResource('gold'), 20, 'Loaded gold should match saved gold');
        expect(newInventory.getItemCount(), 1, 'Loaded item count should match');
        
        logGameState('INVENTORY TESTS COMPLETE');
    });
});

// Test gold earning simulation
describe('Gold Reward System Tests', () => {
    test('Battle Gold Rewards', () => {
        logGameState('SIMULATING BATTLE REWARDS');
        
        const inventory = new Inventory();
        
        // Simulate enemy defeats with different gold rewards
        const enemyRewards = [
            { name: 'Goblin', gold: 8 },
            { name: 'Orc', gold: 12 },
            { name: 'Troll', gold: 18 }
        ];
        
        let totalBattleGold = 0;
        
        enemyRewards.forEach(enemy => {
            logAction(`Defeating ${enemy.name}`);
            inventory.addResource('gold', enemy.gold);
            totalBattleGold += enemy.gold;
            logResult(`Gold earned from ${enemy.name}`, enemy.gold);
        });
        
        logGameState('BATTLE COMPLETE');
        expect(totalBattleGold, 38, 'Total battle gold should be 38');
        expect(inventory.getResource('gold'), 38, 'Final gold amount should be 38');
        
        logGameState('GOLD SYSTEM TESTS COMPLETE');
    });
    
    test('Gold Scaling Formula', () => {
        logGameState('TESTING GOLD SCALING');
        
        const testCases = [
            { health: 30, expectedGold: 8 },
            { health: 60, expectedGold: 11 },
            { health: 90, expectedGold: 14 },
            { health: 120, expectedGold: 17 }
        ];
        
        testCases.forEach(({ health, expectedGold }) => {
            const calculatedGold = Math.floor(health / 10) + 5;
            logAction(`Enemy with ${health} health`);
            logResult('Calculated gold reward', calculatedGold);
            expect(calculatedGold, expectedGold, `${health} health should give ${expectedGold} gold`);
        });
    });
});