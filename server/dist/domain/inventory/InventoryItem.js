"use strict";
// Inventory Item Domain Model (post schema rebase 0001)
// Simplified: no explicit type column. Category tree + free-form attributes JSON capture
// subtype semantics (e.g., firearm, jewelry). Any UI-specific grouping logic should infer
// from category path or attribute presence.
Object.defineProperty(exports, "__esModule", { value: true });
