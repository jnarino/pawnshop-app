import { CustomerRepository } from './infrastructure/persistence/CustomerRepository';
import { ListCustomersUseCase } from './application/useCase/customer/ListCustomersUseCase';
import { GetCustomerUseCase } from './application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from './application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from './application/useCase/customer/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from './application/useCase/customer/DeleteCustomerUseCase';
import { makeCustomerController } from './controller/customer/customerControllerFactory';

const repo = new CustomerRepository();
export const customerController = makeCustomerController({
    list: new ListCustomersUseCase(repo),
    get: new GetCustomerUseCase(repo),
    create: new CreateCustomerUseCase(repo),
    update: new UpdateCustomerUseCase(repo),
    delete: new DeleteCustomerUseCase(repo),
});
