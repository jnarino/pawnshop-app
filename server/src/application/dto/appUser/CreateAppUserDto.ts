import { z } from 'zod';

export const createAppUserSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  firstName: z.string().min(1).max(100),
  middleName: z.string().max(100).optional().nullable(),
  lastName: z.string().min(1).max(100),
  streetAddress: z.string().max(200).optional().nullable(),
  suiteNumber: z.string().max(50).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  stateUs: z.string().max(2).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  phoneNumber: z.string().max(30).optional().nullable(),
  ssNumber: z.string().max(20).optional().nullable(),
  birthDate: z.string().optional().nullable(),      // ISO date string
  startingDate: z.string().optional().nullable(),   // ISO date string
  terminatedDate: z.string().optional().nullable(), // ISO date string
  isActive: z.boolean().optional().default(true),
  roleId: z.number().int().min(1).max(3)
});

export type CreateAppUserRequestDto = z.infer<typeof createAppUserSchema>;
