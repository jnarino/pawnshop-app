import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { toast } from 'sonner';
import ManageCashDialog from '@/app/feature/admin/components/ManageCashDialog';
import DrawerBalanceDialog from '@/app/feature/admin/components/DrawerBalanceDialog';
import { FindByInputModal, InventoryItemModal } from '@/app/feature/_shared/inventory-item';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { createInventoryItem, getByInventoryNumber, updateInventoryItem, type InventoryItemApiResponse, type UpdateInventoryItemPayload } from '@/app/core/api/inventoryItemApi';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import { LookupTypeStones, Stone } from '@/app/feature/_shared/inventory-item/components/InventoryItemModal/stones/types';
import { useElectronMenuEvents } from '@/app/shared/hooks/useElectronMenuEvents';

// Helper to extract ID from attribute objects or return string value
export const extractId = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object' && 'id' in value) {
    return (value as { id: string }).id || '';
  }
  return '';
};

// Transform stones from API format to frontend format
export function transformStones(stones: Array<{
  type: LookupTypeStones;
  shape?: LookupTypeStones;
  color?: LookupTypeStones;
  carat?: number | string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  clarity?: LookupTypeStones;
  quantity?: number | string;
}> | undefined) {
  if (!stones || !Array.isArray(stones)) return undefined;
  return stones.map((stone, index) => ({
    id: `stone-${index}-${Date.now()}`,
    quantity: String(stone.quantity || 1),
    type: stone.type,
    shape: stone.shape,
    color: stone.color,
    carat: String(stone.carat || ''),
    weight: String(stone.weight || ''),
    length: String(stone.length || ''),
    width: String(stone.width || ''),
    clarity: stone.clarity,
  }));
}

// Map API response to InventoryItemDraft format
export function mapApiToInventoryItemDraft(item: InventoryItemApiResponse): InventoryItemDraft {
  const attributes = item.attributes || {};
  const extra = item.extra || {};

  return {
    id: item.id,
    type: item.inventoryCategory?.id || '',
    categoryName: item.inventoryCategory?.name || '',
    subcategoryId: item.inventorySubcategory?.id || '',
    subcategoryName: item.inventorySubcategory?.name || '',
    brand: item.brand,
    model: item.model || '',
    serial: item.serialNumber || '',
    color: item.colorId,
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.ownerMark || '',
    description: item.itemDescription || '',
    // Jewelry attributes (UUIDs from lookup)
    metal: attributes.metal,
    karat: attributes.karat,
    style: attributes.style,
    gender: attributes.gender,
    sizeLength: attributes.sizeLength,
    // Extra fields
    weight: extractId(extra.weight),
    weightUnit: extractId(extra.weightUnit) || 'Grams',
    // Stones
    stones: transformStones(extra.stones as any[]),
    // Store original data for update
    status: item.status,
    inventoryNumber: item.inventoryNumber,
  };
}

// Map InventoryItemDraft back to API update payload
function mapDraftToUpdatePayload(draft: InventoryItemDraft): Omit<UpdateInventoryItemPayload, 'id'> {
  const attributes: Record<string, unknown> = {};
  const extra: Record<string, unknown> = {};

  // Build attributes for jewelry/firearm
  if (draft.metal) attributes.metal = draft.metal;
  if (draft.karat) attributes.karat = draft.karat;
  if (draft.style) attributes.style = draft.style;
  if (draft.gender) attributes.gender = draft.gender;

  // Firearm attributes
  if (draft.caliber) attributes.caliber = draft.caliber;
  if (draft.action) attributes.action = draft.action;
  if (draft.barrelLength) attributes.barrelLength = draft.barrelLength;

  // Build extra object (weight, weightUnit, gender, size, stones)
  if (draft.weight) extra.weight = draft.weight;
  if (draft.weightUnit) extra.weightUnit = draft.weightUnit;
  if (draft.sizeLength) extra.size = draft.sizeLength;

  // Build stones array for backend (convert string values to numbers where needed)
  if (draft.stones && draft.stones.length > 0) {
    const stones = draft.stones.map(stone => {
      const stoneData: Record<string, unknown> = {
        quantity: Number(stone.quantity) || 1,
      };
      if (stone.type) stoneData.type = stone.type;
      if (stone.shape) stoneData.shape = stone.shape;
      if (stone.carat) stoneData.carat = Number(stone.carat);
      if (stone.color) stoneData.color = stone.color;
      if (stone.weight) stoneData.weight = Number(stone.weight);
      if (stone.length) stoneData.length = Number(stone.length);
      if (stone.width) stoneData.width = Number(stone.width);
      if (stone.clarity) stoneData.clarity = stone.clarity;
      return stoneData;
    });
    extra.stones = stones;
  }

  return {
    inventorySubcategoryId: draft.subcategoryId || undefined,
    status: draft.status || undefined,
    quantity: Number.parseInt(draft.quantity || '1', 10) || 1,
    brand: draft.brandId || undefined,
    model: draft.model || undefined,
    serialNumber: draft.serial || undefined,
    colorId: draft.color?.id || undefined,
    itemCondition: draft.condition || undefined,
    ownerMark: draft.ownerNumber || undefined,
    itemDescription: draft.description || undefined,
    priceAmount: Number.parseFloat(draft.amount || '0') || 0,
    resale: Number.parseFloat(draft.resale || '0') || 0,
    itemReplace: Number.parseFloat(draft.replace || '0') || 0,
    extra: Object.keys(extra).length > 0 ? extra : undefined,
    attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
    inventoryNumber: draft.inventoryNumber || undefined,
  };
}

