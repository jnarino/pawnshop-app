import { Customer } from "../../../domains/customer/Customer";
import { CustomerResponseDto, CustomerSummaryDto } from "../../dto/customer/query/CustomerResponseDto";


function toDateOnlyOrNull(value: Date | null): string | null {
    if (!value) return null;
    return value.toISOString().substring(0, 10);
}

function toIsoOrNull(value: Date | null): string | null {
    if (!value) return null;
    return value.toISOString();
}

export function toCustomerResponseDto(customer: Customer): CustomerResponseDto {
    return {
        id: customer.id,
        oldCustomerPk: customer.oldCustomerPk,
        oldCustomerId: customer.oldCustomerId,

        firstName: customer.firstName,
        middleName: customer.middleName,
        lastName: customer.lastName,

        streetAddress: customer.streetAddress,
        suiteNumber: customer.suiteNumber,
        city: customer.city,
        stateUs: customer.stateUs,
        zipCode: customer.zipCode,

        phoneNumber: customer.phoneNumber,
        cellPhone: customer.cellPhone,
        email: customer.email,

        height: customer.height,
        weight: customer.weight,
        hairColorId: customer.hairColorId,
        eyeColorId: customer.eyeColorId,
        race: customer.race,
        sex: customer.sex,
        marks: customer.marks,

        dateOfBirth: toDateOnlyOrNull(customer.dateOfBirth),
        birthCity: customer.birthCity,
        birthState: customer.birthState,
        birthCountry: customer.birthCountry,

        idType: customer.idType,
        idNumber: customer.idNumber,
        idExpiration: toDateOnlyOrNull(customer.idExpiration),
        idIssueDate: toDateOnlyOrNull(customer.idIssueDate),
        ssNumber: customer.ssNumber,

        idAddress: customer.idAddress,
        idSuiteNumber: customer.idSuiteNumber,
        idCity: customer.idCity,
        idState: customer.idState,
        idZip: customer.idZip,

        employerName: customer.employerName,
        employerAddress: customer.employerAddress,
        employerSuiteNumber: customer.employerSuiteNumber,
        employerCity: customer.employerCity,
        employerState: customer.employerState,
        employerZip: customer.employerZip,
        employerPhoneNumber: customer.employerPhoneNumber,

        description: customer.description,
        fflNumber: customer.fflNumber,
        locked: customer.locked,
        taxId: customer.taxId,
        enteredAt: toIsoOrNull(customer.enteredAt),
        military: customer.military,
        fflExpireDate: toDateOnlyOrNull(customer.fflExpireDate),
        taxExempt: customer.taxExempt,
        taxExemptCertificate: customer.taxExemptCertificate,

        createdAt: customer.createdAt.toISOString(),
        updatedAt: customer.updatedAt.toISOString()
    };
}

export function toCustomerSummaryDto(customer: Customer): CustomerSummaryDto {
    return {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        dateOfBirth: toDateOnlyOrNull(customer.dateOfBirth),
        phoneNumber: customer.phoneNumber,
        cellPhone: customer.cellPhone
    };
}
