"use strict";
// Minimal test harness (no external deps)
// Register tests via test(name, fn). Then run runAll().
Object.defineProperty(exports, "__esModule", { value: true });
exports.test = test;
exports.runAll = runAll;
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
async function runAll() {
    let passed = 0;
    const failures = [];
    for (const t of tests) {
        try {
            await t.fn();
            passed++;
            console.log(`✓ ${t.name}`);
        }
        catch (e) {
            failures.push({ name: t.name, error: e });
            console.error(`✗ ${t.name}`);
        }
    }
    console.log(`\nTest Results: ${passed} passed, ${failures.length} failed, total ${tests.length}`);
    for (const f of failures) {
        console.error(`--- Failure: ${f.name}\n`, f.error && f.error.stack ? f.error.stack : f.error);
    }
    if (failures.length)
        process.exitCode = 1;
    else
        console.log('All tests passed');
}
