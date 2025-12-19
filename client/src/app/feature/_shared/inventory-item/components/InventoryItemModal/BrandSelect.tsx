import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CategoryOption } from '@/app/core/api/categoryApi';

interface BrandSelectProps {
    readonly value: string;
    readonly options: CategoryOption[];
    readonly onChange: (value: string) => void;
    readonly disabled?: boolean;
}

export const BrandSelect = React.memo(function BrandSelect({
    value,
    options,
    onChange,
    disabled = false,
}: BrandSelectProps) {
    // Optimization: If the list is huge, this memo prevents re-mapping on every render
    // unless options actually change.
    // Note: Radix Select can still be heavy with thousands of items.
    // If this is still slow, we might need a virtualized list or Command/Combobox.
    const selectItems = useMemo(() => {
        return options.map((brand) => (
            <SelectItem key={brand.id} value={brand.id} className="text-xs uppercase">
                {brand.name.toUpperCase()}
            </SelectItem>
        ));
    }, [options]);

    return (
        <div className="space-y-1 col-span-3">
            <Label className="text-xs font-semibold">
                Brand <span className="text-red-600">*</span>
            </Label>
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger className="h-8 text-xs uppercase">
                    <SelectValue placeholder="SELECT BRAND..." />
                </SelectTrigger>
                <SelectContent>
                    {selectItems}
                </SelectContent>
            </Select>
        </div>
    );
});
