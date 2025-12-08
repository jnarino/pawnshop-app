import { AppUserRepository } from '../../../src/domains/appUser/AppUserRepository';
import { AppUser } from '../../../src/domains/appUser/AppUser';
import { ForbiddenError, NotFoundError } from '../../../src/application/common/errors';
import { DeleteAppUserUseCase } from '../../../src/application/use-case/appUser/command/DeleteAppUserUseCase';

class MockAppUserRepository implements AppUserRepository {
  findByUsername = jest.fn();
  findById = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
}

describe('DeleteAppUserUseCase', () => {
  it('should forbid non-admin and non-manager from deleting users', async () => {
    const repo = new MockAppUserRepository();
    const useCase = new DeleteAppUserUseCase(repo);

    const actor = { id: '1', username: 'test', role: 'sales_associate' };

    await expect(
      useCase.execute(actor, '123')
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError if user does not exist', async () => {
    const repo = new MockAppUserRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new DeleteAppUserUseCase(repo);

    const actor = { id: '1', username: 'admin', role: 'admin' };

    await expect(
      useCase.execute(actor, '999')
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should allow admin to delete user', async () => {
    const repo = new MockAppUserRepository();
    const existingUser = new AppUser({
      id: '123',
      username: 'testuser',
      passwordHash: 'hash',
      firstName: 'Test',
      lastName: 'User',
      roleId: 3,
      isActive: true,
      startingDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingUser);

    const useCase = new DeleteAppUserUseCase(repo);
    const actor = { id: '1', username: 'admin', role: 'admin' };

    await useCase.execute(actor, '123');

    expect(repo.findById).toHaveBeenCalledWith('123');
    expect(repo.delete).toHaveBeenCalledWith('123');
  });

  it('should allow manager to delete user', async () => {
    const repo = new MockAppUserRepository();
    const existingUser = new AppUser({
      id: '123',
      username: 'testuser',
      passwordHash: 'hash',
      firstName: 'Test',
      lastName: 'User',
      roleId: 3,
      isActive: true,
      startingDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingUser);

    const useCase = new DeleteAppUserUseCase(repo);
    const actor = { id: '1', username: 'manager', role: 'manager' };

    await useCase.execute(actor, '123');

    expect(repo.delete).toHaveBeenCalledWith('123');
  });
});
