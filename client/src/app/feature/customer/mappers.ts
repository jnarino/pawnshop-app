import type { Customer as CustomerDto } from './types';

// UI form model updated to new naming.
export interface CustomerRecord {
  id?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  sex?: string;
  height?: string;
  streetAddress?: string;
  city?: string;
  stateUs?: string;
  zipCode?: string;        // was zipcode
  phoneNumber?: string;    // was phone
  email?: string;
  hairColor?: string;
  eyeColor?: string;
  race?: string;
  weight?: string;
  ssNumber?: string;
  idNumber?: string;
  idIssueDate?: string;    // was issueDate
  idExpiration?: string;   // was expirationDate
  idState?: string;        // was issuingState
}

// DTO -> UI
export function dtoToRecord(c?: CustomerDto | null): CustomerRecord {
  if (!c) return { firstName: '', lastName: '', dateOfBirth: undefined, sex: '' };
  return {
    id: c.id,
    firstName: c.firstName,
    middleName: c.middleName ?? undefined,
    lastName: c.lastName,
    dateOfBirth: c.dateOfBirth ?? undefined,
    sex: c.sex ?? undefined,
    height: c.height ?? undefined,
    streetAddress: c.streetAddress ?? undefined,
    city: c.city ?? undefined,
    stateUs: c.stateUs ?? undefined,
    zipCode: c.zipCode ?? undefined,
    phoneNumber: c.phoneNumber ?? undefined,
    email: c.email ?? undefined,
    hairColor: c.hairColor ?? undefined,
    eyeColor: c.eyeColor ?? undefined,
    race: c.race ?? undefined,
    weight: c.weight ?? undefined,
    ssNumber: c.ssNumber ?? undefined,
    idNumber: c.idNumber ?? undefined,
    idIssueDate: c.idIssueDate ?? undefined,
    idExpiration: c.idExpiration ?? undefined,
    idState: c.idState ?? undefined,
  };
}

// UI -> DTO
export function recordToDto(r: CustomerRecord, id?: string): CustomerDto {
  return {
    id: id ?? r.id ?? '',
    firstName: r.firstName,
    middleName: r.middleName ?? null,
    lastName: r.lastName,
    dateOfBirth: r.dateOfBirth ?? null,
    sex: r.sex ?? null,
    height: r.height ?? null,
    weight: r.weight ?? null,
    hairColor: r.hairColor ?? null,
    eyeColor: r.eyeColor ?? null,
    race: r.race ?? null,
    streetAddress: r.streetAddress ?? null,
    city: r.city ?? null,
    stateUs: r.stateUs ?? null,
    zipCode: r.zipCode ?? null,
    phoneNumber: r.phoneNumber ?? null,
    email: r.email ?? null,
    idNumber: r.idNumber ?? null,
    idIssueDate: r.idIssueDate ?? null,
    idExpiration: r.idExpiration ?? null,
    idState: r.idState ?? null,
    ssNumber: r.ssNumber ?? null,
    // unused optional fields set null
    idType: null,
    marks: null,
    birthCity: null,
    birthState: null,
    birthCountry: null,
    createdAt: undefined,
    updatedAt: undefined,
  } as CustomerDto;
}

// API snake_case -> UI record (tolerates old & new)
export function apiToRecordLoose(c: any): CustomerRecord {
  return {
    id: c.id,
    firstName: c.firstName ?? c.first_name ?? '',
    middleName: c.middleName ?? c.middle_name ?? undefined,
    lastName: c.lastName ?? c.last_name ?? '',
    dateOfBirth: c.dateOfBirth ?? c.date_of_birth ?? undefined,
    sex: c.sex ?? undefined,
    height: c.height ?? undefined,
    streetAddress: c.streetAddress ?? c.street_address ?? undefined,
    city: c.city ?? undefined,
    stateUs: c.stateUs ?? c.state_us ?? undefined,
    zipCode: c.zipCode ?? c.zip_code ?? undefined,
    phoneNumber: c.phoneNumber ?? c.phone_number ?? undefined,
    email: c.email ?? undefined,
    hairColor: c.hairColor ?? c.hair_color ?? undefined,
    eyeColor: c.eyeColor ?? c.eye_color ?? undefined,
    race: c.race ?? undefined,
    weight: c.weight ?? undefined,
    ssNumber: c.ssNumber ?? c.ss_number ?? undefined,
    idNumber: c.idNumber ?? c.id_number ?? undefined,
    idIssueDate: c.idIssueDate ?? c.id_issue_date ?? undefined,
    idExpiration: c.idExpiration ?? c.id_expiration ?? undefined,
    idState: c.idState ?? c.id_state ?? undefined,
  };
}