import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { NotFoundError } from '../../../common/errors';
import { UpdateCustomerRequestDto, updateCustomerRequestSchema } from '../../../dto/customer/command/UpdateCustomerRequestDto';
import { CustomerResponseDto } from '../../../dto/customer/query/CustomerResponseDto';
import { toCustomerResponseDto } from '../../../mapping/customer/customerMapper';


function parseDateOrNull(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export class UpdateCustomerUseCase {
    constructor(private readonly customerRepo: CustomerRepository) { }

    async execute(input: unknown): Promise<CustomerResponseDto> {
        const dto: UpdateCustomerRequestDto = updateCustomerRequestSchema.parse(input);

        // 1) Load existing aggregate
        const existing = await this.customerRepo.findById(dto.id);
        if (!existing) {
            throw new NotFoundError('Customer not found');
        }

        // 2) Mutate fields on the existing aggregate
        existing.oldCustomerPk = dto.oldCustomerPk ?? null;
        existing.oldCustomerId = dto.oldCustomerId ?? null;

        existing.firstName = dto.firstName;
        existing.middleName = dto.middleName ?? null;
        existing.lastName = dto.lastName;

        existing.streetAddress = dto.streetAddress ?? null;
        existing.suiteNumber = dto.suiteNumber ?? null;
        existing.city = dto.city ?? null;
        existing.stateUs = dto.stateUs ?? null;
        existing.zipCode = dto.zipCode ?? null;

        existing.phoneNumber = dto.phoneNumber ?? null;
        existing.cellPhone = dto.cellPhone ?? null;
        existing.email = dto.email ?? null;

        existing.height = dto.height ?? null;
        existing.weight = dto.weight ?? null;
        existing.hairColorId = dto.hairColorId ?? null;
        existing.eyeColorId = dto.eyeColorId ?? null;
        existing.race = dto.race ?? null;
        existing.sex = dto.sex ?? null;
        existing.marks = dto.marks ?? null;

        existing.dateOfBirth = parseDateOrNull(dto.dateOfBirth ?? null);
        existing.birthCity = dto.birthCity ?? null;
        existing.birthState = dto.birthState ?? null;
        existing.birthCountry = dto.birthCountry ?? null;

        existing.idType = dto.idType ?? null;
        existing.idNumber = dto.idNumber ?? null;
        existing.idExpiration = parseDateOrNull(dto.idExpiration ?? null);
        existing.idIssueDate = parseDateOrNull(dto.idIssueDate ?? null);
        existing.ssNumber = dto.ssNumber ?? null;

        existing.idAddress = dto.idAddress ?? null;
        existing.idSuiteNumber = dto.idSuiteNumber ?? null;
        existing.idCity = dto.idCity ?? null;
        existing.idState = dto.idState ?? null;
        existing.idZip = dto.idZip ?? null;

        existing.employerName = dto.employerName ?? null;
        existing.employerAddress = dto.employerAddress ?? null;
        existing.employerSuiteNumber = dto.employerSuiteNumber ?? null;
        existing.employerCity = dto.employerCity ?? null;
        existing.employerState = dto.employerState ?? null;
        existing.employerZip = dto.employerZip ?? null;
        existing.employerPhoneNumber = dto.employerPhoneNumber ?? null;

        existing.description = dto.description ?? null;
        existing.fflNumber = dto.fflNumber ?? null;
        existing.locked = dto.locked ?? false;
        existing.taxId = dto.taxId ?? null;
        existing.enteredAt = parseDateOrNull(dto.enteredAt ?? null);
        existing.military = dto.military ?? false;
        existing.fflExpireDate = parseDateOrNull(dto.fflExpireDate ?? null);
        existing.taxExempt = dto.taxExempt ?? false;
        existing.taxExemptCertificate = dto.taxExemptCertificate ?? null;

        existing.updatedAt = new Date(); // keep createdAt as-is

        // 3) Persist via repository
        const saved = await this.customerRepo.update(existing);

        // 4) Map to response DTO
        return toCustomerResponseDto(saved);
    }
}
