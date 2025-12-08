import { AuthService } from '../../../src/application/service/AuthService';
import { LoginUseCase } from '../../../src/application/use-case/auth/command/LoginUseCase';

class MockAuthService {
  login = jest.fn();
  logout = jest.fn();
  refresh = jest.fn();
}

describe('LoginUseCase', () => {
  it('should call AuthService.login with valid credentials', async () => {
    const authService = new MockAuthService();
    authService.login.mockResolvedValue({
      access_token: 'fake-access-token',
      refresh_token: 'fake-refresh-token',
      expires_in: 900,
      user: {
        id: '1',
        username: 'testuser',
        role: 'admin'
      }
    });

    const useCase = new LoginUseCase(authService as any);

    const result = await useCase.execute({
      username: 'testuser',
      password: 'password123'
    });

    expect(authService.login).toHaveBeenCalledWith('testuser', 'password123');
    expect(result.access_token).toBe('fake-access-token');
    expect(result.user.username).toBe('testuser');
  });

  it('should propagate errors from AuthService', async () => {
    const authService = new MockAuthService();
    authService.login.mockRejectedValue(new Error('Invalid credentials'));

    const useCase = new LoginUseCase(authService as any);

    await expect(
      useCase.execute({
        username: 'wronguser',
        password: 'wrongpass'
      })
    ).rejects.toThrow('Invalid credentials');
  });
});
