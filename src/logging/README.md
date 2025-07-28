# Logging System

The game uses a centralized logging system to control debug output across different categories.

## Logger Class

### Configuration Categories

- **`cardSelection`** - Card selection and hand management (default: `false`)
- **`battle`** - Battle system events and state changes (default: `false`)
- **`poker`** - Poker hand evaluation and calculations (default: `false`)
- **`general`** - General game events and info (default: `true`)

### Methods

#### Logging Methods
```javascript
Logger.log(category, message, ...args)     // Standard logging
Logger.warn(category, message, ...args)    // Warning messages
Logger.error(category, message, ...args)   // Error messages
```

#### Control Methods
```javascript
Logger.enable(category)     // Enable logging for category
Logger.disable(category)    // Disable logging for category
Logger.toggle(category)     // Toggle logging for category
Logger.enableAll()          // Enable all categories
Logger.disableAll()         // Disable all categories
Logger.getConfig()          // Get current configuration
```

## Usage Examples

### Basic Logging
```javascript
import Logger from '../logging/Logger.js';

// Log card selection events
Logger.log('cardSelection', 'Card selected:', cardIndex);

// Log battle events
Logger.log('battle', 'Player turn started');

// Log errors
Logger.error('poker', 'Invalid hand evaluation:', hand);
```

### Runtime Control
```javascript
// Enable card selection debugging
Logger.enable('cardSelection');

// Disable all logging for production
Logger.disableAll();

// Toggle battle logging during testing
Logger.toggle('battle');

// Check current configuration
console.log(Logger.getConfig());
```

### Development Workflow
```javascript
// During development - enable specific systems
Logger.enable('cardSelection');
Logger.enable('battle');

// During testing - enable all logging
Logger.enableAll();

// For production - disable debug categories
Logger.disable('cardSelection');
Logger.disable('battle');
Logger.disable('poker');
// Keep 'general' enabled for important messages
```

## Integration

The Logger is used throughout the game systems:

- **BattleManager**: Card selection and battle flow
- **PokerHand**: Hand evaluation and ranking
- **Enemy**: Damage calculations and state changes
- **GameScene**: Scene transitions and setup

## Best Practices

1. **Use appropriate categories** - Don't put everything in 'general'
2. **Meaningful messages** - Include context and relevant data
3. **Toggle off in production** - Disable debug categories for release
4. **Use warn/error appropriately** - Reserve for actual issues
5. **Include relevant data** - Pass objects/arrays as additional arguments

## Adding New Categories

To add a new logging category:

1. Add it to the `config` object in `Logger.js`
2. Set appropriate default value (`true` for important, `false` for debug)
3. Document it in this README
4. Use it in your code with `Logger.log('newCategory', ...)`