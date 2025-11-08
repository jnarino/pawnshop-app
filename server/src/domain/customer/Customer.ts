export interface Customer {
  id: string;

  // Legacy linkage
  oldCustomerPk?: string | null;
  oldCustomerId?: string | null;

  // Person
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
  hairColorId?: string | null; // ✅ Changed from hairColor to FK
  eyeColorId?: string | null;  // ✅ Changed from eyeColor to FK
  race?: string | null;
  sex?: string | null;
  marks?: string | null;
  dateOfBirth?: string | null;
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;

  // Identification
  idType?: string | null;
  idNumber?: string | null;
  idExpiration?: string | null;
  idIssueDate?: string | null;
  ssNumber?: string | null;
  idAddress?: string | null;
  idSuiteNumber?: string | null;
  idCity?: string | null;
  idState?: string | null;
  idZip?: string | null;

  // Employer
  employerName?: string | null;
  employerAddress?: string | null;
  employerSuiteNumber?: string | null;
  employerCity?: string | null;
  employerState?: string | null;
  employerZip?: string | null;
  employerPhoneNumber?: string | null;

  // Misc / compliance
  description?: string | null;
  fflNumber?: string | null;
  locked?: boolean | null;
  taxId?: string | null;
  cellPhone?: string | null;
  email?: string | null;
  enteredAt?: string | null;
  military?: boolean | null;
  fflExpireDate?: string | null;
  taxExempt?: boolean | null;
  taxExemptCertificate?: string | null; // ✅ Added

  // Housekeeping
  createdAt?: string;
  updatedAt?: string;
}