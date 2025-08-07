import { CustomerRepository } from './infrastructure/persistence/CustomerRepository';
import { ListCustomersUseCase } from './application/useCase/customer/ListCustomersUseCase';
import { GetCustomerUseCase } from './application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from './application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from './application/useCase/customer/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from './application/useCase/customer/DeleteCustomerUseCase';
import { makeCustomerController } from './controller/customer/customerControllerFactory';

const customerRepo = new CustomerRepository();
const listUseCase = new ListCustomersUseCase(customerRepo);
const getUseCase = new GetCustomerUseCase(customerRepo);
const createUseCase = new CreateCustomerUseCase(customerRepo);
const updateUseCase = new UpdateCustomerUseCase(customerRepo);
const deleteUseCase = new DeleteCustomerUseCase(customerRepo);

export const customerController = makeCustomerController({
    list: listUseCase,
    get: getUseCase,
    create: createUseCase,
    update: updateUseCase,
    delete: deleteUseCase,
});
