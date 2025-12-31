import { z } from 'zod';

export const generateDailyPoliceReportRequestSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export type GenerateDailyPoliceReportRequestDto = z.infer<typeof generateDailyPoliceReportRequestSchema>;
