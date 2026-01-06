import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import addIcon from '@/assets/icons/add.svg';
import editIcon from '@/assets/icons/edit.svg';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { InventoryItem } from '@/app/core/api/inventoryApi';
import { Customer } from '../../customer';

interface SaleTransactionDetailsProps {
  readonly disabled?: boolean;
  readonly inventoryNumber?: string;
  readonly inventoryItem?: InventoryItem;
  readonly quantity?: number;
  readonly description?: string;
  readonly customer?: Customer;
  readonly taxExemptUsed?: boolean;
  readonly priceEach?: number | string;
  readonly onSearchInventoryItem: (value: string) => void;
  readonly handleSaveItem: (item: any) => void; // TODO: any
  readonly handleFieldByKey: (key: string, value: any) => void;
  readonly setTaxExemptUsed: (value: boolean) => void;
  readonly isEditing?: boolean;
  readonly onCancelEdit?: () => void;
}

export function SaleTransactionDetails({
  disabled = false,
  inventoryNumber,
  inventoryItem,
  quantity,
  description,
  customer,
  taxExemptUsed,
  setTaxExemptUsed,
  priceEach,
  onSearchInventoryItem,
  handleSaveItem,
  handleFieldByKey,
  isEditing,
  onCancelEdit
}: SaleTransactionDetailsProps) {
  return (
    <Card className={`border-2 mb-6 ${isEditing ? 'border-amber-400 bg-amber-50/30' : ''}`}>
      <CardHeader className="bg-slate-50 border-b py-4">
        <CardTitle className="text-lg font-semibold">Transaction Details</CardTitle>
      </CardHeader>
      <CardContent className="p-6 grid gap-6">


        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col space-y-2">
            <div className="gap-2">
              <Label htmlFor="rate">Inventory # or Non-Inv Type</Label>
              <div className="flex gap-2">
                <Input
                  id="rate"
                  type="text"
                  value={inventoryNumber || ''}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      let val = e.currentTarget.value;
                      // Determine if it looks like a barcode (10 digits starting with 00)
                      // Format: 00PPPPPPSS -> P=prefix, S=suffix
                      if (/^00\d{8}$/.test(val)) {
                        const prefix = parseInt(val.substring(0, 8), 10);
                        const suffix = parseInt(val.substring(8), 10);
                        val = `${prefix}-${suffix}`;
                        handleFieldByKey('inventoryNumber', val);
                      }
                      onSearchInventoryItem(val)
                    }
                  }}
                  onChange={(e) => handleFieldByKey('inventoryNumber', e.currentTarget.value)}
                />
                <Button variant="outline" onClick={(e) => {
                  e.preventDefault();
                  onSearchInventoryItem(inventoryNumber || '')
                }}>Find</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                className="h-full"
                value={description}
                onChange={(e) => handleFieldByKey('description', e.target.value)}
                disabled={disabled || !!inventoryItem} // Read-only ONLY if item is found
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={quantity ?? ''}
                min={1}
                // Only enforce max if we have an inventory item with tracked quantity
                max={inventoryItem?.quantity ? inventoryItem.quantity : undefined}
                onChange={(e) => {
                  const val = e.target.valueAsNumber;
                  const max = inventoryItem?.quantity || 0;
                  // If manual item (no inventoryItem), allow any quantity > 0
                  // If inventory item, enforce max
                  if (!inventoryItem || val <= max) {
                    handleFieldByKey('quantity', val);
                  }
                }}
                disabled={disabled} // Always enabled (unless form is disabled)
              />
            </div>
            <div className="gap-2">
              <Label>Price each</Label>
              <Input
                type="number"
                step="0.01"
                value={priceEach ?? ''}
                onChange={(e) => handleFieldByKey('priceEach', e.target.value)} // Pass string to allow typing decimals
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleFieldByKey('priceEach', val.toFixed(2));
                  }
                }}
                disabled={disabled} // Always enabled
              />
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <div>
              <Label>On hand</Label>
              <Input
                type="number"
                step="0.01"
                value={inventoryItem?.quantity || 0}
                onChange={() => { }}
                disabled
              />
            </div>
            <div>
              <Label>Retail</Label>
              <Input
                type="number"
                step="0.01"
                value={0}
                onChange={() => { }}
                disabled
              />
            </div>
            <div><Label>Cost each</Label>
              <Input
                type="number"
                step="0.01"
                value={inventoryItem?.priceAmount || 0}
                onChange={() => { }}
                disabled={true}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-col">
          {customer && <p><b>Customer:</b> {customer?.firstName + ' ' + customer?.lastName}</p>}
          <hr className="my-2" />
          <div className="flex items-center justify-end mt-2 gap-2 items-end">
            <div className="flex gap-2">
              <Checkbox
                id="taxExempt"
                checked={taxExemptUsed}
                onCheckedChange={(checked) => setTaxExemptUsed(checked === true)}
                disabled={disabled}
              />
              <Label htmlFor="taxExempt" className="mb-0">Tax Exempt?</Label>
            </div>
            <Button
              type="button"
              onClick={() => handleSaveItem({
                inventoryItem,
                inventoryNumber, // Pass the manual number
                description,
                quantity,
                priceEach,
                taxExempt: false
              })}
              disabled={disabled || !quantity || quantity <= 0 || !description || priceEach === '' || priceEach === undefined} // Allow saving if we have quantity
              size="sm"
              className={isEditing ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
            >
              <img src={isEditing ? editIcon : addIcon} alt={isEditing ? "Save" : "Add"} className="w-4 h-4 mr-1 brightness-0 invert" />
              {isEditing ? "Update Item" : "Add Item"}
            </Button>
            {isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
