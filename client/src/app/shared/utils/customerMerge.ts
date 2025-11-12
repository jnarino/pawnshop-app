import { CustomerRecord } from '../../feature/pawns/tabs/CustomerInfoTab/mappers';
import { AamvaData } from '../hooks/useIdScan';

export interface MergeAamvaOptions {
  onlyIfEmpty?: boolean; // if true, do not overwrite non-empty existing values
}

// Utility: treat undefined, null, '' as empty for conditional merges
function isEmpty(v: any) { return v === undefined || v === null || v === ''; }

export function mergeAamva(base: CustomerRecord, scan: AamvaData, opts: MergeAamvaOptions = {}): CustomerRecord {
  const { onlyIfEmpty = false } = opts;
  const pick = <K extends keyof CustomerRecord>(targetKey: K, scanValue: any) => {
    if (scanValue === undefined || scanValue === null) return base[targetKey];
    if (onlyIfEmpty && !isEmpty(base[targetKey])) return base[targetKey];
    return scanValue as CustomerRecord[K];
  };
  return {
    ...base,
    firstName: pick('firstName', scan.firstName),
    middleName: pick('middleName', scan.middleName),
    lastName: pick('lastName', scan.lastName),
    dateOfBirth: pick('dateOfBirth', scan.dateOfBirth),
    idIssueDate: pick('idIssueDate', scan.issueDate),
    idExpiration: pick('idExpiration', scan.expirationDate),
    streetAddress: pick('streetAddress', scan.streetAddress),
    city: pick('city', scan.city),
    stateUs: pick('stateUs', scan.stateUs),
    zipCode: pick('zipCode', scan.zipcode),
    sex: pick('sex', scan.sex),
    height: pick('height', scan.height),
    idNumber: pick('idNumber', scan.idNumber),
    weight: pick('weight', scan.weight),
    eyeColor: pick('eyeColor', scan.eyeColor),
    hairColor: pick('hairColor', scan.hairColor),
    birthCountry: pick('birthCountry', (scan as any).country),
  };
}

// Shared phone formatter
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  const p1 = digits.slice(0, 3), p2 = digits.slice(3, 6), p3 = digits.slice(6);
  if (digits.length <= 3) return `(${p1}`;
  if (digits.length <= 6) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
}

export function deriveHeightParts(height?: string) {
  if (!height) return { feet: '', inches: '' };
  const ftMatch = height.match(/(\d+)'/);
  const inMatch = height.match(/'(\d{1,2})"?/);
  return { feet: ftMatch ? ftMatch[1] : '', inches: inMatch ? inMatch[1] : '' };
}

export function normalizeHeight(feet: string, inches: string): string | undefined {
  const f = feet.replace(/\D/g, '').slice(0, 2);
  const i = inches.replace(/\D/g, '').slice(0, 2);
  if (!f && !i) return undefined;
  return `${f || '0'}'${i || '0'}"`;
}
