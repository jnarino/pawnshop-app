import { pool, runMigrations } from './infrastructure/db';
import { env } from './config/env';
import { AuthService } from './application/service/AuthService';
import { CreateAppUserUseCase } from './application/use-case/appUser/command/CreateAppUserUseCase';
import { DeleteAppUserUseCase } from './application/use-case/appUser/command/DeleteAppUserUseCase';
import { UpdateAppUserUseCase } from './application/use-case/appUser/command/UpdateAppUserUseCase';
import { ListAppUserUseCase } from './application/use-case/appUser/query/ListAppUserUseCase';
import { LoginUseCase } from './application/use-case/auth/command/LoginUseCase';
import { LogoutUseCase } from './application/use-case/auth/command/LogoutUseCase';
import { RefreshTokenUseCase } from './application/use-case/auth/command/RefreshTokenUseCase';
import { CreateCustomerUseCase } from './application/use-case/customer/command/CreateCustomerUseCase';
import { DeleteCustomerUseCase } from './application/use-case/customer/command/DeleteCustomerUseCase';
import { UpdateCustomerUseCase } from './application/use-case/customer/command/UpdateCustomerUseCase';
import { FindCustomerUseCase } from './application/use-case/customer/query/FindCustomerUseCase';
import { GetCustomerByIdUseCase } from './application/use-case/customer/query/GetCustomerByIdUseCase';
import { PgAppUserRepository } from './infrastructure/persistence/appUser/PgAppUserRepository';
import { PgCustomerRepository } from './infrastructure/persistence/customer/PgCustomerRepository';
import { AppUserSessionRepository } from './infrastructure/persistence/session/AppUserSessionRepository';
import { createExpressApp } from './interfaces/http';
import { AppUserController } from './interfaces/http/controller/appUser/AppUserController';
import { AuthController } from './interfaces/http/controller/auth/AuthController';
import { CustomerController } from './interfaces/http/controller/customer/CustomerController';
import { PgInventoryItemRepository } from './infrastructure/persistence/inventory/PgInventoryItemRepository';
import { GetInventoryItemBySerialNumberUseCase } from './application/use-case/inventory/query/GetInventoryItemBySerialNumberUseCase';
import { CreateInventoryItemUseCase } from './application/use-case/inventory/command/CreateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from './application/use-case/inventory/command/DeleteInventoryItemUseCase';
import { UpdateInventoryItemUseCase } from './application/use-case/inventory/command/UpdateInventoryItemUseCase';
import { GetInventoryItemByIdUseCase } from './application/use-case/inventory/query/GetInventoryItemByIdUseCase';
import { GetInventoryItemByInventoryNumberUseCase } from './application/use-case/inventory/query/GetInventoryItemByInventoryNumberUseCase';
import { InventoryItemController } from './interfaces/http/controller/inventory/InventoryItemController';
import { PgInventoryCategoryRepository } from './infrastructure/persistence/inventory/PgInventoryCategoryRepository';
import { CreateInventoryCategoryUseCase } from './application/use-case/inventory/command/CreateInventoryCategoryUseCase';
import { GetInventoryCategoryTreeUseCase } from './application/use-case/inventory/query/GetInventoryCategoryTreeUseCase';
import { InventoryCategoryController } from './interfaces/http/controller/inventory/InventoryCategoryController';
import { PgPawnTicketRepository } from './infrastructure/persistence/pawnTicket/PgPawnTicketRepository';
import { PgPawnTicketUnitOfWork } from './infrastructure/db/PgPawnTicketUnitOfWork';
import { CreatePawnTicketWithItemsUseCase } from './application/use-case/pawnTicket/command/CreatePawnTicketWithItemsUseCase';
import { CreatePawnTicketUseCase } from './application/use-case/pawnTicket/command/CreatePawnTicketUseCase';
import { ListActivePawnTicketsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase';
import { ListPawnTicketsByControlNumberUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { PawnTicketController } from './interfaces/http/controller/pawnTicket/PawnTicketController';
import { ListPawnTicketsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase';
import { PgStoreTransactionRepository } from './infrastructure/persistence/storeTransaction/PgStoreTransactionRepository';
import { ListStoreTransactionsByDateRangeUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByDateRangeUseCase';
import { ListStoreTransactionsByCustomerUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByCustomerUseCase';
import { StoreTransactionController } from './interfaces/http/controller/storeTransaction/StoreTransactionController';



export async function createApp() {
  await runMigrations();

  // Repositories
  const appUserRepo = new PgAppUserRepository(pool);
  const sessionRepo = new AppUserSessionRepository(pool);
  const customerRepo = new PgCustomerRepository(pool);
  const inventoryItemRepo = new PgInventoryItemRepository(pool);
  const inventoryCategoryRepo = new PgInventoryCategoryRepository(pool);
  const pawnTicketRepo = new PgPawnTicketRepository(pool);
  const pawnTicketUnitOfWork = new PgPawnTicketUnitOfWork(pool);
  const storeTransactionRepo = new PgStoreTransactionRepository(pool);

  // Services
  const authService = new AuthService(appUserRepo, sessionRepo, env.jwtSecret);


  // Auth use-cases
  const loginUseCase = new LoginUseCase(authService);
  const refreshTokenUseCase = new RefreshTokenUseCase(authService);
  const logoutUseCase = new LogoutUseCase(authService);

  // AppUser use-cases
  const listAppUserUseCase = new ListAppUserUseCase(appUserRepo);
  const createAppUserUseCase = new CreateAppUserUseCase(appUserRepo);
  const updateAppUserUseCase = new UpdateAppUserUseCase(appUserRepo);
  const deleteAppUserUseCase = new DeleteAppUserUseCase(appUserRepo);

  // Customer use-cases
  const createCustomerUseCase = new CreateCustomerUseCase(customerRepo);
  const updateCustomerUseCase = new UpdateCustomerUseCase(customerRepo);
  const deleteCustomerUseCase = new DeleteCustomerUseCase(customerRepo);
  const findCustomerUseCase = new FindCustomerUseCase(customerRepo);
  const getCustomerByIdUseCase = new GetCustomerByIdUseCase(customerRepo);

  // Inventory Item use-cases
  const createInventoryItemUseCase = new CreateInventoryItemUseCase(inventoryItemRepo);
  const updateInventoryItemUseCase = new UpdateInventoryItemUseCase(inventoryItemRepo);
  const deleteInventoryItemUseCase = new DeleteInventoryItemUseCase(inventoryItemRepo);
  const getInventoryItemByIdUseCase = new GetInventoryItemByIdUseCase(inventoryItemRepo);
  const getInventoryItemByInventoryNumberUseCase = new GetInventoryItemByInventoryNumberUseCase(inventoryItemRepo);
  const getInventoryItemBySerialNumberUseCase = new GetInventoryItemBySerialNumberUseCase(inventoryItemRepo);

  // Inventory Category use-cases
  const createInventoryCategoryUseCase = new CreateInventoryCategoryUseCase(inventoryCategoryRepo);
  const getInventoryCategoryTreeUseCase = new GetInventoryCategoryTreeUseCase(inventoryCategoryRepo);

  // Pawn Ticket use-cases  
  const createPawnTicketWithItemsUseCase = new CreatePawnTicketWithItemsUseCase(pawnTicketUnitOfWork);
  const listPawnTicketsByControlNumberUseCase = new ListPawnTicketsByControlNumberUseCase(pawnTicketRepo);
  const listActivePawnTicketsByCustomerUseCase = new ListActivePawnTicketsByCustomerUseCase(pawnTicketRepo);
  const listPawnTicketsByCustomerUseCase = new ListPawnTicketsByCustomerUseCase(pawnTicketRepo);

  // Store Transaction use-cases
  const listStoreTransactionsByCustomerUseCase = new ListStoreTransactionsByCustomerUseCase(storeTransactionRepo);
  const listStoreTransactionsByDateRangeUseCase = new ListStoreTransactionsByDateRangeUseCase(storeTransactionRepo);

  // Controllers
  const authController = new AuthController(
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase
  );

  const appUserController = new AppUserController(
    listAppUserUseCase,
    createAppUserUseCase,
    updateAppUserUseCase,
    deleteAppUserUseCase
  );

  const customerController = new CustomerController(
    createCustomerUseCase,
    updateCustomerUseCase,
    deleteCustomerUseCase,
    findCustomerUseCase,
    getCustomerByIdUseCase
  );

  const inventoryItemController = new InventoryItemController(
    createInventoryItemUseCase,
    updateInventoryItemUseCase,
    deleteInventoryItemUseCase,
    getInventoryItemByIdUseCase,
    getInventoryItemByInventoryNumberUseCase,
    getInventoryItemBySerialNumberUseCase
  );

  const inventoryCategoryController = new InventoryCategoryController(
    createInventoryCategoryUseCase,
    getInventoryCategoryTreeUseCase
  );

  const pawnTicketController = new PawnTicketController(
    createPawnTicketWithItemsUseCase,
    listPawnTicketsByControlNumberUseCase,
    listPawnTicketsByCustomerUseCase,
    listActivePawnTicketsByCustomerUseCase
  );

  const storeTransactionController = new StoreTransactionController(
    listStoreTransactionsByCustomerUseCase,
    listStoreTransactionsByDateRangeUseCase
  );

  const app = createExpressApp({
    authController,
    appUserController,
    customerController,
    inventoryItemController,
    inventoryCategoryController,
    pawnTicketController,
    storeTransactionController,
    jwtSecret: env.jwtSecret
  });

  return app;
}
