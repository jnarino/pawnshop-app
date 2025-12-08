import { z } from 'zod';

export const createCustomerRequestSchema = z.object({
  oldCustomerPk: z.string().optional().nullable(),
  oldCustomerId: z.string().optional().nullable(),

  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'Last name is required'),

  streetAddress: z.string().optional().nullable(),
  suiteNumber: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  stateUs: z.string().optional().nullable(),
  zipCode: z.string().optional().nullable(),

  phoneNumber: z.string().optional().nullable(),
  cellPhone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),

  height: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  hairColorId: z.string().uuid().optional().nullable(),
  eyeColorId: z.string().uuid().optional().nullable(),
  race: z.string().optional().nullable(),
  sex: z.string().optional().nullable(),
  marks: z.string().optional().nullable(),

  // Dates as strings from API, e.g. '1980-01-23'
  dateOfBirth: z.string().optional().nullable(),
  birthCity: z.string().optional().nullable(),
  birthState: z.string().optional().nullable(),
  birthCountry: z.string().optional().nullable(),

  idType: z.string().optional().nullable(),
  idNumber: z.string().optional().nullable(),
  idExpiration: z.string().optional().nullable(),
  idIssueDate: z.string().optional().nullable(),
  ssNumber: z.string().optional().nullable(),

  idAddress: z.string().optional().nullable(),
  idSuiteNumber: z.string().optional().nullable(),
  idCity: z.string().optional().nullable(),
  idState: z.string().optional().nullable(),
  idZip: z.string().optional().nullable(),

  employerName: z.string().optional().nullable(),
  employerAddress: z.string().optional().nullable(),
  employerSuiteNumber: z.string().optional().nullable(),
  employerCity: z.string().optional().nullable(),
  employerState: z.string().optional().nullable(),
  employerZip: z.string().optional().nullable(),
  employerPhoneNumber: z.string().optional().nullable(),

  description: z.string().optional().nullable(),
  fflNumber: z.string().optional().nullable(),
  locked: z.boolean().optional(),
  taxId: z.string().optional().nullable(),
  enteredAt: z.string().optional().nullable(),
  military: z.boolean().optional(),
  fflExpireDate: z.string().optional().nullable(),
  taxExempt: z.boolean().optional(),
  taxExemptCertificate: z.string().optional().nullable()
});

export type CreateCustomerRequestDto = z.infer<typeof createCustomerRequestSchema>;
