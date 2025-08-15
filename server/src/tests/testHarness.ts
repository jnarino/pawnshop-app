// Minimal test harness (no external deps)
// Register tests via test(name, fn). Then run runAll().

type TestFn = () => any | Promise<any>;
interface Test { name: string; fn: TestFn; }
const tests: Test[] = [];
export function test(name: string, fn: TestFn) { tests.push({ name, fn }); }

export async function runAll() {
  let passed = 0;
  const failures: { name: string; error: any }[] = [];
  for (const t of tests) {
    try { await t.fn(); passed++; console.log(`✓ ${t.name}`); } catch (e) { failures.push({ name: t.name, error: e }); console.error(`✗ ${t.name}`); }
  }
  console.log(`\nTest Results: ${passed} passed, ${failures.length} failed, total ${tests.length}`);
  for (const f of failures) {
    console.error(`--- Failure: ${f.name}\n`, f.error && f.error.stack ? f.error.stack : f.error);
  }
  if (failures.length) process.exitCode = 1; else console.log('All tests passed');
}
