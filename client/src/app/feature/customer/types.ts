// src/app/feature/customer/types.ts
import { z } from "zod";

/**
 * 1️⃣ API DTO type (matches backend field names exactly)
 */
export type CustomerDTO = {
    id: string;
    old_customer_pk?: string | null;
    old_customer_id?: string | null;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    street_address?: string | null;
    city?: string | null;
    state_us?: string | null;
    zip_code?: string | null;
    phone_number?: string | null;
    height?: string | null;
    weight?: string | null;
    hair_color?: string | null;
    eye_color?: string | null;
    race?: string | null;
    sex?: string | null;
    marks?: string | null;
    date_of_birth?: string | null;          // ISO date
    birth_city?: string | null;
    birth_state?: string | null;
    birth_country?: string | null;
    id_type?: string | null;
    id_number?: string | null;
    id_expiration?: string | null;          // ISO date
    id_issue_date?: string | null;          // ISO date
    ss_number?: string | null;
    id_address?: string | null;
    id_city?: string | null;
    id_state?: string | null;
    id_zip?: string | null;
    employer_name?: string | null;
    employer_address?: string | null;
    employer_city?: string | null;
    employer_state?: string | null;
    employer_zip?: string | null;
    employer_phone_number?: string | null;
    description?: string | null;
    ffl_number?: string | null;
    locked?: boolean | null;
    tax_id?: string | null;
    cell_phone?: string | null;
    email?: string | null;
    entered_at?: string | null;             // timestamp
    military?: boolean | null;
    ffl_expire_date?: string | null;        // ISO date
    tax_exempt?: boolean | null;
    created_at?: string;                    // timestamp
    updated_at?: string;                    // timestamp
};

/**
 * 2️⃣ Domain type (frontend preferred camelCase)
 */
export interface Customer {
  id: string;
  oldCustomerPk?: string | null;
  oldCustomerId?: string | null;
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
  idType?: string | null;
  idNumber?: string | null;
  idExpiration?: string | null;
  idIssueDate?: string | null;
  ssNumber?: string | null;
  idAddress?: string | null;
  idCity?: string | null;
  idState?: string | null;
  idZip?: string | null;
  employerName?: string | null;
  employerAddress?: string | null;
  employerCity?: string | null;
  employerState?: string | null;
  employerZip?: string | null;
  employerPhoneNumber?: string | null;
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
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 3️⃣ Zod schema for runtime validation (matches DTO)
 */
export const CustomerDTOSchema = z.object({
    id: z.string(),
    old_customer_pk: z.string().nullable().optional(),
    old_customer_id: z.string().nullable().optional(),
    first_name: z.string(),
    middle_name: z.string().nullable().optional(),
    last_name: z.string(),
    street_address: z.string().nullable().optional(),
    city: z.string().nullable().optional(),
    state_us: z.string().nullable().optional(),
    zip_code: z.string().nullable().optional(),
    phone_number: z.string().nullable().optional(),
    height: z.string().nullable().optional(),
    weight: z.string().nullable().optional(),
    hair_color: z.string().nullable().optional(),
    eye_color: z.string().nullable().optional(),
    race: z.string().nullable().optional(),
    sex: z.string().nullable().optional(),
    marks: z.string().nullable().optional(),
    date_of_birth: z.string().nullable().optional(),
    birth_city: z.string().nullable().optional(),
    birth_state: z.string().nullable().optional(),
    birth_country: z.string().nullable().optional(),
    id_type: z.string().nullable().optional(),
    id_number: z.string().nullable().optional(),
    id_expiration: z.string().nullable().optional(),
    id_issue_date: z.string().nullable().optional(),
    ss_number: z.string().nullable().optional(),
    id_address: z.string().nullable().optional(),
    id_city: z.string().nullable().optional(),
    id_state: z.string().nullable().optional(),
    id_zip: z.string().nullable().optional(),
    employer_name: z.string().nullable().optional(),
    employer_address: z.string().nullable().optional(),
    employer_city: z.string().nullable().optional(),
    employer_state: z.string().nullable().optional(),
    employer_zip: z.string().nullable().optional(),
    employer_phone_number: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    ffl_number: z.string().nullable().optional(),
    locked: z.boolean().nullable().optional(),
    tax_id: z.string().nullable().optional(),
    cell_phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    entered_at: z.string().nullable().optional(),
    military: z.boolean().nullable().optional(),
    ffl_expire_date: z.string().nullable().optional(),
    tax_exempt: z.boolean().nullable().optional(),
    created_at: z.string().nullable().optional(),
    updated_at: z.string().nullable().optional(),
});

/**
 * 4️⃣ Mapper function — validates & converts snake_case → camelCase
 */
export const toCustomer = (dto: CustomerDTO): Customer => {
    const d = CustomerDTOSchema.parse(dto); // throws if invalid

    return {
        id: d.id,
        oldCustomerPk: d.old_customer_pk ?? null,
        oldCustomerId: d.old_customer_id ?? null,
        firstName: d.first_name,
        middleName: d.middle_name ?? null,
        lastName: d.last_name,
        streetAddress: d.street_address ?? null,
        city: d.city ?? null,
        stateUs: d.state_us ?? null,
        zipCode: d.zip_code ?? null,
        phoneNumber: d.phone_number ?? null,
        height: d.height ?? null,
        weight: d.weight ?? null,
        hairColor: d.hair_color ?? null,
        eyeColor: d.eye_color ?? null,
        race: d.race ?? null,
        sex: d.sex ?? null,
        marks: d.marks ?? null,
        dateOfBirth: d.date_of_birth ?? null,
        birthCity: d.birth_city ?? null,
        birthState: d.birth_state ?? null,
        birthCountry: d.birth_country ?? null,
        idType: d.id_type ?? null,
        idNumber: d.id_number ?? null,
        idExpiration: d.id_expiration ?? null,
        idIssueDate: d.id_issue_date ?? null,
        ssNumber: d.ss_number ?? null,
        idAddress: d.id_address ?? null,
        idCity: d.id_city ?? null,
        idState: d.id_state ?? null,
        idZip: d.id_zip ?? null,
        employerName: d.employer_name ?? null,
        employerAddress: d.employer_address ?? null,
        employerCity: d.employer_city ?? null,
        employerState: d.employer_state ?? null,
        employerZip: d.employer_zip ?? null,
        employerPhoneNumber: d.employer_phone_number ?? null,
        description: d.description ?? null,
        fflNumber: d.ffl_number ?? null,
        locked: d.locked ?? null,
        taxId: d.tax_id ?? null,
        cellPhone: d.cell_phone ?? null,
        email: d.email ?? null,
        enteredAt: d.entered_at ?? null,
        military: d.military ?? null,
        fflExpireDate: d.ffl_expire_date ?? null,
        taxExempt: d.tax_exempt ?? null,
        createdAt: d.created_at ?? undefined,
        updatedAt: d.updated_at ?? undefined,
    };
};

/**
 * 5️⃣ Optional: bulk mapper
 */
export const toCustomers = (dtos: CustomerDTO[]): Customer[] => dtos.map(toCustomer);
