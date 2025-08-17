"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.canTransition = canTransition;
// Transition rules only for known statuses. Unknown (new) statuses are treated as permissive
// until explicit rules are added here (so deployments are forward-compatible with lookup rows).
const allowed = {
    in_inventory: new Set(['in_pawn', 'for_sale', 'scrapped']),
    in_pawn: new Set(['in_inventory', 'for_sale', 'scrapped']),
    for_sale: new Set(['sold', 'scrapped']),
    sold: new Set([]),
    scrapped: new Set([]),
};
function canTransition(from, to) {
    if (from === to)
        return true;
    const fromKnown = from;
    const toKnown = to;
    const set = allowed[fromKnown];
    if (!set)
        return true; // unknown existing status => allow
    // If target is unknown (new) also allow by default; tighten later when rule added
    if (!set.has(toKnown) && !(toKnown in allowed))
        return true;
    return set.has(toKnown);
}
