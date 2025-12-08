import { AppUserRepository } from '../../../src/domains/appUser/AppUserRepository';
import { AppUser } from '../../../src/domains/appUser/AppUser';
import { ForbiddenError, NotFoundError } from '../../../src/application/common/errors';
import { UpdateAppUserUseCase } from '../../../src/application/use-case/appUser/command/UpdateAppUserUseCase';

class MockAppUserRepository implements AppUserRepository {
  findByUsername = jest.fn();
  findById = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn(async (u: AppUser) => u);
  delete = jest.fn();
}

describe('UpdateAppUserUseCase', () => {
  it('should forbid non-admin and non-manager from updating users', async () => {
    const repo = new MockAppUserRepository();
    const useCase = new UpdateAppUserUseCase(repo);

    const actor = { id: '1', username: 'test', role: 'sales_associate' };

    await expect(
      useCase.execute(actor, {
        id: '123',
        username: 'updated',
        firstName: 'Updated',
        lastName: 'User',
        roleId: 3
      })
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw NotFoundError if user does not exist', async () => {
    const repo = new MockAppUserRepository();
    repo.findById.mockResolvedValue(null);
    const useCase = new UpdateAppUserUseCase(repo);

    const actor = { id: '1', username: 'admin', role: 'admin' };

    await expect(
      useCase.execute(actor, {
        id: '999',
        username: 'nonexistent',
        firstName: 'Test',
        lastName: 'User',
        roleId: 3
      })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('should allow admin to update user', async () => {
    const repo = new MockAppUserRepository();
    const existingUser = new AppUser({
      id: '123',
      username: 'oldname',
      passwordHash: 'hash',
      firstName: 'Old',
      lastName: 'Name',
      roleId: 3,
      isActive: true,
      startingDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingUser);

    const useCase = new UpdateAppUserUseCase(repo);
    const actor = { id: '1', username: 'admin', role: 'admin' };

    const result = await useCase.execute(actor, {
      id: '123',
      username: 'newname',
      firstName: 'New',
      lastName: 'Name',
      roleId: 2
    });

    expect(repo.findById).toHaveBeenCalledWith('123');
    expect(repo.update).toHaveBeenCalled();
    expect(result.username).toBe('newname');
  });

  it('should allow manager to update user', async () => {
    const repo = new MockAppUserRepository();
    const existingUser = new AppUser({
      id: '123',
      username: 'oldname',
      passwordHash: 'hash',
      firstName: 'Old',
      lastName: 'Name',
      roleId: 3,
      isActive: true,
      startingDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    repo.findById.mockResolvedValue(existingUser);

    const useCase = new UpdateAppUserUseCase(repo);
    const actor = { id: '1', username: 'manager', role: 'manager' };

    const result = await useCase.execute(actor, {
      id: '123',
      username: 'updatedname',
      firstName: 'Updated',
      lastName: 'User',
      roleId: 3
    });

    expect(repo.update).toHaveBeenCalled();
    expect(result.username).toBe('updatedname');
  });
});
