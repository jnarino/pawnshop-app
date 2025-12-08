import { AppUser } from '../../domains/appUser/AppUser';
import { AppUserResponseDto } from '../dto/appUser/AppUserResponseDto';

export function toAppUserResponseDto(user: AppUser): AppUserResponseDto {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    streetAddress: user.streetAddress,
    suiteNumber: user.suiteNumber,
    city: user.city,
    stateUs: user.stateUs,
    zipCode: user.zipCode,
    phoneNumber: user.phoneNumber,
    ssNumber: user.ssNumber,
    birthDate: user.birthDate ? user.birthDate.toISOString() : null,
    startingDate: user.startingDate.toISOString(),
    terminatedDate: user.terminatedDate ? user.terminatedDate.toISOString() : null,
    isActive: user.isActive,
    roleId: user.roleId,
    roleName: user.roleName,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  };
}
