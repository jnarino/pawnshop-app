import { Button } from '@/components/ui/button';

interface CustomerActionButtonsProps {
  editingNew: boolean;
  loading: boolean;
  saving: boolean;
  disableSearch: boolean;
  onSearch: () => void;
  onClear: () => void;
  onAddNew: () => void;
  onScanId: () => void;
  onSave: () => void;
  onCancel: () => void;
  onCancelTransaction?: () => void;
}

export function CustomerActionButtons({
  editingNew,
  loading,
  saving,
  disableSearch,
  onSearch,
  onClear,
  onAddNew,
  onScanId,
  onSave,
  onCancel,
  onCancelTransaction,
}: CustomerActionButtonsProps) {
  return (
    <div className="col-span-2 flex flex-col justify-between py-4 h-full">
      <div className="flex flex-col gap-2">
        {!editingNew && (
          <>
            <Button type="submit" disabled={disableSearch || loading} onClick={onSearch}>
              {loading ? 'Searching…' : 'Find'}
            </Button>
            <Button type="button" variant="outline" onClick={onClear} disabled={loading}>
              Clear
            </Button>
            <Button type="button" variant="secondary" onClick={onAddNew} disabled={loading}>
              Add New
            </Button>
            <Button type="button" variant="secondary" onClick={onScanId}>
              Scan ID
            </Button>
          </>
        )}
        {editingNew && (
          <>
            <Button type="button" onClick={onSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save Customer'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
              Cancel
            </Button>
          </>
        )}
      </div>
      
      {!editingNew && onCancelTransaction && (
        <div className="mt-auto pt-4">
          <Button type="button" variant="destructive" onClick={onCancelTransaction} className="w-full">
            Cancel Transaction
          </Button>
        </div>
      )}
    </div>
  );
}
