import { Customer } from '../../domain/customer/Customer';
import { ValidationError } from '../errors';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const STATE_RE = /^[A-Z]{2}$/;

export function validateNewCustomer(input: Omit<Customer,'id'>): Omit<Customer,'id'> {
  const required: (keyof Omit<Customer,'id'>)[] = ['firstName','lastName','dateOfBirth'];
  for (const f of required) {
    if (!input[f]) throw new ValidationError(`${String(f)} is required`);
  }
  if (!DATE_RE.test(input.dateOfBirth)) throw new ValidationError('dateOfBirth must be YYYY-MM-DD');
  if (input.email && !EMAIL_RE.test(input.email)) throw new ValidationError('email invalid');
  if (input.stateUs && !STATE_RE.test(input.stateUs)) throw new ValidationError('stateUs invalid');
  return sanitizeCustomer(input);
}

export function sanitizeCustomer<T extends Partial<Customer>>(c: T): T {
  const trim = (v: any) => typeof v === 'string' ? v.trim() : v;
  const out: any = { ...c };
  for (const k of Object.keys(out)) out[k] = trim(out[k]);
  if (out.email) out.email = out.email.toLowerCase();
  return out;
}
