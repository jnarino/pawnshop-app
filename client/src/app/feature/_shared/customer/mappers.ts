import type { Customer as CustomerDto } from './types';

// UI form model now mirrors full Customer domain (all fields optional except core names/date for creation flows)
export interface CustomerRecord {
  id?: string;
  // Legacy linkage
  oldCustomerPk?: string | null;
  oldCustomerId?: string | null;
  // Person
  firstName: string;
  middleName?: string | null;
  lastName: string;
  streetAddress?: string | null;
  city?: string | null;
  stateUs?: string | null;
  zipCode?: string | null;
  phoneNumber?: string | null;
  height?: string | null;
  weight?: string | null;
  hairColor?: string | null;
  eyeColor?: string | null;
  race?: string | null;
  sex?: string | null;
  marks?: string | null;
  dateOfBirth?: string | null;
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;
  // Identification
  idType?: string | null;
  idNumber?: string | null;
  idExpiration?: string | null;
  idIssueDate?: string | null;
  ssNumber?: string | null;
  idAddress?: string | null;
  idCity?: string | null;
  idState?: string | null;
  idZip?: string | null;
  // Employer
  employerName?: string | null;
  employerAddress?: string | null;
  employerCity?: string | null;
  employerState?: string | null;
  employerZip?: string | null;
  employerPhoneNumber?: string | null;
  // Misc / compliance
  description?: string | null;
  fflNumber?: string | null;
  locked?: boolean | null;
  taxId?: string | null;
  cellPhone?: string | null;
  email?: string | null;
  enteredAt?: string | null;
  military?: boolean | null;
  fflExpireDate?: string | null;
  taxExempt?: boolean | null;
  // Housekeeping
  createdAt?: string | null;
  updatedAt?: string | null;
}

// DTO -> UI
export function dtoToRecord(c?: CustomerDto | null): CustomerRecord {
  if (!c) return { firstName: '', lastName: '', dateOfBirth: undefined, sex: '' } as CustomerRecord;
  return {
    id: c.id,
    oldCustomerPk: c.oldCustomerPk ?? null,
    oldCustomerId: c.oldCustomerId ?? null,
    firstName: c.firstName,
    middleName: c.middleName ?? null,
    lastName: c.lastName,
    streetAddress: c.streetAddress ?? null,
    city: c.city ?? null,
    stateUs: c.stateUs ?? null,
    zipCode: c.zipCode ?? null,
    phoneNumber: c.phoneNumber ?? null,
    height: c.height ?? null,
    weight: c.weight ?? null,
    hairColor: c.hairColor ?? null,
    eyeColor: c.eyeColor ?? null,
    race: c.race ?? null,
    sex: c.sex ?? null,
    marks: c.marks ?? null,
    dateOfBirth: c.dateOfBirth ?? null,
    birthCity: c.birthCity ?? null,
    birthState: c.birthState ?? null,
    birthCountry: c.birthCountry ?? null,
    idType: c.idType ?? null,
    idNumber: c.idNumber ?? null,
    idExpiration: c.idExpiration ?? null,
    idIssueDate: c.idIssueDate ?? null,
    ssNumber: c.ssNumber ?? null,
    idAddress: c.idAddress ?? null,
    idCity: c.idCity ?? null,
    idState: c.idState ?? null,
    idZip: c.idZip ?? null,
    employerName: c.employerName ?? null,
    employerAddress: c.employerAddress ?? null,
    employerCity: c.employerCity ?? null,
    employerState: c.employerState ?? null,
    employerZip: c.employerZip ?? null,
    employerPhoneNumber: c.employerPhoneNumber ?? null,
    description: c.description ?? null,
    fflNumber: c.fflNumber ?? null,
    locked: c.locked ?? null,
    taxId: c.taxId ?? null,
    cellPhone: c.cellPhone ?? null,
    email: c.email ?? null,
    enteredAt: c.enteredAt ?? null,
    military: c.military ?? null,
    fflExpireDate: c.fflExpireDate ?? null,
    taxExempt: c.taxExempt ?? null,
    createdAt: c.createdAt ?? null,
    updatedAt: c.updatedAt ?? null,
  };
}

