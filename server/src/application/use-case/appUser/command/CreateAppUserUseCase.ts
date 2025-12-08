import * as argon2 from 'argon2';
import { AppUser } from '../../../../domains/appUser/AppUser';
import { AppUserRepository } from '../../../../domains/appUser/AppUserRepository';
import { Actor } from '../../../common/Actor';
import { ForbiddenError } from '../../../common/errors';
import { AppUserResponseDto } from '../../../dto/appUser/AppUserResponseDto';
import { createAppUserSchema, CreateAppUserRequestDto } from '../../../dto/appUser/CreateAppUserDto';
import { toAppUserResponseDto } from '../../../mapping/appUserMapper';


export class CreateAppUserUseCase {
  constructor(private readonly repo: AppUserRepository) { }

  private assertCanManage(actor: Actor) {
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new ForbiddenError('Not allowed to manage users');
    }
  }

  async execute(actor: Actor, input: unknown): Promise<AppUserResponseDto> {
    this.assertCanManage(actor);
    const dto = createAppUserSchema.parse(input) as CreateAppUserRequestDto;

    const passwordHash = await argon2.hash(dto.password);
    const now = new Date();
    const startingDate = dto.startingDate ? new Date(dto.startingDate) : now;
    const birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    const terminatedDate = dto.terminatedDate ? new Date(dto.terminatedDate) : null;

    const user = new AppUser({
      id: '00000000-0000-0000-0000-000000000000',
      username: dto.username,
      passwordHash,
      firstName: dto.firstName,
      middleName: dto.middleName ?? null,
      lastName: dto.lastName,
      streetAddress: dto.streetAddress ?? null,
      suiteNumber: dto.suiteNumber ?? null,
      city: dto.city ?? null,
      stateUs: dto.stateUs ?? null,
      zipCode: dto.zipCode ?? null,
      phoneNumber: dto.phoneNumber ?? null,
      ssNumber: dto.ssNumber ?? null,
      birthDate,
      startingDate,
      terminatedDate,
      isActive: dto.isActive ?? true,
      roleId: dto.roleId,
      roleName: null,
      createdAt: now,
      updatedAt: now
    });

    const created = await this.repo.create(user);
    return toAppUserResponseDto(created);
  }
}
