import { useEffect, useRef } from 'react';

export interface ScannerBaseOptions {
  enabled: boolean;
  onScan: (raw: string) => void;
  timingGapMs?: number;        // max gap between chars to consider same scan
  endKey?: string;             // usually 'Enter'
  minLength?: number;          // ignore very short noise
  prefix?: string;             // optional required starting text
  suffix?: string;             // optional required ending text (before endKey)
  stripPrefixSuffix?: boolean; // remove prefix/suffix from raw before onScan
}

export function useScannerBase(opts: ScannerBaseOptions) {
  const {
    enabled,
    onScan,
    timingGapMs = 50,
    endKey = 'Enter',
    minLength = 4,
    prefix,
    suffix,
    stripPrefixSuffix = true,
  } = opts;

  const bufferRef = useRef('');
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const handleKey = (e: KeyboardEvent) => {
      const now = performance.now();
      const gap = now - lastTsRef.current;
      lastTsRef.current = now;

      if (e.key.length > 1 && e.key !== endKey) return;
      if (gap > timingGapMs) bufferRef.current = '';

      if (e.key === endKey) {
        const raw = bufferRef.current;
        bufferRef.current = '';
        if (raw.length < minLength) return;

        if (prefix && !raw.startsWith(prefix)) return;
        if (suffix && !raw.endsWith(suffix)) return;

        let cleaned = raw;
        if (stripPrefixSuffix) {
            if (prefix && cleaned.startsWith(prefix)) cleaned = cleaned.slice(prefix.length);
            if (suffix && cleaned.endsWith(suffix)) cleaned = cleaned.slice(0, -suffix.length);
        }
        onScan(cleaned);
        return;
      }

      bufferRef.current += e.key;
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [enabled, onScan, timingGapMs, endKey, minLength, prefix, suffix, stripPrefixSuffix]);
}