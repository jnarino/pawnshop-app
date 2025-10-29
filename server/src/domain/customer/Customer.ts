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
  phoneNumber?: string | null; // primary phone on record
  height?: string | null;
  weight?: string | null;
  hairColor?: string | null;
  eyeColor?: string | null;
  race?: string | null;
  sex?: string | null;
  marks?: string | null;          // scars / identifying marks
  dateOfBirth?: string | null;    // ISO (DATE)
  birthCity?: string | null;
  birthState?: string | null;
  birthCountry?: string | null;

  // Identification
  idType?: string | null;
  idNumber?: string | null;
  idExpiration?: string | null;   // ISO (DATE)
  idIssueDate?: string | null;    // ISO (DATE)
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
  enteredAt?: string | null;        // original entry timestamp if imported
  military?: boolean | null;
  fflExpireDate?: string | null;    // ISO (DATE)
  taxExempt?: boolean | null;

  // Housekeeping (server-managed)
  createdAt?: string;               // TIMESTAMPTZ
  updatedAt?: string;               // TIMESTAMPTZ
}