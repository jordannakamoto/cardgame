# Inventory System Tests

Tests for the game's inventory and resource management systems.

## What is Tested

### Inventory Core Functions
- **Resource Management**: Adding, removing, and checking gold/gems/essence
- **Item Storage**: Adding items to inventory slots
- **Capacity Limits**: Testing inventory slot limits
- **Save/Load**: Persistence of inventory state

### Gold Reward System
- **Enemy Rewards**: Gold drops from different enemy types
- **Battle Totals**: Accumulation of gold across multiple defeats
- **Scaling Formula**: Gold rewards based on enemy health

## Running Tests

```bash
npm run test:inventory
```

## Test Output

The tests simulate game scenarios:

```
[INITIALIZING INVENTORY]
    > Creating new inventory
    → Initial gold: 0

[ADDING RESOURCES]
    > Adding 50 gold
    → Gold after addition: 50

[SPENDING RESOURCES]
    > Spending 30 gold
    → Gold spending successful: true
    → Gold remaining: 20

[SIMULATING BATTLE REWARDS]
    > Defeating Goblin
    → Gold earned from Goblin: 8
    → Current total gold: 8
```

## Integration

These tests verify:
- Inventory system works independently
- Gold rewards scale properly with enemy difficulty
- Resource management prevents overspending
- Save/load preserves game progress

The inventory system integrates with:
- **Battle System**: Receives gold when enemies die
- **UI System**: Updates gold display in real-time  
- **Game Persistence**: Saves player progress