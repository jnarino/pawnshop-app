import { InventoryItemStatus } from './InventoryItem';

// Conservative default rules for seeded statuses; unknown statuses allowed by default.
const allowed: Record<string, Set<string>> = {
  in_inventory: new Set(['in_pawn','for_sale','scrapped']),
  in_pawn: new Set(['in_inventory','for_sale','scrapped']),
  for_sale: new Set(['sold','scrapped']),
  sold: new Set([]),
  scrapped: new Set([]),
};

export function canTransition(from: InventoryItemStatus, to: InventoryItemStatus): boolean {
  if (from === to) return true;
  const set = allowed[from];
  if (!set) return true; // unknown current status -> permissive
  if (!set.has(to) && !(to in allowed)) return true; // target unknown -> allow
  return set.has(to);
}
