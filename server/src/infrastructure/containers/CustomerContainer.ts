import { CustomerRepository } from '../persistence/CustomerRepository';
import { ListCustomersUseCase } from '../../application/useCase/customer/ListCustomersUseCase';
import { GetCustomerUseCase } from '../../application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from '../../application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from '../../application/useCase/customer/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from '../../application/useCase/customer/DeleteCustomerUseCase';
import { makeCustomerController } from '../../controller/customer/customerControllerFactory';
import type { DatabaseConnectionProvider } from '../providers/DatabaseConnectionProvider';

// ✅ Single Responsibility: Manages customer domain dependencies
export class CustomerContainer {
    private readonly _repository: CustomerRepository;
    private readonly _useCases: any;
    private readonly _controller: any;

    constructor(dbProvider: DatabaseConnectionProvider) {
        this._repository = new CustomerRepository(dbProvider.getPool()); // ✅ Pass pool to constructor
        
        this._useCases = {
            list: new ListCustomersUseCase(this._repository),
            get: new GetCustomerUseCase(this._repository),
            create: new CreateCustomerUseCase(this._repository),
            update: new UpdateCustomerUseCase(this._repository),
            delete: new DeleteCustomerUseCase(this._repository),
        };

        this._controller = makeCustomerController(this._useCases);
    }

    public getRepository() { return this._repository; }
    public getUseCases() { return this._useCases; }
    public getController() { return this._controller; }
}
