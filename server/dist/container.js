"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryController = exports.pawnTicketController = exports.inventoryStatusController = exports.inventoryController = exports.customerController = void 0;
const CustomerRepository_1 = require("./infrastructure/persistence/CustomerRepository");
const ListCustomersUseCase_1 = require("./application/useCase/customer/ListCustomersUseCase");
const GetCustomerUseCase_1 = require("./application/useCase/customer/GetCustomerUseCase");
const CreateCustomerUseCase_1 = require("./application/useCase/customer/CreateCustomerUseCase");
const UpdateCustomerUseCase_1 = require("./application/useCase/customer/UpdateCustomerUseCase");
const DeleteCustomerUseCase_1 = require("./application/useCase/customer/DeleteCustomerUseCase");
const customerControllerFactory_1 = require("./controller/customer/customerControllerFactory");
const InventoryRepository_1 = require("./infrastructure/persistence/InventoryRepository");
const CreateInventoryItemUseCase_1 = require("./application/useCase/inventory/CreateInventoryItemUseCase");
const DeleteInventoryItemUseCase_1 = require("./application/useCase/inventory/DeleteInventoryItemUseCase");
const GetInventoryItemUseCase_1 = require("./application/useCase/inventory/GetInventoryItemUseCase");
const ListInventoryItemsUseCase_1 = require("./application/useCase/inventory/ListInventoryItemsUseCase");
const UpdateInventoryItemUseCase_1 = require("./application/useCase/inventory/UpdateInventoryItemUseCase");
const inventoryControllerFactory_1 = require("./controller/inventory/inventoryControllerFactory");
const InventoryStatusRepository_1 = require("./infrastructure/persistence/InventoryStatusRepository");
const ListInventoryStatusesUseCase_1 = require("./application/useCase/inventory/status/ListInventoryStatusesUseCase");
const CreateInventoryStatusUseCase_1 = require("./application/useCase/inventory/status/CreateInventoryStatusUseCase");
const DeactivateInventoryStatusUseCase_1 = require("./application/useCase/inventory/status/DeactivateInventoryStatusUseCase");
const inventoryStatusControllerFactory_1 = require("./controller/inventory/inventoryStatusControllerFactory");
const PawnTicketRepository_1 = require("./infrastructure/persistence/PawnTicketRepository");
const CreatePawnTicketUseCase_1 = require("./application/useCase/pawnTicket/CreatePawnTicketUseCase");
const GetPawnTicketUseCase_1 = require("./application/useCase/pawnTicket/GetPawnTicketUseCase");
const UpdatePawnTicketDatesUseCase_1 = require("./application/useCase/pawnTicket/UpdatePawnTicketDatesUseCase");
const DeletePawnTicketUseCase_1 = require("./application/useCase/pawnTicket/DeletePawnTicketUseCase");
const pawnTicketController_1 = require("./controller/pawnTicket/pawnTicketController");
const SearchPawnTicketsUseCase_1 = require("./application/useCase/pawnTicket/SearchPawnTicketsUseCase");
const CategoryRepository_1 = require("./infrastructure/persistence/CategoryRepository");
const ListCategoriesTreeUseCase_1 = require("./application/useCase/category/ListCategoriesTreeUseCase");
const categoryControllerFactory_1 = require("./controller/category/categoryControllerFactory");
const FindAllPawnTicketsUseCase_1 = require("./application/useCase/pawnTicket/FindAllPawnTicketsUseCase");
const repo = new CustomerRepository_1.CustomerRepository();
const inventoryRepo = new InventoryRepository_1.InventoryRepository();
const statusRepo = new InventoryStatusRepository_1.InventoryStatusRepository();
const pawnTicketRepo = new PawnTicketRepository_1.PawnTicketRepository();
// Categories (same pattern as others)
const categoryRepo = new CategoryRepository_1.CategoryRepository();
exports.customerController = (0, customerControllerFactory_1.makeCustomerController)({
    list: new ListCustomersUseCase_1.ListCustomersUseCase(repo),
    get: new GetCustomerUseCase_1.GetCustomerUseCase(repo),
    create: new CreateCustomerUseCase_1.CreateCustomerUseCase(repo),
    update: new UpdateCustomerUseCase_1.UpdateCustomerUseCase(repo),
    delete: new DeleteCustomerUseCase_1.DeleteCustomerUseCase(repo),
});
exports.inventoryController = (0, inventoryControllerFactory_1.makeInventoryController)({
    list: new ListInventoryItemsUseCase_1.ListInventoryItemsUseCase(inventoryRepo),
    get: new GetInventoryItemUseCase_1.GetInventoryItemUseCase(inventoryRepo),
    create: new CreateInventoryItemUseCase_1.CreateInventoryItemUseCase(inventoryRepo),
    update: new UpdateInventoryItemUseCase_1.UpdateInventoryItemUseCase(inventoryRepo),
    delete: new DeleteInventoryItemUseCase_1.DeleteInventoryItemUseCase(inventoryRepo),
});
exports.inventoryStatusController = (0, inventoryStatusControllerFactory_1.makeInventoryStatusController)({
    list: new ListInventoryStatusesUseCase_1.ListInventoryStatusesUseCase(statusRepo),
    create: new CreateInventoryStatusUseCase_1.CreateInventoryStatusUseCase(statusRepo),
    deactivate: new DeactivateInventoryStatusUseCase_1.DeactivateInventoryStatusUseCase(statusRepo),
});
exports.pawnTicketController = (0, pawnTicketController_1.makePawnTicketController)({
    findAll: new FindAllPawnTicketsUseCase_1.FindAllPawnTicketsUseCase(pawnTicketRepo),
    create: new CreatePawnTicketUseCase_1.CreatePawnTicketUseCase(pawnTicketRepo, new CreateInventoryItemUseCase_1.CreateInventoryItemUseCase(inventoryRepo)),
    get: new GetPawnTicketUseCase_1.GetPawnTicketUseCase(pawnTicketRepo),
    updateDates: new UpdatePawnTicketDatesUseCase_1.UpdatePawnTicketDatesUseCase(pawnTicketRepo),
    delete: new DeletePawnTicketUseCase_1.DeletePawnTicketUseCase(pawnTicketRepo),
    search: new SearchPawnTicketsUseCase_1.SearchPawnTicketsUseCase(pawnTicketRepo),
});
exports.categoryController = (0, categoryControllerFactory_1.makeCategoryController)({
    tree: new ListCategoriesTreeUseCase_1.ListCategoriesTreeUseCase(categoryRepo),
});
