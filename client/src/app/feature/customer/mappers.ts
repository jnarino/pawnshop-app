import type { Customer as CustomerDto } from './types';

// UI form model (kept internal to the feature)
export interface CustomerRecord {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: string;
  height?: string; // e.g. 5'11"
  streetAddress?: string;
  city?: string;
  stateUs?: string;
  zipcode?: string;
  phone?: string;
  email?: string;
  hairColor?: string;
  eyeColor?: string;
  race?: string;
  country?: string;
  weight?: string;
  ssNumber?: string;
  idNumber?: string;
  issueDate?: string;
  expirationDate?: string;
  issuingState?: string;
}

// DTO -> UI
export function dtoToRecord(c?: CustomerDto | null): CustomerRecord {
  if (!c) return { firstName: '', lastName: '', dateOfBirth: undefined, sex: '' };
  return {
    id: c.id,
    firstName: c.firstName,
    middleName: (c as any).middleName ?? undefined,
    lastName: c.lastName,
    dateOfBirth: (c as any).dateOfBirth ?? undefined,
    sex: (c as any).sex ?? undefined,
    height: (c as any).height ?? undefined,
    streetAddress: (c as any).streetAddress ?? undefined,
    city: (c as any).city ?? undefined,
    stateUs: (c as any).stateUs ?? undefined,
    zipcode: (c as any).zipcode ?? undefined,
    phone: (c as any).phone ?? undefined,
    email: (c as any).email ?? undefined,
    hairColor: (c as any).hairColor ?? undefined,
    eyeColor: (c as any).eyeColor ?? undefined,
    race: (c as any).race ?? undefined,
    country: (c as any).country ?? undefined,
    weight: (c as any).weight ?? undefined,
    ssNumber: (c as any).ssNumber ?? undefined,
    idNumber: (c as any).idNumber ?? undefined,
    issueDate: (c as any).issueDate ?? undefined,
    expirationDate: (c as any).expirationDate ?? undefined,
    issuingState: (c as any).issuingState ?? undefined,
  };
}

// UI -> DTO
export function recordToDto(r: CustomerRecord, id?: string): CustomerDto {
  return {
    id: id ?? r.id ?? '',
    firstName: r.firstName,
    middleName: r.middleName ?? null,
    lastName: r.lastName,
    suffix: null as any,
    dateOfBirth: r.dateOfBirth ?? '',
    sex: (r.sex ?? null) as any,
    eyeColor: (r.eyeColor ?? null) as any,
    height: (r.height ?? null) as any,
    streetAddress: r.streetAddress ?? null as any,
    city: r.city ?? null as any,
    hairColor: (r.hairColor ?? null) as any,
    stateUs: r.stateUs ?? null as any,
    zipcode: r.zipcode ?? null as any,
    country: (r.country ?? null) as any,
    race: (r.race ?? null) as any,
    idNumber: (r.idNumber ?? null) as any,
    ssNumber: (r.ssNumber ?? null) as any,
    weight: (r.weight ?? null) as any,
    issueDate: r.issueDate ?? '',
    expirationDate: (r.expirationDate ?? null) as any,
    issuingState: (r.issuingState ?? null) as any,
    phone: r.phone ?? '',
    email: (r.email ?? null) as any,
  };
}

// Optional: normalize snake_case API payloads -> CustomerRecord
export function apiToRecordLoose(c: any): CustomerRecord {
  return {
    id: c.id,
    firstName: c.firstName ?? c.first_name,
    middleName: c.middleName ?? c.middle_name ?? undefined,
    lastName: c.lastName ?? c.last_name,
    dateOfBirth: c.dateOfBirth ?? c.date_of_birth,
    sex: c.sex ?? undefined,
    height: c.height ?? undefined,
    streetAddress: c.streetAddress ?? c.street_address,
    city: c.city ?? undefined,
    stateUs: c.stateUs ?? c.state_us,
    zipcode: c.zipcode ?? c.zip_code,
    phone: c.phone ?? c.phone_number,
    email: c.email ?? undefined,
    hairColor: c.hairColor ?? c.hair_color,
    eyeColor: c.eyeColor ?? c.eye_color,
    race: c.race ?? undefined,
    country: c.country ?? undefined,
    weight: c.weight ?? undefined,
    ssNumber: c.ssNumber ?? c.ss_number,
    idNumber: c.idNumber ?? c.id_number,
    issueDate: c.issueDate ?? c.id_issue_date,
    expirationDate: c.expirationDate ?? c.id_expiration,
    issuingState: c.issuing_state ?? c.issuingState,
  };
}