import { AppUserRepository } from "../../../../domains/appUser/AppUserRepository";
import { Actor } from "../../../common/Actor";
import { ForbiddenError, NotFoundError } from "../../../common/errors";


export class DeleteAppUserUseCase {
  constructor(private readonly repo: AppUserRepository) { }

  private assertCanManage(actor: Actor) {
    if (actor.role !== 'admin' && actor.role !== 'manager') {
      throw new ForbiddenError('Not allowed to manage users');
    }
  }

  async execute(actor: Actor, id: string): Promise<void> {
    this.assertCanManage(actor);

    const existing = await this.repo.findById(id);
    if (!existing) {
      throw new NotFoundError('User not found');
    }

    await this.repo.delete(id);
  }
}
