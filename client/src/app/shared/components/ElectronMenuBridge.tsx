import { useEffect, useState, useCallback } from 'react';
import ManageCashDialog from '@/app/feature/admin/components/ManageCashDialog';
import { FindByInputModal, InventoryItemModal } from '@/app/feature/_shared/inventory-item';
import { PawnMaintainModal } from '@/app/feature/_shared/pawn-ticket';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { getByInventoryNumber } from '@/app/core/api/inventoryItemApi';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';

export default function ElectronMenuBridge() {
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [findInventoryOpen, setFindInventoryOpen] = useState(false);
  const [findInventoryLoading, setFindInventoryLoading] = useState(false);
  const [findInventoryError, setFindInventoryError] = useState<string | null>(null);
  const [inventoryItem, setInventoryItem] = useState<InventoryItemDraft | null>(null);
  const [inventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);
  const [pawnMaintainOpen, setPawnMaintainOpen] = useState(false);

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

  // Open pawn maintain flow on menu signal
  useEffect(() => {
    const api = globalThis.electronAPI;
    if (!api?.onPawnMaintain) return;
    const dispose = api.onPawnMaintain(() => setPawnMaintainOpen(true));
    return () => dispose?.();
  }, []);

  const handleFindInventory = useCallback(async (inventoryNumber: string) => {
    setFindInventoryLoading(true);
    setFindInventoryError(null);
    try {
      const item = await getByInventoryNumber(inventoryNumber);
      setInventoryItem(item as InventoryItemDraft);
      setFindInventoryOpen(false);
      setInventoryItemModalOpen(true);
    } catch (err) {
      setFindInventoryError(err instanceof Error ? err.message : 'Inventory item not found');
    } finally {
      setFindInventoryLoading(false);
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

      <PawnMaintainModal
        open={pawnMaintainOpen}
        onClose={() => setPawnMaintainOpen(false)}
      />

      <InventoryItemModal
        mode={ViewMode.VIEW}
        open={inventoryItemModalOpen}
        initial={inventoryItem}
        onCancel={handleCloseInventoryItem}
      />
    </>
  );
}
