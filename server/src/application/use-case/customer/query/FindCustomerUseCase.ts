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


        const criteria = {
            firstName: dto.firstName,
            lastName: dto.lastName,
            dateOfBirth: dob === null ? undefined : dob,
            idType: dto.idType,
            idNumber: dto.idNumber,
            idState: dto.idState
        };

        const customers = await this.customerRepo.findCustomer(criteria);
        return customers.map(toCustomerResponseDto);
    }
}
