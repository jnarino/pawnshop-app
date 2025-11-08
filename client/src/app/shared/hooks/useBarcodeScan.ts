import { useScannerBase } from './useScannerBase';

export interface BarcodeScanOptions {
  enabled: boolean;
  onBarcode: (code: string) => void;
  timingGapMs?: number;
  prefix?: string;   // e.g. 'INVC:' or scanner-specific prefix
  suffix?: string;
  minLength?: number;
  allowRegex?: RegExp; // optional pattern enforcement
}

export function useBarcodeScan({
  enabled,
  onBarcode,
  timingGapMs = 40,
  prefix,
  suffix,
  minLength = 3,
  allowRegex
}: BarcodeScanOptions) {

  useScannerBase({
    enabled,
    timingGapMs,
    prefix,
    suffix,
    minLength,
    endKey: 'Enter',
    onScan: (raw) => {
      if (allowRegex && !allowRegex.test(raw)) return;
      onBarcode(raw);
    }
  });
}