import { useEffect, useRef } from 'react';
import { useScannerBase } from './useScannerBase';

export interface AamvaData {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: string;
  issueDate?: string;
  expirationDate?: string;
  sex?: string;
  streetAddress?: string;
  city?: string;
  stateUs?: string;
  zipcode?: string;
  idNumber?: string;
  eyeColor?: string;
  hairColor?: string;
  height?: string;
  country?: string;
  weight?: string; // <--- ADDED
}

const AAMVA_DATE = (v?: string) => {
  // Expect YYYYMMDD or MMDDYYYY; spec usually: CCYYMMDD or YYYYMMDD (older)
  if (!v) return undefined;
  let cleaned = v.replace(/\D/g, '');
  if (cleaned.length === 8) {
    // Heuristic: if starts with 19/20 treat as YYYYMMDD else MMDDYYYY
    if (/^(19|20)/.test(cleaned)) {
      return `${cleaned.slice(0,4)}-${cleaned.slice(4,6)}-${cleaned.slice(6,8)}`;
    } else {
      return `${cleaned.slice(4,8)}-${cleaned.slice(0,2)}-${cleaned.slice(2,4)}`;
    }
  }
  return undefined;
};

function inchesToFeetIn(inchesStr?: string) {
  if (!inchesStr) return undefined;
  const n = parseInt(inchesStr.replace(/\D/g,''),10);
  if (isNaN(n) || n<=0) return undefined;
  const ft = Math.floor(n/12);
  const inch = n % 12;
  return `${ft}'${inch}"`;
}

const EYE_MAP: Record<string,string> = {
  BLK:'Black', BLU:'Blue', BRO:'Brown', BRN:'Brown', GRY:'Gray',
  GRN:'Green', HAZ:'Hazel', MAR:'Maroon', PNK:'Pink', DIC:'Dichroic'
};
const HAIR_MAP: Record<string,string> = {
  BLK:'Black', BLN:'Blond', BRO:'Brown', BRN:'Brown', GRY:'Gray',
  WHI:'White', RED:'Red', SDY:'Sandy', BAL:'Bald'
};
const SEX_MAP: Record<string,string> = { '1':'M', '2':'F', '3':'X', M:'M', F:'F', U:'X' };

// Fallback parser for simple line-based (non-AAMVA ANSI) driver license scans
function parseSimpleLines(raw: string): AamvaData | null {
  // Normalize newlines
  const lines = raw.replace(/\r/g, '\n').split('\n').map(l => l.trim());
  if (lines.length < 6) return null;

  // Find a 2-letter state line (e.g. FL)
  const stateIdx = lines.findIndex(l => /^[A-Z]{2}$/.test(l));
  if (stateIdx === -1) return null;

  // Expected order relative to state line (based on your sample):
  // [state] [DOB: YYYYMMDD] [NAME: LAST,FIRST[,MIDDLE]] [ISSUE: MMDDYYYY]
  // [EXP: MMDDYYYY] [CITY] [ADDRESS1] [maybe address2 or #] [ZIP(5|9)]
  // subsequent single-letter or # lines ignored, height like "069 IN"
  const safe = (i: number) => (i >= 0 && i < lines.length ? lines[i] : '');

  const dobRaw    = safe(stateIdx + 1);
  const nameLine  = safe(stateIdx + 2);
  const issueRaw  = safe(stateIdx + 3);
  const expRaw    = safe(stateIdx + 4);
  const cityLine  = safe(stateIdx + 5);
  const addr1Line = safe(stateIdx + 6);

  // Find zip anywhere after addr1
  const zipLine = lines
    .slice(stateIdx + 5)
    .find(l => /^\d{5}(-?\d{4})?$/.test(l)) || '';

  // Height pattern e.g. "069 IN"
  const heightLine = lines.find(l => /\b\d{2,3}\s?IN\b/i.test(l));

  const toDate = (v: string): string | undefined => {
    const d = v.replace(/\D/g,'');
    if (d.length !== 8) return;
    if (/^(19|20)/.test(d)) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`; // YYYYMMDD
    // else MMDDYYYY
    return `${d.slice(4,8)}-${d.slice(0,2)}-${d.slice(2,4)}`;
  };

  let lastName='', firstName='', middleName: string|undefined;
  if (nameLine.includes(',')) {
    const parts = nameLine.split(',').map(p=>p.trim()).filter(Boolean);
    lastName = parts[0] || '';
    firstName = parts[1] || '';
    middleName = parts[2];
  } else {
    const parts = nameLine.split(/\s+/);
    lastName = parts[0] || '';
    firstName = parts[1] || '';
    middleName = parts.slice(2).join(' ') || undefined;
  }

  let height: string | undefined;
  if (heightLine) {
    const m = heightLine.match(/(\d{2,3})\s?IN/i);
    if (m) {
      const inches = parseInt(m[1],10);
      if (!isNaN(inches) && inches > 0) {
        const ft = Math.floor(inches/12);
        const inch = inches % 12;
        height = `${ft}'${inch}"`;
      }
    }
  }

  const data: AamvaData = {
    firstName: firstName || undefined,
    middleName,
    lastName: lastName || undefined,
    dateOfBirth: toDate(dobRaw),
    issueDate: toDate(issueRaw),
    expirationDate: toDate(expRaw),
    city: cityLine || undefined,
    streetAddress: addr1Line || undefined,
    stateUs: /^[A-Z]{2}$/.test(lines[stateIdx]) ? lines[stateIdx] : undefined,
    zipcode: zipLine ? zipLine.replace(/\D/g,'').slice(0,5) : undefined,
    sex: lines.find(l => /^[MFX]$/.test(l)) || undefined,
    height
  };

  if (!data.firstName || !data.lastName || !data.dateOfBirth) return null;
  return data;
}

