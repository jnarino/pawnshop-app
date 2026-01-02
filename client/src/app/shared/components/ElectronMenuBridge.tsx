import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import ManageCashDialog from '@/app/feature/admin/components/ManageCashDialog';
import { FindByInputModal, InventoryItemModal } from '@/app/feature/_shared/inventory-item';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { getByInventoryNumber, updateInventoryItem, type InventoryItemApiResponse, type UpdateInventoryItemPayload } from '@/app/core/api/inventoryItemApi';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import { useNavigate } from 'react-router-dom';

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
  type?: { id: string; name?: string | null } | string;
  shape?: { id: string; name?: string | null } | string;
  color?: { id: string; name?: string | null } | string;
  carat?: number | string;
  weight?: number | string;
  length?: number | string;
  width?: number | string;
  clarity?: string;
  quantity?: number | string;
}> | undefined) {
  if (!stones || !Array.isArray(stones)) return undefined;
  return stones.map((stone, index) => ({
    id: `stone-${index}-${Date.now()}`,
    quantity: String(stone.quantity || 1),
    type: typeof stone.type === 'object' ? stone.type?.id || '' : stone.type || '',
    shape: typeof stone.shape === 'object' ? stone.shape?.id || '' : stone.shape || '',
    color: typeof stone.color === 'object' ? stone.color?.id || '' : stone.color || '',
    carat: String(stone.carat || ''),
    weight: String(stone.weight || ''),
    length: String(stone.length || ''),
    width: String(stone.width || ''),
    clarity: stone.clarity || '',
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
    brandId: item.brand?.id || '',
    brandName: item.brand?.name || '',
    model: item.model || '',
    serial: item.serialNumber || '',
    color: extractId(item.colorId),
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.ownerMark || '',
    description: item.itemDescription || '',
    // Jewelry attributes (UUIDs from lookup)
    metal: extractId(attributes.metal),
    karat: extractId(attributes.karat),
    style: extractId(attributes.style),
    // Extra fields
    gender: extractId(extra.gender),
    sizeLength: extractId(extra.size),
    weight: extractId(extra.weight),
    weightUnit: extractId(extra.weightUnit) || 'Grams',
    // Stones
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    stones: transformStones(extra.stones as any),
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

  // Firearm attributes
  if (draft.caliber) attributes.caliber = draft.caliber;
  if (draft.action) attributes.action = draft.action;
  if (draft.barrelLength) attributes.barrelLength = draft.barrelLength;

  // Build extra object (weight, weightUnit, gender, size, stones)
  if (draft.weight) extra.weight = draft.weight;
  if (draft.weightUnit) extra.weightUnit = draft.weightUnit;
  if (draft.gender) extra.gender = draft.gender;
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
    colorId: draft.color || undefined,
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
  const [findInventoryOpen, setFindInventoryOpen] = useState(false);
  const [findInventoryLoading, setFindInventoryLoading] = useState(false);
  const [findInventoryError, setFindInventoryError] = useState<string | null>(null);
  const [inventoryItem, setInventoryItem] = useState<InventoryItemDraft | null>(null);
  const [inventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);
  const navigate = useNavigate();

  // Open cash dialog on menu signal
  useEffect(() => {
    const api = globalThis.electronAPI;
    if (!api?.onManageCash) return;
    const dispose = api.onManageCash(() => setCashDialogOpen(true));
    return () => dispose?.();
  }, []);

  // Open inventory maintain flow on menu signal
  useEffect(() => {
    const api = globalThis.electronAPI;
    if (!api?.onInventoryMaintain) return;
    const dispose = api.onInventoryMaintain(() => {
      setFindInventoryError(null);
      setFindInventoryOpen(true);
    });
    return () => dispose?.();
  }, []);

  useEffect(() => {
    const api = globalThis.electronAPI;
    if (!api) return;

    const unsubscribes: Array<() => void> = [];

    if (api.onPawnMaintain) {
      const dispose = api.onPawnMaintain(() => {
        navigate('/pawns/maintain', { replace: true });
      });
      if (dispose) unsubscribes.push(dispose);
    }

    return () => {
      unsubscribes.forEach((fn) => fn());
    };
  }, []);

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

  const handleSaveInventoryItem = useCallback(async (draft: InventoryItemDraft) => {
    if (!draft.id) {
      console.error('Cannot update item without ID');
      return;
    }

    try {
      const payload = mapDraftToUpdatePayload(draft);
      await updateInventoryItem(draft.id, payload);
      toast.success('Inventory item updated successfully!');
      setInventoryItemModalOpen(false);
      setInventoryItem(null);
    } catch (err) {
      console.error('Failed to update inventory item:', err);
      toast.error('Failed to update inventory item');
      // The modal will stay open so user can retry or cancel
    }
  }, []);

  const handleCloseFindInventory = useCallback(() => {
    setFindInventoryOpen(false);
    setFindInventoryError(null);
  }, []);

  const handleCloseInventoryItem = useCallback(() => {
    setInventoryItemModalOpen(false);
    setInventoryItem(null);
  }, []);

  return (
    <>
      <ManageCashDialog open={cashDialogOpen} onOpenChange={setCashDialogOpen} />

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
    </>
  );
}
