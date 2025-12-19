import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, DollarSign, Package } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import ManageCashDialog from '@/app/feature/admin/components/ManageCashDialog';
import { FindByInputModal, InventoryItemModal } from '@/app/feature/_shared/inventory-item';
import type { InventoryItemDraft } from '@/app/feature/_shared/inventory-item';
import { getByInventoryNumber } from '@/app/core/api/inventoryItemApi';

export default function BurgerMenu() {
  const navigate = useNavigate();
  const [cashDialogOpen, setCashDialogOpen] = useState(false);
  const [findInventoryOpen, setFindInventoryOpen] = useState(false);
  const [findInventoryLoading, setFindInventoryLoading] = useState(false);
  const [findInventoryError, setFindInventoryError] = useState<string | null>(null);
  const [inventoryItem, setInventoryItem] = useState<InventoryItemDraft | null>(null);
  const [inventoryItemModalOpen, setInventoryItemModalOpen] = useState(false);

  const handleLogout = useCallback(() => {
    navigate('/logout');
  }, [navigate]);

  const handleMaintain = useCallback(() => {
    setFindInventoryError(null);
    setFindInventoryOpen(true);
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="text-white hover:bg-gray-800">
            <Menu className="h-6 w-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setCashDialogOpen(true)} className="cursor-pointer">
            <DollarSign className="mr-2 h-4 w-4" />
            <span>Manage Cash</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="cursor-pointer">
              <Package className="mr-2 h-4 w-4" />
              <span>Inventory</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={handleMaintain} className="cursor-pointer">
                <span>Maintain</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
        mode="VIEW"
        open={inventoryItemModalOpen}
        initial={inventoryItem}
        onCancel={handleCloseInventoryItem}
      />
    </>
  );
}
