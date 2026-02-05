import { z } from 'zod';

export const createPoliceHoldRequestSchema = z.object({
  holdDate: z.string().datetime().optional().or(z.string()), // Allow ISO string or date string
  caseNumber: z.string().min(1),
  agency: z.string().min(1),
  jurisdiction: z.string().optional(),
  
  agentFirstName: z.string().optional(),
  agentMiddleInitial: z.string().optional(),
  agentLastName: z.string().optional(),
  badgeNumber: z.string().optional(),
  
  phoneAreaCode: z.string().optional(),
  phoneNumber: z.string().optional(),
  phoneExtension: z.string().optional(),
  
  isHold: z.boolean(),
  comment: z.string().optional(),
  
  itemIds: z.array(z.string().uuid())
});

export type CreatePoliceHoldRequestDto = z.infer<typeof createPoliceHoldRequestSchema>;
