import express from 'express';
import cors from 'cors';
import { json } from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../../config/swagger.config';
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
import { PawnTicketController } from './controller/pawnTicket/PawnTicketController';
import { createPawnTicketRouter } from './route/pawnTicket/pawnTicketRoute';
import { StoreTransactionController } from './controller/storeTransaction/StoreTransactionController';
import { createStoreTransactionRouter } from './route/storeTransaction/storeTransactionRoute';

export function createExpressApp(
  deps: {
    authController: AuthController;
    appUserController: AppUserController;
    jwtSecret: string;
    customerController: CustomerController;
    inventoryItemController: InventoryItemController;
    inventoryCategoryController: InventoryCategoryController;
    pawnTicketController: PawnTicketController;
    storeTransactionController: StoreTransactionController;
  }
) {
  const app = express();

  app.use(cors());
  app.use(json());

  app.use('/health', healthRouter);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use('/api/auth', createAuthRouter(deps.authController));
  app.use('/api/app-users', createAppUserRouter(deps.appUserController, deps.jwtSecret));
  app.use('/api/customer', createCustomerRouter(deps.customerController, deps.jwtSecret));
  app.use('/api/inventory-items', createInventoryItemRouter(deps.inventoryItemController, deps.jwtSecret));
  app.use('/api/category', createInventoryCategoryRouter(deps.inventoryCategoryController, deps.jwtSecret));
  app.use('/api/pawn-ticket', createPawnTicketRouter(deps.pawnTicketController, deps.jwtSecret));
  app.use('/api/store-transaction', createStoreTransactionRouter(deps.storeTransactionController, deps.jwtSecret));

  app.use(errorMiddleware);

  return app;
}
