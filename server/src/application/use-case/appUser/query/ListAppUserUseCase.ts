import { AppUserRepository } from '../../../../domains/appUser/AppUserRepository';
import { Actor } from '../../../common/Actor';
import { ForbiddenError } from '../../../common/errors';
import { AppUserResponseDto } from '../../../dto/appUser/AppUserResponseDto';
import { toAppUserResponseDto } from '../../../mapping/appUserMapper';

export class ListAppUserUseCase {
  constructor(private readonly repo: AppUserRepository) {}

  async execute(actor: Actor): Promise<AppUserResponseDto[]> {
    if (!actor) {
      throw new ForbiddenError('Authentication required');
    }
    const users = await this.repo.listAll();
    return users.map(toAppUserResponseDto);
  }
}
