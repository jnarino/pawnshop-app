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
// Mapping of snake_case DTO keys to camelCase Customer keys (excluding id, created/updated timestamps handled specially)
const SNAKE_TO_CAMEL: Record<string, keyof Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>> = {
  old_customer_pk: 'oldCustomerPk',
  old_customer_id: 'oldCustomerId',
  first_name: 'firstName',
  middle_name: 'middleName',
  last_name: 'lastName',
  street_address: 'streetAddress',
  city: 'city',
  state_us: 'stateUs',
  zip_code: 'zipCode',
  phone_number: 'phoneNumber',
  height: 'height',
  weight: 'weight',
  hair_color: 'hairColor',
  eye_color: 'eyeColor',
  race: 'race',
  sex: 'sex',
  marks: 'marks',
  date_of_birth: 'dateOfBirth',
  birth_city: 'birthCity',
  birth_state: 'birthState',
  birth_country: 'birthCountry',
  id_type: 'idType',
  id_number: 'idNumber',
  id_expiration: 'idExpiration',
  id_issue_date: 'idIssueDate',
  ss_number: 'ssNumber',
  id_address: 'idAddress',
  id_city: 'idCity',
  id_state: 'idState',
  id_zip: 'idZip',
  employer_name: 'employerName',
  employer_address: 'employerAddress',
  employer_city: 'employerCity',
  employer_state: 'employerState',
  employer_zip: 'employerZip',
  employer_phone_number: 'employerPhoneNumber',
  description: 'description',
  ffl_number: 'fflNumber',
  locked: 'locked',
  tax_id: 'taxId',
  cell_phone: 'cellPhone',
  email: 'email',
  entered_at: 'enteredAt',
  military: 'military',
  ffl_expire_date: 'fflExpireDate',
  tax_exempt: 'taxExempt'
};

export const toCustomer = (dto: CustomerDTO): Customer => {
  const d = CustomerDTOSchema.parse(dto); // validation
  const base: any = { id: d.id };
  for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
    const val = (d as any)[snake];
    // created/updated timestamps handled after loop, others default to null when absent
    base[camel] = val ?? null;
  }
  // Adjust createdAt/updatedAt to undefined (rather than null) when absent to match existing semantics
  base.createdAt = d.created_at ?? undefined;
  base.updatedAt = d.updated_at ?? undefined;
  return base as Customer;
};

/**
 * 5️⃣ Optional: bulk mapper
 */
export const toCustomers = (dtos: CustomerDTO[]): Customer[] => dtos.map(toCustomer);
