"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerController = void 0;
const CustomerRepository_1 = require("./infrastructure/persistence/CustomerRepository");
const ListCustomersUseCase_1 = require("./application/useCase/customer/ListCustomersUseCase");
const GetCustomerUseCase_1 = require("./application/useCase/customer/GetCustomerUseCase");
const CreateCustomerUseCase_1 = require("./application/useCase/customer/CreateCustomerUseCase");
const UpdateCustomerUseCase_1 = require("./application/useCase/customer/UpdateCustomerUseCase");
const DeleteCustomerUseCase_1 = require("./application/useCase/customer/DeleteCustomerUseCase");
const customerControllerFactory_1 = require("./controller/customer/customerControllerFactory");
const repo = new CustomerRepository_1.CustomerRepository();
exports.customerController = (0, customerControllerFactory_1.makeCustomerController)({
    list: new ListCustomersUseCase_1.ListCustomersUseCase(repo),
    get: new GetCustomerUseCase_1.GetCustomerUseCase(repo),
    create: new CreateCustomerUseCase_1.CreateCustomerUseCase(repo),
    update: new UpdateCustomerUseCase_1.UpdateCustomerUseCase(repo),
    delete: new DeleteCustomerUseCase_1.DeleteCustomerUseCase(repo),
});
