import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { US_STATES } from '../constants/states';

interface StateSelectProps {
  value?: string | null;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function StateSelect({ 
  value, 
  onValueChange, 
  disabled = false, 
  placeholder = "Select state",
  className 
}: StateSelectProps) {
  return (
    <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {US_STATES.map(state => (
          <SelectItem key={state} value={state}>{state}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
