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
PreloadScene → GameScene → BattleScene → ShopScene → PackOpeningScene (default flow)
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

#### Pack & Card System
- **Pack** (`src/packs/Pack.js`): Card pack class with generation system
  - **Card Generation**: Creates realistic playing cards with rarity system
  - **Rarity Distribution**: Common (60%), Uncommon (25%), Rare (10%), Legendary (5%)
  - **Special Properties**: Damage bonuses and effects based on rarity tier
  - **Pack Types**: Basic (5 cards), Premium (better odds), Legendary (3 high-rarity cards)
- **PackManager** (`src/packs/PackManager.js`): Global pack management
  - **Shop Integration**: Weighted pack selection for shop inventory
  - **Battle Rewards**: Automatic pack rewards after battle completion
- **PackOpeningScene** (`src/scenes/PackOpeningScene.js`): Elegant pack opening experience
  - **3D Pack Rendering**: Mesh-based pack display with foil shader effects
  - **Refined Particle Effects**: Subtle dust motes and paper fragments inspired by Expedition 33
  - **Rarity-Based Animations**: Enhanced visual feedback for legendary/rare cards
  - **Card Reveal System**: Staggered reveals with minimal shimmer effects

#### Inventory System
- **Inventory** (`src/inventory/Inventory.js`): Resource management
  - **Resources**: Gold, gems, essence tracking
  - **Item Storage**: 20-slot inventory system
  - **Battle Integration**: Gold rewards from defeated enemies
  - **Pack Integration**: Cards from opened packs added to inventory

#### Shop System
- **ShopScene** (`src/scenes/ShopScene.js`): Complete shop experience with 3D pack rendering
  - **3D Pack Display**: Mesh-based packs with realistic tilt physics responding to mouse position
  - **Foil Shader Effects**: Directional shimmer that responds to pack tilt angle and amount
  - **Pack Physics**: "Standing on a pin" effect - mouse position simulates pressing corners
  - **Reduced Tilt Intensity**: 0.15 radians for subtle, elegant movement
  - **Shop Inventory**: Randomized selection of 6 items (heroes, equipment, packs)
  - **Purchase Integration**: Seamless flow from shop to pack opening scene

#### 3D Rendering System
- **FoilPipeline** (`src/rendering/FoilPipeline.js`): Custom WebGL shader for pack effects
  - **Directional Foil**: Shimmer follows tilt direction with flow-based calculations
  - **Tilt Integration**: Shader responds to pack rotation amount and angle
  - **Cross-hatching**: Perpendicular waves for realistic foil appearance
  - **Rainbow Interference**: Subtle color variations based on viewing angle
- **PlaneGeometry**: Proper mesh generation with vertices, UVs, indices, and normals
  - **Mesh Scaling**: Appropriate sizing (200x280px for pack opening, 320x400px for shop)
  - **UV Mapping**: Correct texture coordinates for proper image display

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

## Current Pack Types
```javascript
BASIC_PACK: { 
  price: 25, cardCount: 5, 
  guarantees: { common: 3, uncommon: 1, rare: 1 }
}
PREMIUM_PACK: { 
  price: 50, cardCount: 5, 
  guarantees: { common: 2, uncommon: 2, rare: 1 }
}
LEGENDARY_PACK: { 
  price: 100, cardCount: 3, 
  guarantees: { rare: 1, legendary: 2 }
}
```

