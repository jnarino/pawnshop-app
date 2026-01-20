import React, { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CategoryOption, createNewBrand } from '@/app/core/api/categoryApi';
import { Plus } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { useNewOptionModal } from '@/app/shared/hooks/useNewOptionModal';
interface BrandSelectProps {
    readonly value: string | { id: string, name: string } | undefined;
    readonly categoryId: any;
    readonly options: CategoryOption[];
    readonly onChange: (value: string, explicitBrand?: CategoryOption) => void;
    readonly disabled?: boolean;
    readonly showAddButton?: boolean;
    readonly loadSubcategoriesAndBrands: () => Promise<void>;
}

export const BrandSelect = React.memo(function BrandSelect({
    value,
    categoryId,
    options,
    onChange,
    disabled = false,
    showAddButton = false,
    loadSubcategoriesAndBrands,
}: BrandSelectProps) {
    const selectedId = useMemo(() => {
        const rawId = typeof value === 'string' ? value : value?.id;
        if (!rawId) return '';

        // If it's a valid ID in options, use it
        if (options.some(opt => opt.id === rawId)) return rawId;

        // If not, try to match by name (case-insensitive)
        const match = options.find(opt => opt.name.trim().toUpperCase() === rawId.trim().toUpperCase());
        return match?.id ?? '';
    }, [value, options]);
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

    const handleConfirmAdd = async (name: string) => {
        if (!categoryId || !name.trim()) return;

        try {
            const response = await createNewBrand({
                name,
                inventoryCategoryId: categoryId
            });
            if (response && response.id) {
                await loadSubcategoriesAndBrands();
                onChange(response.id, { id: response.id, name: response.name || name });
            }
        } catch (error) {
            console.error('Failed to create new option', error);
        }
    };

    const { NewOptionModalWrapper, setShowAddModal } = useNewOptionModal(handleConfirmAdd, "brand");

    const handleOpenModal = (e: any) => {
        e.preventDefault();
        setShowAddModal(true)
    }

    return (
        <div className="space-y-1 col-span-3">
            <Label className="text-xs font-semibold">
                Brand <span className="text-red-600">*</span>
            </Label>
            <div className='flex items-center w-full'>
                <Select value={selectedId ?? ''} onValueChange={onChange} disabled={disabled}>
                    <SelectTrigger className={`h-8 text-xs uppercase ${showAddButton ? "rounded-r-none rounded-l-lg" : "rounded-lg"}`}>
                        <SelectValue placeholder="SELECT BRAND..." />
                    </SelectTrigger>
                    <SelectContent>
                        {selectItems}
                    </SelectContent>
                </Select>
                {showAddButton && (
                    <Tooltip content={`Add brand`}>
                        <button className={`shrink-0 !p-0 h-8 w-8 border border-l-0 rounded-r-lg rounded-l-none ${disabled ? "cursor-not-allowed" : "cursor-pointer"} flex items-center justify-center`} disabled={disabled} onClick={handleOpenModal}>
                            <Plus className="h-4 w-4" />
                        </button>
                    </Tooltip>
                )}
            </div>
            <NewOptionModalWrapper />
        </div>
    );
});
