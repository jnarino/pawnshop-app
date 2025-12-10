
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { NotFoundError } from '../../../common/errors';
import { CustomerResponseDto } from '../../../dto/customer/query/CustomerResponseDto';
import { GetCustomerByIdRequestDto, getCustomerByIdRequestSchema } from '../../../dto/customer/query/GetCustomerByIdRequestDto';
import { toCustomerResponseDto } from '../../../mapping/customer/customerMapper';

export class GetCustomerByIdUseCase {
    constructor(private readonly customerRepo: CustomerRepository) { }

    async execute(input: unknown): Promise<CustomerResponseDto> {
        const { id }: GetCustomerByIdRequestDto =
            getCustomerByIdRequestSchema.parse(input);

        const customer = await this.customerRepo.findById(id);
        if (!customer) {
            throw new NotFoundError('Customer not found');
        }

        return toCustomerResponseDto(customer);
    }
}
