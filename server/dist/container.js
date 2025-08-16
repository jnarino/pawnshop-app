"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryController = exports.customerController = void 0;
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
const repo = new CustomerRepository_1.CustomerRepository();
const inventoryRepo = new InventoryRepository_1.InventoryRepository();
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
