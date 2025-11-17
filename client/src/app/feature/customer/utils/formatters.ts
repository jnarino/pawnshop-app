/**
 * Formats a raw phone number string into (XXX) XXX-XXXX format
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (!digits) return '';
  
  const p1 = digits.slice(0, 3);
  const p2 = digits.slice(3, 6);
  const p3 = digits.slice(6);
  
  if (digits.length <= 3) return `(${p1}`;
  if (digits.length <= 6) return `(${p1}) ${p2}`;
  return `(${p1}) ${p2}-${p3}`;
}

/**
 * Parses height string (e.g., "5'10\"") and returns separate feet and inches
 */
export function deriveHeightParts(height?: string): { feet: string; inches: string } {
  if (!height) return { feet: '', inches: '' };
  
  const ftMatch = height.match(/(\d+)'/);
  const inMatch = height.match(/'(\d{1,2})"?/);
  
  return {
    feet: ftMatch ? ftMatch[1] : '',
    inches: inMatch ? inMatch[1] : '',
  };
}

/**
 * Normalizes feet and inches into height string format (e.g., "5'10\"")
 */
export function normalizeHeight(feet: string, inches: string): string | undefined {
  const f = feet.replace(/\D/g, '').slice(0, 2);
  const i = inches.replace(/\D/g, '').slice(0, 2);
  
  if (!f && !i) return undefined;
  
  return `${f || '0'}'${i || '0'}"`;
}
