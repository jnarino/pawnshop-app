"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testHarness_1 = require("./testHarness");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function loadTests(dir) {
    for (const entry of fs_1.default.readdirSync(dir)) {
        const full = path_1.default.join(dir, entry);
        const stat = fs_1.default.statSync(full);
        if (stat.isDirectory())
            loadTests(full);
        else if (/\.test\.js$/.test(entry))
            require(full);
    }
}
// compiled JS location mirrors TS; __dirname points to dist/tests
loadTests(__dirname);
(0, testHarness_1.runAll)();
