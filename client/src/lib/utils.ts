import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | Date | null | undefined, withTime: boolean = false): string {
  if (!dateStr) return '';
  try {
    const options: Intl.DateTimeFormatOptions = {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
      ...(withTime && {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  } catch (e) {
    console.error('Error formatting date:', e);
    return 'Invalid Date';
  }
}

export function formatCurrency(amount?: number | string | null): string {
  if (!amount && amount !== 0) return '$0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number.isNaN(numAmount) ? '$0.00' : `$${numAmount.toFixed(2)}`;
}