// UPDATED fallback parser for non-ANSI line-based licenses (like your sample)
function parseSimpleLinesFallback(raw: string): AamvaData | null {
  const lines = raw
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.trim());

  if (lines.length < 8) return null;

  const stateIdx = lines.findIndex(l => /^[A-Z]{2}$/.test(l));
  if (stateIdx === -1) return null;

  const safe = (i: number) => (i >= 0 && i < lines.length ? lines[i].trim() : '');

  const state = safe(stateIdx);
  const dobRaw = safe(stateIdx + 1);
  const nameLine = safe(stateIdx + 2);
  const issueRaw = safe(stateIdx + 3);
  const expRaw = safe(stateIdx + 4);
  const cityLine = safe(stateIdx + 5);
  const addr1Line = safe(stateIdx + 6);

  // UPDATED: accept alphanumeric ID (letters allowed) and KEEP letters (no stripping).
  // Exclude the 2‑letter state line by requiring length >= 6.
  let idNumber: string | undefined;
  for (let i = 0; i < stateIdx; i++) {
    const cand = lines[i];
    if (/^[A-Z0-9]{6,}$/.test(cand)) {
      idNumber = cand; // keep as-is (e.g. S250821640300)
      break;
    }
  }

  let zipLine: string | undefined;
  for (let i = stateIdx + 5; i < lines.length; i++) {
    const l = lines[i];
    if (/^\d{5}(-?\d{4})?$/.test(l) || /^\d{9}$/.test(l)) {
      zipLine = l;
      break;
    }
  }

  const sexLine = lines.find(l => /^[MFX]$/.test(l));
  const heightLine = lines.find(l => /\b\d{2,3}\s?IN\b/i.test(l));
  const weightLine = lines.find(l => /\b\d{2,3}\s?LBS\b/i.test(l));

  const parseDate = (v: string): string | undefined => {
    const d = v.replace(/\D/g, '');
    if (d.length !== 8) return;
    if (/^(19|20)/.test(d)) return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`;
    return `${d.slice(4,8)}-${d.slice(0,2)}-${d.slice(2,4)}`;
  };

  let lastName = '', firstName = '', middleName: string | undefined;
  if (nameLine.includes(',')) {
    const parts = nameLine.split(',').map(p => p.trim()).filter(Boolean);
    lastName = parts[0] || '';
    firstName = parts[1] || '';
    middleName = parts[2];
  } else {
    const parts = nameLine.split(/\s+/);
    lastName = parts[0] || '';
    firstName = parts[1] || '';
    middleName = parts.slice(2).join(' ') || undefined;
  }

  let height: string | undefined;
  if (heightLine) {
    const m = heightLine.match(/(\d{2,3})\s?IN/i);
    if (m) {
      const inches = parseInt(m[1], 10);
      if (inches > 0) {
        const ft = Math.floor(inches / 12);
        const inch = inches % 12;
        height = `${ft}'${inch}"`;
      }
    }
  }

  const weight = weightLine ? weightLine.replace(/\D/g, '') : undefined;

  const data: AamvaData = {
    firstName: firstName || undefined,
    middleName,
    lastName: lastName || undefined,
    dateOfBirth: parseDate(dobRaw),
    issueDate: parseDate(issueRaw),
    expirationDate: parseDate(expRaw),
    city: cityLine || undefined,
    streetAddress: addr1Line || undefined,
    stateUs: /^[A-Z]{2}$/.test(state) ? state : undefined,
    zipcode: zipLine ? zipLine.replace(/\D/g, '').slice(0, 5) : undefined,
    sex: sexLine || undefined,
    height,
    idNumber,
    weight: weight || undefined
  };

  if (!data.firstName || !data.lastName || !data.dateOfBirth) return null;
  return data;
}

export function parseAamva(raw: string): AamvaData | null {
  // If original ANSI parser exists, place it here and return on success.
  if (raw.includes('ANSI ')) {
    // existing ANSI parsing block (unchanged)
    // if parsed ok -> return that object
  }
  // Fallback to simple line-based format
  const fallback = parseSimpleLinesFallback(raw);
  return fallback;
}

interface UseIdScanOptions {
  enabled: boolean;
  onAamva: (data: AamvaData, raw: string) => void;
  timingGapMs?: number;
  // optional: dedicated prefix/suffix your scanner is configured with
  prefix?: string;
  suffix?: string;
}

export function useIdScan({
  enabled,
  onAamva,
  timingGapMs = 50,
  prefix,
  suffix
}: UseIdScanOptions) {

  useScannerBase({
    enabled,
    timingGapMs,
    onScan: (raw) => {
      const parsed = parseAamva(raw);
      if (parsed) onAamva(parsed, raw);
    },
    prefix,
    suffix,
    endKey: 'Enter',
    minLength: 20
  });
}