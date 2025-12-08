import { RefreshTokenResponseDto, refreshTokenRequestSchema } from "../../../dto/auth/RefreshTokenDto";
import { AuthService } from "../../../service/AuthService";


export class RefreshTokenUseCase {
  constructor(private readonly authService: AuthService) { }

  async execute(input: unknown): Promise<RefreshTokenResponseDto> {
    const dto = refreshTokenRequestSchema.parse(input);
    return this.authService.refresh(dto.refresh_token);
  }
}
