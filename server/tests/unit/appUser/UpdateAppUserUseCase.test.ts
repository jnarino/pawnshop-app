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
  const userId = '550e8400-e29b-41d4-a716-446655440005';
  const actorId = '550e8400-e29b-41d4-a716-446655440006';
  const nonExistentId = '550e8400-e29b-41d4-a716-446655440099';

  it('should forbid non-admin and non-manager from updating users', async () => {
    const repo = new MockAppUserRepository();
    const useCase = new UpdateAppUserUseCase(repo);

    const actor = { id: actorId, username: 'test', role: 'sales_associate' };

    await expect(
      useCase.execute(actor, {
        id: userId,
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

    const actor = { id: actorId, username: 'admin', role: 'admin' };

    await expect(
      useCase.execute(actor, {
        id: nonExistentId,
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
      id: userId,
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
    const actor = { id: actorId, username: 'admin', role: 'admin' };

    const result = await useCase.execute(actor, {
      id: userId,
      username: 'newname',
      firstName: 'New',
      lastName: 'Name',
      roleId: 2
    });

    expect(repo.findById).toHaveBeenCalledWith(userId);
    expect(repo.update).toHaveBeenCalled();
    expect(result.username).toBe('newname');
  });

  it('should allow manager to update user', async () => {
    const repo = new MockAppUserRepository();
    const existingUser = new AppUser({
      id: userId,
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
    const actor = { id: actorId, username: 'manager', role: 'manager' };

    const result = await useCase.execute(actor, {
      id: userId,
      username: 'updatedname',
      firstName: 'Updated',
      lastName: 'User',
      roleId: 3
    });

    expect(repo.update).toHaveBeenCalled();
    expect(result.username).toBe('updatedname');
  });
});
