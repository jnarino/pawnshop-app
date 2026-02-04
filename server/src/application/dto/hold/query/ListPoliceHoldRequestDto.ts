import { z } from 'zod';

export const listPoliceHoldRequestSchema = z.object({
  controlNumber: z.string().optional(),
  caseNumber: z.string().optional(),
  inventoryNumber: z.string().optional(),
  jurisdiction: z.string().optional(),
  agency: z.string().optional()
});

export type ListPoliceHoldRequestDto = z.infer<typeof listPoliceHoldRequestSchema>;
