export type CustomerResponseDto = {
  id: string;
  oldCustomerPk: string | null;
  oldCustomerId: string | null;

  firstName: string;
  middleName: string | null;
  lastName: string;

  streetAddress: string | null;
  suiteNumber: string | null;
  city: string | null;
  stateUs: string | null;
  zipCode: string | null;

  phoneNumber: string | null;
  cellPhone: string | null;
  email: string | null;

  height: string | null;
  weight: string | null;
  hairColorId: string | null;
  eyeColorId: string | null;
  race: string | null;
  sex: string | null;
  marks: string | null;

  dateOfBirth: string | null; // 'YYYY-MM-DD'
  birthCity: string | null;
  birthState: string | null;
  birthCountry: string | null;

  idType: string | null;
  idNumber: string | null;
  idExpiration: string | null;
  idIssueDate: string | null;
  ssNumber: string | null;

  idAddress: string | null;
  idSuiteNumber: string | null;
  idCity: string | null;
  idState: string | null;
  idZip: string | null;

  employerName: string | null;
  employerAddress: string | null;
  employerSuiteNumber: string | null;
  employerCity: string | null;
  employerState: string | null;
  employerZip: string | null;
  employerPhoneNumber: string | null;

  description: string | null;
  fflNumber: string | null;
  locked: boolean;
  taxId: string | null;
  enteredAt: string | null;
  military: boolean;
  fflExpireDate: string | null;
  taxExempt: boolean;
  taxExemptCertificate: string | null;

  createdAt: string;
  updatedAt: string;
};

export type CustomerSummaryDto = {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null; // 'YYYY-MM-DD'
  phoneNumber: string | null;
  cellPhone: string | null;
};
