// Inventory Item Domain Model (post schema rebase 0001)
// Simplified: no explicit type column. Category tree + free-form attributes JSON capture
// subtype semantics (e.g., firearm, jewelry). Any UI-specific grouping logic should infer
// from category path or attribute presence.

export type InventoryItemStatus = string; // FK to inventory_item_status(code)

export interface InventoryItem {
  id: string;
  inventoryNumber: string;       // Required globally-unique human-facing number (e.g., 1000-1)
  status: InventoryItemStatus;
  categoryId: string;            // Leaf category id
  brand?: string;
  model?: string;
  serialNumber?: string;
  color?: string;
  itemCondition?: string;
  quantity: number;              // >0
  amount?: number;
  resale?: number;
  itemReplace?: number;
  binNumber?: string;            // physical storage location (bin_number)
  ownerTag?: string;
  itemDescription?: string;
  attributes: Record<string, any>; // Arbitrary structured attributes (firearm/jewelry/etc.)
  createdAt: string;
  updatedAt: string;
}

// Backward-compat helper types (legacy code/tests may still import these symbols). They are now aliases.
export type FirearmAttributes = Record<string, any>;
export type JewelryAttributes = Record<string, any>;
export interface JewelryStone { [k: string]: any; }
