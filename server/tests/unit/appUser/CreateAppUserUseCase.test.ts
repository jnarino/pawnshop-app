
import { AppUserRepository } from '../../../src/domains/appUser/AppUserRepository';
import { AppUser } from '../../../src/domains/appUser/AppUser';
import { ForbiddenError } from '../../../src/application/common/errors';
import { CreateAppUserUseCase } from '../../../src/application/use-case/appUser/command/CreateAppUserUseCase';

class mockRepo implements AppUserRepository {
  findByUsername = jest.fn();
  findById = jest.fn();
  listAll = jest.fn();
  create = jest.fn(async (u: AppUser) => u);
  update = jest.fn();
  delete = jest.fn();
}

describe('CreateAppUserUseCase permissions', () => {
  it('should forbid non-admin and non-manager from creating users', async () => {
    const repo = new mockRepo();
    const useCase = new CreateAppUserUseCase(repo);

    const actor = { id: '1', username: 'test', role: 'sales_associate' };

    await expect(
      useCase.execute(actor, {
        username: 'x',
        password: 'secret123',
        firstName: 'Test',
        lastName: 'User',
        roleId: 3
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