## Card Rarity System
```javascript
COMMON: { bonus: 0%, color: 0x9e9e9e (gray) }
UNCOMMON: { bonus: +10% damage, color: 0x4caf50 (green) }
RARE: { bonus: +25% damage, color: 0x2196f3 (blue) }
LEGENDARY: { bonus: +50% damage + draw card, color: 0xff9800 (orange) }
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
│   ├── BattleManager.js     # Core battle logic with hero integration + pack rewards
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
├── equipment/
│   ├── Equipment.js         # Equipment class with stats and validation
│   └── EquipmentRegistry.js # Equipment definitions and factory
├── packs/
│   ├── Pack.js              # Pack class with card generation & rarity system
│   └── PackManager.js       # Global pack management & shop integration
├── rendering/
│   └── FoilPipeline.js      # Custom WebGL shader for 3D pack effects
├── scenes/
│   ├── PreloadScene.js      # Asset loading (enemies + heroes + packs)
│   ├── GameScene.js         # Main menu (auto-transitions to battle)
│   ├── BattleScene.js       # Battle UI with hero portraits
│   ├── ShopScene.js         # Shop with 3D pack physics and foil shaders
│   └── PackOpeningScene.js  # Elegant pack opening with refined particle effects
├── ui/
│   ├── DebugMenu.js         # Debug mode switcher
│   └── EquipmentMenu.js     # Legacy equipment management modal
└── index.js                 # Game initialization

test/
├── testFramework.js         # Custom test framework
├── test-poker.js           # Poker hand tests
├── test-inventory.js       # Inventory system tests
└── test-heroes.js          # Hero system tests

public/
├── assets/
│   ├── enemies/            # Enemy artwork (goblin1.png, orc2.png, troll1.png)
│   ├── heroes/             # Hero portraits (warrior2.png, mage1.png, etc.)
│   └── packs/              # Pack artwork (basic1.png, basic2.png, basic3.png)
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
- **HitArea Callbacks**: Fixed null hitAreaCallback errors with proper rectangle hit areas
- **Equipment Type Filtering**: Fixed undefined item types preventing inventory display
- **Victory Screen Toggle**: Added debug configuration to disable victory screen animations

### Testing Commands
```bash
npm run dev          # Development server with hot reload
npm run start        # Development server
npm run build        # Production build
npm run test         # Run all tests
```

## Current State
The game is a complete card battle system where players use poker hands to damage enemies, enhanced by strategic hero abilities and a sophisticated pack opening system. The core gameplay loop works: draw cards → select cards (1-5) → make poker hands → hero abilities modify damage → deal damage → defeat enemies → earn gold → visit shop → purchase packs → open packs → collect cards → manage resources.

### Key Gameplay Features
- **Strategic Depth**: Hero multipliers add layer of strategy to hand selection
- **Visual Feedback**: Clear indication of when abilities activate and modify damage
- **Flexible Combat**: Can play 1-5 cards instead of being locked to 5-card hands
- **Interactive Targeting**: Mouse and keyboard support for enemy selection
- **Resource Management**: Gold-based economy with inventory system
- **Scalable Hero System**: Framework for adding more heroes with unique abilities
- **Elegant Pack System**: Refined pack opening experience with 3D mesh rendering and sophisticated particle effects
- **Card Collection**: Rarity-based card generation with meaningful bonuses and special effects

### Recent Polish Improvements
- **Enhanced UI Layout**: Damage preview moved to bottom-left panel for better visibility
- **Elegant Victory Screen**: Balatro-style ornate panel with animated gold counting
- **Premium Enemy Targeting**: Silver arrow cursor with blue glow effects and subtle camera pan
- **Card Animation System**: Fan-in animation for newly drawn cards with selective targeting
- **Visual Refinements**: Gold displays use coin symbols (🪙), hero portraits cropped instead of squished
- **Magic Theme Default**: Rich gradient card backgrounds with ornate decorations
- **Clean Interface**: Removed visual clutter like card numbers and hero elevation effects
- **3D Pack Rendering**: Mesh-based pack display with realistic tilt physics and foil shader effects
- **Refined Pack Opening**: Expedition 33-inspired elegant particle effects (dust motes, paper fragments)
- **Sophisticated Card Generation**: Complete rarity system with meaningful gameplay bonuses
- **Shop Integration**: Seamless flow from battle rewards to pack purchasing to card collection
- **Drag-and-Drop Equipment**: Complete inventory grid with visual drag-and-drop equipment system
- **Equipment Integration**: Full equipment slots with stats, effects, and hero integration

## Equipment System

### Drag-and-Drop Interface
- **Inventory Grid**: 4×3 visual grid in shop scene showing equipment items
- **Hero Portraits**: Horizontal layout displaying actual hero portrait images
- **Drag Mechanics**: Click and drag items from inventory grid to hero portraits
- **Visual Feedback**: Green highlight on hero portraits during drag operations
- **Smart Snapping**: Items snap back to grid if dropped in invalid areas

### Equipment Classes & Stats
- **Equipment Class**: Proper class instances with `canEquipTo()` validation
- **Equipment Slots**: Armor and accessory slots per hero
- **Stat System**: Damage reduction, vampirism, dodge chance, gold bonus
- **Rarity Effects**: Equipment provides meaningful gameplay bonuses based on rarity

### Shop Experience
- **Inventory Persistence**: Items appear immediately after purchase
- **Equipment Modal**: Legacy click-to-open equipment management still available
- **Clean UI**: Grid slots show even when empty, providing clear inventory structure
- **Success Feedback**: Animated "Equipped!" messages when items are successfully equipped

All major systems are implemented, tested, and scaled for high-resolution display. The game now features a complete equipment system with intuitive drag-and-drop mechanics. Ready for expansion with additional heroes, enemies, items, and game modes.