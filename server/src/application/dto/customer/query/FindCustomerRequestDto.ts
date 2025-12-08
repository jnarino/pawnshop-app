import { z } from 'zod';

/**
 * Allowed combinations:
 * - dateOfBirth
 * - dateOfBirth + lastName
 * - lastName
 * - lastName + firstName
 * - dateOfBirth + lastName + firstName
 */
export const findCustomerRequestSchema = z
  .object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    dateOfBirth: z.string().optional(), // 'YYYY-MM-DD',

    idType: z.string().optional(),
    idNumber: z.string().optional(),
    idState: z.string().optional()
  })
  .superRefine((value, ctx) => {
    const hasDob = !!value.dateOfBirth;
    const hasLast = !!value.lastName;
    const hasFirst = !!value.firstName;

    const hasIdNumber = !!value.idNumber;
    const hasIdType = !!value.idType;
    const hasIdState = !!value.idState;

    if (hasIdNumber || hasIdType || hasIdState) {
      if (!(hasIdNumber && hasIdType && hasIdState)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'To search by ID, idType, idNumber and idState are all required.'
        });
      }
      return;
    }

    const valid =
      (hasDob && !hasLast && !hasFirst) ||
      (hasDob && hasLast && !hasFirst) ||
      (!hasDob && hasLast && !hasFirst) ||
      (!hasDob && hasLast && hasFirst) ||
      (hasDob && hasLast && hasFirst);

    if (!valid) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'Invalid search. Use DOB; DOB + last name; last name; last + first; DOB + last + first; or full ID (idType, idNumber, idState).'
      });
    }
  });

export type FindCustomerRequestDto = z.infer<typeof findCustomerRequestSchema>;
