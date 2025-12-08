import { AuthService } from '../../../src/application/service/AuthService';
import { RefreshTokenUseCase } from '../../../src/application/use-case/auth/command/RefreshTokenUseCase';

class MockAuthService {
  login = jest.fn();
  logout = jest.fn();
  refresh = jest.fn();
}

describe('RefreshTokenUseCase', () => {
  it('should call AuthService.refresh with valid refresh token', async () => {
    const authService = new MockAuthService();
    authService.refresh.mockResolvedValue({
      access_token: 'new-access-token',
      expires_in: 900,
      user: {
        id: '1',
        username: 'testuser',
        role: 'admin'
      }
    });

    const useCase = new RefreshTokenUseCase(authService as any);

    const result = await useCase.execute({
      refresh_token: 'valid-refresh-token'
    });

    expect(authService.refresh).toHaveBeenCalledWith('valid-refresh-token');
    expect(result.access_token).toBe('new-access-token');
    expect(result.user.username).toBe('testuser');
  });

  it('should propagate errors for invalid refresh tokens', async () => {
    const authService = new MockAuthService();
    authService.refresh.mockRejectedValue(new Error('Invalid refresh token'));

    const useCase = new RefreshTokenUseCase(authService as any);

    await expect(
      useCase.execute({
        refresh_token: 'invalid-refresh-token'
      })
    ).rejects.toThrow('Invalid refresh token');
  });
});
