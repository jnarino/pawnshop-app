import { useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLookup } from '@/app/shared/hooks/useLookup';
import type { LookupTypeName } from '@/app/shared/types/lookup';
import { Plus } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import NewOptionModal from './NewOptionModal';
import { createAttributeValue } from '@/app/core/api/lookupApi';
import { useNewOptionModal } from '../hooks/useNewOptionModal';

interface LookupSelectProps {
  readonly typeName: LookupTypeName;
  readonly value: string | { id: string; name: string } | undefined;
  readonly onChange: (value: string, displayValue?: any, option?: any) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
  readonly showAddButton?: boolean;
}

/**
 * A reusable select component that fetches and displays lookup values from the API.
 * Values are cached in Redux after the first load, preventing duplicate API calls.
 * Use LookupTypeName enum to specify which lookup type to display (e.g., KARAT, METAL, GENDER).
 */
// ... component ...
export function LookupSelect({
  typeName,
  value,
  onChange,
  placeholder = 'SELECT...',
  disabled = false,
  required = false,
  className = '',
  showAddButton = false
}: LookupSelectProps) {
  const { options, isLoading, typeId, refreshValues } = useLookup(typeName);

  const selectedId = useMemo(() => {
    const rawId = typeof value === 'string' ? value : value?.id;
    if (!rawId) return '';
    if (options.some(opt => opt.id === rawId)) return rawId;
    const match = options.find(opt => opt.value.trim().toUpperCase() === rawId.trim().toUpperCase());
    return match?.id ?? '';
  }, [value, options]);

  const handleValueChange = (selectedId: string) => {
    const option = options.find(opt => opt.id === selectedId);
    if (option) {
      onChange(selectedId, option.value, option);
    }
  };

  const handleConfirmAdd = async (description: string) => {
    if (!typeId || !description.trim()) return;

    try {
      const response = await createAttributeValue({
        value: description,
        attributeTypeId: typeId
      });
      if (response && response.id) {
        refreshValues();
        onChange(response.id, response.value, response);
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Failed to create new option', error);
    }
  };

  const { NewOptionModalWrapper, setShowAddModal } = useNewOptionModal(handleConfirmAdd, typeName?.toLocaleLowerCase());

  const handleOpenModal = (e: any) => {
    e.preventDefault();
    setShowAddModal(true)
  }

  if (isLoading) {
    return <div className="h-8 flex items-center text-xs text-gray-500">Loading...</div>;
  }

  return (
    <>
      <div className='flex items-center w-full'>
        <Select value={selectedId} onValueChange={handleValueChange} required={required} disabled={disabled}>
          <SelectTrigger className={`flex-1 min-w-0 h-8 text-xs ${className} ${showAddButton ? "rounded-r-none rounded-l-lg" : "rounded-lg"}`}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent showSearch>
            {options.map(opt => (
              <SelectItem key={opt.id} value={opt.id} className="text-xs">
                {opt.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {showAddButton && (
          <Tooltip content={`Add ${typeName?.toLowerCase()}`}>
            <button
              type="button"
              className="shrink-0 !p-0 h-8 w-8 border border-l-0 rounded-r-lg rounded-l-none cursor-pointer flex items-center justify-center hover:bg-muted"
              disabled={disabled}
              onClick={handleOpenModal}
            >
              <Plus className="h-4 w-4" />
            </button>
          </Tooltip>
        )}
      </div>
      <NewOptionModalWrapper />
    </>
  );
}
