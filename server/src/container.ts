import { ApplicationContainer } from './infrastructure/containers/ApplicationContainer';

// ✅ Clean exports - single source of truth
export const container = ApplicationContainer.getInstance();

// ✅ Export individual controllers for backward compatibility
export const customerController = container.customer.getController();
export const inventoryController = container.inventory.getController();
export const inventoryStatusController = container.inventory.getStatusController();
export const pawnTicketController = container.pawnTicket.getController();
export const categoryController = container.category.getController();
export const paymentController = container.payment.getController();

// ✅ Export cache for graceful shutdown
export const categoryCache = container.category.getCache();
