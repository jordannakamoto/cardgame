# Test System

Comprehensive testing for the Phaser Card Game Engine using our custom test framework.

## Test Structure

### Card Engine Tests (`/card-engine/`)
- **`cardTests.js`** - Basic card functionality
- **`cardManagerTests.js`** - Deck management and shuffling
- **`pokerHandTests.js`** - Poker hand recognition system

### System Tests
- **`inventoryTests.js`** - Resource management and gold rewards

## Running Tests

```bash
# Run all tests
npm test

# Run specific test categories
npm run test:poker      # Poker hand system
npm run test:cards      # Basic card functionality
npm run test:manager    # Deck management
npm run test:inventory  # Inventory and gold system
```

## Test Framework

Uses our custom game-like test framework that simulates runtime scenarios:

```
[INITIALIZING INVENTORY]
    > Creating new inventory
    → Initial gold: 0

[ADDING RESOURCES]
    > Adding 50 gold
    → Gold after addition: 50
```

## Documentation

- **`TEST_SYSTEM.md`** - Detailed framework documentation
- **`inventory-README.md`** - Inventory system test specifics

## Integration

All tests verify systems work independently and integrate properly with the game engine.