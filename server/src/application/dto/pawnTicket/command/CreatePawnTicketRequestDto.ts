import { z } from 'zod';

export const pawnTransactionTypeSchema = z.enum(['PAWN', 'PURCHASE']);

export const createPawnTicketRequestSchema = z
  .object({
    customerId: z.string().uuid(),
    transactionType: pawnTransactionTypeSchema,

    // For PAWN
    amountFinanced: z.number().nonnegative().nullable().optional(),

    // For PURCHASE
    purchaseTradeValue: z.number().nonnegative().nullable().optional(),

    // Dates as strings (expect ISO or 'YYYY-MM-DD' from UI)
    transactionDate: z.string().min(1),
    maturityDate: z.string().min(1),
    defaultDate: z.string().min(1),

    // At least one item
    itemIds: z.array(z.string().uuid()).min(1)
  })
  .superRefine((val, ctx) => {
    if (val.transactionType === 'PAWN') {
      if (val.amountFinanced == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'amountFinanced is required for PAWN transactions',
          path: ['amountFinanced']
        });
      }
      if (val.purchaseTradeValue != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'purchaseTradeValue must be null for PAWN transactions',
          path: ['purchaseTradeValue']
        });
      }
    }

    if (val.transactionType === 'PURCHASE') {
      if (val.purchaseTradeValue == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'purchaseTradeValue is required for PURCHASE transactions',
          path: ['purchaseTradeValue']
        });
      }
      if (val.amountFinanced != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'amountFinanced must be null for PURCHASE transactions',
          path: ['amountFinanced']
        });
      }
    }
  });

export type CreatePawnTicketRequestDto = z.infer<
  typeof createPawnTicketRequestSchema
>;
