import { CustomerRepository } from './infrastructure/persistence/CustomerRepository';
import { ListCustomersUseCase } from './application/useCase/customer/ListCustomersUseCase';
import { GetCustomerUseCase } from './application/useCase/customer/GetCustomerUseCase';
import { CreateCustomerUseCase } from './application/useCase/customer/CreateCustomerUseCase';
import { UpdateCustomerUseCase } from './application/useCase/customer/UpdateCustomerUseCase';
import { DeleteCustomerUseCase } from './application/useCase/customer/DeleteCustomerUseCase';
import { makeCustomerController } from './controller/customer/customerControllerFactory';
import { InventoryRepository } from './infrastructure/persistence/InventoryRepository';
import { CreateInventoryItemUseCase } from './application/useCase/inventory/CreateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from './application/useCase/inventory/DeleteInventoryItemUseCase';
import { GetInventoryItemUseCase } from './application/useCase/inventory/GetInventoryItemUseCase';
import { ListInventoryItemsUseCase } from './application/useCase/inventory/ListInventoryItemsUseCase';
import { UpdateInventoryItemUseCase } from './application/useCase/inventory/UpdateInventoryItemUseCase';
import { makeInventoryController } from './controller/inventory/inventoryControllerFactory';


const repo = new CustomerRepository();
const inventoryRepo = new InventoryRepository();
export const customerController = makeCustomerController({
    list: new ListCustomersUseCase(repo),
    get: new GetCustomerUseCase(repo),
    create: new CreateCustomerUseCase(repo),
    update: new UpdateCustomerUseCase(repo),
    delete: new DeleteCustomerUseCase(repo),
});

export const inventoryController = makeInventoryController({
    list: new ListInventoryItemsUseCase(inventoryRepo),
    get: new GetInventoryItemUseCase(inventoryRepo),
    create: new CreateInventoryItemUseCase(inventoryRepo),
    update: new UpdateInventoryItemUseCase(inventoryRepo),
    delete: new DeleteInventoryItemUseCase(inventoryRepo),
});
