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
import { useInventoryItemForm } from '../../hooks/useInventoryItemForm';
import { ViewMode } from '@/app/feature/_shared/types/viewMode';
import type { InventoryItemDraft } from './types';

export type { InventoryItemDraft } from './types';

interface InventoryItemModalProps {
  readonly mode?: ViewMode;
  readonly open: boolean;
  readonly initial?: InventoryItemDraft | null;
  readonly onCancel: () => void;
  readonly onSave?: (item: InventoryItemDraft) => void;
}

export function InventoryItemModal({ mode = ViewMode.CREATE, open, initial, onCancel, onSave }: InventoryItemModalProps) {
  const isViewMode = mode === ViewMode.VIEW;
  
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
  } = useInventoryItemForm({ open, initial, onSave: onSave || (() => {}), mode });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto p-5" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>
            {(() => {
              if (isViewMode) return 'View Item Details';
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
              disabled={isViewMode}
            />
            
            <BasicInfoFields
              draft={draft}
              updateField={updateField}
              isFirearm={isFirearm}
              brands={brands}
              handleBrandChange={handleBrandChange}
              disabled={isViewMode}
            />

            {!isJewelry && !isFirearm && <div></div>}
            
            {isJewelry && (
              <JewelryFields
                draft={draft}
                updateField={updateField}
                handleMetalChange={handleMetalChange}
                isRing={isRing}
                disabled={isViewMode}
              />
            )}
            
            {isFirearm && (
              <FirearmFields
                draft={draft}
                updateField={updateField}
                disabled={isViewMode}
              />
            )}
          </div>

          {isJewelry && (
            <StonesSection 
              stones={draft.stones || []} 
              onChange={(stones) => updateField('stones', stones)}
              disabled={isViewMode}
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
              disabled={isViewMode}
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5 px-3.5">
              <AlertDescription className="text-xs flex items-center gap-2">
                <span className="text-sm">⚠️</span> {error}
              </AlertDescription>
            </Alert>
          )}

          {!isViewMode && (
            <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
              <div className="flex items-center gap-4">
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
