import { AppUserRepository } from '../../../src/domains/appUser/AppUserRepository';
import { AppUser } from '../../../src/domains/appUser/AppUser';
import { ForbiddenError } from '../../../src/application/common/errors';
import { ListAppUserUseCase } from '../../../src/application/use-case/appUser/query/ListAppUserUseCase';

class MockAppUserRepository implements AppUserRepository {
  findByUsername = jest.fn();
  findById = jest.fn();
  listAll = jest.fn();
  create = jest.fn();
  update = jest.fn();
  delete = jest.fn();
}

describe('ListAppUserUseCase', () => {
  it('should throw ForbiddenError if actor is not provided', async () => {
    const repo = new MockAppUserRepository();
    const useCase = new ListAppUserUseCase(repo);

    await expect(
      useCase.execute(null as any)
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should return list of users for authenticated actor', async () => {
    const repo = new MockAppUserRepository();
    const users = [
      new AppUser({
        id: '1',
        username: 'user1',
        passwordHash: 'hash1',
        firstName: 'First',
        lastName: 'User',
        roleId: 3,
        isActive: true,
        startingDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }),
      new AppUser({
        id: '2',
        username: 'user2',
        passwordHash: 'hash2',
        firstName: 'Second',
        lastName: 'User',
        roleId: 2,
        isActive: true,
        startingDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
    ];
    repo.listAll.mockResolvedValue(users);

    const useCase = new ListAppUserUseCase(repo);
    const actor = { id: '1', username: 'test', role: 'sales_associate' };

    const result = await useCase.execute(actor);

    expect(repo.listAll).toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].username).toBe('user1');
    expect(result[1].username).toBe('user2');
  });
});
