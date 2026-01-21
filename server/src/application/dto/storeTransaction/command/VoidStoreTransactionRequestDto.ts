import { z } from 'zod';

export const voidStoreTransactionRequestSchema = z.object({
  /**
   * The control number of the original transaction being voided/referenced.
   */
  controlNumber: z.string().min(1),

  /**
   * The date the void occurred. Defaults to now (EST) if omitted.
   */
  occurredAt: z.string().optional(),

  /**
   * Items to return/void.
   */
  items: z.array(z.object({
    inventoryItemId: z.string().uuid(),
    /**
     * The refund amount for this item (should be positive in DTO, converted to negative in logic, 
     * or explicit negative? User said "negative amount", but usually input is "Quantity 1, Price $10" and system handles sign. 
     * Given user instructions: "add the item ... with the negative amount", I will assume we pass the MAGNITUDE here and negate it.)
     * 
     * Wait, user said "client decided... how much to return".
     */
    price: z.number(), 
  })),

  /**
   * Tenders to refund.
   */
  tenders: z.array(z.object({
    tenderTypeId: z.number().int(),
    amount: z.number(), // Input as positive magnitude of refund? Or negative? usually positive in UI "Refund $50".
  })),
  
  note: z.string().optional()
});

export type VoidStoreTransactionRequestDto = z.infer<typeof voidStoreTransactionRequestSchema>;
