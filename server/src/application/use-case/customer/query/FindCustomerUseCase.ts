import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { CustomerSummaryDto } from '../../../dto/customer/query/CustomerResponseDto';
import { FindCustomerRequestDto, findCustomerRequestSchema } from '../../../dto/customer/query/FindCustomerRequestDto';
import { toCustomerResponseDto, toCustomerSummaryDto } from '../../../mapping/customer/customerMapper';


function parseDateOrNull(value?: string): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export class FindCustomerUseCase {
    constructor(private readonly customerRepo: CustomerRepository) { }

    async execute(input: unknown): Promise<CustomerSummaryDto[]> {
        const dto: FindCustomerRequestDto = findCustomerRequestSchema.parse(input);

        const dob = parseDateOrNull(dto.dateOfBirth);


        // Normalize to uppercase before querying repository
        const criteria = {
            firstName: dto.firstName ? dto.firstName.toUpperCase() : undefined,
            lastName: dto.lastName ? dto.lastName.toUpperCase() : undefined,
            dateOfBirth: dob === null ? undefined : dob,
            idType: dto.idType ? dto.idType.toUpperCase() : undefined,
            idNumber: dto.idNumber ? dto.idNumber.toUpperCase() : undefined,
            idState: dto.idState ? dto.idState.toUpperCase() : undefined
        };

        const customers = await this.customerRepo.findCustomer(criteria);
        return customers.map(toCustomerResponseDto);
    }
}
