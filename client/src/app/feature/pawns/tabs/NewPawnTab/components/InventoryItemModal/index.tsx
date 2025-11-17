import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CategoryFields } from './CategoryFields';
import { BasicInfoFields } from './BasicInfoFields';
import { JewelryFields } from './JewelryFields';
import { FirearmFields } from './FirearmFields';
import { useInventoryItemForm } from './useInventoryItemForm';
import { InventoryItemDraft } from './types';

export type { InventoryItemDraft };

interface Props {
  open: boolean;
  initial?: InventoryItemDraft | null;
  onCancel: () => void;
  onSave: (item: InventoryItemDraft) => void;
}

export default function InventoryItemModal({ open, initial, onCancel, onSave }: Props) {
  const {
    draft,
    error,
    barcodeMode,
    setBarcodeMode,
    typeQuery,
    setTypeQuery,
    showSuggestions,
    setShowSuggestions,
    suggestions,
    isLoading,
    subtypes,
    isJewelry,
    isFirearm,
    isRing,
    karatOptions,
    updateField,
    selectType,
    handleSubmit,
    handleMetalChange
  } = useInventoryItemForm({ open, initial, onSave });

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl w-full max-h-[85vh] overflow-y-auto p-5">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Item' : 'Add New Item'}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-12 gap-3">
            <CategoryFields
              typeQuery={typeQuery}
              setTypeQuery={setTypeQuery}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              suggestions={suggestions}
              selectType={selectType}
              isLoading={isLoading}
              draft={draft}
              subtypes={subtypes}
              updateField={updateField}
            />
            
            <BasicInfoFields
              draft={draft}
              updateField={updateField}
              isFirearm={isFirearm}
            />

            {!isJewelry && !isFirearm && <div></div>}
            
            {isJewelry && (
              <JewelryFields
                draft={draft}
                updateField={updateField}
                handleMetalChange={handleMetalChange}
                karatOptions={karatOptions}
                isRing={isRing}
              />
            )}
            
            {isFirearm && (
              <FirearmFields
                draft={draft}
                updateField={updateField}
              />
            )}
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Description</Label>
            <Textarea
              value={draft.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={2}
              placeholder="Brief description (free text)..."
              className="text-xs resize-none"
            />
          </div>

          {error && (
            <Alert variant="destructive" className="py-2.5 px-3.5">
              <AlertDescription className="text-xs flex items-center gap-2">
                <span className="text-sm">⚠️</span> {error}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center pt-4 border-t-2 border-gray-200">
            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant={barcodeMode ? "destructive" : "secondary"}
                size="sm"
                onClick={() => setBarcodeMode(!barcodeMode)}
                className="text-xs"
              >
                {barcodeMode ? '⏹️ Stop Scanner' : '📱 Scan Barcode'}
              </Button>
              {barcodeMode && (
                <span className="text-green-600 text-[10px] font-medium flex items-center gap-1">
                  📱 Scanner active - scan barcode now
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
                {initial ? '💾 Update Item' : '➕ Add Item'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
