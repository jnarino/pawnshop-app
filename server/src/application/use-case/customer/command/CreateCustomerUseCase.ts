import crypto from 'crypto';
import { Customer } from '../../../../domains/customer/Customer';
import { CustomerRepository } from '../../../../domains/customer/CustomerRepository';
import { CreateCustomerRequestDto, createCustomerRequestSchema } from '../../../dto/customer/command/CreateCustomerRequestDto';
import { CustomerResponseDto } from '../../../dto/customer/query/CustomerResponseDto';
import { toCustomerResponseDto } from '../../../mapping/customer/customerMapper';


function parseDateOrNull(value?: string | null): Date | null {
    if (!value) return null;
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
}

export class CreateCustomerUseCase {
    constructor(private readonly customerRepo: CustomerRepository) { }

    async execute(input: unknown): Promise<CustomerResponseDto> {
        const dto: CreateCustomerRequestDto = createCustomerRequestSchema.parse(input);

        const now = new Date();

        const customer = new Customer({
            id: crypto.randomUUID(), // DB will generate its own id; this one is temporary
            oldCustomerPk: dto.oldCustomerPk ?? null,
            oldCustomerId: dto.oldCustomerId ?? null,

            firstName: dto.firstName,
            middleName: dto.middleName ?? null,
            lastName: dto.lastName,

            streetAddress: dto.streetAddress ?? null,
            suiteNumber: dto.suiteNumber ?? null,
            city: dto.city ?? null,
            stateUs: dto.stateUs ?? null,
            zipCode: dto.zipCode ?? null,

            phoneNumber: dto.phoneNumber ?? null,
            cellPhone: dto.cellPhone ?? null,
            email: dto.email ?? null,

            height: dto.height ?? null,
            weight: dto.weight ?? null,
            hairColorId: dto.hairColorId ?? null,
            eyeColorId: dto.eyeColorId ?? null,
            race: dto.race ?? null,
            sex: dto.sex ?? null,
            marks: dto.marks ?? null,

            dateOfBirth: parseDateOrNull(dto.dateOfBirth) ?? new Date('1900-01-01'),
            birthCity: dto.birthCity ?? null,
            birthState: dto.birthState ?? null,
            birthCountry: dto.birthCountry ?? null,

            idType: dto.idType ?? null,
            idNumber: dto.idNumber ?? null,
            idExpiration: parseDateOrNull(dto.idExpiration ?? null),
            idIssueDate: parseDateOrNull(dto.idIssueDate ?? null),
            ssNumber: dto.ssNumber ?? null,

            idAddress: dto.idAddress ?? null,
            idSuiteNumber: dto.idSuiteNumber ?? null,
            idCity: dto.idCity ?? null,
            idState: dto.idState ?? null,
            idZip: dto.idZip ?? null,

            employerName: dto.employerName ?? null,
            employerAddress: dto.employerAddress ?? null,
            employerSuiteNumber: dto.employerSuiteNumber ?? null,
            employerCity: dto.employerCity ?? null,
            employerState: dto.employerState ?? null,
            employerZip: dto.employerZip ?? null,
            employerPhoneNumber: dto.employerPhoneNumber ?? null,

            description: dto.description ?? null,
            fflNumber: dto.fflNumber ?? null,
            locked: dto.locked ?? false,
            taxId: dto.taxId ?? null,
            enteredAt: parseDateOrNull(dto.enteredAt ?? null),
            military: dto.military ?? false,
            fflExpireDate: parseDateOrNull(dto.fflExpireDate ?? null),
            taxExempt: dto.taxExempt ?? false,
            taxExemptCertificate: dto.taxExemptCertificate ?? null,

            createdAt: now,
            updatedAt: now
        });

        const saved = await this.customerRepo.create(customer);
        return toCustomerResponseDto(saved);
    }
}
