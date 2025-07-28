# Phaser Card Game Engine - Claude Context

## Project Overview
A Phaser 3-based card game engine with playing cards, poker hands, and battle mechanics. Built as a single-page application with ES modules and webpack.

## Current Game Resolution
- **Canvas Size:** 2560x1440 (doubled from original 1280x720)
- **Scaling:** All UI elements, text, and sprites scaled proportionally for higher resolution
- **Text:** All font sizes doubled (e.g., 18px → 36px, 32px → 64px)
- **Sprites:** Enemy sprites 160x200px, cards 120x168px in battle

## Architecture

### Core Systems
- **Game Engine:** Phaser 3.70.0
- **Build System:** Webpack with dev server, Babel transpilation
- **Module Type:** ES modules ("type": "module" in package.json)
- **File Extensions:** All imports require .js extensions due to ES module strictness

### Scene Structure
```
PreloadScene → GameScene → BattleScene (default flow)
```

### Key Components

#### Cards & Poker System
- **CardManager** (`src/game/CardManager.js`): Creates realistic playing cards with:
  - Proper card layout (top-left/bottom-right rank/suit, center suit symbol)
  - Unicode suit symbols: ♥ ♦ ♣ ♠
  - Size: 300x420px base, 120x168px in battle
  - Red for hearts/diamonds, black for clubs/spades
  
- **PokerHand** (`src/game/PokerHand.js`): Evaluates poker hands, calculates rankings and tiebreakers
- **Card** (`src/game/Card.js`): Basic card class with rank, suit, value

#### Battle System
- **BattleManager** (`src/battle/BattleManager.js`): Core battle logic
  - Damage calculation with poker hand bonuses
  - Player turn management, card selection
  - **Damage System:** Base damage + card value bonuses
    - HIGH_CARD: 3, ONE_PAIR: 20, TWO_PAIR: 35, THREE_OF_A_KIND: 55
    - STRAIGHT: 75, FLUSH: 90, FULL_HOUSE: 125, FOUR_OF_A_KIND: 160
    - STRAIGHT_FLUSH: 250, ROYAL_FLUSH: 500
  - **Gold System:** Awards total gold only at battle end (not per enemy death)

#### Enemy System
- **Enemy** (`src/battle/Enemy.js`): Individual enemy entities with health, targeting, damage preview
- **EnemyTypes** (`src/battle/EnemyTypes.js`): Centralized enemy definitions
- **EnemyFactory**: Creates enemies from type definitions
- **Enemy Art System**: Loads from `public/assets/enemies/` with fallback colored rectangles

#### Mode Management
- **ModeManager** (`src/managers/ModeManager.js`): Game mode tracking (Battle, Campaign, Shop, Event, Party)
- **DebugMenu** (`src/ui/DebugMenu.js`): Top debug menu bar for mode switching
- **HTML Integration**: Fixed debug menu bar outside canvas area

## Current Enemy Types
```javascript
GOBLIN: { health: 50, goldReward: 8, artPath: 'assets/enemies/goblin1.png' }
ORC: { health: 80, goldReward: 12, artPath: 'assets/enemies/orc2.png' }  
TROLL: { health: 120, goldReward: 18, artPath: 'assets/enemies/troll1.png' }
```

## Key Features Implemented

### Battle Mechanics
- **Card Selection**: 8-card hand, select up to 5 cards to play
- **Poker Evaluation**: Full poker hand rankings with proper damage scaling
- **Enemy Targeting**: Arrow keys to cycle between enemies
- **Visual Feedback**: 
  - Selected cards lift up with yellow highlight
  - Damage preview on targeted enemies
  - Enemy health bars with damage visualization
  - Victory screen with total gold earned

### Visual Systems
- **Responsive Design**: Cards and UI scale with screen size
- **Animation System**: Card selection, damage text, enemy death animations
- **Art Integration**: Dynamic loading of enemy sprites with fallback system
- **Quality Settings**: Anti-aliasing enabled, pixel rounding for crisp text

### Input System
- **Keyboard**: 1-8 for card selection, arrows for targeting, Enter to attack, Space for new hand
- **Mouse**: Click cards to select, click enemies to target
- **Hover Effects**: Card preview on hover

## File Structure
```
src/
├── battle/
│   ├── BattleManager.js     # Core battle logic
│   ├── Enemy.js             # Enemy entities
│   └── EnemyTypes.js        # Enemy definitions & factory
├── game/
│   ├── Card.js              # Basic card class
│   ├── CardManager.js       # Card rendering & deck management
│   └── PokerHand.js         # Poker hand evaluation
├── managers/
│   └── ModeManager.js       # Game mode management
├── scenes/
│   ├── PreloadScene.js      # Asset loading
│   ├── GameScene.js         # Main menu (auto-transitions to battle)
│   └── BattleScene.js       # Battle interface & card display
├── ui/
│   └── DebugMenu.js         # Debug mode switcher
└── index.js                 # Game initialization

public/
├── assets/enemies/          # Enemy artwork
└── index.html              # Game container + debug menu bar
```

## Development Notes

### Scaling System
All visual elements scaled 2x for 2560x1440:
- Enemy sprites: 80x100 → 160x200
- Card sizes: Various scaling applied
- Font sizes: All doubled
- Spacing: Proportionally increased

### Known Issues Fixed
- **ES Module Imports**: All imports require .js extensions
- **Webpack Config**: Renamed to .cjs extension for ES module compatibility
- **Gold Duplication**: Fixed battle-end gold reward triggering multiple times
- **NaN Damage**: Added validation for poker hand tieBreaker values
- **Arrow Key Scrolling**: Disabled default browser behavior with `overflow: hidden`

### Testing Commands
```bash
npm run dev          # Development server with hot reload
npm run start        # Development server
npm run build        # Production build
npm run test         # Run all tests
```

## Current State
The game is a functional card battle system where players use poker hands to damage enemies. The core gameplay loop works: draw cards → select cards → make poker hands → deal damage → defeat enemies → earn gold. All major systems are implemented and scaled for high-resolution display.