"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerProps {
  value?: string; // ISO format yyyy-mm-dd (stored format)
  onChange?: (value: string | undefined) => void;
  disabled?: boolean;
  placeholder?: string;
}

// Parse ISO date (yyyy-mm-dd) or mm/dd/yyyy to Date object
function parseDate(dateString: string): Date | undefined {
  if (!dateString) return undefined;
  
  // Try ISO format first (yyyy-mm-dd)
  if (dateString.includes('-')) {
    const [year, month, day] = dateString.split('-').map(p => Number.parseInt(p, 10));
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      const date = new Date(year, month - 1, day);
      if (date.getMonth() === month - 1 && date.getDate() === day && date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  // Try mm/dd/yyyy format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const month = Number.parseInt(parts[0], 10);
    const day = Number.parseInt(parts[1], 10);
    const year = Number.parseInt(parts[2], 10);
    
    if (!Number.isNaN(month) && !Number.isNaN(day) && !Number.isNaN(year)) {
      const date = new Date(year, month - 1, day);
      if (date.getMonth() === month - 1 && date.getDate() === day && date.getFullYear() === year) {
        return date;
      }
    }
  }
  
  return undefined;
}

// Format Date to ISO (yyyy-mm-dd) for storage
function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format Date to mm/dd/yyyy for display
function formatDateForDisplay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatInputValue(value: string): string {
  // Remove all non-numeric characters
   
  const digits = value.replace(new RegExp('\\D', 'g'), '');
  
  // Format as mm/dd/yyyy
  if (digits.length <= 2) {
    return digits;
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  } else {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
  }
}

export function DatePicker({ value, onChange, disabled, placeholder = "mm/dd/yyyy" }: DatePickerProps) {
  // Convert ISO to display format for input
  const initialDisplay = value ? (() => {
    const d = parseDate(value);
    return d ? formatDateForDisplay(d) : '';
  })() : '';
  
  const [inputValue, setInputValue] = React.useState(initialDisplay);
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Sync input value with prop value
  React.useEffect(() => {
    if (value) {
      const d = parseDate(value);
      setInputValue(d ? formatDateForDisplay(d) : '');
    } else {
      setInputValue('');
    }
  }, [value]);

  const selectedDate = parseDate(inputValue);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatInputValue(e.target.value);
    setInputValue(formatted);
    
    // Only trigger onChange if we have a complete, valid date
    if (formatted.length === 10) {
      const parsed = parseDate(formatted);
      if (parsed) {
        onChange?.(formatDateToISO(parsed)); // Store as ISO
      }
    } else if (formatted === '') {
      onChange?.(undefined);
    }
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      const displayFormatted = formatDateForDisplay(date);
      const isoFormatted = formatDateToISO(date);
      setInputValue(displayFormatted);
      onChange?.(isoFormatted); // Store as ISO
      setIsOpen(false);
    }
  };

  const handleInputBlur = () => {
    // Validate and clean up on blur
    const parsed = parseDate(inputValue);
    if (parsed) {
      const displayFormatted = formatDateForDisplay(parsed);
      const isoFormatted = formatDateToISO(parsed);
      setInputValue(displayFormatted);
      onChange?.(isoFormatted); // Store as ISO
    } else if (inputValue && inputValue.length > 0) {
      // Invalid date, clear it
      setInputValue('');
      onChange?.(undefined);
    }
  };

  return (
    <div className="relative">
      <Input
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={10}
        className="pr-10"
      />
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-0 top-0 h-full px-3 hover:bg-transparent",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            type="button"
          >
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            captionLayout="dropdown-months"
            startMonth={new Date(1900, 0)}
            endMonth={new Date(new Date().getFullYear() + 10, 11)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
