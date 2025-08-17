// Inventory Item Domain Model
// Supports three primary types: FIREARM, JEWELRY, GENERIC (which will later branch into many sub-categories)
// A single inventory item MAY or MAY NOT be associated with a pawn ticket. That relationship will
// be modeled later (likely via a linking table pawn_ticket_inventory or a nullable FK on a join table)
// to allow future scenarios like partial item grouping, multiple tickets history, etc.

// Known inventory statuses seeded in lookup table. We keep a separate union for
// compile-time convenience but expose InventoryItemStatus as a wide `string`
// so new rows added (via admin UI + lookup table) do not force an immediate deploy.
export type KnownInventoryItemStatus =
  | 'in_inventory'
  | 'in_pawn'
  | 'for_sale'
  | 'sold'
  | 'scrapped';

// Public status type (future-proof): any string; validation / transition logic
// will apply rules only to the known subset and allow unknown values through.
export type InventoryItemStatus = string;

export type InventoryItemType = 'FIREARM' | 'JEWELRY' | 'GENERIC';

// Shared / base attributes across all inventory items.
export interface BaseInventoryItem {
  id: string;
  type: InventoryItemType;
  status: InventoryItemStatus; // FK to inventory_item_status_lu(code)
  // Hierarchical categories (categoryId parent, subcategoryId child). Additional depth will use chaining later.
  categoryId?: string;
  subcategoryId?: string;
  brand?: string;
  model?: string;
  serialNumber?: string; // firearms / electronics / instruments / tools
  color?: string;
  itemCondition?: string;    // free-form now; could become enum later
  quantity: number;          // default 1; >1 for grouped identical items
  amount?: number;           // amount currently tied to (loan/pricing context)
  resale?: number;           // estimated resale value
  itemReplace?: number;      // replacement value (insurance)
  bin?: string;              // physical storage location
  ownerTag?: string;         // legacy owner # / tag
  itemDescription?: string;  // long text description
  createdAt: string;         // ISO timestamp
  updatedAt: string;         // ISO timestamp
}

// FIREARM specific attributes
export interface FirearmAttributes {
  action?: string;        // e.g., SEMI-AUTO, BOLT, REVOLVER
  finish?: string;        // e.g., BLUED, STAINLESS
  numberOfBarrels?: number;
  barrelLength?: number;  // inches
  caliberGauge?: string;  // e.g., 9MM, 12GA
  importer?: string;
}

// Jewelry stone detail (multiple allowed)
export interface JewelryStone {
  quantity?: number; // count of this stone grouping
  type?: string;     // e.g., DIAMOND, EMERALD
  shape?: string;    // ROUND, PRINCESS, OVAL, etc.
  carat?: number;    // total carat for the stone/group
  color?: string;    // color grade
  clarity?: string;  // clarity grade
  weight?: number;   // optional separate weight (carat or grams depending on UI)
  length?: number;   // mm
  width?: number;    // mm
}

// JEWELRY specific attributes
export interface JewelryAttributes {
  metal?: string;      // GOLD, SILVER, PLATINUM
  karat?: string;      // 10K, 14K, 18K
  weight?: number;     // numeric weight
  weightUnit?: string; // GRAMS, DWT (store raw but UI can convert)
  gender?: string;     // M, F, UNISEX
  style?: string;      // ring style, chain type, etc.
  size?: string;       // ring size / length
  stones?: JewelryStone[]; // optional stones array
}

// Main Inventory Item interface aggregating optional specialized attributes
export interface InventoryItem extends BaseInventoryItem {
  firearm?: FirearmAttributes; // present when type === 'FIREARM'
  jewelry?: JewelryAttributes; // present when type === 'JEWELRY'
  // Future: generic-specific structured attributes can be added here without schema churn
}
