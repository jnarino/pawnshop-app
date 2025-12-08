import { AppUserRepository } from "../../../../domains/appUser/AppUserRepository";
import { Actor } from "../../../common/Actor";
import { ForbiddenError, NotFoundError } from "../../../common/errors";
import { AppUserResponseDto } from "../../../dto/appUser/AppUserResponseDto";
import { updateAppUserSchema, UpdateAppUserRequestDto } from "../../../dto/appUser/UpdateAppUserDto";
import { toAppUserResponseDto } from "../../../mapping/appUserMapper";


export class UpdateAppUserUseCase {
  constructor(private readonly repo: AppUserRepository) { }

  private assertCanManage(actor: Actor) {
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new ForbiddenError('Not allowed to manage users');
    }
  }

  async execute(actor: Actor, input: unknown): Promise<AppUserResponseDto> {
    this.assertCanManage(actor);
    const dto = updateAppUserSchema.parse(input) as UpdateAppUserRequestDto;

    const existing = await this.repo.findById(dto.id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    existing.username = dto.username;
    existing.firstName = dto.firstName;
    existing.middleName = dto.middleName ?? null;
    existing.lastName = dto.lastName;
    existing.streetAddress = dto.streetAddress ?? null;
    existing.suiteNumber = dto.suiteNumber ?? null;
    existing.city = dto.city ?? null;
    existing.stateUs = dto.stateUs ?? null;
    existing.zipCode = dto.zipCode ?? null;
    existing.phoneNumber = dto.phoneNumber ?? null;
    existing.ssNumber = dto.ssNumber ?? null;
    existing.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    existing.startingDate = dto.startingDate ? new Date(dto.startingDate) : existing.startingDate;
    existing.terminatedDate = dto.terminatedDate ? new Date(dto.terminatedDate) : null;
    existing.isActive = dto.isActive ?? existing.isActive;
    existing.roleId = dto.roleId;

    const updated = await this.repo.update(existing);
    return toAppUserResponseDto(updated);
  }
}
