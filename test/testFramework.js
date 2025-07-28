// Simple Test Framework
class TestRunner {
    constructor() {
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
        this.currentSuite = '';
        this.currentTest = '';
        this.suiteResults = {};
    }

    describe(suiteName, callback) {
        this.currentSuite = suiteName;
        this.suiteResults[suiteName] = { passed: 0, failed: 0, tests: [] };
        
        console.log(`\n🎮 ${suiteName}`);
        console.log('─'.repeat(60));
        
        try {
            callback();
        } catch (error) {
            console.log(`💥 Suite crashed: ${error.message}`);
        }
    }

    test(testName, callback) {
        this.currentTest = testName;
        this.totalTests++;
        
        console.log(`\n▶️  ${testName}`);
        
        try {
            callback();
            this.passedTests++;
            this.suiteResults[this.currentSuite].passed++;
            this.suiteResults[this.currentSuite].tests.push({ name: testName, status: 'PASS' });
            console.log(`    ✅ PASS`);
        } catch (error) {
            this.failedTests++;
            this.suiteResults[this.currentSuite].failed++;
            this.suiteResults[this.currentSuite].tests.push({ name: testName, status: 'FAIL', error: error.message });
            console.log(`    ❌ FAIL: ${error.message}`);
        }
    }

    expect(actual) {
        return new Assertion(actual);
    }

    printSummary() {
        console.log('\n' + '═'.repeat(60));
        console.log('🏁 TEST EXECUTION COMPLETE');
        console.log('═'.repeat(60));
        
        console.log(`\n📈 Results: ${this.passedTests} passed, ${this.failedTests} failed`);
        
        if (this.failedTests === 0) {
            console.log('🎉 All backend systems are working correctly!');
        } else {
            console.log(`⚠️  ${this.failedTests} issue(s) need attention`);
        }
    }

    logAction(action, details = {}) {
        console.log(`    > ${action}`);
        if (Object.keys(details).length > 0) {
            Object.keys(details).forEach(key => {
                console.log(`      ${key}: ${details[key]}`);
            });
        }
    }

    logResult(description, result) {
        console.log(`    → ${description}: ${result}`);
    }

    logGameState(state) {
        console.log(`    [${state}]`);
    }
}

class Assertion {
    constructor(actual) {
        this.actual = actual;
    }

    toBe(expected) {
        if (this.actual !== expected) {
            throw new Error(`Expected ${expected}, but got ${this.actual}`);
        }
    }

    toEqual(expected) {
        if (JSON.stringify(this.actual) !== JSON.stringify(expected)) {
            throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(this.actual)}`);
        }
    }

    toBeGreaterThan(expected) {
        if (this.actual <= expected) {
            throw new Error(`Expected ${this.actual} to be greater than ${expected}`);
        }
    }

    toBeLessThan(expected) {
        if (this.actual >= expected) {
            throw new Error(`Expected ${this.actual} to be less than ${expected}`);
        }
    }

    toBeDefined() {
        if (this.actual === undefined) {
            throw new Error('Expected value to be defined');
        }
    }

    toThrow(expectedMessage) {
        if (typeof this.actual !== 'function') {
            throw new Error('Expected a function that throws');
        }
        
        let didThrow = false;
        let thrownError = null;
        
        try {
            this.actual();
        } catch (error) {
            didThrow = true;
            thrownError = error;
        }
        
        if (!didThrow) {
            throw new Error('Expected function to throw an error');
        }
        
        if (expectedMessage && !thrownError.message.includes(expectedMessage)) {
            throw new Error(`Expected error message to contain "${expectedMessage}", but got "${thrownError.message}"`);
        }
    }
}

// Global test runner instance
const testRunner = new TestRunner();

// Export functions for use in test files
export const describe = (name, callback) => testRunner.describe(name, callback);
export const test = (name, callback) => testRunner.test(name, callback);
export const expect = (actual) => testRunner.expect(actual);
export const logAction = (action, details) => testRunner.logAction(action, details);
export const logResult = (description, result) => testRunner.logResult(description, result);
export const logGameState = (state) => testRunner.logGameState(state);

export default testRunner;