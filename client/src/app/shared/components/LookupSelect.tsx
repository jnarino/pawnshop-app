import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLookup } from '@/app/shared/hooks/useLookup';
import type { LookupTypeName } from '@/app/shared/types/lookup';

interface LookupSelectProps {
  readonly typeName: LookupTypeName;
  readonly value: { id: string; name: string } | undefined;
  readonly onChange: (value: string, displayValue?: any) => void;
  readonly placeholder?: string;
  readonly disabled?: boolean;
  readonly required?: boolean;
  readonly className?: string;
}

/**
 * A reusable select component that fetches and displays lookup values from the API.
 * Values are cached in Redux after the first load, preventing duplicate API calls.
 * Use LookupTypeName enum to specify which lookup type to display (e.g., KARAT, METAL, GENDER).
 */
export function LookupSelect({
  typeName,
  value,
  onChange,
  placeholder = 'SELECT...',
  disabled = false,
  required = false,
  className = '',
}: LookupSelectProps) {
  const { options, isLoading } = useLookup(typeName);

  if (isLoading) {
    return <div className="h-8 flex items-center text-xs text-gray-500">Loading...</div>;
  }

  const handleValueChange = (selectedId: string) => {
    const option = options.find(opt => opt.id === selectedId);
    if (option) {
      onChange(selectedId, { id: option.id, name: option.value });
    }
  };

  return (
    <Select value={value?.id ?? ''} onValueChange={handleValueChange} required={required} disabled={disabled}>
      <SelectTrigger className={`h-8 text-xs ${className}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(opt => (
          <SelectItem key={opt.id} value={opt.id} className="text-xs">
            {opt.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
