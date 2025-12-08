import { Response, NextFunction } from 'express';
import { Actor } from '../../../../application/common/Actor';
import { CreateCustomerUseCase } from '../../../../application/use-case/customer/command/CreateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../../../application/use-case/customer/command/DeleteCustomerUseCase';
import { UpdateCustomerUseCase } from '../../../../application/use-case/customer/command/UpdateCustomerUseCase';
import { GetCustomerByIdUseCase } from '../../../../application/use-case/customer/query/GetCustomerByIdUseCase';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { FindCustomerUseCase } from '../../../../application/use-case/customer/query/FindCustomerUseCase';


export class CustomerController {
    constructor(
        private readonly createCustomerUseCase: CreateCustomerUseCase,
        private readonly updateCustomerUseCase: UpdateCustomerUseCase,
        private readonly deleteCustomerUseCase: DeleteCustomerUseCase,
        private readonly findCustomerUseCase: FindCustomerUseCase,
        private readonly getCustomerByIdUseCase: GetCustomerByIdUseCase
    ) { }

    search = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const { firstName, lastName, dateOfBirth, idType, idNumber, idState } = req.query;

            const input = {
                firstName: typeof firstName === 'string' ? firstName : undefined,
                lastName: typeof lastName === 'string' ? lastName : undefined,
                dateOfBirth: typeof dateOfBirth === 'string' ? dateOfBirth : undefined,
                idType: typeof idType === 'string' ? idType : undefined,
                idNumber: typeof idNumber === 'string' ? idNumber : undefined,
                idState: typeof idState === 'string' ? idState : undefined
            };

            const result = await this.findCustomerUseCase.execute(input);
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Get full customer details by ID.
     * GET /api/customers/:id
     */
    getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.getCustomerByIdUseCase.execute({ id: req.params.id });
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Create a new customer.
     * POST /api/customers
     */
    create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const result = await this.createCustomerUseCase.execute(req.body);
            return res.status(201).json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Update an existing customer.
     * PUT /api/customers/:id
     */
    update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const payload = { ...req.body, id: req.params.id };
            const result = await this.updateCustomerUseCase.execute(payload);
            return res.json(result);
        } catch (err) {
            return next(err);
        }
    };

    /**
     * Delete a customer (admin/manager only).
     * DELETE /api/customers/:id
     */
    remove = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        try {
            const actor = this.getActor(req);
            await this.deleteCustomerUseCase.execute(actor, req.params.id);
            return res.status(204).send();
        } catch (err) {
            return next(err);
        }
    };

    // ---- helpers ----

    private getActor(req: AuthenticatedRequest): Actor {
        if (!req.user) {
            throw new Error('Missing authenticated user on request');
        }
        return {
            id: req.user.id,
            username: req.user.username,
            role: req.user.role
        };
    }
}
