import { z } from 'zod';

// Helper to handle { id: "..." } or "..." or null input
const idTransform = z.union([
  z.string(),
  z.object({ id: z.string() }).transform(o => o.id),
  z.null()
]).optional().nullable();

// Preprocess item input to map complex objects to IDs and handle alias names
export const updatePawnTicketItemSchema = z.preprocess(
  (val: any) => {
    if (!val || typeof val !== 'object') return val;
    return {
      ...val,
      // Map 'id' in item object to 'itemId' if provided
      itemId: val.id ?? val.itemId,
      // Extract IDs from nested objects if present
      inventorySubcategoryId: val.inventorySubcategory?.id ?? val.inventorySubcategoryId,
      brand: val.brand?.id ?? val.brand, // Assumes brand matches inventory_brand_id
      colorId: val.colorId?.id ?? val.colorId,
    };
  },
  z.object({
    itemId: z.string().uuid(),
    inventorySubcategoryId: z.string().uuid().optional(), // allow string UUID
    brand: z.string().optional().nullable(),
    model: z.string().optional().nullable(),
    serialNumber: z.string().optional().nullable(),
    colorId: z.string().optional().nullable(),
    itemCondition: z.string().optional().nullable(),
    ownerMark: z.string().optional().nullable(),
    itemDescription: z.string().optional().nullable(),
    attributes: z.record(z.any()).optional().nullable(),
  })
);

export const updatePawnTicketItemsRequestSchema = z.preprocess(
  (val: any) => {
    if (!val || typeof val !== 'object') return val;
    return {
      ...val,
      // Map root 'id' to 'pawnTicketId'
      pawnTicketId: val.id ?? val.pawnTicketId
    };
  },
  z.object({
    pawnTicketId: z.string().uuid(),
    items: z.array(updatePawnTicketItemSchema).min(1),
    clerkUserId: z.string().optional(),
    // Allow extra fields from full DTO without validation errors
    customer: z.any().optional(),
    controlNumber: z.any().optional(),
    transactionType: z.any().optional(),
    clerkUsername: z.any().optional(),
    currentCharges: z.any().optional(),
    periodsBehind: z.any().optional(),
    redemptionAmount: z.any().optional(),
  })
);

export type UpdatePawnTicketItemsRequestDto = z.infer<typeof updatePawnTicketItemsRequestSchema>;
