import { z } from 'zod';

export const pawnTransactionTypeSchema = z.enum(['PAWN', 'PURCHASE']);

export const tenderSchema = z.object({
  tenderTypeId: z.number().int().positive(), // References tender_type.id
  amount: z.number() // Can be negative for cash out to customer, positive for cash in
});

export const createPawnTicketRequestSchema = z
  .object({
  customerId: z.string().uuid(),
  transactionType: pawnTransactionTypeSchema,
  clerkUserId: z.string().uuid(), // User creating the ticket

  // For PAWN
  amountFinanced: z.number().nonnegative().nullable().optional(),
  originalPawnAmount: z.number().nonnegative().nullable().optional(),
  periodicRate: z.number().nonnegative().nullable().optional(),
  apr: z.number().nonnegative().nullable().optional(),

  // For PURCHASE
  purchaseTradeValue: z.number().nonnegative().nullable().optional(),

  // Dates as strings (expect ISO or 'YYYY-MM-DD' from UI)
  transactionDate: z.string().min(1),
  maturityDate: z.string().min(1),
  defaultDate: z.string().min(1),

  // At least one item
  itemIds: z.array(z.string().uuid()).min(1),

  // Tender information (optional, will be auto-generated if not provided)
  tenders: z.array(tenderSchema).optional(),

  // Note for the transaction
  note: z.string().optional()
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
      if (val.periodicRate == null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'periodicRate is required for PAWN transactions',
          path: ['periodicRate']
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
      if (val.originalPawnAmount != null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'originalPawnAmount must be null for PURCHASE transactions',
          path: ['originalPawnAmount']
        });
      }
    }
  });

export type CreatePawnTicketRequestDto = z.infer<
  typeof createPawnTicketRequestSchema
>;
