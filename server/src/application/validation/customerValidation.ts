import { Customer } from '../../domain/customer/Customer';
import { ValidationError } from '../errors';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
const STATE_RE = /^[A-Z]{2}$/;
const ZIP_RE = /^\d{5}(?:-\d{4})?$/;

export function validateNewCustomer(input: Omit<Customer, 'id'>): Omit<Customer, 'id'> {
  // Required (business rule: must have DOB even though DB allows null)
  const required: (keyof Omit<Customer, 'id'>)[] = ['firstName', 'lastName', 'dateOfBirth'];
  for (const f of required) {
    if (!input[f]) throw new ValidationError(`${String(f)} is required`);
  }

  // Dates
  if (input.dateOfBirth && !DATE_RE.test(input.dateOfBirth)) throw new ValidationError('dateOfBirth must be YYYY-MM-DD');
  if (input.idIssueDate && !DATE_RE.test(input.idIssueDate)) throw new ValidationError('idIssueDate must be YYYY-MM-DD');
  if (input.idExpiration && !DATE_RE.test(input.idExpiration)) throw new ValidationError('idExpiration must be YYYY-MM-DD');
  if (input.idIssueDate && input.idExpiration && input.idIssueDate > input.idExpiration) {
    throw new ValidationError('idIssueDate cannot be after idExpiration');
  }

  // Contact
  if (input.email && !EMAIL_RE.test(input.email)) throw new ValidationError('email invalid');
  if (input.stateUs && !STATE_RE.test(input.stateUs)) throw new ValidationError('stateUs invalid');
  if (input.idState && !STATE_RE.test(input.idState)) throw new ValidationError('idState invalid');
  if (input.zipCode && !ZIP_RE.test(input.zipCode)) throw new ValidationError('zipCode invalid');
  if (input.phoneNumber) {
    const digits = input.phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) throw new ValidationError('phoneNumber must have 10 digits');
  }

  return sanitizeCustomer(input);
}

export function sanitizeCustomer<T extends Partial<Customer>>(c: T): T {
  const trim = (v: any) => typeof v === 'string' ? v.trim() : v;
  const out: any = { ...c };
  for (const k of Object.keys(out)) out[k] = trim(out[k]);
  if (out.email) out.email = out.email.toLowerCase();
  // Normalize phone formatting to digits only (leave presentation formatting to UI)
  if (out.phoneNumber) out.phoneNumber = out.phoneNumber.replace(/\D/g, '');
  return out;
}
