"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePawnTicketDatesUseCase = void 0;
const errors_1 = require("../../errors");
class UpdatePawnTicketDatesUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(id, maturityDate, defaultDate) {
        if (!id)
            throw new errors_1.ValidationError('id required');
        if (!maturityDate && !defaultDate)
            throw new errors_1.ValidationError('no updates');
        if (maturityDate && isNaN(Date.parse(maturityDate)))
            throw new errors_1.ValidationError('invalid maturityDate');
        if (defaultDate && isNaN(Date.parse(defaultDate)))
            throw new errors_1.ValidationError('invalid defaultDate');
        return this.repo.updateDates(id, maturityDate, defaultDate);
    }
}
exports.UpdatePawnTicketDatesUseCase = UpdatePawnTicketDatesUseCase;
