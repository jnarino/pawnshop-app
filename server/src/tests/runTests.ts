import { runTests } from './testHarness'; // ✅ Fixed import - use runTests instead of runAll

async function main() {
    console.log('🧪 Running test suite...\n');
    
    const results = await runTests();
    
    const passed = results.filter(r => r.passed).length;
    const total = results.length;
    const percentage = total > 0 ? Math.round((passed / total) * 100) : 0;
    
    console.log(`\n📊 Test Results: ${passed}/${total} passed (${percentage}%)`);
    
    if (passed < total) {
        console.log('\n❌ Some tests failed');
        process.exit(1);
    } else {
        console.log('\n✅ All tests passed');
        process.exit(0);
    }
}

if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test runner failed:', error);
        process.exit(1);
    });
}