export default function ElectronMenuBridge() {
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [drawerBalanceDialogOpen, setDrawerBalanceDialogOpen] = useState(false);
  const [findInventoryOpen, setFindInventoryOpen] = useState(false);
  const [findInventoryLoading, setFindInventoryLoading] = useState(false);
  const [findInventoryError, setFindInventoryError] = useState<string | null>(null);
  const [inventoryItem, setInventoryItem] = useState<InventoryItemDraft | null>(null);
  const [inventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);
  const [showNewInventoryItem, setShowNewInventoryItem] = useState(false);

  const navigate = useNavigate();

  useElectronMenuEvents({
    onPawnsMaintain: () => navigate('/pawns/maintain', { replace: true }),
    onPawnsForfeitPull: () => navigate('/pawns/forfeit', { replace: true }),
    onSalesMaintain: () => navigate('/sales/maintain', { replace: true }),
    onManageCash: () => setCashDialogOpen(true),
    onBalanceDrawer: () => setDrawerBalanceDialogOpen(true),
    onInventoryMaintain: () => {
      setFindInventoryError(null);
      setFindInventoryOpen(true);
    },
    onNewInventoryItem: () => setShowNewInventoryItem(true),
  });

  const handleFindInventory = useCallback(async (inventoryNumber: string) => {
    setFindInventoryLoading(true);
    setFindInventoryError(null);
    try {
      const item = await getByInventoryNumber(inventoryNumber);
      const mappedItem = mapApiToInventoryItemDraft(item);
      setInventoryItem(mappedItem);
      setFindInventoryOpen(false);
      setInventoryItemModalOpen(true);
    } catch (err) {
      setFindInventoryError(err instanceof Error ? err.message : 'Inventory item not found');
    } finally {
      setFindInventoryLoading(false);
    }
  }, []);

  const handleSaveInventoryItem = useCallback(async (draft: InventoryItemDraft, isCreate: boolean = false) => {
    if (!draft.id) {
      console.error('Cannot update item without ID');
      return;
    }

    try {
      const payload = mapDraftToUpdatePayload(draft);
      if (isCreate) {
        await createInventoryItem(payload);
      } else {
        await updateInventoryItem(draft.id, payload);
      }
      toast.success('Inventory item updated successfully!');
      setInventoryItemModalOpen(false);
      setInventoryItem(null);
    } catch (err) {
      console.error('Failed to update inventory item:', err);
      toast.error('Failed to update inventory item');
    }
  }, []);

  const handleCloseFindInventory = useCallback(() => {
    setFindInventoryOpen(false);
    setFindInventoryError(null);
  }, []);

  const handleCloseInventoryItem = useCallback(() => {
    setInventoryItemModalOpen(false);
    setShowNewInventoryItem(false);
    setInventoryItem(null);
  }, []);

  return (
    <>
      <ManageCashDialog open={cashDialogOpen} onOpenChange={setCashDialogOpen} />
      <DrawerBalanceDialog open={drawerBalanceDialogOpen} onOpenChange={setDrawerBalanceDialogOpen} />

      <FindByInputModal
        open={findInventoryOpen}
        loading={findInventoryLoading}
        error={findInventoryError}
        onClose={handleCloseFindInventory}
        onFind={handleFindInventory}
        title="Find Inventory Item"
        description="Enter the inventory number to find and view the item details."
        inputLabel="Inventory Number"
        inputPlaceholder="Enter inventory number..."
        infoMessage="You can type the inventory number manually or use a barcode scanner."
      />

      <InventoryItemModal
        mode={ViewMode.MODIFY}
        open={inventoryItemModalOpen}
        initial={inventoryItem}
        onCancel={handleCloseInventoryItem}
        onSave={handleSaveInventoryItem}
      />

      <InventoryItemModal
        mode={ViewMode.CREATE}
        open={showNewInventoryItem}
        initial={inventoryItem}
        onCancel={handleCloseInventoryItem}
        onSave={(editingItem) => handleSaveInventoryItem(editingItem, true)}
      />
    </>
  );
}
