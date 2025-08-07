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
const customerRepo = new CustomerRepository_1.CustomerRepository();
const listUseCase = new ListCustomersUseCase_1.ListCustomersUseCase(customerRepo);
const getUseCase = new GetCustomerUseCase_1.GetCustomerUseCase(customerRepo);
const createUseCase = new CreateCustomerUseCase_1.CreateCustomerUseCase(customerRepo);
const updateUseCase = new UpdateCustomerUseCase_1.UpdateCustomerUseCase(customerRepo);
const deleteUseCase = new DeleteCustomerUseCase_1.DeleteCustomerUseCase(customerRepo);
exports.customerController = (0, customerControllerFactory_1.makeCustomerController)({
    list: listUseCase,
    get: getUseCase,
    create: createUseCase,
    update: updateUseCase,
    delete: deleteUseCase,
});
