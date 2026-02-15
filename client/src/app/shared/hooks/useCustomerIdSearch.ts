import { useCallback, useEffect, useRef, useState } from 'react';
import { useIdScan, AamvaData } from './useIdScan';
import { http } from '@/app/core/api/http'; // ✅ Add this import

export type NotFoundInfo = { idNumber?: string; dobISO?: string; aamva?: AamvaData };

function normalizeDobISO(d?: string) {
  if (!d) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const clean = d.replace(/\D/g, '');
  if (/^\d{8}$/.test(clean)) {
    if (/^(19|20)/.test(clean)) return `${clean.slice(0, 4)}-${clean.slice(4, 6)}-${clean.slice(6, 8)}`;
    return `${clean.slice(4, 8)}-${clean.slice(0, 2)}-${clean.slice(2, 4)}`;
  }
  return undefined;
}

export function useCustomerIdSearch(
  onFound: (cust: any) => void,
  onNotFound: (info: NotFoundInfo) => void
) {
  const [scanning, setScanning] = useState(false);

  // Keep latest callbacks in refs so our handler can be stable
  const onFoundRef = useRef(onFound);
  const onNotFoundRef = useRef(onNotFound);
  useEffect(() => { onFoundRef.current = onFound; }, [onFound]);
  useEffect(() => { onNotFoundRef.current = onNotFound; }, [onNotFound]);

  // Guards to avoid duplicate requests
  const busyRef = useRef(false);
  const lastKeyRef = useRef<string | null>(null);
  const lastKeyTsRef = useRef<number>(0);
  const DEDUPE_MS = 3000;

  const handleAamva = useCallback(async (data: AamvaData) => {
    // De-dupe identical scans within a short window
    const dobISO = normalizeDobISO(data.dateOfBirth);
    const idNumber = data.idNumber?.trim();
    const key = `${dobISO ?? ''}|${idNumber ?? ''}`;
    const now = Date.now();
    if (lastKeyRef.current === key && now - lastKeyTsRef.current < DEDUPE_MS) return;
    lastKeyRef.current = key;
    lastKeyTsRef.current = now;

    if (busyRef.current) return;
    busyRef.current = true;

    setScanning(false);

    if (!dobISO || !idNumber) {
      onNotFoundRef.current({ idNumber, dobISO, aamva: data });
      busyRef.current = false;
      return;
    }

    try {
      // ✅ Use http() with correct endpoint and JWT auth
      const params = new URLSearchParams();
      params.set('dateOfBirth', dobISO!);
      if (data.firstName) params.set('firstName', data.firstName);
      if (data.lastName) params.set('lastName', data.lastName);
      params.set('limit', '10');

      console.info('[IDScan] 🔍 Searching for customer:', {
        dob: dobISO,
        firstName: data.firstName,
        lastName: data.lastName,
        idNumber: idNumber
      });

      const customers = await http(`/api/customer?${params.toString()}`);

      console.info('[IDScan] Search results:', { count: customers?.length || 0 });

      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        console.info('[IDScan] ❌ No customer found');
        onNotFoundRef.current({ idNumber, dobISO, aamva: data });
        return;
      }

      // ✅ Find exact match by ID number
      const match = customers.find((c: any) =>
        c.idNumber?.toUpperCase() === idNumber?.toUpperCase()
      );

      if (match) {
        console.info('[IDScan] ✅ Customer found:', match.id);
        onFoundRef.current(match);
      } else {
        console.info('[IDScan] ⚠️ Customers found but no ID match');
        onNotFoundRef.current({ idNumber, dobISO, aamva: data });
      }
    } catch (error) {
      console.error('[IDScan] ❌ Search error:', error);
      onNotFoundRef.current({ idNumber, dobISO, aamva: data });
    } finally {
      busyRef.current = false;
    }
  }, []);

  useIdScan({
    enabled: scanning,
    onAamva: handleAamva,     // stable reference prevents re-subscribing spam
    timingGapMs: 50,
  });

  return {
    scanning,
    startScan: () => setScanning(true),
    stopScan: () => setScanning(false),
  };
}