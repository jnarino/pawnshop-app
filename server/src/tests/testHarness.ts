// Simple test harness for running unit tests without external dependencies

interface TestResult {
    name: string;
    passed: boolean;
    error?: Error;
    duration: number;
}

const tests: Array<() => Promise<void> | void> = [];
const testNames: string[] = [];

export function test(name: string, testFn: () => Promise<void> | void): void {
    tests.push(testFn);
    testNames.push(name);
}

export async function runTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    for (let i = 0; i < tests.length; i++) {
        const testName = testNames[i];
        const testFn = tests[i];
        const startTime = Date.now();
        
        try {
            await testFn();
            results.push({
                name: testName,
                passed: true,
                duration: Date.now() - startTime
            });
            console.log(`✅ ${testName}`);
        } catch (error) {
            results.push({
                name: testName,
                passed: false,
                error: error as Error,
                duration: Date.now() - startTime
            });
            console.log(`❌ ${testName}: ${(error as Error).message}`);
        }
    }
    
    return results;
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().then(results => {
        const passed = results.filter(r => r.passed).length;
        const total = results.length;
        const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
        
        console.log(`\n📊 Test Results: ${passed}/${total} passed (${percentage}%)`);
        
        if (passed < total) {
            process.exit(1);
        }
    });
}
