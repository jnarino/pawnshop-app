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
import { InventoryStatusRepository } from './infrastructure/persistence/InventoryStatusRepository';
import { ListInventoryStatusesUseCase } from './application/useCase/inventory/status/ListInventoryStatusesUseCase';
import { CreateInventoryStatusUseCase } from './application/useCase/inventory/status/CreateInventoryStatusUseCase';
import { DeactivateInventoryStatusUseCase } from './application/useCase/inventory/status/DeactivateInventoryStatusUseCase';
import { makeInventoryStatusController } from './controller/inventory/inventoryStatusControllerFactory';
import { PawnTicketRepository } from './infrastructure/persistence/PawnTicketRepository';
import { CreatePawnTicketUseCase } from './application/useCase/pawnTicket/CreatePawnTicketUseCase';
import { GetPawnTicketUseCase } from './application/useCase/pawnTicket/GetPawnTicketUseCase';
import { UpdatePawnTicketDatesUseCase } from './application/useCase/pawnTicket/UpdatePawnTicketDatesUseCase';
import { DeletePawnTicketUseCase } from './application/useCase/pawnTicket/DeletePawnTicketUseCase';
import { makePawnTicketController } from './controller/pawnTicket/pawnTicketController';
import { SearchPawnTicketsUseCase } from './application/useCase/pawnTicket/SearchPawnTicketsUseCase';
import { CategoryRepository } from './infrastructure/persistence/CategoryRepository';
import { ListCategoriesTreeUseCase } from './application/useCase/category/ListCategoriesTreeUseCase';
import { makeCategoryController } from './controller/category/categoryControllerFactory';

const repo = new CustomerRepository();
const inventoryRepo = new InventoryRepository();
const statusRepo = new InventoryStatusRepository();
const pawnTicketRepo = new PawnTicketRepository();
// Categories (same pattern as others)
const categoryRepo = new CategoryRepository();
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

export const inventoryStatusController = makeInventoryStatusController({
    list: new ListInventoryStatusesUseCase(statusRepo),
    create: new CreateInventoryStatusUseCase(statusRepo),
    deactivate: new DeactivateInventoryStatusUseCase(statusRepo),
});

export const pawnTicketController = makePawnTicketController({
    create: new CreatePawnTicketUseCase(pawnTicketRepo, new CreateInventoryItemUseCase(inventoryRepo)),
    get: new GetPawnTicketUseCase(pawnTicketRepo),
    updateDates: new UpdatePawnTicketDatesUseCase(pawnTicketRepo),
    delete: new DeletePawnTicketUseCase(pawnTicketRepo),
    search: new SearchPawnTicketsUseCase(pawnTicketRepo),
});

export const categoryController = makeCategoryController({
    tree: new ListCategoriesTreeUseCase(categoryRepo) as any,
});
