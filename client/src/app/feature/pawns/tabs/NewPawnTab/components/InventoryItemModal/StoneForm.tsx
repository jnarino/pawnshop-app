import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Stone } from './types';

const STONE_TYPES = ['Diamond', 'Ruby', 'Sapphire', 'Emerald', 'Pearl', 'Amethyst', 'Topaz', 'Opal', 'Onyx', 'Other'];
const CUTS = ['Round', 'Princess', 'Cushion', 'Oval', 'Emerald', 'Pear', 'Marquise', 'Radiant', 'Asscher', 'Heart'];
const COLORS = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Fancy'];
const CLARITIES = ['FL', 'IF', 'VVS1', 'VVS2', 'VS1', 'VS2', 'SI1', 'SI2', 'I1', 'I2', 'I3'];
const SETTINGS = ['Prong', 'Bezel', 'Channel', 'Pavé', 'Tension', 'Halo', 'Cluster', 'Bar'];
const WEIGHT_UNITS = ['Carats', 'Points'];

interface StoneFormProps {
  initialStone?: Stone | null;
  onSubmit: (stone: Omit<Stone, 'id'>) => void;
  onCancel: () => void;
}

export function StoneForm({ initialStone, onSubmit, onCancel }: StoneFormProps) {
  const [formData, setFormData] = useState({
    type: '',
    cut: '',
    color: '',
    clarity: '',
    weight: '',
    weightUnit: 'Carats',
    count: '1',
    setting: '',
    certification: ''
  });

  useEffect(() => {
    if (initialStone) {
      setFormData({
        type: initialStone.type || '',
        cut: initialStone.cut || '',
        color: initialStone.color || '',
        clarity: initialStone.clarity || '',
        weight: initialStone.weight || '',
        weightUnit: initialStone.weightUnit || 'Carats',
        count: initialStone.count || '1',
        setting: initialStone.setting || '',
        certification: initialStone.certification || ''
      });
    }
  }, [initialStone]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.weight) {
      return;
    }
    onSubmit(formData);
    setFormData({
      type: '',
      cut: '',
      color: '',
      clarity: '',
      weight: '',
      weightUnit: 'Carats',
      count: '1',
      setting: '',
      certification: ''
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label className="text-xs font-semibold">Type *</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
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
        <Label className="text-xs font-semibold">Cut</Label>
        <Select value={formData.cut} onValueChange={(value) => setFormData(prev => ({ ...prev, cut: value }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select cut..." />
          </SelectTrigger>
          <SelectContent>
            {CUTS.map(cut => (
              <SelectItem key={cut} value={cut} className="text-xs">{cut}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold">Color</Label>
        <Select value={formData.color} onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}>
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
        <Label className="text-xs font-semibold">Clarity</Label>
        <Select value={formData.clarity} onValueChange={(value) => setFormData(prev => ({ ...prev, clarity: value }))}>
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

      <div className="space-y-1">
        <Label className="text-xs font-semibold">Weight *</Label>
        <div className="flex gap-1">
          <Input
            type="number"
            step="0.01"
            value={formData.weight}
            onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
            placeholder="0.50"
            required
            className="h-8 text-xs flex-1"
          />
          <Select value={formData.weightUnit} onValueChange={(value) => setFormData(prev => ({ ...prev, weightUnit: value }))}>
            <SelectTrigger className="h-8 text-xs w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_UNITS.map(unit => (
                <SelectItem key={unit} value={unit} className="text-xs">{unit}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold">Count</Label>
        <Input
          type="number"
          min="1"
          value={formData.count}
          onChange={(e) => setFormData(prev => ({ ...prev, count: e.target.value }))}
          className="h-8 text-xs"
        />
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold">Setting</Label>
        <Select value={formData.setting} onValueChange={(value) => setFormData(prev => ({ ...prev, setting: value }))}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="Select setting..." />
          </SelectTrigger>
          <SelectContent>
            {SETTINGS.map(setting => (
              <SelectItem key={setting} value={setting} className="text-xs">{setting}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold">Certification</Label>
        <Input
          value={formData.certification}
          onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.value.toUpperCase() }))}
          placeholder="GIA, AGS, EGL..."
          className="h-8 text-xs uppercase"
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button type="submit" size="sm" className="w-full text-xs">
          {initialStone ? 'Update' : 'Add'} Stone
        </Button>
        {initialStone && (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} className="w-full text-xs">
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
