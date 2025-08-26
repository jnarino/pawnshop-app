"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FindCustomerByDobAndIdUseCase = void 0;
class FindCustomerByDobAndIdUseCase {
    constructor(repo) {
        this.repo = repo;
    }
    async execute(dobISO, idNumber) {
        if (!dobISO || !idNumber)
            return null;
        return this.repo.findByDobAndIdNumber(dobISO, idNumber);
    }
}
exports.FindCustomerByDobAndIdUseCase = FindCustomerByDobAndIdUseCase;
