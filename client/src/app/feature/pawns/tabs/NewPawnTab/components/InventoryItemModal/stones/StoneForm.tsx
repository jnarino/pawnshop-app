import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Stone } from './types';

const STONE_TYPES = ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Amethyst', 'Topaz', 'Opal', 'Onyx', 'Other'];
const SHAPES = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Marquise', 'Radiant', 'Asscher', 'Heart'];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Fancy'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];

interface StoneFormProps {
  initialStone?: Stone | null;
  onSubmit: (stone: Omit<Stone, 'id'>) => void;
  onCancel: () => void;
}

const DEFAULT_FORM = {
  quantity: '1',
  type: '',
  shape: '',
  carat: '',
  color: '',
  weight: '',
  length: '',
  width: '',
  clarity: ''
};

export function StoneForm({ initialStone, onSubmit, onCancel }: StoneFormProps) {
  const [formData, setFormData] = useState(DEFAULT_FORM);

  useEffect(() => {
    if (initialStone) {
      setFormData({
        quantity: initialStone.quantity || '1',
        type: initialStone.type || '',
        shape: initialStone.shape || '',
        carat: initialStone.carat || '',
        color: initialStone.color || '',
        weight: initialStone.weight || '',
        length: initialStone.length || '',
        width: initialStone.width || '',
        clarity: initialStone.clarity || ''
      });
    }
  }, [initialStone]);

  const updateField = useCallback((field: string, value: string) => {
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
          <Select value={formData.type} onValueChange={(v) => updateField('type', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {STONE_TYPES.map(type => (
                <SelectItem key={type} value={type} className="text-xs">{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs font-semibold">Shape</Label>
          <Select value={formData.shape} onValueChange={(v) => updateField('shape', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select shape..." />
            </SelectTrigger>
            <SelectContent>
              {SHAPES.map(shape => (
                <SelectItem key={shape} value={shape} className="text-xs">{shape}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={formData.color} onValueChange={(v) => updateField('color', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select color..." />
            </SelectTrigger>
            <SelectContent>
              {COLORS.map(color => (
                <SelectItem key={color} value={color} className="text-xs">{color}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Select value={formData.clarity} onValueChange={(v) => updateField('clarity', v)}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Select clarity..." />
            </SelectTrigger>
            <SelectContent>
              {CLARITIES.map(clarity => (
                <SelectItem key={clarity} value={clarity} className="text-xs">{clarity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="button" size="sm" className="w-full text-xs" onClick={handleSubmit}>
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
