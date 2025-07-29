# Phaser Card Battle Game - Claude Context

## Project Overview
A complete Phaser 3-based card battle game inspired by Balatro + Chrono Ark mechanics. Features playing cards, poker hands, enemy battles, and a strategic hero system. Built as a single-page application with ES modules and webpack.

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
  - Damage calculation with poker hand bonuses and hero multipliers
  - Player turn management, card selection (1-5 cards from 8-card hand)
  - **Damage System:** Base damage + card value bonuses + hero multipliers
    - HIGH_CARD: 3, ONE_PAIR: 20, TWO_PAIR: 35, THREE_OF_A_KIND: 55
    - STRAIGHT: 75, FLUSH: 90, FULL_HOUSE: 125, FOUR_OF_A_KIND: 160
    - STRAIGHT_FLUSH: 250, ROYAL_FLUSH: 500
  - **Gold System:** Awards total gold only at battle end (not per enemy death)
  - **Hero Integration:** Calculates final damage with active hero abilities

#### Enemy System
- **Enemy** (`src/battle/Enemy.js`): Individual enemy entities with health, targeting, damage preview
  - **Premium Targeting**: Ornate silver arrow cursor with blue glow effects
  - **Interactive Sprites**: Pixel-perfect click detection for image sprites
  - **Subtle Camera Effects**: Minimal zoom (1.02x) and pan (0.5%) when targeting
- **EnemyTypes** (`src/battle/EnemyTypes.js`): Centralized enemy definitions
- **EnemyFactory**: Creates enemies from type definitions
- **Enemy Art System**: Loads from `public/assets/enemies/` with fallback colored rectangles

#### Hero System
- **Hero** (`src/heroes/Hero.js`): Base hero class with multipliers and abilities
  - **Multiplier System**: Conditional damage bonuses based on hand types
  - **Mana System**: Generate mana from played cards, spend on abilities (disabled)
  - **Portrait System**: Visual representation cropped to 360x180px for cleaner look
- **HeroManager** (`src/heroes/HeroManager.js`): Manages party of heroes
- **StarterHero** (`src/heroes/heroes/StarterHero.js`): Basic hero with pair bonus
- **Visual Feedback**: 
  - Orange glow and "+" indicator when abilities activate
  - No portrait elevation for reduced visual noise
  - Subtle glow effects behind other UI elements

#### Inventory System
- **Inventory** (`src/inventory/Inventory.js`): Resource management
  - **Resources**: Gold, gems, essence tracking
  - **Item Storage**: 20-slot inventory system
  - **Battle Integration**: Gold rewards from defeated enemies

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
- **Card Selection**: 8-card hand, select 1-5 cards to play (flexible poker hands)
- **Poker Evaluation**: Full poker hand rankings with proper damage scaling
- **Enemy Targeting**: Arrow keys to cycle or mouse click to select enemies
- **Hero Abilities**: Conditional multipliers that modify damage based on hand types
- **Visual Feedback**: 
  - Selected cards lift up with white highlight and animation
  - Damage preview in bottom-left panel: "High Card : 11 (+10)"
  - Hero portrait glow and "+" indicator when abilities activate (no elevation)
  - Enemy health bars with damage visualization and premium targeting cursor
  - Elegant victory screen with animated gold counting and ornate panel

### Test System
- **Custom Framework** (`/test/testFramework.js`): No Jest dependency
- **Runtime Simulation**: Tests simulate actual game runtime slices
- **Readable Output**: Plain JavaScript with descriptive console logging
- **Test Coverage**: Poker hands, inventory system, hero multipliers
- **Execution**: Run with `npm run test` or direct file execution

### Visual Systems
- **Responsive Design**: Cards and UI scale with screen size
- **Animation System**: Card selection, damage text, enemy death animations, card fan-in effects
- **Art Integration**: Dynamic loading of enemy sprites with fallback system
- **Quality Settings**: Anti-aliasing enabled, pixel rounding for crisp text
- **Card Theming**: Magic theme default with gradient backgrounds and ornate decorations

