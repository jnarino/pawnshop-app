import { useEffect, useState, useCallback } from 'react';
import ManageCashDialog from '@/app/feature/admin/components/ManageCashDialog';
import { FindByInputModal, InventoryItemModal } from '@/app/feature/_shared/inventory-item';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { getByInventoryNumber, updateInventoryItem, type InventoryItemApiResponse, type UpdateInventoryItemPayload } from '@/app/core/api/inventoryItemApi';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import { useNavigate } from 'react-router-dom';

// Map API response to InventoryItemDraft format
function mapApiToInventoryItemDraft(item: InventoryItemApiResponse): InventoryItemDraft {
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
    color: item.colorId || '',
    condition: item.itemCondition || '',
    quantity: String(item.quantity || 1),
    amount: String(item.priceAmount || 0),
    resale: String(item.resale || 0),
    replace: String(item.itemReplace || 0),
    ownerNumber: item.ownerMark || '',
    description: item.itemDescription || '',
    // Jewelry attributes (UUIDs from lookup)
    metal: (attributes.metal as string) || '',
    karat: (attributes.karat as string) || '',
    style: (attributes.style as string) || '',
    gender: (attributes.gender as string) || '',
    sizeLength: (attributes.sizeLength as string) || '',
    weight: String((attributes.weight as string | number) || (extra.weight as string | number) || ''),
    weightUnit: (attributes.weightUnit as string) || 'Grams',
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
  if (draft.sizeLength) attributes.sizeLength = draft.sizeLength;
  if (draft.weight) {
    attributes.weight = draft.weight;
    extra.weight = Number.parseFloat(draft.weight) || 0;
  }
  if (draft.weightUnit) attributes.weightUnit = draft.weightUnit;
  
  // Firearm attributes
  if (draft.caliber) attributes.caliber = draft.caliber;
  if (draft.action) attributes.action = draft.action;
  if (draft.barrelLength) attributes.barrelLength = draft.barrelLength;
  
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

    if (api.onForfeit) {
      const dispose = api.onForfeit(() => {
        navigate('/pawns/forfeit', { replace: true });
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
      setInventoryItemModalOpen(false);
      setInventoryItem(null);
    } catch (err) {
      console.error('Failed to update inventory item:', err);
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
