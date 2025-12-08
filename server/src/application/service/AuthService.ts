import jwt from 'jsonwebtoken';
import * as argon2 from 'argon2';
import crypto from 'crypto';
import { AppUserRepository } from '../../domains/appUser/AppUserRepository';
import { AppUserSessionRepository } from '../../infrastructure/persistence/session/AppUserSessionRepository';
import { AppUserSession } from '../../domains/auth/AppUserSession';
import { LoginResponseDto } from '../dto/auth/LoginDto';
import { RefreshTokenResponseDto } from '../dto/auth/RefreshTokenDto';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

type JwtPayload = {
  sub: string;   // user id
  sid: string;   // session id
  username: string;
  role: string;
};

export class InvalidCredentialsError extends Error {}
export class InvalidRefreshTokenError extends Error {}

export class AuthService {
  constructor(
    private readonly userRepo: AppUserRepository,
    private readonly sessionRepo: AppUserSessionRepository,
    private readonly jwtSecret: string
  ) {}

  async login(username: string, password: string): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      throw new InvalidCredentialsError('Invalid username or password');
    }

    const passwordOk = await argon2.verify(user.passwordHash, password);
    if (!passwordOk) {
      throw new InvalidCredentialsError('Invalid username or password');
    }

    const { plain: refreshToken, hash: refreshTokenHash } =
      this.generateRefreshToken();

    const session = await this.sessionRepo.create(
      new AppUserSession({
        userId: user.id,
        refreshTokenHash
      })
    );

    const { token: accessToken, expiresIn } = this.createAccessToken(
      user.id,
      user.username,
      user.roleName ?? 'sales_associate',
      session
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: expiresIn,
      user: {
        id: user.id,
        username: user.username,
        role: user.roleName
      }
    };
  }

  async refresh(refreshToken: string): Promise<RefreshTokenResponseDto> {
    const hash = this.hashRefreshToken(refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(hash);

    if (!session || !session.isActive) {
      throw new InvalidRefreshTokenError('Invalid refresh token');
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user) {
      throw new InvalidRefreshTokenError('Invalid refresh token');
    }

    session.touch();
    await this.sessionRepo.update(session);

    const { token: accessToken, expiresIn } = this.createAccessToken(
      user.id,
      user.username,
      user.roleName ?? 'sales_associate',
      session
    );

    return {
      access_token: accessToken,
      expires_in: expiresIn,
      user: {
        id: user.id,
        username: user.username,
        role: user.roleName
      }
    };
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = this.hashRefreshToken(refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(hash);
    if (!session || !session.isActive) {
      return;
    }

    session.revoke();
    await this.sessionRepo.update(session);
  }

  private createAccessToken(
    userId: string,
    username: string,
    role: string,
    session: AppUserSession
  ) {
    const payload: JwtPayload = {
      sub: userId,
      sid: session.id,
      username,
      role
    };

    const expiresIn = ACCESS_TOKEN_TTL_SECONDS;

    const token = jwt.sign(payload, this.jwtSecret, { expiresIn });

    return { token, expiresIn };
  }

  private generateRefreshToken(): { plain: string; hash: string } {
    const plain = crypto.randomBytes(64).toString('hex');
    const hash = this.hashRefreshToken(plain);
    return { plain, hash };
  }

  private hashRefreshToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
