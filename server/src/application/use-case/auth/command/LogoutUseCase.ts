import { refreshTokenRequestSchema } from "../../../dto/auth/RefreshTokenDto";
import { AuthService } from "../../../service/AuthService";


export class LogoutUseCase {
  constructor(private readonly authService: AuthService) { }

  async execute(input: unknown): Promise<void> {
    const dto = refreshTokenRequestSchema.parse(input);
    await this.authService.logout(dto.refresh_token);
  }
}