### Input System
- **Keyboard**: 1-8 for card selection (hidden), arrows for targeting, Enter to attack, Space for new hand, I for info menu
- **Mouse**: Click cards to select, click enemies to target, hover for card preview
- **Info Menu**: Toggleable controls and game info overlay (I key or button)
- **Hero Interaction**: Click hero portraits to switch active hero

## File Structure
```
src/
├── battle/
│   ├── BattleManager.js     # Core battle logic with hero integration
│   ├── Enemy.js             # Enemy entities with mouse targeting
│   └── EnemyTypes.js        # Enemy definitions & factory
├── game/
│   ├── Card.js              # Basic card class
│   ├── CardManager.js       # Card rendering & deck management
│   └── PokerHand.js         # Poker hand evaluation (1-5 cards)
├── heroes/
│   ├── Hero.js              # Base hero class with multipliers
│   ├── HeroManager.js       # Party management
│   └── heroes/
│       └── StarterHero.js   # Basic hero with pair bonus
├── inventory/
│   └── Inventory.js         # Resource and item management
├── logging/
│   └── Logger.js            # Toggleable logging system
├── managers/
│   └── ModeManager.js       # Game mode management
├── scenes/
│   ├── PreloadScene.js      # Asset loading (enemies + heroes)
│   ├── GameScene.js         # Main menu (auto-transitions to battle)
│   └── BattleScene.js       # Battle UI with hero portraits
├── ui/
│   └── DebugMenu.js         # Debug mode switcher
└── index.js                 # Game initialization

test/
├── testFramework.js         # Custom test framework
├── test-poker.js           # Poker hand tests
├── test-inventory.js       # Inventory system tests
└── test-heroes.js          # Hero system tests

public/
├── assets/
│   ├── enemies/            # Enemy artwork
│   └── heroes/             # Hero portraits (warrior2.png)
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
- **Hero Animation Drift**: Fixed portrait position tracking to prevent continuous upward movement
- **Flush Card Count**: Fixed flush detection to require exactly 5 cards
- **High Card Stacking**: Only highest card value counts for high card damage bonus
- **Card Selection Limits**: Flexible 1-5 card selection instead of exactly 5
- **Target Switching**: Damage preview properly transfers when switching enemies

### Testing Commands
```bash
npm run dev          # Development server with hot reload
npm run start        # Development server
npm run build        # Production build
npm run test         # Run all tests
```

## Current State
The game is a complete card battle system where players use poker hands to damage enemies, enhanced by strategic hero abilities. The core gameplay loop works: draw cards → select cards (1-5) → make poker hands → hero abilities modify damage → deal damage → defeat enemies → earn gold → manage resources. 

### Key Gameplay Features
- **Strategic Depth**: Hero multipliers add layer of strategy to hand selection
- **Visual Feedback**: Clear indication of when abilities activate and modify damage
- **Flexible Combat**: Can play 1-5 cards instead of being locked to 5-card hands
- **Interactive Targeting**: Mouse and keyboard support for enemy selection
- **Resource Management**: Gold-based economy with inventory system
- **Scalable Hero System**: Framework for adding more heroes with unique abilities

### Recent Polish Improvements
- **Enhanced UI Layout**: Damage preview moved to bottom-left panel for better visibility
- **Elegant Victory Screen**: Balatro-style ornate panel with animated gold counting
- **Premium Enemy Targeting**: Silver arrow cursor with blue glow effects and subtle camera pan
- **Card Animation System**: Fan-in animation for newly drawn cards with selective targeting
- **Visual Refinements**: Gold displays use coin symbols (🪙), hero portraits cropped instead of squished
- **Magic Theme Default**: Rich gradient card backgrounds with ornate decorations
- **Clean Interface**: Removed visual clutter like card numbers and hero elevation effects

All major systems are implemented, tested, and scaled for high-resolution display. The game is ready for expansion with additional heroes, enemies, items, and game modes.