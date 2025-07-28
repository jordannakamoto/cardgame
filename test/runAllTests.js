import testRunner from './testFramework.js';

console.log('🚀 PHASER CARD GAME - TEST SUITE');
console.log('═'.repeat(60));
console.log('Running comprehensive tests for the card game backend...\n');

// Import all test files
await import('./card-engine/cardTests.js');
await import('./card-engine/cardManagerTests.js');
await import('./card-engine/pokerHandTests.js');
await import('./inventoryTests.js');

// Print final summary
testRunner.printSummary();

console.log('\n' + '═'.repeat(60));
console.log('🏁 TEST EXECUTION COMPLETE');
console.log('═'.repeat(60));