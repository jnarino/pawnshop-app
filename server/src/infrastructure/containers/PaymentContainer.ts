import { CreatePawnTicketPaymentUseCase } from '../../application/useCase/payment/CreatePawnTicketPaymentUseCase';
import { makePaymentController } from '../../controller/payment/paymentController';
import type { DatabaseConnectionProvider } from '../providers/DatabaseConnectionProvider';

// ✅ Single Responsibility: Manages payment domain dependencies
export class PaymentContainer {
    private readonly _useCases: any;
    private readonly _controller: any;

    constructor(dbProvider: DatabaseConnectionProvider) {
        this._useCases = {
            createPawnTicketPayment: new CreatePawnTicketPaymentUseCase(),
        };

        this._controller = makePaymentController(this._useCases);
    }

    public getUseCases() { return this._useCases; }
    public getController() { return this._controller; }
}
