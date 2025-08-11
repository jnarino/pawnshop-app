// src/app/feature/customer/types.ts
import { z } from "zod";

/**
 * 1️⃣ API DTO type (matches backend field names exactly)
 */
export type CustomerDTO = {
    id: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    suffix?: string | null;
    date_of_birth: string; // ISO date
    sex?: string | null;
    eye_color?: string | null;
    height?: string | null;
    street_address: string;
    city: string;
    state_us: string;
    zipcode: string;
    id_number: string;
    issue_date: string;
    expiration_date: string;
    issuing_state: string;
    phone: string;
    email?: string | null;
};

/**
 * 2️⃣ Domain type (frontend preferred camelCase)
 */
export type Customer = {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    suffix?: string | null;
    dateOfBirth: string;
    sex?: string | null;
    eyeColor?: string | null;
    height?: string | null;
    streetAddress: string;
    city: string;
    stateUs: string;
    zipcode: string;
    idNumber: string;
    issueDate: string;
    expirationDate: string;
    issuingState: string;
    phone: string;
    email?: string | null;
};

/**
 * 3️⃣ Zod schema for runtime validation (matches DTO)
 */
export const CustomerDTOSchema = z.object({
    id: z.string(),
    first_name: z.string(),
    middle_name: z.string().nullable().optional(),
    last_name: z.string(),
    suffix: z.string().nullable().optional(),
    date_of_birth: z.string(),
    sex: z.string().nullable().optional(),
    eye_color: z.string().nullable().optional(),
    height: z.string().nullable().optional(),
    street_address: z.string(),
    city: z.string(),
    state_us: z.string(),
    zipcode: z.string(),
    id_number: z.string(),
    issue_date: z.string(),
    expiration_date: z.string(),
    issuing_state: z.string(),
    phone: z.string(),
    email: z.string().nullable().optional(),
});

/**
 * 4️⃣ Mapper function — validates & converts snake_case → camelCase
 */
export const toCustomer = (dto: CustomerDTO): Customer => {
    const valid = CustomerDTOSchema.parse(dto); // throws if invalid

    return {
        id: valid.id,
        firstName: valid.first_name,
        middleName: valid.middle_name,
        lastName: valid.last_name,
        suffix: valid.suffix,
        dateOfBirth: valid.date_of_birth,
        sex: valid.sex,
        eyeColor: valid.eye_color,
        height: valid.height,
        streetAddress: valid.street_address,
        city: valid.city,
        stateUs: valid.state_us,
        zipcode: valid.zipcode,
        idNumber: valid.id_number,
        issueDate: valid.issue_date,
        expirationDate: valid.expiration_date,
        issuingState: valid.issuing_state,
        phone: valid.phone,
        email: valid.email,
    };
};

/**
 * 5️⃣ Optional: bulk mapper
 */
export const toCustomers = (dtos: CustomerDTO[]): Customer[] =>
    dtos.map(toCustomer);
