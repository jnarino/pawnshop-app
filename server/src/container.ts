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
import { CategoryCacheService } from './infrastructure/cache/CategoryCacheService';
import { ListCategoriesTreeUseCase } from './application/useCase/category/ListCategoriesTreeUseCase';
import { pool } from './infrastructure/persistence/db';
import { FindAllPawnTicketsUseCase } from './application/useCase/pawnTicket/FindAllPawnTicketsUseCase';
import { makeCategoryController } from './controller/category/categoryControllerFactory';
import { RatePlanRepository } from './infrastructure/persistence/RatePlanRepository';
import { StoreTransactionRepository } from './infrastructure/persistence/StoreTransactionRepository';
import { GunlogRepository } from './infrastructure/persistence/GunlogRepository';
import { CreatePawnTicketPaymentUseCase } from './application/useCase/payment/CreatePawnTicketPaymentUseCase';
import { makePaymentController } from './controller/payment/paymentController';

const repo = new CustomerRepository();
const inventoryRepo = new InventoryRepository();
const statusRepo = new InventoryStatusRepository();
const pawnTicketRepo = new PawnTicketRepository();

// ✅ Add missing repository instances
const ratePlanRepo = new RatePlanRepository();
const storeTransactionRepo = new StoreTransactionRepository();
const gunlogRepo = new GunlogRepository();

// Initialize category repository and cache
const categoryRepo = new CategoryRepository(pool);
const categoryCache = new CategoryCacheService(categoryRepo);

// Initialize cache on startup
categoryCache.refreshCache().catch(err => {
    console.error('[Container] Failed to initialize category cache:', err);
});

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
    findAll: new FindAllPawnTicketsUseCase(pawnTicketRepo),
    create: new CreatePawnTicketUseCase(
        pawnTicketRepo, 
        repo, // CustomerRepository
        ratePlanRepo,
        storeTransactionRepo,
        gunlogRepo,
        new CreateInventoryItemUseCase(inventoryRepo)
    ),
    get: new GetPawnTicketUseCase(pawnTicketRepo),
    updateDates: new UpdatePawnTicketDatesUseCase(pawnTicketRepo),
    delete: new DeletePawnTicketUseCase(pawnTicketRepo),
    search: new SearchPawnTicketsUseCase(pawnTicketRepo),
});

// ✅ Add dedicated payment controller
export const paymentController = makePaymentController({
  createPawnTicketPayment: new CreatePawnTicketPaymentUseCase(),
});

export const categoryController = makeCategoryController({
    tree: new ListCategoriesTreeUseCase(categoryCache),
});

export const container = {
    customer: {
        list: new ListCustomersUseCase(repo),
        get: new GetCustomerUseCase(repo),
        create: new CreateCustomerUseCase(repo),
        update: new UpdateCustomerUseCase(repo),
        delete: new DeleteCustomerUseCase(repo),
    },
    inventory: {
        list: new ListInventoryItemsUseCase(inventoryRepo),
        get: new GetInventoryItemUseCase(inventoryRepo),
        create: new CreateInventoryItemUseCase(inventoryRepo),
        update: new UpdateInventoryItemUseCase(inventoryRepo),
        delete: new DeleteInventoryItemUseCase(inventoryRepo),
    },
    inventoryStatus: {
        list: new ListInventoryStatusesUseCase(statusRepo),
        create: new CreateInventoryStatusUseCase(statusRepo),
        deactivate: new DeactivateInventoryStatusUseCase(statusRepo),
    },
    pawnTicket: {
        findAll: new FindAllPawnTicketsUseCase(pawnTicketRepo),
        create: new CreatePawnTicketUseCase(
            pawnTicketRepo,
            repo, // CustomerRepository
            ratePlanRepo,
            storeTransactionRepo,
            gunlogRepo,
            new CreateInventoryItemUseCase(inventoryRepo)
        ),
        get: new GetPawnTicketUseCase(pawnTicketRepo),
        updateDates: new UpdatePawnTicketDatesUseCase(pawnTicketRepo),
        delete: new DeletePawnTicketUseCase(pawnTicketRepo),
        search: new SearchPawnTicketsUseCase(pawnTicketRepo),
    },
    category: {
        tree: new ListCategoriesTreeUseCase(categoryCache),
    },
};

// Export categoryCache for graceful shutdown
export { categoryCache };
