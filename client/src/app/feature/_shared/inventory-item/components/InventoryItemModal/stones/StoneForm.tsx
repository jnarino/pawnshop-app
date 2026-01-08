import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { LookupSelect } from '@/app/shared/components/LookupSelect';
import { LookupTypeName } from '@/app/shared/types/lookup';
import { Stone } from './types';

interface StoneFormProps {
  initialStone?: Stone | null;
  onSubmit: (stone: Omit<Stone, 'id'>) => void;
  onCancel: () => void;
  disabled?: boolean;
}

const DEFAULT_FORM = {
  quantity: '1',
  type: { id: '', name: '' },
  shape: { id: '', name: '' },
  carat: '',
  color: { id: '', name: '' },
  weight: '',
  length: '',
  width: '',
  clarity: { id: '', name: '' }
};

export function StoneForm({ initialStone, onSubmit, onCancel, disabled }: StoneFormProps) {
  const [formData, setFormData] = useState(DEFAULT_FORM);


  useEffect(() => {
    if (initialStone) {
      setFormData({
        quantity: initialStone.quantity || '1',
        type: initialStone.type || { id: '', name: '' },
        shape: initialStone.shape || { id: '', name: '' },
        carat: initialStone.carat || '',
        color: initialStone.color || { id: '', name: '' },
        weight: initialStone.weight || '',
        length: initialStone.length || '',
        width: initialStone.width || '',
        clarity: initialStone.clarity || { id: '', name: '' }
      });
    } else {
      // Reset form when initialStone becomes null (e.g., after cancel)
      setFormData(DEFAULT_FORM);
    }
  }, [initialStone]);

  const updateField = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!formData.type) return;
    onSubmit(formData);
    setFormData(DEFAULT_FORM);
  }, [formData, onSubmit]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold">Quantity *</Label>
          <Input
            type="number"
            min="1"
            value={formData.quantity}
            onChange={(e) => updateField('quantity', e.target.value)}
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Type *</Label>
          <LookupSelect
            typeName={LookupTypeName.TYPE}
            value={formData.type}
            onChange={(_, stone) => {
              updateField('type', stone)
            }}
            placeholder="Select type..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Shape</Label>
          <LookupSelect
            typeName={LookupTypeName.SHAPE}
            value={formData.shape}
            onChange={(_, stone) => updateField('shape', stone)}
            placeholder="Select shape..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Carat</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.carat}
            onChange={(e) => updateField('carat', e.target.value)}
            placeholder="0.50"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Color</Label>
          <LookupSelect
            typeName={LookupTypeName.COLOR}
            value={formData.color}
            onChange={(_, stone) => updateField('color', stone)}
            placeholder="Select color..."
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Weight</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) => updateField('weight', e.target.value)}
            placeholder="0.00"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Length</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.length}
            onChange={(e) => updateField('length', e.target.value)}
            placeholder="0.00"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Width</Label>
          <Input
            type="number"
            step="0.01"
            value={formData.width}
            onChange={(e) => updateField('width', e.target.value)}
            placeholder="0.00"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1 col-span-2">
          <Label className="text-xs font-semibold">Clarity</Label>
          <LookupSelect
            typeName={LookupTypeName.CLARITY}
            value={formData.clarity}
            onChange={(_, stone) => updateField('clarity', stone)}
            placeholder="Select clarity..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" size="sm" className="w-full text-xs" onClick={handleSubmit} disabled={disabled}>
          {initialStone ? 'Update' : 'Add'} Stone
        </Button>
        {initialStone && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="w-full text-xs">
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
