"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePawnTicketUseCase = void 0;
const errors_1 = require("../../errors");
class CreatePawnTicketUseCase {
    constructor(repo, createInventoryItem) {
        this.repo = repo;
        this.createInventoryItem = createInventoryItem;
    }
    async execute(input) {
        if (!input.customerId)
            throw new errors_1.ValidationError('customerId required');
        const hasProvidedIds = Array.isArray(input.inventoryItemIds) && input.inventoryItemIds.length > 0;
        const hasNewItems = Array.isArray(input.newInventoryItems) && input.newInventoryItems.length > 0;
        if (!hasProvidedIds && !hasNewItems)
            throw new errors_1.ValidationError('at least one inventory item required');
        // Determine inventory item IDs: either provided or created from newInventoryItems
        let inventoryIds = [];
        if (Array.isArray(input.newInventoryItems) && input.newInventoryItems.length) {
            if (!input.controlNumber)
                throw new errors_1.ValidationError('controlNumber required when creating new inventory items');
            // auto-generate inventory numbers based on control number and order
            const base = input.controlNumber.trim();
            const created = [];
            for (let i = 0; i < input.newInventoryItems.length; i++) {
                const dto = {
                    ...input.newInventoryItems[i],
                    status: 'in_pawn',
                    inventoryNumber: `${base}-${i + 1}`,
                };
                if (!dto.categoryId)
                    throw new errors_1.ValidationError('categoryId required for new inventory item');
                const id = await this.createInventoryItem.execute(dto, { forceInPawn: true });
                created.push(id);
            }
            inventoryIds = created;
        }
        else {
            if (!Array.isArray(input.inventoryItemIds) || input.inventoryItemIds.length === 0)
                throw new errors_1.ValidationError('inventoryItemIds required');
            inventoryIds = input.inventoryItemIds;
        }
        input.inventoryItemIds = inventoryIds; // ensure passed to repo
        if (input.type === 'PAWN') {
            if (typeof input.amountFinanced !== 'number' || input.amountFinanced <= 0)
                throw new errors_1.ValidationError('amountFinanced required');
            if (input.periodicRate !== undefined && (input.periodicRate < 0.10 || input.periodicRate > 0.25))
                throw new errors_1.ValidationError('periodicRate out of range');
        }
        else if (input.type === 'PURCHASE') {
            if (typeof input.purchaseTradeValue !== 'number' || input.purchaseTradeValue <= 0)
                throw new errors_1.ValidationError('purchaseTradeValue required');
        }
        else {
            throw new errors_1.ValidationError('invalid type');
        }
        return this.repo.create(input);
    }
}
exports.CreatePawnTicketUseCase = CreatePawnTicketUseCase;
