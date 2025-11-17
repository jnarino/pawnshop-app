import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface FormFieldProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'number';
  className?: string;
  options?: readonly string[];
  step?: string;
  min?: string;
  max?: string;
  datalist?: readonly string[];
}

export function FormField({
  label,
  required,
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  options,
  step,
  min,
  max,
  datalist
}: FormFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs font-semibold">
        {label} {required && <span className="text-red-600">*</span>}
      </Label>
      {options ? (
        <Select value={value} onValueChange={onChange} required={required}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option} value={option} className="text-xs uppercase">
                {option.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`uppercase text-xs h-8 ${className}`}
          required={required}
          step={step}
          min={min}
          max={max}
          list={datalist ? `datalist-${label}` : undefined}
        />
      )}
      {datalist && (
        <datalist id={`datalist-${label}`}>
          {datalist.map(item => (
            <option key={item} value={item.toUpperCase()} />
          ))}
        </datalist>
      )}
    </div>
  );
}
