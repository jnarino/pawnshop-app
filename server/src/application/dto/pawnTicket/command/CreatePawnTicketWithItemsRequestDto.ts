import { z } from 'zod';
import { createInventoryItemRequestSchema } from '../../inventory/command/CreateInventoryItemRequestDto';

/**
 * Minimal shape for the pawn part when creating a pawn WITH items in one shot.
 *
 * We intentionally do NOT put `itemIds` here. The combined use-case will
 * compose `itemIds` and then call the normal CreatePawnTicketUseCase,
 * which will validate against the full createPawnTicketRequestSchema.
 *
 * `.passthrough()` lets extra pawn fields (amountFinanced, etc.) flow through.
 */
const pawnCoreSchema = z
  .object({
    customerId: z.string().uuid(),
    transactionType: z.enum(['PAWN', 'PURCHASE']),
  })
  .passthrough();

export const createPawnTicketWithItemsRequestSchema = z
  .object({
    pawn: pawnCoreSchema,

    // Items that will be CREATED inside the pawn transaction (REQUIRED)
    items: z.array(createInventoryItemRequestSchema).min(1),

    // Items that ALREADY exist in inventory and will just be linked (optional)
    itemIds: z.array(z.string().uuid()).optional(),
  });

export type CreatePawnTicketWithItemsRequestDto = z.infer<
  typeof createPawnTicketWithItemsRequestSchema
>;
