import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

import { CreateInventoryItemUseCase } from '../../../../application/use-case/inventory/command/CreateInventoryItemUseCase';
import { UpdateInventoryItemUseCase } from '../../../../application/use-case/inventory/command/UpdateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from '../../../../application/use-case/inventory/command/DeleteInventoryItemUseCase';
import { GetInventoryItemByIdUseCase } from '../../../../application/use-case/inventory/query/GetInventoryItemByIdUseCase';
import { GetInventoryItemByInventoryNumberUseCase } from '../../../../application/use-case/inventory/query/GetInventoryItemByInventoryNumberUseCase';
import { GetInventoryItemBySerialNumberUseCase } from '../../../../application/use-case/inventory/query/GetInventoryItemBySerialNumberUseCase';

export class InventoryItemController {
    constructor(
        private readonly createInventoryItemUseCase: CreateInventoryItemUseCase,
        private readonly updateInventoryItemUseCase: UpdateInventoryItemUseCase,
        private readonly deleteInventoryItemUseCase: DeleteInventoryItemUseCase,
        private readonly getInventoryItemByIdUseCase: GetInventoryItemByIdUseCase,
        private readonly getInventoryItemByInventoryNumberUseCase: GetInventoryItemByInventoryNumberUseCase,
        private readonly getInventoryItemBySerialNumberUseCase: GetInventoryItemBySerialNumberUseCase
    ) { }

    /**
     * Get full inventory item by ID.
     * GET /api/inventory-items/:id
     */
    getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getInventoryItemByIdUseCase.execute({ id: req.params.id });
            if (!result) {
                return res.status(404).json({ message: 'Inventory item not found' });
            }
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get inventory item by store-visible inventory number.
     * GET /api/inventory-items/by-inventory-number/:inventoryNumber
     */
    getByInventoryNumber = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getInventoryItemByInventoryNumberUseCase.execute({
                inventoryNumber: req.params.inventoryNumber
            });

            if (!result) {
                return res.status(404).json({ message: 'Inventory item not found' });
            }

            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get inventory item by serial number.
     * GET /api/inventory-items/by-serial-number/:serialNumber
     */
    getBySerialNumber = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getInventoryItemBySerialNumberUseCase.execute({
                serialNumber: req.params.serialNumber
            });

            if (!result) {
                return res.status(404).json({ message: 'Inventory item not found' });
            }

            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Create a new inventory item.
     * POST /api/inventory-items
     */
    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createInventoryItemUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Update an existing inventory item.
     * PUT /api/inventory-items/:id
     */
    update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const payload = { ...req.body, id: req.params.id };
            const result = await this.updateInventoryItemUseCase.execute(payload);
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Delete an inventory item (admin/manager only via route middleware).
     * DELETE /api/inventory-items/:id
     */
    remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            await this.deleteInventoryItemUseCase.execute({ id: req.params.id });
            return res.status(204).send();
        } catch (err) {
            return next(err);
        }
    };
}
