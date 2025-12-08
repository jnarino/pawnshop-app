export class Customer {
  readonly id: string;

  // Legacy linkage
  oldCustomerPk: string | null;
  oldCustomerId: string | null;

  // Person
  firstName: string;
  middleName: string | null;
  lastName: string;
  streetAddress: string | null;
  suiteNumber: string | null;
  city: string | null;
  stateUs: string | null;
  zipCode: string | null;
  phoneNumber: string | null;
  height: string | null;
  weight: string | null;
  hairColorId: string | null;
  eyeColorId: string | null;
  race: string | null;
  sex: string | null;
  marks: string | null;
  dateOfBirth: Date | null;
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;

  // Identification
  idType: string | null;
  idNumber: string | null;
  idExpiration: Date | null;
  idIssueDate: Date | null;
  ssNumber: string | null;
  idAddress: string | null;
  idSuiteNumber: string | null;
  idCity: string | null;
  idState: string | null;
  idZip: string | null;

  // Employer
  employerName: string | null;
  employerAddress: string | null;
  employerSuiteNumber: string | null;
  employerCity: string | null;
  employerState: string | null;
  employerZip: string | null;
  employerPhoneNumber: string | null;

  // Misc / compliance
  description: string | null;
  fflNumber: string | null;
  locked: boolean;
  taxId: string | null;
  cellPhone: string | null;
  email: string | null;
  enteredAt: Date | null;
  military: boolean;
  fflExpireDate: Date | null;
  taxExempt: boolean;
  taxExemptCertificate: string | null;

  // Audit
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;

    oldCustomerPk?: string | null;
    oldCustomerId?: string | null;

    firstName: string;
    middleName?: string | null;
    lastName: string;
    streetAddress?: string | null;
    suiteNumber?: string | null;
    city?: string | null;
    stateUs?: string | null;
    zipCode?: string | null;
    phoneNumber?: string | null;
    height?: string | null;
    weight?: string | null;
    hairColorId?: string | null;
    eyeColorId?: string | null;
    race?: string | null;
    sex?: string | null;
    marks?: string | null;
    dateOfBirth?: Date | null;
    birthCity?: string | null;
    birthState?: string | null;
    birthCountry?: string | null;

    idType?: string | null;
    idNumber?: string | null;
    idExpiration?: Date | null;
    idIssueDate?: Date | null;
    ssNumber?: string | null;
    idAddress?: string | null;
    idSuiteNumber?: string | null;
    idCity?: string | null;
    idState?: string | null;
    idZip?: string | null;

    employerName?: string | null;
    employerAddress?: string | null;
    employerSuiteNumber?: string | null;
    employerCity?: string | null;
    employerState?: string | null;
    employerZip?: string | null;
    employerPhoneNumber?: string | null;

    description?: string | null;
    fflNumber?: string | null;
    locked?: boolean;
    taxId?: string | null;
    cellPhone?: string | null;
    email?: string | null;
    enteredAt?: Date | null;
    military?: boolean;
    fflExpireDate?: Date | null;
    taxExempt?: boolean;
    taxExemptCertificate?: string | null;

    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;

    this.oldCustomerPk = params.oldCustomerPk ?? null;
    this.oldCustomerId = params.oldCustomerId ?? null;

    this.firstName = params.firstName;
    this.middleName = params.middleName ?? null;
    this.lastName = params.lastName;

    this.streetAddress = params.streetAddress ?? null;
    this.suiteNumber = params.suiteNumber ?? null;
    this.city = params.city ?? null;
    this.stateUs = params.stateUs ?? null;
    this.zipCode = params.zipCode ?? null;
    this.phoneNumber = params.phoneNumber ?? null;
    this.height = params.height ?? null;
    this.weight = params.weight ?? null;
    this.hairColorId = params.hairColorId ?? null;
    this.eyeColorId = params.eyeColorId ?? null;
    this.race = params.race ?? null;
    this.sex = params.sex ?? null;
    this.marks = params.marks ?? null;
    this.dateOfBirth = params.dateOfBirth ?? null;
    this.birthCity = params.birthCity ?? null;
    this.birthState = params.birthState ?? null;
    this.birthCountry = params.birthCountry ?? null;

    this.idType = params.idType ?? null;
    this.idNumber = params.idNumber ?? null;
    this.idExpiration = params.idExpiration ?? null;
    this.idIssueDate = params.idIssueDate ?? null;
    this.ssNumber = params.ssNumber ?? null;
    this.idAddress = params.idAddress ?? null;
    this.idSuiteNumber = params.idSuiteNumber ?? null;
    this.idCity = params.idCity ?? null;
    this.idState = params.idState ?? null;
    this.idZip = params.idZip ?? null;

    this.employerName = params.employerName ?? null;
    this.employerAddress = params.employerAddress ?? null;
    this.employerSuiteNumber = params.employerSuiteNumber ?? null;
    this.employerCity = params.employerCity ?? null;
    this.employerState = params.employerState ?? null;
    this.employerZip = params.employerZip ?? null;
    this.employerPhoneNumber = params.employerPhoneNumber ?? null;

    this.description = params.description ?? null;
    this.fflNumber = params.fflNumber ?? null;
    this.locked = params.locked ?? false;
    this.taxId = params.taxId ?? null;
    this.cellPhone = params.cellPhone ?? null;
    this.email = params.email ?? null;
    this.enteredAt = params.enteredAt ?? null;
    this.military = params.military ?? false;
    this.fflExpireDate = params.fflExpireDate ?? null;
    this.taxExempt = params.taxExempt ?? false;
    this.taxExemptCertificate = params.taxExemptCertificate ?? null;

    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
