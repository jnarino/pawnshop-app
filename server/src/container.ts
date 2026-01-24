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
import { GetCustomerStatisticsUseCase } from './application/use-case/customer/query/GetCustomerStatisticsUseCase';
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
import { GetScrapInventoryNumbersUseCase } from './application/use-case/inventory/query/GetScrapInventoryNumbersUseCase';
import { InventoryItemController } from './interfaces/http/controller/inventory/InventoryItemController';
import { PgInventoryCategoryRepository } from './infrastructure/persistence/inventory/PgInventoryCategoryRepository';
import { InventoryCategoryController } from './interfaces/http/controller/inventory/InventoryCategoryController';
import { PgPawnTicketRepository } from './infrastructure/persistence/pawnTicket/PgPawnTicketRepository';
import { PgPawnTicketPaymentRepository } from './infrastructure/persistence/pawnTicketPayment/PgPawnTicketPaymentRepository';
import { PgPawnTicketUnitOfWork } from './infrastructure/db/PgPawnTicketUnitOfWork';
import { CreatePawnTicketWithItemsUseCase } from './application/use-case/pawnTicket/command/CreatePawnTicketWithItemsUseCase';
import { ListActivePawnTicketsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListActivePawnTicketsByCustomerUseCase';
import { ListPreviousItemsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListPreviousItemsByCustomerUseCase';
import { ListHistoryPawnsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListHistoryPawnsByCustomerUseCase';
import { GetPawnTicketPaymentsUseCase } from './application/use-case/pawnTicketPayment/query/GetPawnTicketPaymentsUseCase';
import { ListPawnTicketsByControlNumberUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByControlNumberUseCase';
import { PawnTicketController } from './interfaces/http/controller/pawnTicket/PawnTicketController';

import { PayPawnTicketUseCase } from './application/use-case/pawnTicket/command/PayPawnTicketUseCase';
import { PullPawnTicketItemsToInventoryUseCase } from './application/use-case/pawnTicket/command/PullPawnTicketItemsToInventoryUseCase';
import { GetAllInventoryAttributeTypesUseCase } from './application/use-case/inventory/query/GetAllInventoryAttributeTypesUseCase';
import { GetBrandsByCategoryRootUseCase } from './application/use-case/inventory/query/GetBrandsByCategoryRootUseCase';
import { GetInventoryAttributeValuesByTypeUseCase } from './application/use-case/inventory/query/GetInventoryAttributeValuesByTypeUseCase';
import { CreateInventoryAttributeValueUseCase } from './application/use-case/inventory/command/CreateInventoryAttributeValueUseCase';
import { GetRootCategoriesUseCase } from './application/use-case/inventory/query/GetRootCategoriesUseCase';
import { GetSubCategoriesUseCase } from './application/use-case/inventory/query/GetSubCategoriesUseCase';
import { CreateInventoryCategoryUseCase } from './application/use-case/inventory/command/CreateInventoryCategoryUseCase';
import { CreateInventorySubCategoryUseCase } from './application/use-case/inventory/command/CreateInventorySubCategoryUseCase';
import { CreateBrandUseCase } from './application/use-case/inventory/command/CreateBrandUseCase';
import { ListPawnTicketsByCustomerUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByCustomerUseCase';
import { ListStoreTransactionsByCustomerUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByCustomerUseCase';
import { ListStoreTransactionsByDateRangeUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByDateRangeUseCase';
import { ListPawnTicketsByDateRangeUseCase } from './application/use-case/pawnTicket/query/ListPawnTicketsByDateRangeUseCase';
import { PgControlNumberRepository } from './infrastructure/persistence/controlNumber/PgControlNumberRepository';
import { PgInventoryAttributeRepository } from './infrastructure/persistence/inventory/PgInventoryAttributeRepository';
import { PgStoreTransactionRepository } from './infrastructure/persistence/storeTransaction/PgStoreTransactionRepository';
import { InventoryAttributeController } from './interfaces/http/controller/inventory/InventoryAttributeController';
import { StoreTransactionController } from './interfaces/http/controller/storeTransaction/StoreTransactionController';
import { CreateStoreTransactionUseCase } from './application/use-case/storeTransaction/command/CreateStoreTransactionUseCase';
import { GetPawnTicketCurrentChargesUseCase } from './application/use-case/pawnTicket/query/GetPawnTicketCurrentChargesUseCase';
import { ListTenderTypesUseCase } from './application/use-case/tenderType/query/ListTenderTypesUseCase';
import { PgTenderTypeRepository } from './infrastructure/persistence/tenderType/PgTenderTypeRepository';
import { TenderTypeController } from './interfaces/http/controller/tenderType/TenderTypeController';
import { PgPoliceReportRepository } from './infrastructure/persistence/reports/police/PgPoliceReportRepository';
import { GenerateDailyPoliceReportUseCase } from './application/use-case/reports/police/query/GenerateDailyPoliceReportUseCase';
import { PoliceReportFixedWidthService } from './application/service/reports/PoliceReportFixedWidthService';
import { PoliceReportController } from './interfaces/http/controller/reports/police/PoliceReportController';
import { PgCashDrawerReportRepository } from './infrastructure/persistence/reports/cashDrawer/PgCashDrawerReportRepository';
import { GenerateCashDrawerDetailUseCase } from './application/use-case/reports/cashDrawer/query/GenerateCashDrawerDetailUseCase';
import { CashDrawerReportController } from './interfaces/http/controller/reports/cashDrawer/CashDrawerReportController';
import { RemoveCashFromMainDrawerUseCase } from './application/use-case/storeTransaction/command/RemoveCashFromMainDrawerUseCase';
import { AddMoneyToMainDrawerUseCase } from './application/use-case/storeTransaction/command/AddMoneyToMainDrawerUseCase';
import { ListBalanceCashDrawerUseCase } from './application/use-case/storeTransaction/query/ListBalanceCashDrawerUseCase';
import { CloseBalanceCashDrawerUseCase } from './application/use-case/storeTransaction/command/CloseBalanceCashDrawerUseCase';
import { ListStoreTransactionsByControlNumberUseCase } from './application/use-case/storeTransaction/query/ListStoreTransactionsByControlNumberUseCase';



import { VoidStoreTransactionUseCase } from './application/use-case/storeTransaction/command/VoidStoreTransactionUseCase';
import { PgLayawayRepository } from './infrastructure/persistence/layaway/PgLayawayRepository';
import { PgLayawayUnitOfWork } from './infrastructure/db/PgLayawayUnitOfWork'; // Added
import { CreateLayawayUseCase } from './application/use-case/layaway/command/CreateLayawayUseCase'; // Added
import { GetLayawaysUseCase } from './application/use-case/layaway/query/GetLayawaysUseCase';
import { GetLayawaysByCustomerUseCase } from './application/use-case/layaway/query/GetLayawaysByCustomerUseCase';
import { GetLayawayByTicketNumUseCase } from './application/use-case/layaway/query/GetLayawayByTicketNumUseCase';
import { GetLayawayHistoryUseCase } from './application/use-case/layaway/query/GetLayawayHistoryUseCase';
import { MakeLayawayPaymentUseCase } from './application/use-case/layaway/command/MakeLayawayPaymentUseCase';
import { VoidLayawayPaymentUseCase } from './application/use-case/layaway/command/VoidLayawayPaymentUseCase';
import { LayawayController } from './interfaces/http/controller/layaway/LayawayController';

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
  const tenderTypeRepository = new PgTenderTypeRepository(pool);
  const policeReportRepo = new PgPoliceReportRepository(pool);
  const cashDrawerReportRepo = new PgCashDrawerReportRepository(pool);
  const layawayRepo = new PgLayawayRepository(pool);
  const layawayUnitOfWork = new PgLayawayUnitOfWork(pool);

  // Services
  const authService = new AuthService(appUserRepo, sessionRepo, env.jwtSecret);
  const itemAttributeMapper = new ItemAttributeMapper(inventoryCategoryRepo);
  const policeReportFixedWidthService = new PoliceReportFixedWidthService();


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
  const getCustomerStatisticsUseCase = new GetCustomerStatisticsUseCase(customerRepo);

  // Inventory Item use-cases
  const createInventoryItemUseCase = new CreateInventoryItemUseCase(inventoryItemRepo, itemAttributeMapper);
  const updateInventoryItemUseCase = new UpdateInventoryItemUseCase(inventoryItemRepo);
  const deleteInventoryItemUseCase = new DeleteInventoryItemUseCase(inventoryItemRepo);
  const getInventoryItemByInventoryNumberUseCase = new GetInventoryItemByInventoryNumberUseCase(inventoryItemRepo);
  const getInventoryItemBySerialNumberUseCase = new GetInventoryItemBySerialNumberUseCase(inventoryItemRepo);
  const getItemOnInventoryUseCase = new GetItemOnInventoryUseCase(inventoryItemRepo);
  const getScrapInventoryNumbersUseCase = new GetScrapInventoryNumbersUseCase(inventoryItemRepo);

  // Inventory Category use-cases 
  const getRootCategoriesUseCase = new GetRootCategoriesUseCase(inventoryCategoryRepo);
  const getBrandsByCategoryRootUseCase = new GetBrandsByCategoryRootUseCase(inventoryCategoryRepo);
  const getSubcategoriesByCategoryUseCase = new GetSubCategoriesUseCase(inventoryCategoryRepo);
  const createInventoryCategoryUseCase = new CreateInventoryCategoryUseCase(inventoryCategoryRepo);
  const createInventorySubCategoryUseCase = new CreateInventorySubCategoryUseCase(inventoryCategoryRepo);
  const createBrandUseCase = new CreateBrandUseCase(inventoryCategoryRepo);

  // Inventory Attribute use-cases
  const getAllInventoryAttributeTypesUseCase = new GetAllInventoryAttributeTypesUseCase(inventoryAttributeRepo);
  const getInventoryAttributeValuesByTypeUseCase = new GetInventoryAttributeValuesByTypeUseCase(inventoryAttributeRepo);
  const createInventoryAttributeValueUseCase = new CreateInventoryAttributeValueUseCase(inventoryAttributeRepo);


  // Pawn Ticket use-cases  
  const createPawnTicketWithItemsUseCase = new CreatePawnTicketWithItemsUseCase(pawnTicketUnitOfWork, itemAttributeMapper, controlNumberRepository);
  const listPawnTicketsByControlNumberUseCase = new ListPawnTicketsByControlNumberUseCase(pawnTicketRepo);
  const getPawnTicketPaymentsUseCase = new GetPawnTicketPaymentsUseCase(pawnTicketPaymentRepo);
  const getPawnTicketCurrentChargesUseCase = new GetPawnTicketCurrentChargesUseCase(listPawnTicketsByControlNumberUseCase, getPawnTicketPaymentsUseCase)
  const listActivePawnTicketsByCustomerUseCase = new ListActivePawnTicketsByCustomerUseCase(pawnTicketRepo, getPawnTicketCurrentChargesUseCase);
  const listPawnTicketsByCustomerUseCase = new ListPawnTicketsByCustomerUseCase(pawnTicketRepo);
  const listPawnTicketsByDateRangeUseCase = new ListPawnTicketsByDateRangeUseCase(pawnTicketRepo);
  const listPreviousItemsByCustomerUseCase = new ListPreviousItemsByCustomerUseCase(pawnTicketRepo);
  const listHistoryPawnsByCustomerUseCase = new ListHistoryPawnsByCustomerUseCase(pawnTicketRepo);

  // Store Transaction use-cases
  const createStoreTransactionUseCase = new CreateStoreTransactionUseCase(storeTransactionRepo, inventoryItemRepo, customerRepo);
  const listStoreTransactionsByCustomerUseCase = new ListStoreTransactionsByCustomerUseCase(storeTransactionRepo, inventoryItemRepo);
  const listStoreTransactionsByDateRangeUseCase = new ListStoreTransactionsByDateRangeUseCase(storeTransactionRepo, inventoryItemRepo);
  const listStoreTransactionsByControlNumberUseCase = new ListStoreTransactionsByControlNumberUseCase(storeTransactionRepo, inventoryItemRepo);
  const removeCashFromMainDrawerUseCase = new RemoveCashFromMainDrawerUseCase(storeTransactionRepo);
  const addMoneyToMainDrawerUseCase = new AddMoneyToMainDrawerUseCase(storeTransactionRepo, tenderTypeRepository);
  const listBalanceCashDrawerUseCase = new ListBalanceCashDrawerUseCase(storeTransactionRepo);
  const closeBalanceCashDrawerUseCase = new CloseBalanceCashDrawerUseCase(storeTransactionRepo, tenderTypeRepository);
  const voidStoreTransactionUseCase = new VoidStoreTransactionUseCase(storeTransactionRepo, inventoryItemRepo, customerRepo);

  // Tender Type use-cases
  const listTenderTypesUseCase = new ListTenderTypesUseCase(tenderTypeRepository);

  // Police Report use-cases
  const generateDailyPoliceReportUseCase = new GenerateDailyPoliceReportUseCase(policeReportRepo, policeReportFixedWidthService);
  // Cash Drawer Report use-cases
  const generateCashDrawerDetailUseCase = new GenerateCashDrawerDetailUseCase(cashDrawerReportRepo);

  // Layaway use-cases
  const getLayawaysUseCase = new GetLayawaysUseCase(layawayRepo);
  const getLayawaysByCustomerUseCase = new GetLayawaysByCustomerUseCase(layawayRepo);
  const getLayawayByTicketNumUseCase = new GetLayawayByTicketNumUseCase(layawayRepo);
  const getLayawayHistoryUseCase = new GetLayawayHistoryUseCase(layawayRepo);
  const createLayawayUseCase = new CreateLayawayUseCase(layawayUnitOfWork, controlNumberRepository, customerRepo);
  const makeLayawayPaymentUseCase = new MakeLayawayPaymentUseCase(layawayUnitOfWork, controlNumberRepository);
  const voidLayawayPaymentUseCase = new VoidLayawayPaymentUseCase(layawayUnitOfWork, controlNumberRepository);

  // Controllers
  const authController = new AuthController(
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase
  );

  const tenderTypeController = new TenderTypeController(
    listTenderTypesUseCase
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
    getCustomerByIdUseCase,
    getCustomerStatisticsUseCase
  );

  const inventoryItemController = new InventoryItemController(
    createInventoryItemUseCase,
    updateInventoryItemUseCase,
    deleteInventoryItemUseCase,
    getInventoryItemByInventoryNumberUseCase,
    getInventoryItemBySerialNumberUseCase,
    getItemOnInventoryUseCase,
    getScrapInventoryNumbersUseCase
  );

  const inventoryCategoryController = new InventoryCategoryController(
    getRootCategoriesUseCase,
    getSubcategoriesByCategoryUseCase,
    getBrandsByCategoryRootUseCase,
    createInventoryCategoryUseCase,
    createInventorySubCategoryUseCase,
    createBrandUseCase
  );

  const inventoryAttributeController = new InventoryAttributeController(
    getAllInventoryAttributeTypesUseCase,
    getInventoryAttributeValuesByTypeUseCase,
    createInventoryAttributeValueUseCase
  );

  const payPawnTicketUseCase = new PayPawnTicketUseCase(
    pawnTicketUnitOfWork,
    getPawnTicketCurrentChargesUseCase
  );
  const pullPawnTicketItemsToInventoryUseCase = new PullPawnTicketItemsToInventoryUseCase(pawnTicketUnitOfWork);

  const pawnTicketController = new PawnTicketController(
    createPawnTicketWithItemsUseCase,
    listPawnTicketsByControlNumberUseCase,
    listPawnTicketsByCustomerUseCase,
    listActivePawnTicketsByCustomerUseCase,
    listPreviousItemsByCustomerUseCase,
    listHistoryPawnsByCustomerUseCase,
    getPawnTicketPaymentsUseCase,
    getPawnTicketCurrentChargesUseCase,
    payPawnTicketUseCase,
    listPawnTicketsByDateRangeUseCase,
    pullPawnTicketItemsToInventoryUseCase
  );

  const storeTransactionController = new StoreTransactionController(
    listStoreTransactionsByCustomerUseCase,
    listStoreTransactionsByDateRangeUseCase,
    listStoreTransactionsByControlNumberUseCase,
    createStoreTransactionUseCase,
    removeCashFromMainDrawerUseCase,
    addMoneyToMainDrawerUseCase,
    listBalanceCashDrawerUseCase,
    closeBalanceCashDrawerUseCase,
    voidStoreTransactionUseCase
  );

  const policeReportController = new PoliceReportController(
    generateDailyPoliceReportUseCase
  );
  const cashDrawerReportController = new CashDrawerReportController(
    generateCashDrawerDetailUseCase
  );

  const layawayController = new LayawayController(
    getLayawaysUseCase, 
    createLayawayUseCase, 
    getLayawaysByCustomerUseCase,
    getLayawayByTicketNumUseCase,
    makeLayawayPaymentUseCase,
    voidLayawayPaymentUseCase,
    getLayawayHistoryUseCase
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
    policeReportController,
    cashDrawerReportController,
    layawayController,
    jwtSecret: env.jwtSecret
  });

  return app;
}
