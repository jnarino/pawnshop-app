import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import addIcon from '@/assets/icons/add.svg';
import barcodeReaderIcon from '@/assets/icons/barcode_reader.svg';
import barcodeScannerIcon from '@/assets/icons/barcode_scanner.svg';
import { CategoryFields } from './CategoryFields';
import { BasicInfoFields } from './BasicInfoFields';
import { JewelryFields } from './JewelryFields';
import { FirearmFields } from './FirearmFields';
import { StonesSection } from './stones';
import { ScrapDetails } from './ScrapDetails';
import { useInventoryItemForm } from '../../hooks/useInventoryItemForm';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import type { InventoryItemDraft } from './types';
import { DollarInput } from '@/components/ui/dollar-input';

export type { InventoryItemDraft } from './types';

interface InventoryItemModalProps {
  readonly mode?: ViewMode;
  readonly open: boolean;
  readonly initial?: InventoryItemDraft | null;
  readonly onCancel: () => void;
  readonly onSave?: (item: InventoryItemDraft) => void;
  readonly scrapItems?: { itemDescription: string; inventoryNumber: string }[];
}

export function InventoryItemModal({ mode = ViewMode.CREATE, open, initial, onCancel, onSave, hasNextItem = false, scrapItems = [] }: InventoryItemModalProps & { hasNextItem?: boolean }) {
  const isViewMode = mode === ViewMode.VIEW;
  const isPullMode = mode === ViewMode.PULL;
  const isCreateMode = mode === ViewMode.CREATE;
  const {
    draft,
    error,
    barcodeMode,
    setBarcodeMode,
    rootCategories,
    subcategories,
    brands,
    isLoading,
    isJewelry,
    isFirearm,
    isRing,
    updateField,
    handleCategoryChange,
    handleSubcategoryChange,
    handleBrandChange,
    handleSubmit,
    handleMetalChange,
  } = useInventoryItemForm({ open, initial, onSave: onSave || (() => { }), mode });

  const isDisabled = draft.itemStatus === 'I' ?
    !draft.resale || !draft.minResale || (!isFirearm && !draft.itemStatus) :
    draft.itemStatus === 'J' ? !draft.scrappedIntoInvItem || draft.scrappedIntoInvItem.length === 0 || draft.scrappedIntoInvItem.every((item) => item.inventoryNumber === '') : true;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto p-5" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {(() => {
              if (isViewMode) return 'View Item Details';
              if (isPullMode) return 'Pull Item';
              if (initial) return 'Edit Item';
              return 'Add New Item';
            })()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <CategoryFields
              isLoading={isLoading}
              draft={draft}
              rootCategories={rootCategories}
              subcategories={subcategories}
              handleCategoryChange={handleCategoryChange}
              handleSubcategoryChange={handleSubcategoryChange}
              updateField={updateField}
              disabled={isViewMode || isPullMode}
              showAddButton={true}
            />

            <BasicInfoFields
              draft={draft}
              updateField={updateField}
              isFirearm={isFirearm}
              brands={brands}
              handleBrandChange={handleBrandChange}
              disabled={isViewMode || isPullMode}
            />

            {!isJewelry && !isFirearm && <div></div>}

            {isJewelry && (
              <JewelryFields
                draft={draft}
                updateField={updateField}
                handleMetalChange={handleMetalChange}
                isRing={isRing}
                disabled={isViewMode || isPullMode}
              />
            )}

            {isFirearm && (
              <FirearmFields
                draft={draft}
                updateField={updateField}
                disabled={isViewMode || isPullMode}
              />
            )}
          </div>

          {isJewelry && (
            <StonesSection
              stones={draft.stones || []}
              onChange={(stones) => updateField('stones', stones)}
              disabled={isViewMode || isPullMode}
            />
          )}

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              value={draft.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              placeholder="Brief description (free text)..."
              className="text-xs resize-none"
              disabled={isViewMode || isPullMode}
            />
          </div>

          {isPullMode && (
            <div className="p-4 bg-gray-50 rounded-lg space-y-4 border border-gray-200">
              <h4 className="text-sm font-bold text-gray-700">Pull Information</h4>

              {!isFirearm && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold">Item Action</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="itemStatus"
                        value="I"
                        checked={draft.itemStatus === 'I'}
                        onChange={(e) => updateField('itemStatus', e.target.value)}
                        className="w-4 h-4 text-blue-600"
                      />
                      Pull to Inventory
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input
                        type="radio"
                        name="itemStatus"
                        value="J"
                        checked={draft.itemStatus === 'J'}
                        onChange={(e) => updateField('itemStatus', e.target.value)}
                        className="w-4 h-4 text-red-600"
                      />
                      Scrap
                    </label>
                  </div>
                </div>
              )}

              {!draft.itemStatus && (
                <>
                  <p>Please select an item action</p>
                </>
              )}

              {draft.itemStatus === 'J' && !isFirearm && (
                <ScrapDetails
                  draft={draft}
                  updateField={updateField}
                  disabled={isViewMode}
                  availableScrapItems={scrapItems}
                />
              )}

              {draft.itemStatus === 'I' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Resale Price ($)</Label>
                      <DollarInput
                        value={draft.resale || ''}
                        onChange={(value) => updateField('resale', value)}
                        placeholder="0.00"
                        required
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs font-semibold">Min Resale Price ($)</Label>
                      <DollarInput
                        value={draft.minResale || ''}
                        onChange={(value) => updateField('minResale', value)}
                        placeholder="0.00"
                        required
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div></>
              )}
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="py-2.5 px-3.5">
              <AlertDescription className="text-xs flex items-center gap-2">
                <span className="text-sm">⚠️</span> {error}
              </AlertDescription>
            </Alert>
          )}

          {(!isViewMode && !isPullMode) && (
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-4">
                {!isCreateMode && (
                  <>
                    <Button
                      type="button"
                      variant={barcodeMode ? "destructive" : "secondary"}
                      size="sm"
                      onClick={() => setBarcodeMode(!barcodeMode)}
                      className="text-xs"
                    >
                      {!barcodeMode && <img src={barcodeReaderIcon} alt="Barcode" className="w-4 h-4 mr-1" />}
                      {barcodeMode ? 'Stop Scanner' : 'Scan Barcode'}
                    </Button>
                    {barcodeMode && (
                      <span className="text-green-600 text-[10px] font-medium flex items-center gap-1">
                        <img src={barcodeScannerIcon} alt="Scanner active" className="w-4 h-4 brightness-0 saturate-100" style={{ filter: 'brightness(0) saturate(100%) invert(42%) sepia(93%) saturate(500%) hue-rotate(86deg) brightness(96%) contrast(85%)' }} />{' '}
                        Scanner active - scan barcode now
                      </span>
                    )}</>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs"
                >
                  <img src={addIcon} alt={initial ? 'Update' : 'Add'} className="w-4 h-4 mr-1 brightness-0 invert" />
                  {initial ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </div>
          )}

          {isPullMode && (
            <div className="flex justify-end pt-4 border-t-2 border-gray-200 gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs"
                disabled={isDisabled}
              >
                {hasNextItem ? "Next item" : "Finish"}
              </Button>
            </div>
          )}

          {isViewMode && (
            <div className="flex justify-end pt-4 border-t-2 border-gray-200">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancel}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
