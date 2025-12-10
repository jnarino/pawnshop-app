export class AppUser {
  readonly id: string;
  username: string;
  passwordHash: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  streetAddress: string | null;
  suiteNumber: string | null;
  city: string | null;
  stateUs: string | null;
  zipCode: string | null;
  phoneNumber: string | null;
  ssNumber: string | null;
  birthDate: Date | null;
  startingDate: Date;
  terminatedDate: Date | null;
  isActive: boolean;
  roleId: number;
  roleName: string | null;
  createdAt: Date;
  updatedAt: Date;

  constructor(params: {
    id: string;
    username: string;
    passwordHash: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    streetAddress?: string | null;
    suiteNumber?: string | null;
    city?: string | null;
    stateUs?: string | null;
    zipCode?: string | null;
    phoneNumber?: string | null;
    ssNumber?: string | null;
    birthDate?: Date | null;
    startingDate: Date;
    terminatedDate?: Date | null;
    isActive: boolean;
    roleId: number;
    roleName?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this.id = params.id;
    this.username = params.username;
    this.passwordHash = params.passwordHash;
    this.firstName = params.firstName;
    this.middleName = params.middleName ?? null;
    this.lastName = params.lastName;
    this.streetAddress = params.streetAddress ?? null;
    this.suiteNumber = params.suiteNumber ?? null;
    this.city = params.city ?? null;
    this.stateUs = params.stateUs ?? null;
    this.zipCode = params.zipCode ?? null;
    this.phoneNumber = params.phoneNumber ?? null;
    this.ssNumber = params.ssNumber ?? null;
    this.birthDate = params.birthDate ?? null;
    this.startingDate = params.startingDate;
    this.terminatedDate = params.terminatedDate ?? null;
    this.isActive = params.isActive;
    this.roleId = params.roleId;
    this.roleName = params.roleName ?? null;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt;
  }
}