// UI -> DTO (when sending to API we only include known domain fields; omit createdAt/updatedAt if undefined)
export function recordToDto(r: CustomerRecord, id?: string): CustomerDto {
  return {
    id: id ?? r.id ?? '',
    oldCustomerPk: r.oldCustomerPk ?? null,
    oldCustomerId: r.oldCustomerId ?? null,
    firstName: r.firstName,
    middleName: r.middleName ?? null,
    lastName: r.lastName,
    streetAddress: r.streetAddress ?? null,
    city: r.city ?? null,
    stateUs: r.stateUs ?? null,
    zipCode: r.zipCode ?? null,
    phoneNumber: r.phoneNumber ?? null,
    height: r.height ?? null,
    weight: r.weight ?? null,
    hairColor: r.hairColor ?? null,
    eyeColor: r.eyeColor ?? null,
    race: r.race ?? null,
    sex: r.sex ?? null,
    marks: r.marks ?? null,
    dateOfBirth: r.dateOfBirth ?? null,
    birthCity: r.birthCity ?? null,
    birthState: r.birthState ?? null,
    birthCountry: r.birthCountry ?? null,
    idType: r.idType ?? null,
    idNumber: r.idNumber ?? null,
    idExpiration: r.idExpiration ?? null,
    idIssueDate: r.idIssueDate ?? null,
    ssNumber: r.ssNumber ?? null,
    idAddress: r.idAddress ?? null,
    idCity: r.idCity ?? null,
    idState: r.idState ?? null,
    idZip: r.idZip ?? null,
    employerName: r.employerName ?? null,
    employerAddress: r.employerAddress ?? null,
    employerCity: r.employerCity ?? null,
    employerState: r.employerState ?? null,
    employerZip: r.employerZip ?? null,
    employerPhoneNumber: r.employerPhoneNumber ?? null,
    description: r.description ?? null,
    fflNumber: r.fflNumber ?? null,
    locked: r.locked ?? false,
    taxId: r.taxId ?? null,
    cellPhone: r.cellPhone ?? null,
    email: r.email ?? null,
    enteredAt: r.enteredAt ?? null,
    military: r.military ?? false,
    fflExpireDate: r.fflExpireDate ?? null,
    taxExempt: r.taxExempt ?? false,
    createdAt: r.createdAt ?? undefined,
    updatedAt: r.updatedAt ?? undefined,
  } as CustomerDto;
}

// API snake_case or camelCase -> UI record (tolerant mapper for search results)
export function apiToRecordLoose(c: any): CustomerRecord {
  return {
    id: c.id,
    oldCustomerPk: c.oldCustomerPk ?? c.old_customer_pk ?? null,
    oldCustomerId: c.oldCustomerId ?? c.old_customer_id ?? null,
    firstName: c.firstName ?? c.first_name ?? '',
    middleName: c.middleName ?? c.middle_name ?? null,
    lastName: c.lastName ?? c.last_name ?? '',
    streetAddress: c.streetAddress ?? c.street_address ?? null,
    city: c.city ?? null,
    stateUs: c.stateUs ?? c.state_us ?? null,
    zipCode: c.zipCode ?? c.zip_code ?? null,
    phoneNumber: c.phoneNumber ?? c.phone_number ?? null,
    height: c.height ?? null,
    weight: c.weight ?? null,
    hairColor: c.hairColor ?? c.hair_color ?? null,
    eyeColor: c.eyeColor ?? c.eye_color ?? null,
    race: c.race ?? null,
    sex: c.sex ?? null,
    marks: c.marks ?? null,
    dateOfBirth: c.dateOfBirth ?? c.date_of_birth ?? null,
    birthCity: c.birthCity ?? c.birth_city ?? null,
    birthState: c.birthState ?? c.birth_state ?? null,
    birthCountry: c.birthCountry ?? c.birth_country ?? null,
    idType: c.idType ?? c.id_type ?? null,
    idNumber: c.idNumber ?? c.id_number ?? null,
    idExpiration: c.idExpiration ?? c.id_expiration ?? null,
    idIssueDate: c.idIssueDate ?? c.id_issue_date ?? null,
    ssNumber: c.ssNumber ?? c.ss_number ?? null,
    idAddress: c.idAddress ?? c.id_address ?? null,
    idCity: c.idCity ?? c.id_city ?? null,
    idState: c.idState ?? c.id_state ?? null,
    idZip: c.idZip ?? c.id_zip ?? null,
    employerName: c.employerName ?? c.employer_name ?? null,
    employerAddress: c.employerAddress ?? c.employer_address ?? null,
    employerCity: c.employerCity ?? c.employer_city ?? null,
    employerState: c.employerState ?? c.employer_state ?? null,
    employerZip: c.employerZip ?? c.employer_zip ?? null,
    employerPhoneNumber: c.employerPhoneNumber ?? c.employer_phone_number ?? null,
    description: c.description ?? null,
    fflNumber: c.fflNumber ?? c.ffl_number ?? null,
    locked: c.locked ?? null,
    taxId: c.taxId ?? c.tax_id ?? null,
    cellPhone: c.cellPhone ?? c.cell_phone ?? null,
    email: c.email ?? null,
    enteredAt: c.enteredAt ?? c.entered_at ?? null,
    military: c.military ?? null,
    fflExpireDate: c.fflExpireDate ?? c.ffl_expire_date ?? null,
    taxExempt: c.taxExempt ?? c.tax_exempt ?? null,
    createdAt: c.createdAt ?? c.created_at ?? null,
    updatedAt: c.updatedAt ?? c.updated_at ?? null,
  };
}