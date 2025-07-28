# Test System Documentation

## Overview

This project uses a custom JavaScript testing framework designed to simulate game engine runtime behavior. Tests read like a slice of the actual game engine processing, making them intuitive for game developers.

## Test Structure

```
test/
├── testFramework.js          # Core testing framework
├── runAllTests.js           # Test runner for all suites
├── card-engine/             # Card engine system tests
│   ├── cardTests.js         # Individual card functionality
│   ├── cardManagerTests.js  # Deck management & operations
│   └── pokerHandTests.js    # Poker hand recognition
└── TEST_SYSTEM.md          # This documentation
```

## Running Tests

### Available Commands

```bash
npm test              # Run all card engine tests
npm run test:poker    # Run poker hand recognition only
npm run test:cards    # Run card system tests only
npm run test:manager  # Run deck management tests only
```

### Example Output

```
▶️  Deal Royal Flush in Hearts
    [DEALING CARDS]
    > Creating PokerHand instance
    → Hand Classification: Royal Flush
    → Hand Rank: 10
    [ROYAL FLUSH DETECTED]
    ✅ PASS
```

## Framework API

### Core Functions

```javascript
import { describe, test, expect, logAction, logResult, logGameState } from '../testFramework.js';

describe('System Name', () => {
    test('Specific behavior test', () => {
        // Test implementation
    });
});
```

### Logging Functions

- **`logGameState(state)`** - Shows game engine states like `[DEALING CARDS]`
- **`logAction(action)`** - Shows engine actions like `> Creating PokerHand instance`
- **`logResult(description, result)`** - Shows results like `→ Hand Classification: Royal Flush`

### Assertions

Standard assertion methods available:
- `expect(actual).toBe(expected)`
- `expect(actual).toEqual(expected)`
- `expect(actual).toBeGreaterThan(expected)`
- `expect(fn).toThrow(expectedMessage)`

## Writing Tests

### Game Engine Style

Tests should simulate actual game runtime behavior:

```javascript
test('Deal Pocket Aces', () => {
    logGameState('DEALING POCKET ROCKETS');
    const cards = [
        createCard('A', 'Hearts', 14),
        createCard('A', 'Diamonds', 14),
        // ... more cards
    ];
    
    const hand = new PokerHand(cards);
    logResult('Premium Pair', 'Pocket Aces');
    
    expect(hand.handRank).toBe(HAND_RANKINGS.ONE_PAIR);
});
```

### Naming Conventions

- **Game states**: `[DEALING CARDS]`, `[SHOWDOWN TIME]`, `[VALIDATION CHECK]`
- **Actions**: `> Creating instance`, `> Shuffling deck`, `> Drawing card`
- **Results**: `→ Classification: Royal Flush`, `→ Winner: Player 1`

### Test Categories

1. **System Tests** - Core functionality (card creation, deck management)
2. **Recognition Tests** - Algorithm validation (poker hand detection)
3. **Comparison Tests** - Logic validation (hand rankings, tie-breakers)
4. **Validation Tests** - Error handling (invalid inputs)

## Framework Features

### Custom Test Runner
- No external dependencies (Jest-free)
- Game engine focused output
- Minimal, clean assertions
- Real-time pass/fail feedback

### Console Output
- **▶️** Test execution marker
- **[STATE]** Game engine states
- **>** Engine actions
- **→** Results and outputs
- **✅/❌** Pass/fail indicators

### Error Handling
- Descriptive error messages
- Stack trace preservation
- Graceful failure handling
- Test isolation

## Adding New Tests

1. Create test file in appropriate folder:
   ```bash
   touch test/card-engine/newSystemTests.js
   ```

2. Import the framework:
   ```javascript
   import { describe, test, expect, logAction, logResult, logGameState } from '../testFramework.js';
   ```

3. Write game engine style tests:
   ```javascript
   describe('New System', () => {
       test('System behavior', () => {
           logGameState('INITIALIZING SYSTEM');
           // Test implementation
           logResult('Status', 'Ready');
       });
   });
   ```

4. Add to test runner if needed:
   ```javascript
   // In runAllTests.js
   await import('./card-engine/newSystemTests.js');
   ```

## Best Practices

### Do ✅
- Use game terminology ("Deal", "Showdown", "Draw")
- Log game states and actions
- Keep tests focused on one behavior
- Use descriptive test names
- Show intermediate results

### Don't ❌
- Write verbose descriptions
- Use technical jargon in output
- Create overly complex test setups
- Skip error case testing
- Bundle multiple behaviors in one test

## System Architecture

The test framework simulates a game engine's internal logging and state management, making it natural for game developers to understand what each test validates and debug issues when they occur.

Each test reads like watching the game engine process a specific scenario in real-time, from initial state through actions to final results.