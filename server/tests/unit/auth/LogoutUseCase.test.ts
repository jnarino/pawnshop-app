import { AuthService } from '../../../src/application/service/AuthService';
import { LogoutUseCase } from '../../../src/application/use-case/auth/command/LogoutUseCase';

class MockAuthService {
  login = jest.fn();
  logout = jest.fn();
  refresh = jest.fn();
}

describe('LogoutUseCase', () => {
  it('should call AuthService.logout with refresh token', async () => {
    const authService = new MockAuthService();
    authService.logout.mockResolvedValue(undefined);

    const useCase = new LogoutUseCase(authService as any);

    await useCase.execute({
      refresh_token: 'fake-refresh-token'
    });

    expect(authService.logout).toHaveBeenCalledWith('fake-refresh-token');
  });

  it('should handle logout even if token is invalid', async () => {
    const authService = new MockAuthService();
    authService.logout.mockResolvedValue(undefined);

    const useCase = new LogoutUseCase(authService as any);

    await useCase.execute({
      refresh_token: 'invalid-token'
    });

    expect(authService.logout).toHaveBeenCalledWith('invalid-token');
  });
});
