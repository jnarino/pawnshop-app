import { pool, runMigrations } from './infrastructure/db';
import { env } from './config/env';
import { AuthService } from './application/service/AuthService';
import { ItemAttributeMapper } from './application/service/ItemAttributeMapper';
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
import { GetItemOnInventoryUseCase } from './application/use-case/inventory/query/GetItemOnInventoryUseCase';
import { CreateInventoryItemUseCase } from './application/use-case/inventory/command/CreateInventoryItemUseCase';
import { DeleteInventoryItemUseCase } from './application/use-case/inventory/command/DeleteInventoryItemUseCase';
import { UpdateInventoryItemUseCase } from './application/use-case/inventory/command/UpdateInventoryItemUseCase';

import { GetInventoryItemByInventoryNumberUseCase } from './application/use-case/inventory/query/GetInventoryItemByInventoryNumberUseCase';
import { InventoryItemController } from './interfaces/http/controller/inventory/InventoryItemController';
import { PgInventoryCategoryRepository } from './infrastructure/persistence/inventory/PgInventoryCategoryRepository';
import { InventoryCategoryController } from './interfaces/http/controller/inventory/InventoryCategoryController';
import { PgPawnTicketRepository } from './infrastructure/persistence/pawnTicket/PgPawnTicketRepository';
import { PgPawnTicketPaymentRepository } from './infrastructure/persistence/pawnTicketPayment/PgPawnTicketPaymentRepository';
import { PgPawnTicketUnitOfWork } from './infrastructure/db/PgPawnTicketUnitOfWork';
import { CreatePawnTicketWithItemsUseCase } from './application/use-case/pawnTicket/command/CreatePawnTicketWithItemsUseCase';
import { ListActivePawnTicketsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase';
import { GetPawnTicketPaymentsUseCase } from './application/use-case/pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';
import { ListPawnTicketsByControlNumberUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { PawnTicketController } from './interfaces/http/controller/pawnTicket/PawnTicketController';

import { PayPawnTicketUseCase } from './application/use-case/pawnTicket/command/PayPawnTicketUseCase';
import { GetAllInventoryAttributeTypesUseCase } from './application/use-case/inventory/query/GetAllInventoryAttributeTypesUseCase';
import { GetBrandsByCategoryRootUseCase } from './application/use-case/inventory/query/GetBrandsByCategoryRootUseCase';
import { GetInventoryAttributeValuesByTypeUseCase } from './application/use-case/inventory/query/GetInventoryAttributeValuesByTypeUseCase';
import { GetRootCategoriesUseCase } from './application/use-case/inventory/query/GetRootCategoriesUseCase';
import { GetSubCategoriesUseCase } from './application/use-case/inventory/query/GetSubCategoriesUseCase';
import { ListPawnTicketsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase';
import { ListStoreTransactionsByCustomerUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByCustomerUseCase';
import { ListStoreTransactionsByDateRangeUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByDateRangeUseCase';
import { PgControlNumberRepository } from './infrastructure/persistence/controlNumber/PgControlNumberRepository';
import { PgInventoryAttributeRepository } from './infrastructure/persistence/inventory/PgInventoryAttributeRepository';
import { PgStoreTransactionRepository } from './infrastructure/persistence/storeTransaction/PgStoreTransactionRepository';
import { InventoryAttributeController } from './interfaces/http/controller/inventory/InventoryAttributeController';
import { StoreTransactionController } from './interfaces/http/controller/storeTransaction/StoreTransactionController';
import { CreateStoreTransaction } from './application/use-case/storeTransaction/command/CreateStoreTransaction';



export async function createApp() {
  await runMigrations();

  // Repositories
  const appUserRepo = new PgAppUserRepository(pool);
  const sessionRepo = new AppUserSessionRepository(pool);
  const customerRepo = new PgCustomerRepository(pool);
  const inventoryItemRepo = new PgInventoryItemRepository(pool);
  const inventoryCategoryRepo = new PgInventoryCategoryRepository(pool);
  const inventoryAttributeRepo = new PgInventoryAttributeRepository(pool);
  const pawnTicketRepo = new PgPawnTicketRepository(pool);
  const pawnTicketPaymentRepo = new PgPawnTicketPaymentRepository(pool);
  const pawnTicketUnitOfWork = new PgPawnTicketUnitOfWork(pool);
  const storeTransactionRepo = new PgStoreTransactionRepository(pool);
  const controlNumberRepository = new PgControlNumberRepository(pool);

  // Services
  const authService = new AuthService(appUserRepo, sessionRepo, env.jwtSecret);
  const itemAttributeMapper = new ItemAttributeMapper(inventoryCategoryRepo);


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
  const createInventoryItemUseCase = new CreateInventoryItemUseCase(inventoryItemRepo, itemAttributeMapper);
  const updateInventoryItemUseCase = new UpdateInventoryItemUseCase(inventoryItemRepo);
  const deleteInventoryItemUseCase = new DeleteInventoryItemUseCase(inventoryItemRepo);
  const getInventoryItemByInventoryNumberUseCase = new GetInventoryItemByInventoryNumberUseCase(inventoryItemRepo);
  const getInventoryItemBySerialNumberUseCase = new GetInventoryItemBySerialNumberUseCase(inventoryItemRepo);
  const getItemOnInventoryUseCase = new GetItemOnInventoryUseCase(inventoryItemRepo);

  // Inventory Category use-cases 
  const getRootCategoriesUseCase = new GetRootCategoriesUseCase(inventoryCategoryRepo);
  const getBrandsByCategoryRootUseCase = new GetBrandsByCategoryRootUseCase(inventoryCategoryRepo);
  const getSubcategoriesByCategoryUseCase = new GetSubCategoriesUseCase(inventoryCategoryRepo);

  // Inventory Attribute use-cases
  const getAllInventoryAttributeTypesUseCase = new GetAllInventoryAttributeTypesUseCase(inventoryAttributeRepo);
  const getInventoryAttributeValuesByTypeUseCase = new GetInventoryAttributeValuesByTypeUseCase(inventoryAttributeRepo);


  // Pawn Ticket use-cases  
  const createPawnTicketWithItemsUseCase = new CreatePawnTicketWithItemsUseCase(pawnTicketUnitOfWork, itemAttributeMapper, controlNumberRepository);
  const listPawnTicketsByControlNumberUseCase = new ListPawnTicketsByControlNumberUseCase(pawnTicketRepo);
  const listActivePawnTicketsByCustomerUseCase = new ListActivePawnTicketsByCustomerUseCase(pawnTicketRepo);
  const listPawnTicketsByCustomerUseCase = new ListPawnTicketsByCustomerUseCase(pawnTicketRepo);
  const getPawnTicketPaymentsUseCase = new GetPawnTicketPaymentsUseCase(pawnTicketPaymentRepo);
  const getPawnTicketCurrentChargesUseCase = new (require('./application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase').GetPawnTicketCurrentChargesUseCase)(listPawnTicketsByControlNumberUseCase, getPawnTicketPaymentsUseCase);

  // Store Transaction use-cases
  const createStoreTransactionUseCase = new CreateStoreTransaction(storeTransactionRepo, inventoryItemRepo);
  const listStoreTransactionsByCustomerUseCase = new ListStoreTransactionsByCustomerUseCase(storeTransactionRepo);
  const listStoreTransactionsByDateRangeUseCase = new ListStoreTransactionsByDateRangeUseCase(storeTransactionRepo);

  // Tender Type use-cases
  const listTenderTypesUseCase = new (require('./application/use-case/tenderType/query/ListTenderTypes').ListTenderTypes)(new (require('./infrastructure/persistence/tenderType/PgTenderTypeRepository').PgTenderTypeRepository)(pool));

  // Controllers
  const authController = new AuthController(
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase
  );

  const tenderTypeController = new (require('./interfaces/http/controller/tenderType/TenderTypeController').TenderTypeController)(listTenderTypesUseCase);

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
    getInventoryItemByInventoryNumberUseCase,
    getInventoryItemBySerialNumberUseCase,
    getItemOnInventoryUseCase
  );

  const inventoryCategoryController = new InventoryCategoryController(
    getRootCategoriesUseCase,
    getSubcategoriesByCategoryUseCase,
    getBrandsByCategoryRootUseCase
  );

  const inventoryAttributeController = new InventoryAttributeController(
    getAllInventoryAttributeTypesUseCase,
    getInventoryAttributeValuesByTypeUseCase
  );

  const payPawnTicketUseCase = new PayPawnTicketUseCase(
    pawnTicketRepo,
    inventoryItemRepo,
    storeTransactionRepo,
    getPawnTicketCurrentChargesUseCase
  );

  const pawnTicketController = new PawnTicketController(
    createPawnTicketWithItemsUseCase,
    listPawnTicketsByControlNumberUseCase,
    listPawnTicketsByCustomerUseCase,
    listActivePawnTicketsByCustomerUseCase,
    getPawnTicketPaymentsUseCase,
    getPawnTicketCurrentChargesUseCase,
    payPawnTicketUseCase
  );

  const storeTransactionController = new StoreTransactionController(
    listStoreTransactionsByCustomerUseCase,
    listStoreTransactionsByDateRangeUseCase,
    createStoreTransactionUseCase
  );

  const app = createExpressApp({
    authController,
    appUserController,
    customerController,
    inventoryItemController,
    inventoryCategoryController,
    inventoryAttributeController,
    pawnTicketController,
    storeTransactionController,
    tenderTypeController,
    jwtSecret: env.jwtSecret
  });

  return app;
}
