import { z } from 'zod';

export const createStoreTransactionTenderSchema = z.object({
    tenderTypeId: z.number().int().positive(),
    amount: z.number(),
    sequence: z.number().int().positive().optional(),
});

export const createStoreTransactionItemSchema = z.object({
    inventoryItemId: z.string().uuid().nullable().optional(),
    description: z.string().max(500).nullable().optional(),
    quantity: z.number().positive().default(1),
    lineAmount: z.number().nullable().optional(),
    lineCost: z.number().nullable().optional(),
    taxExempt: z.boolean().nullable().optional(),
    countyTaxExempt: z.boolean().nullable().optional(),
    returned: z.boolean().nullable().optional(),
    status: z.string().max(50).nullable().optional(),
    sequence: z.number().int().positive().optional(),
});

export const createStoreTransactionRequestSchema = z.object({
    // can be null for non-customer transactions
    customerId: z.string().uuid().nullable().optional(),

    // this will come from req.user.id in the controller
    clerkUserId: z.string().uuid(),

    // FK to store_transaction_type.id (SMALLINT)
    typeId: z.number().int().positive(),

    // optional, defaults to now() in use-case if missing
    occurredAt: z.string().datetime().optional(),

    amount: z.number().nullable().optional(),
    taxSales: z.number().nullable().optional(),
    stateTax: z.number().nullable().optional(),
    taxExemptUsed: z.boolean().optional().default(false),
    taxExemptCertificate: z.string().max(100).nullable().optional(),
    tenderChange: z.number().nullable().optional(),

    gunProcFee: z.number().nullable().optional(),

    note: z.string().max(1000).nullable().optional(),

    // at least one tender (e.g. CASH)
    tenders: z.array(createStoreTransactionTenderSchema).min(1),

    // items involved in this transaction (can be empty)
    items: z.array(createStoreTransactionItemSchema).optional().default([]),
});

export type CreateStoreTransactionTenderDto = z.infer<
    typeof createStoreTransactionTenderSchema
>;

export type CreateStoreTransactionItemDto = z.infer<
    typeof createStoreTransactionItemSchema
>;

export type CreateStoreTransactionRequestDto = z.infer<
    typeof createStoreTransactionRequestSchema
>;
