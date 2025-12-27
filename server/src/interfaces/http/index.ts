import express from 'express';
import cors from 'cors';
import { json } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from '../../config/swagger.config';
import { AuthController } from './controller/auth/AuthController';
import { AppUserController } from './controller/appUser/AppUserController';
import { createAuthRouter } from './route/auth/authRoute';
import { createAppUserRouter } from './route/appUser/appUserRoute';
import { errorMiddleware } from './middleware/errorMiddleware';
import { healthRouter } from './route/healthRoute';
import { createCustomerRouter } from './route/customer/customerRoute';
import { CustomerController } from './controller/customer/CustomerController';
import { InventoryItemController } from './controller/inventory/InventoryItemController';
import { createInventoryItemRouter } from './route/inventory/inventoryItemRoutes';
import { createInventoryCategoryRouter } from './route/inventory/inventoryCategoryRoutes';
import { InventoryCategoryController } from './controller/inventory/InventoryCategoryController';
import { createInventoryAttributeRouter } from './route/inventory/inventoryAttributeRoute';
import { InventoryAttributeController } from './controller/inventory/InventoryAttributeController';
import { PawnTicketController } from './controller/pawnTicket/PawnTicketController';
import { createPawnTicketRouter } from './route/pawnTicket/pawnTicketRoute';
import { createPawnTicketPaymentRouter } from './route/pawnTicket/pawnTicketPaymentRoute';
import { StoreTransactionController } from './controller/storeTransaction/StoreTransactionController';
import { createStoreTransactionRouter } from './route/storeTransaction/storeTransactionRoute';
import { TenderTypeController } from './controller/tenderType/TenderTypeController';
import { createTenderTypeRouter } from './route/tenderType/tenderTypeRoute';

export function createExpressApp(
  deps: {
    authController: AuthController;
    appUserController: AppUserController;
    jwtSecret: string;
    customerController: CustomerController;
    inventoryItemController: InventoryItemController;
    inventoryCategoryController: InventoryCategoryController;
    inventoryAttributeController: InventoryAttributeController;
    pawnTicketController: PawnTicketController;
    storeTransactionController: StoreTransactionController;
    tenderTypeController: TenderTypeController;
  }
) {
  const app = express();

  app.use(cors());
  app.use(json());

  app.use('/health', healthRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  app.use('/api/auth', createAuthRouter(deps.authController));
  app.use('/api/app-users', createAppUserRouter(deps.appUserController, deps.jwtSecret));
  app.use('/api/customer', createCustomerRouter(deps.customerController, deps.jwtSecret));
  app.use('/api/inventory-items', createInventoryItemRouter(deps.inventoryItemController, deps.jwtSecret));
  app.use('/api/category', createInventoryCategoryRouter(deps.inventoryCategoryController, deps.jwtSecret));
  app.use('/api/inventory/attributes', createInventoryAttributeRouter(deps.inventoryAttributeController, deps.jwtSecret));
  app.use('/api/pawn-ticket', createPawnTicketRouter(deps.pawnTicketController, deps.jwtSecret));
  app.use('/api/pawn-ticket', createPawnTicketPaymentRouter(deps.pawnTicketController, deps.jwtSecret));
  app.use('/api/sales', createStoreTransactionRouter(deps.storeTransactionController, deps.jwtSecret));
  app.use('/api/tender-types', createTenderTypeRouter(deps.tenderTypeController, deps.jwtSecret));

  app.use(errorMiddleware);

  return app;
}
