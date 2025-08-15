import { runAll } from './testHarness';
import fs from 'fs';
import path from 'path';

function loadTests(dir: string) {
	for (const entry of fs.readdirSync(dir)) {
		const full = path.join(dir, entry);
		const stat = fs.statSync(full);
		if (stat.isDirectory()) loadTests(full);
		else if (/\.test\.js$/.test(entry)) require(full);
	}
}

// compiled JS location mirrors TS; __dirname points to dist/tests
loadTests(__dirname);
runAll();
